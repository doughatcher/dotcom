#!/usr/bin/env python3
"""
Mass-delete posts that were created by the runaway full-history backfill
on 2026-05-30. Reads .progress-reddit-export.jsonl, finds every entry
that has result.posted=true AND not result.manual=true, sends Micropub
delete for each URL, then rewrites the progress file keeping only the
manual test-post entries.

The 3 manual entries (ohbfl1f / 1t1kt8l / olyti5r) have result.manual=true
and are explicitly preserved — Doug approved those.

The 13 political-dropped entries (result.dropped=true) never actually
posted to Micropub so they don't need deletion; but we DO need to drop
them from progress so a future wider-window run can re-evaluate.
"""
from __future__ import annotations

import json
import os
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

PROGRESS = Path("/var/home/me/repos/micro.blog/doughatcher/apps/social-bridge/import/.progress-reddit-export.jsonl")
MICROPUB_URL = "https://micro.blog/micropub"
MICROPUB_TOKEN = os.environ.get("MICROBLOG_APP_TOKEN") or os.environ.get("MICROPUB_TOKEN")
if not MICROPUB_TOKEN:
    sys.exit("set MICROBLOG_APP_TOKEN (or MICROPUB_TOKEN) before running")
DELAY_SEC = 1.1

if not PROGRESS.exists():
    sys.exit(f"missing {PROGRESS}")

entries = []
for line in PROGRESS.read_text().splitlines():
    line = line.strip()
    if not line:
        continue
    entries.append(json.loads(line))

print(f"loaded {len(entries)} progress entries", file=sys.stderr)

to_delete = []
to_keep_in_progress = []
for e in entries:
    r = e.get("result", {})
    if r.get("manual"):
        to_keep_in_progress.append(e)
        continue
    if r.get("posted") and r.get("location"):
        to_delete.append(e)

print(f"  manual (preserve in progress): {len(to_keep_in_progress)}", file=sys.stderr)
print(f"  posted by backfill (delete + drop from progress): {len(to_delete)}", file=sys.stderr)
print(f"  other (dropped political / errors — drop from progress): {len(entries) - len(to_keep_in_progress) - len(to_delete)}", file=sys.stderr)


def micropub_delete(url: str) -> tuple[int, str]:
    body = urllib.parse.urlencode([("action", "delete"), ("url", url)]).encode()
    req = urllib.request.Request(
        MICROPUB_URL,
        data=body,
        headers={
            "Authorization": f"Bearer {MICROPUB_TOKEN}",
            "Content-Type": "application/x-www-form-urlencoded",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, r.read().decode()[:200]
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:200]


deleted = 0
errors = 0
for i, e in enumerate(to_delete, 1):
    url = e["result"]["location"]
    status, body = micropub_delete(url)
    if status in (200, 202, 204):
        deleted += 1
        print(f"[{i:4d}/{len(to_delete)}] {status}  {url}", file=sys.stderr)
    else:
        errors += 1
        print(f"[{i:4d}/{len(to_delete)}] ERR {status}  {url}  {body[:100]}", file=sys.stderr)
    time.sleep(DELAY_SEC)

print(f"\ndone. deleted={deleted} errors={errors}", file=sys.stderr)

# Rewrite progress file: only keep manual entries.
PROGRESS.write_text("".join(json.dumps(e) + "\n" for e in to_keep_in_progress))
print(f"progress file rewritten — kept {len(to_keep_in_progress)} manual entries", file=sys.stderr)
