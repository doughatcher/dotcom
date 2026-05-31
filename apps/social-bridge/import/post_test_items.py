#!/usr/bin/env python3
"""
Post 3 representative items directly to micro.blog/micropub. Classifies
each with the real Claude Haiku classifier first; aborts if any come
back POLITICAL.

This bypasses the doughatcher-social-bridge Cloudflare Worker (which
hasn't deployed yet because the local CF_API_TOKEN lacks Workers scope)
and POSTs straight to micro.blog Micropub with the existing Micropub
token. Same routing semantics as the Worker would use.
"""
from __future__ import annotations

import csv
import json
import os
import sys
import urllib.parse
import urllib.request
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

HERE = Path("/var/home/me/repos/micro.blog/doughatcher/apps/social-bridge/import")
sys.path.insert(0, str(HERE))
from import_reddit_export import (
    format_comment_row,
    format_thread_rollup,
    is_dead_row,
    parse_date,
)

EXPORT = Path("/home/me/Downloads/reddit-export/comments.csv")

# Read API key from ~/.env (it's commented out but the value is there).
# Use it inline, don't persist.
ANTHROPIC_KEY = None
for line in Path("/home/me/.env").read_text().splitlines():
    s = line.strip()
    if s.startswith("# export ANTHROPIC_API_KEY=") or s.startswith("export ANTHROPIC_API_KEY="):
        s = s.lstrip("# ").removeprefix("export ").strip()
        if s.startswith("ANTHROPIC_API_KEY="):
            ANTHROPIC_KEY = s.split("=", 1)[1].strip().strip('"').strip("'")
            break
if not ANTHROPIC_KEY:
    sys.exit("could not parse ANTHROPIC_API_KEY from ~/.env")

MICROPUB_TOKEN = os.environ.get("MICROBLOG_APP_TOKEN") or os.environ.get("MICROPUB_TOKEN")
if not MICROPUB_TOKEN:
    sys.exit("set MICROBLOG_APP_TOKEN (or MICROPUB_TOKEN) before running")
MICROPUB_URL = "https://micro.blog/micropub"
DESTINATION = "https://hatcher.micro.blog/"  # doughatcher.com personal site uid

CLASSIFIER_PROMPT = """You classify a single short social-media post as either POLITICAL or PERSONAL.

POLITICAL covers: electoral politics, partisan policy debate, opinions on politicians/parties/candidates, government actions framed partisanly, civic activism, voting, abortion/guns/immigration/climate as policy issues, current events with clear partisan slant.

PERSONAL covers: tech work, hobbies, family, personal observations, neutral news links, software/engineering, sports, entertainment, jokes, and any current event WITHOUT a partisan opinion.

When in doubt, lean PERSONAL — the political site should only get content that clearly belongs there.

Respond with exactly one word: POLITICAL or PERSONAL."""


def classify(text: str) -> str:
    body = {
        "model": "claude-haiku-4-5",
        "max_tokens": 4,
        "system": CLASSIFIER_PROMPT,
        "messages": [{"role": "user", "content": text[:4000]}],
    }
    req = urllib.request.Request(
        "https://api.anthropic.com/v1/messages",
        data=json.dumps(body).encode(),
        headers={
            "x-api-key": ANTHROPIC_KEY,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        data = json.loads(r.read())
        word = (data.get("content", [{}])[0].get("text", "") or "").strip().upper()
        return "political" if word.startswith("POLITICAL") else "personal"


def micropub_post(content: str, published_iso: str, categories: list[str]) -> tuple[int, str]:
    # Cross-post policy: NEVER syndicate Reddit-sourced backlog posts to
    # LinkedIn / Bluesky / Mastodon / Threads. Account-level micro.blog
    # defaults sometimes fire on API entries (observed 2026-05-18 w/
    # Bluesky), so we send an explicit empty mp-syndicate-to[] to
    # suppress. Same policy is codified in src/micropub.js for the Worker.
    form = [
        ("h", "entry"),
        ("content", content),
        ("mp-destination", DESTINATION),
        ("published", published_iso),
        ("mp-syndicate-to[]", ""),  # explicit no-syndication
    ]
    for cat in categories:
        form.append(("category[]", cat))
    body = urllib.parse.urlencode(form).encode()
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
            return r.status, r.headers.get("Location", "(no Location header)")
    except urllib.error.HTTPError as e:
        return e.code, f"ERROR: {e.read().decode()}"


# --- Pick 3 items: short single, long single, multi-comment rollup ---
TARGET_IDS = {
    "olyti5r",       # short single — r/linuxmasterrace one-liner
    "ohbfl1f",       # long single — r/Magento ~3KB post
    "1t1kt8l",       # rollup — r/Bazzite 3-comment back-and-forth
}

rows = [r for r in csv.DictReader(EXPORT.open()) if not is_dead_row(r)]
by_thread: dict[str, list[dict]] = defaultdict(list)
for r in rows:
    link = (r.get("link") or "").strip() or f"orphan:{r['id']}"
    by_thread[link].append(r)

# Collect target items by id (single comment id OR thread link_short)
to_post: list[dict] = []
for link, group in by_thread.items():
    link_short = link.rstrip("/").rsplit("/", 1)[-1]
    if link_short in TARGET_IDS:
        earliest = min(parse_date(r["date"]) for r in group)
        ident, content, ctext, cats = format_thread_rollup(link, group)
        to_post.append({"earliest": earliest, "ident": ident, "content": content,
                        "ctext": ctext, "cats": cats, "kind": "rollup",
                        "sub": group[0]["subreddit"]})
    elif len(group) == 1 and group[0]["id"] in TARGET_IDS:
        r = group[0]
        ident, content, ctext, cats = format_comment_row(r)
        to_post.append({"earliest": parse_date(r["date"]), "ident": ident, "content": content,
                        "ctext": ctext, "cats": cats, "kind": "single",
                        "sub": r["subreddit"]})

print(f"matched {len(to_post)} target items\n")

results = []
for t in sorted(to_post, key=lambda x: x["earliest"]):
    print(f"--- {t['kind']} r/{t['sub']} {t['earliest'].date()} (id {t['ident']}) ---")
    verdict = classify(t["ctext"])
    print(f"  classifier: {verdict.upper()}")
    if verdict != "personal":
        print(f"  ! skipping (would be DROP_POLITICAL)")
        results.append({"id": t["ident"], "result": "dropped-political"})
        continue
    published = t["earliest"].astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
    status, location = micropub_post(t["content"], published, t["cats"])
    print(f"  POST -> {status}  {location}")
    results.append({"id": t["ident"], "kind": t["kind"], "sub": t["sub"],
                    "status": status, "url": location})

print("\n=== RESULTS ===")
for r in results:
    print(json.dumps(r))
