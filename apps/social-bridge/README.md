# doughatcher-social-bridge

Classify-and-route Cloudflare Worker. Multiple sources POST in; each item is classified PERSONAL or POLITICAL by Claude Haiku 4.5 and posted via Micropub to one of two micro.blog sites.

| Classification | Destination |
|---|---|
| PERSONAL (default) | doughatcher.com |
| POLITICAL | leaning.blue |

| Source | Mechanism |
|---|---|
| Reddit (/u/superterran comments) | closet container at `apps/reddit-poller/` polls unauth JSON, POSTs to `/ingest/historical` |
| Facebook posts | Make.com automation POSTs to `/ingest/facebook` |
| Archive backfill (Reddit GDPR, Facebook DYI, future sources) | Local Python scripts in `import/` POST to `/ingest/historical` with original timestamps |

## How it works

```
closet reddit-poller ───┐
                        │
Make.com (Facebook) ────┼──→ Worker ──→ classify (Haiku 4.5) ──→ Micropub ─→ leaning.blue
                        │                                              \
local import scripts ───┘                                                 ─→ doughatcher.com
```

Single Micropub token, dual destinations via `mp-destination`. Classifier fails open to PERSONAL on any API error so leaning.blue never gets accidental noise.

The Worker no longer talks to Reddit directly — Reddit's `.json` endpoints reject Cloudflare egress IPs, and their Developer Platform now gates the data API behind a use-case review. closet's home-ISP IP isn't blocked, so the polling runs there as a small Docker container that pushes new items into the Worker. See `~/repos/closet/apps/reddit-poller/`.

## One-time setup

### 1. Create the leaning.blue site on micro.blog

- micro.blog dashboard → "Account" → "Sites" → add a new site
- Use the leaning.blue custom domain (point its DNS at micro.blog)
- Theme can be the same Dougie theme or a clone

Once it exists, verify the Micropub destination URL:
```
curl -H "Authorization: Bearer <token>" "https://micro.blog/micropub?q=config" | python3 -m json.tool
```
Update `MICROPUB_DEST_POLITICAL` in `wrangler.toml` if it differs from `https://leaning.blue/`.

### 2. Tokens

| Token | Where | Notes |
|---|---|---|
| Micropub token | https://micro.blog/account/apps → New Token, scope Micropub | One token, both sites |
| Anthropic key | https://console.anthropic.com/settings/keys | Same key your local `~/.env` uses |
| `TRIGGER_TOKEN` | generate with `openssl rand -hex 32` | Used by closet poller, Make.com, and import scripts |

### 3. Deploy the Worker

```
cd ~/repos/micro.blog/doughatcher/apps/social-bridge
just install
just set-micropub-token
just set-anthropic-key
just set-trigger-token
just deploy
```

Sanity check (should return 404 from the deployed Worker, proving auth is wired):
```
just ping <TRIGGER_TOKEN>
```

Run a fake item through the full classify-and-route pipeline (dry-run, no Micropub post):
```
just test-facebook <TRIGGER_TOKEN> "Tech ramble about kubernetes"
just test-facebook <TRIGGER_TOKEN> "I cannot believe what Congress did this week"
```

The `classification` field in the response is the verdict.

### 4. Deploy the closet reddit-poller

In the closet repo:
```
cd ~/repos/closet
cp apps/reddit-poller/.env.example apps/reddit-poller/.env
# fill in BRIDGE_TRIGGER_TOKEN (same value as Worker's TRIGGER_TOKEN)
just deploy-apps reddit-poller
ssh closet 'docker logs -f reddit-poller'
```

On cold start the poller walks back the user's comment listing up to Reddit's ~1000-item cap and POSTs each comment with original timestamps. After that, it polls every 15 minutes.

If you want a smaller initial run for sanity-checking, set `INITIAL_BACKFILL_LIMIT=10` in the env, redeploy, watch the output, then bump it up.

### 5. Configure Make.com for Facebook

Trigger: "Facebook — Watch Posts" (Pages module).
Action: HTTP → "Make a request":
- URL: `https://doughatcher-social-bridge.doug-hatcher.workers.dev/ingest/facebook?token=<TRIGGER_TOKEN>`
- Method: POST
- Body type: Raw, JSON
- Body:
  ```json
  {
    "text": "{{1.message}}",
    "url": "{{1.permalink_url}}",
    "id": "{{1.id}}"
  }
  ```

Optionally set `"force_destination": "political"` on the Make.com side when you want to bypass the classifier.

## Archive backfill (preserves original timestamps)

The closet poller covers the live stream and the most recent ~1000 Reddit comments on first deploy. For the deeper historical tail, use the export-based importers.

### Reddit GDPR data export

1. Request the export at https://www.reddit.com/settings/data-request — CSV format. Reddit ships it via email in 3–30 days.
2. Unzip somewhere.
3. Run:
   ```
   export BRIDGE_TRIGGER_TOKEN=<your-trigger-token>
   just import-install
   just backfill-reddit-export-dry ~/Downloads/reddit-export/comments.csv ~/Downloads/reddit-export/posts.csv
   just backfill-reddit-export    ~/Downloads/reddit-export/comments.csv ~/Downloads/reddit-export/posts.csv
   ```

The export's `id` namespace is distinct from the live poller's Reddit fullname, so overlap with the recent items already posted by closet is theoretical — but to be safe, pass `--until <date-of-oldest-closet-imported-item>` to scope the import to the older tail only.

### Facebook DYI export

Facebook doesn't expose historical posts via API at any meaningful scale. The path is "Download Your Information":

1. https://www.facebook.com/dyi → "Download Your Information"
2. Format: **JSON** (the importer parses JSON, not HTML)
3. Data range: "All time" → "Posts" (+ "Posts you're tagged in" if desired)
4. FB emails a download link in a few hours to a day.
5. Unzip. The importer looks under `your_facebook_activity/posts/` first, then `posts/`, then the root.
6. Run:
   ```
   just backfill-facebook-dry ~/Downloads/facebook-export
   just backfill-facebook     ~/Downloads/facebook-export
   ```

Filter by date range with `--since YYYY-MM-DD --until YYYY-MM-DD` to do it in chunks.

### Volume + cost

For 20 years of content:
- Reddit: 1k–10k comments at Haiku's ~$0.0005/classification → $0.50–$5
- Facebook: 500–5000 posts → $0.25–$2.50
- Rate-limited to 1 POST per ~1.1s → ~3 hours wall-clock for 10k items, resumable

Set `CLASSIFIER=off` in `wrangler.toml` during backfill if you want everything to land in doughatcher.com chronologically first and route political items manually later.

### Dry-run / preview workflow

`--dry-run` on any script (or `?dry=1` on the endpoint) returns the classifier verdict + formatted body without posting. Use it to spot-check before committing. If the classifier disagrees with your own gut on archive material, tighten `src/classifier.js`'s system prompt and redeploy before going live.

## Configuration knobs (`wrangler.toml [vars]`)

| Var | Default | Use |
|---|---|---|
| `DRY_RUN` | `0` | `1` = classify but don't post |
| `CLASSIFIER` | `claude-haiku-4-5` | Set to `off` to send everything to doughatcher |
| `MICROPUB_DEST_PERSONAL` | `https://doughatcher.com/` | Personal destination URL |
| `MICROPUB_DEST_POLITICAL` | `https://leaning.blue/` | Political destination URL |
| `CATEGORIES_PERSONAL` | `syndicated` | Micropub `category[]` for personal posts |
| `CATEGORIES_POLITICAL` | `syndicated,politics` | Micropub `category[]` for political posts |

Reddit-sourced posts get extra `from-reddit` + `r-<subreddit>` categories; Facebook gets `from-facebook`; archive imports get `archive`. Easy filters in micro.blog templates.

## Classifier prompt

See `src/classifier.js`. Intentionally conservative — when in doubt, route PERSONAL. The political site only gets content that clearly belongs there. If you find leakage in either direction, tighten the prompt and redeploy.

## Cost notes

- **Anthropic Haiku 4.5**: ~$0.0005/classification (500 input + 1 output token). 100 items/day ≈ $1.50/month. Set `CLASSIFIER=off` to skip.
- **Cloudflare Workers**: free tier is 100k invocations/day, way above what live ingest does.
- **KV reads/writes**: free tier is 100k/day. The historical idempotency keys are write-once, so even a 10k-item backfill is fine.

## Operational notes

- **Facebook idempotency**: webhook payload `id` is stored as `fb_seen:<id>` in KV for 30 days. Make.com retries within seconds; this prevents double-posts.
- **Historical idempotency**: server-side via KV `imported:<source>:<id>` with no TTL. Local scripts also keep a `.progress-*.jsonl` log so re-runs skip already-done items without a network round-trip.
- **Manual override**: include `"force_destination": "political"` or `"personal"` in any ingest payload to skip the classifier.
- **Reddit polling lives on closet** because Reddit blocks Cloudflare egress IPs and gates their Developer Platform API behind a use-case review. closet's home-ISP IP is unrestricted. See `~/repos/closet/apps/reddit-poller/`.
- **Timestamp preservation**: Micropub spec's `published` field (RFC 3339) is passed through to micro.blog, which dates the post to the original time.
