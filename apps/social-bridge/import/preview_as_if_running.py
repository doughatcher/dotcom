#!/usr/bin/env python3
"""
Render exactly what would post if we ran the current ruleset over the
last ~60 days of Reddit history. Uses a heuristic classifier (subreddit
allowlist + simple keyword scan) as a preview-only stand-in for the real
Claude Haiku classifier that runs in the Worker.

This is a preview tool. When the Worker is deployed, the real Claude
classifier runs there — verdicts here are an approximation, intended to
give Doug a sense of routing without burning API calls during iteration.
"""
from __future__ import annotations

import csv
import sys
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

VAULT = Path("/var/home/me/Documents/Cloud Vault/Context/scratch")
EXPORT = Path("/home/me/Downloads/reddit-export/comments.csv")
SINCE = datetime(2026, 4, 1, tzinfo=timezone.utc)  # last ~60 days

POLITICAL_SUBS = {
    "politics", "Libertarian", "atheism", "southcarolina", "conservative",
    "Republican", "democrats", "PoliticalDiscussion", "PoliticalHumor",
    "news", "worldnews", "Conservative", "neoliberal", "progressive",
    "AskAnAmerican", "AskTrumpSupporters",
}

POLITICAL_KEYWORDS = (
    "trump", "biden", "obama", "hillary", "clinton", "harris",
    "republican", "democrat", "liberal", "conservative",
    "gop", "abortion", "vote", "election", "congress", "senator",
    "potus", "senate", "leftist", "right-wing", "libtard", "snowflake",
    "fascist", "nazi", "communist", "socialism", "capitalism",
)


def classify(text: str, subreddit: str) -> str:
    if subreddit in POLITICAL_SUBS:
        return "political"
    lower = text.lower()
    hits = sum(1 for kw in POLITICAL_KEYWORDS if kw in lower)
    return "political" if hits >= 2 else "personal"


# Load + filter
rows = [r for r in csv.DictReader(EXPORT.open()) if not is_dead_row(r)]
rows = [r for r in rows if parse_date(r["date"]) >= SINCE]
print(f"loaded {len(rows)} comments since {SINCE.date()}", file=sys.stderr)

by_thread: dict[str, list[dict]] = defaultdict(list)
for r in rows:
    link = (r.get("link") or "").strip() or f"orphan:{r['id']}"
    by_thread[link].append(r)
print(f"  -> {len(by_thread)} threads "
      f"({sum(1 for g in by_thread.values() if len(g)>1)} multi-comment rollups)",
      file=sys.stderr)

items = []
threads_sorted = sorted(
    by_thread.items(),
    key=lambda kv: min(parse_date(r["date"]) for r in kv[1]),
)
for link, group in threads_sorted:
    earliest = min(parse_date(r["date"]) for r in group)
    if len(group) == 1:
        ident, content, ctext, cats = format_comment_row(group[0])
        kind = "single"
    else:
        ident, content, ctext, cats = format_thread_rollup(link, group)
        kind = "rollup"
    verdict = classify(ctext, group[0]["subreddit"])
    print(f"  [{kind}] {earliest.date()} r/{group[0]['subreddit']:25s} -> {verdict}",
          file=sys.stderr)
    items.append({
        "earliest": earliest,
        "kind": kind,
        "ident": ident,
        "content": content,
        "categories": cats,
        "subreddit": group[0]["subreddit"],
        "comment_count": len(group),
        "verdict": verdict,
    })

posted = [t for t in items if t["verdict"] == "personal"]
dropped = [t for t in items if t["verdict"] == "political"]

lines = [
    "---",
    "type: reddit-backlog-preview",
    "tags: [reddit-backlog, doughatcher, social-bridge, as-if-running]",
    "---",
    "",
    "# Reddit backlog — what would post if we ran today (since 2026-04-01)",
    "",
    f"**Generated:** {datetime.now(timezone.utc).isoformat()}",
    f"**Source:** ~/Downloads/reddit-export GDPR dump",
    f"**Window:** {SINCE.date()} → {max(t['earliest'] for t in items).date()}",
    f"**Classifier (preview-only):** heuristic — subreddit allowlist + keyword scan. The real Worker uses Claude Haiku 4.5 with the same routing semantics. Verdicts here are an approximation; the actual classifier may differ on edge cases.",
    f"**Worker config:** DROP_POLITICAL=1, DRY_RUN=1, classifier on",
    "",
    "## Stats",
    "",
    f"- **Total threads in window:** {len(items)}",
    f"- **Would post to doughatcher.com:** {len(posted)} (`PERSONAL`)",
    f"- **Would be dropped (held for synthesis pipeline):** {len(dropped)} (`POLITICAL`)",
    f"- **Multi-comment rollups:** {sum(1 for t in items if t['kind']=='rollup')}",
    "",
    "## What you're looking at",
    "",
    "Each section is one micro.blog post that would land on doughatcher.com (POSTED) or be held back (DROPPED-political). Body content + bare URL is exactly what publishes; the `cats:` footer is the Micropub category set attached for filtering. Earliest-comment timestamp on a rollup becomes the `published` field — micro.blog dates the post to that.",
    "",
    "If this reads right, this is the pattern we ship.",
    "",
    "---",
    "",
    "# Would post (PERSONAL)",
    "",
]
for t in posted:
    head = f"## ✅ POSTED — {t['earliest'].date()} — r/{t['subreddit']}"
    if t["kind"] == "rollup":
        head += f" — rollup of {t['comment_count']} comments"
    lines.append(head)
    lines.append("")
    lines.append(t["content"])
    lines.append("")
    lines.append(f"`reddit-export-{t['kind']}:{t['ident']}` · cats: `{','.join(t['categories'])}`")
    lines.append("")
    lines.append("---")
    lines.append("")

lines.append("")
lines.append("# Held back (POLITICAL — DROP_POLITICAL=1)")
lines.append("")
lines.append("*These items would NOT post anywhere. They stay in the GDPR CSV on disk as source material for the future leaning.blue synthesis pipeline. The classifier flagged them as POLITICAL.*")
lines.append("")
for t in dropped:
    head = f"## ⏸️ DROPPED — {t['earliest'].date()} — r/{t['subreddit']}"
    if t["kind"] == "rollup":
        head += f" — rollup of {t['comment_count']} comments"
    lines.append(head)
    lines.append("")
    lines.append(t["content"])
    lines.append("")
    lines.append(f"`reddit-export-{t['kind']}:{t['ident']}` · cats: `{','.join(t['categories'])}`")
    lines.append("")
    lines.append("---")
    lines.append("")

out = VAULT / "reddit-backlog-as-if-running.md"
out.write_text("\n".join(lines))
print(f"\nwrote {out.name}: {len(items)} items "
      f"({len(posted)} posted, {len(dropped)} dropped)", file=sys.stderr)
