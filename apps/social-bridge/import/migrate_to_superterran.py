#!/usr/bin/env python3
"""
One-shot migration of the 13 Reddit backfill/manual posts plus the
single Hugo 'what this is' post onto the new superterran.micro.blog
backing site.

Per Doug's 2026-05-30 architecture pivot:
  - doughatcher.com (hatcher.micro.blog) keeps ONLY Magento/Adobe
    Commerce subreddit content. Out of the 13 current posts, that's
    just one: ohbfl1f (r/Magento, "I work at an agency...").
  - superterran.net (superterran.micro.blog) becomes the default
    home for everything else. 12 posts move.
  - The lone Hugo content/posts/2026-05-24-what-this-is.md on the
    GitHub-Pages superterran.net repo also gets posted to the new
    micro.blog so the timeline isn't empty when DNS flips.

Transactional move per post: POST to superterran first; only if that
returns Location do we DELETE the old doughatcher post. If superterran
POST fails, doughatcher stays untouched. Progress file is rewritten
with new locations.

Verified ahead of time:
  - https://superterran.micro.blog/  appears as Micropub destination
  - Same MICROPUB_TOKEN works for both sites (same micro.blog account)
"""
from __future__ import annotations

import csv
import json
import os
import sys
import time
import urllib.parse
import urllib.request
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

HERE = Path("/var/home/me/repos/micro.blog/doughatcher/apps/social-bridge/import")
sys.path.insert(0, str(HERE))
from import_reddit_export import (  # noqa: E402
    format_comment_row,
    format_thread_rollup,
    parse_date,
)

PROGRESS = HERE / ".progress-reddit-export.jsonl"
CSV_PATH = Path("/home/me/Downloads/reddit-export/comments.csv")
WTI_PATH = Path("/var/home/me/repos/micro.blog/superterran.net/content/posts/2026-05-24-what-this-is.md")

TOKEN = os.environ.get("MICROBLOG_APP_TOKEN") or os.environ.get("MICROPUB_TOKEN")
if not TOKEN:
    sys.exit("set MICROBLOG_APP_TOKEN (or MICROPUB_TOKEN) before running")
DOUGHATCHER = "https://hatcher.micro.blog/"
SUPERTERRAN = "https://superterran.micro.blog/"

# Subreddit allowlist for doughatcher (case-insensitive match). Everything
# else routes to superterran. Tight default — Doug can widen later.
PRO_SUBS = {"magento", "adobecommerce"}

DELAY = 1.1


def micropub_post(content: str, published_iso: str, categories: list[str], dest: str) -> tuple[int, str]:
    form = [
        ("h", "entry"),
        ("content", content),
        ("mp-destination", dest),
        ("published", published_iso),
        ("mp-syndicate-to[]", ""),  # NEVER_SYNDICATE policy
    ]
    for cat in categories:
        form.append(("category[]", cat))
    body = urllib.parse.urlencode(form).encode()
    req = urllib.request.Request(
        "https://micro.blog/micropub",
        data=body,
        headers={
            "Authorization": f"Bearer {TOKEN}",
            "Content-Type": "application/x-www-form-urlencoded",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, r.headers.get("Location", "")
    except urllib.error.HTTPError as e:
        return e.code, f"ERROR: {e.read().decode()[:200]}"


def micropub_delete(url: str) -> int:
    body = urllib.parse.urlencode([("action", "delete"), ("url", url)]).encode()
    req = urllib.request.Request(
        "https://micro.blog/micropub",
        data=body,
        headers={
            "Authorization": f"Bearer {TOKEN}",
            "Content-Type": "application/x-www-form-urlencoded",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status
    except urllib.error.HTTPError as e:
        return e.code


# Load CSV indexed by id + grouped by link (for rollup)
rows = list(csv.DictReader(CSV_PATH.open()))
rows_by_id = {r["id"]: r for r in rows}
by_link = defaultdict(list)
for r in rows:
    link = (r.get("link") or "").strip()
    if link:
        by_link[link].append(r)

# Load progress
entries = [json.loads(l) for l in PROGRESS.read_text().splitlines() if l.strip()]
print(f"loaded {len(entries)} progress entries", file=sys.stderr)

new_entries = []
redirects = []  # for later CF redirect setup
moved = stayed = errors = 0

for e in entries:
    eid = e["id"]
    source, ident = eid.split(":", 1)
    old_url = e["result"].get("location") or e["result"].get("url")

    if source == "reddit-export-comment":
        row = rows_by_id.get(ident)
        if not row:
            print(f"[SKIP    ] {eid}: not in CSV", file=sys.stderr)
            new_entries.append(e); continue
        sub_lower = (row.get("subreddit") or "").lower()
        if sub_lower in PRO_SUBS:
            print(f"[STAY    ] {eid} (r/{row['subreddit']}) — kept on doughatcher", file=sys.stderr)
            stayed += 1
            new_entries.append(e); continue
        _, content, ctext, cats = format_comment_row(row)
        dt = parse_date(row["date"])

    elif source == "reddit-export-thread":
        # Rollup. Find the link by walking by_link until ident matches link_short.
        target = None
        for link, group in by_link.items():
            link_short = link.rstrip("/").rsplit("/", 1)[-1]
            if link_short == ident:
                target = (link, group); break
        if not target:
            print(f"[SKIP    ] {eid}: thread not found in CSV", file=sys.stderr)
            new_entries.append(e); continue
        link, group = target
        sub_lower = (group[0].get("subreddit") or "").lower()
        if sub_lower in PRO_SUBS:
            print(f"[STAY    ] {eid} — pro sub", file=sys.stderr)
            stayed += 1
            new_entries.append(e); continue
        _, content, ctext, cats = format_thread_rollup(link, group)
        dt = min(parse_date(r["date"]) for r in group)
    else:
        print(f"[UNKNOWN ] {eid}: unknown source", file=sys.stderr)
        new_entries.append(e); continue

    published = dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
    # POST first
    status, new_url = micropub_post(content, published, cats, SUPERTERRAN)
    if status not in (200, 202) or not new_url.startswith("http"):
        print(f"[ERR POST] {eid}: status={status} resp={new_url[:100]}", file=sys.stderr)
        errors += 1
        new_entries.append(e); continue
    time.sleep(DELAY)
    # Then DELETE old
    del_status = micropub_delete(old_url)
    if del_status not in (200, 202, 204):
        print(f"[ERR DEL ] {eid}: posted to {new_url} but delete failed {del_status}", file=sys.stderr)
        # Still record the move — the post is now duplicated but we'll surface
    print(f"[MOVED   ] {eid}  {old_url}\n              -> {new_url}", file=sys.stderr)
    redirects.append({"from": old_url, "to": new_url, "id": eid})
    new_entries.append({
        "id": eid,
        "result": {
            "posted": True,
            "migrated": True,
            "destination": SUPERTERRAN,
            "location": new_url,
            "previous_location": old_url,
            "published": published,
        },
    })
    moved += 1
    time.sleep(DELAY)

# Now the Hugo "what this is" post
print("", file=sys.stderr)
print("Migrating Hugo 'what this is' post...", file=sys.stderr)
wti_text = WTI_PATH.read_text()
# Split frontmatter
parts = wti_text.split("---\n", 2)
fm_text = parts[1]
body = parts[2].strip()
# Parse a couple frontmatter fields
fm = {}
for line in fm_text.splitlines():
    if ":" in line:
        k, _, v = line.partition(":")
        fm[k.strip()] = v.strip().strip('"').strip("'").strip("[").strip("]").strip().strip('"')
title = fm.get("title", "what this is")
date_str = fm.get("date", "2026-05-24")
# Construct ISO datetime (just use noon UTC if only date)
if "T" not in date_str:
    published = f"{date_str}T12:00:00Z"
else:
    published = date_str

# For a titled post, include the title in the content via a level-2 heading.
content_with_title = f"# {title}\n\n{body}"
status, location = micropub_post(content_with_title, published, ["meta", "site"], SUPERTERRAN)
print(f"  what-this-is: status={status}  url={location}", file=sys.stderr)
if status in (200, 202) and location.startswith("http"):
    new_entries.append({
        "id": "superterran-bootstrap:what-this-is",
        "result": {"posted": True, "manual": True, "location": location, "published": published},
    })

# Persist updated progress + redirect mapping
PROGRESS.write_text("".join(json.dumps(e) + "\n" for e in new_entries))
(HERE / "migration-redirects.json").write_text(json.dumps(redirects, indent=2) + "\n")

print(f"\nDone. moved={moved} stayed={stayed} errors={errors}", file=sys.stderr)
print(f"Redirect mapping saved to {HERE / 'migration-redirects.json'}", file=sys.stderr)
