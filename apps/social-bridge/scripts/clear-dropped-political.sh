#!/usr/bin/env bash
# Clear KV idempotency markers for items the bridge previously dropped under
# the old DROP_POLITICAL=1 policy, so the leaning.blue backfill can re-process
# them under the new 3-label classifier (POLITICAL → leaning.blue,
# PERSONAL → existing rules, SKIP → still dropped).
#
# Items previously POSTED (to doughatcher or superterran) keep their KV
# markers and stay deduped — we only want to retry the held-back politicals.
#
# Requires a Cloudflare API token with Workers:Edit + KV:Edit on this account
# in CLOUDFLARE_API_TOKEN (the regular CF_API_TOKEN in ~/.env only has
# Tunnel/DNS/WAF scope and won't work).
#
# Usage:
#   ./scripts/clear-dropped-political.sh           # list-only, no deletions
#   ./scripts/clear-dropped-political.sh --apply   # actually delete

set -euo pipefail
cd "$(dirname "$0")/.."

APPLY=0
[[ "${1:-}" == "--apply" ]] && APPLY=1

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  echo "error: set CLOUDFLARE_API_TOKEN (needs Workers:Edit + KV:Edit scope)" >&2
  echo "       the CF_API_TOKEN in ~/.env only has Tunnel/DNS/WAF scope and"  >&2
  echo "       will fail with Authentication error [code: 10000]."             >&2
  exit 1
fi

NAMESPACE_BINDING="STATE"
WORKER="doughatcher-social-bridge"

# Find the namespace id from wrangler.toml.
NS_ID=$(awk -F\" '/binding = "STATE"/{found=1} found && /id = "/{print $2; exit}' wrangler.toml)
if [[ -z "$NS_ID" ]]; then
  echo "error: could not find STATE namespace id in wrangler.toml" >&2
  exit 1
fi

echo "namespace: $NS_ID ($NAMESPACE_BINDING binding for $WORKER)"
echo "mode: $([ $APPLY -eq 1 ] && echo APPLY || echo DRY-RUN)"
echo

LIST_FILE=$(mktemp -t kv-list.XXXXXX.json)
trap 'rm -f "$LIST_FILE"' EXIT

# List all keys (paginated, 1000/page). We expect O(few-thousand) keys total.
CURSOR=""
> "$LIST_FILE.keys"
while :; do
  URL="https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/storage/kv/namespaces/$NS_ID/keys?limit=1000"
  [[ -n "$CURSOR" ]] && URL="$URL&cursor=$CURSOR"
  curl -sS -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" "$URL" > "$LIST_FILE"
  jq -r '.result[].name' "$LIST_FILE" >> "$LIST_FILE.keys"
  CURSOR=$(jq -r '.result_info.cursor // ""' "$LIST_FILE")
  [[ -z "$CURSOR" ]] && break
done

TOTAL_KEYS=$(wc -l < "$LIST_FILE.keys")
echo "total keys in namespace: $TOTAL_KEYS"

# Filter to imported:* keys. Anything else is unrelated (poll metadata etc.)
TARGETS_FILE=$(mktemp -t kv-targets.XXXXXX)
grep '^imported:' "$LIST_FILE.keys" > "$TARGETS_FILE" || true
TARGET_COUNT=$(wc -l < "$TARGETS_FILE")
echo "imported:* keys to inspect: $TARGET_COUNT"
echo

# Fetch each value, check for DROP_POLITICAL=1 marker, collect deletables.
DELETE_FILE=$(mktemp -t kv-delete.XXXXXX)
INSPECTED=0
while read -r KEY; do
  INSPECTED=$((INSPECTED + 1))
  if (( INSPECTED % 100 == 0 )); then
    echo "  inspected $INSPECTED / $TARGET_COUNT..."
  fi
  VALUE=$(curl -sS -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/storage/kv/namespaces/$NS_ID/values/$KEY")
  if echo "$VALUE" | grep -q '"reason":"DROP_POLITICAL=1"'; then
    echo "$KEY" >> "$DELETE_FILE"
  fi
done < "$TARGETS_FILE"

TO_DELETE=$(wc -l < "$DELETE_FILE")
echo
echo "matched keys (reason=DROP_POLITICAL=1): $TO_DELETE"

if [[ $APPLY -eq 0 ]]; then
  echo "DRY-RUN — no deletions performed. Re-run with --apply to delete."
  echo "first 10 keys that would be deleted:"
  head -10 "$DELETE_FILE" | sed 's/^/  /'
  exit 0
fi

echo "deleting $TO_DELETE keys..."
# Bulk-delete endpoint accepts up to 10000 keys per call.
jq -R . "$DELETE_FILE" | jq -s . > "$DELETE_FILE.json"
curl -sS -X DELETE \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data @"$DELETE_FILE.json" \
  "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/storage/kv/namespaces/$NS_ID/bulk" \
  | jq '.success, .errors'

echo "done."
