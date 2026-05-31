#!/usr/bin/env python3
"""
Reddit GDPR export importer — Phase 2 of archive import.

Reads comments.csv and/or posts.csv from a Reddit data request
(reddit.com/settings/data-request, full export, CSV format). Posts each
item to the Worker's /ingest/historical endpoint with the original
timestamp preserved.

Comments are grouped by `link` (the t3_<thread> id). Threads where the
account-owner left multiple comments are posted as a single thread-rollup
note (chronological order, ──── divider between adjacent comments) so
back-and-forth conversations read coherently. Single-comment threads land
as a per-comment note.

The export carries no OP title/selftext and no parent comment body —
just the owner's own comment bodies, subreddit, permalink, link_id,
parent_id, date — so the rollup is structural-only (no enrichment).
Reddit's unauth JSON endpoints now reject all egress IPs (2026-05), so
mid-import fetches to enrich aren't an option.

Usage:
  uv run import_reddit_export.py --comments path/to/comments.csv \\
                                  [--posts path/to/posts.csv] \\
                                  [--dry-run] [--since 2010-01-01] [--until 2015-12-31]

The Reddit export folder layout (as of 2026):
  export/
    comments.csv         ← id, permalink, date, ip, subreddit, gildings, link, parent, body
    posts.csv            ← id, permalink, date, ip, subreddit, gildings, title, url, body
    ...other files (saved, votes, etc.) — not used here
"""
from __future__ import annotations

import argparse
import csv
import re
import sys
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE))
from _bridge import Progress, post_historical, sleep_between  # noqa: E402
from reddit_enrich import SubmissionCache, fetch_submission_metadata, submission_id_from_link  # noqa: E402


def parse_date(s: str) -> datetime:
    """Reddit exports use 'YYYY-MM-DD HH:MM:SS UTC'."""
    s = s.strip().replace(" UTC", "+00:00")
    try:
        return datetime.fromisoformat(s)
    except ValueError:
        return datetime.strptime(s, "%Y-%m-%dT%H:%M:%S%z")


def normalize_subreddit(link_or_perm: str) -> str:
    """Extract 'sub' from /r/sub/comments/... permalink."""
    if not link_or_perm:
        return ""
    parts = link_or_perm.split("/")
    if "r" in parts:
        idx = parts.index("r")
        if idx + 1 < len(parts):
            return parts[idx + 1]
    return ""


def normalize_thread_url(link_field: str) -> str:
    """Trim a Reddit thread URL (CSV `link` column) to a canonical
    https://www.reddit.com/r/<sub>/comments/<link_short>/ form.
    The export sometimes drops the trailing slash; sometimes includes a
    truncated slug. We just want the comments/<short> root."""
    if not link_field:
        return ""
    s = link_field.strip()
    if not s.startswith("http"):
        s = f"https://www.reddit.com{s if s.startswith('/') else '/' + s}"
    return s.rstrip("/") + "/"


def link_short_id(link_field: str) -> str:
    """Extract the `<link_short>` slug from the link URL. Used as the
    rollup idempotency key — stable, short, human-readable."""
    if not link_field:
        return ""
    parts = [p for p in link_field.split("/") if p]
    # ['https:', 'www.reddit.com', 'r', sub, 'comments', link_short, ...]
    if "comments" in parts:
        i = parts.index("comments")
        if i + 1 < len(parts):
            return parts[i + 1]
    return link_field  # fallback — caller still gets a stable string


def format_comment_row(row: dict, submission_meta: dict | None = None) -> tuple[str, str, str, list[str]]:
    """Per-comment format (2026-05-31):

    Self post (or unknown):
        <comment body>
        ---
        _Originally a Reddit comment on [<title>](<comment_url>) in r/<sub>._

    Link post (parent was a submission linking out to an article):
        <comment body>

        <bare external article url>

        — reads as if Doug posted the article with a short take. micro.blog's
          link-preview Worker turns the bare URL into a card.

    `submission_meta`, when provided, comes from reddit_enrich.fetch_submission_metadata
    and shapes the rendering. None → falls back to self-post style with no title.

    Returns (id, content, classifier_text, categories)."""
    body = (row.get("body") or "").strip()
    sub = normalize_subreddit(row.get("permalink") or row.get("link") or "")
    permalink = row.get("permalink") or ""
    if permalink and not permalink.startswith("http"):
        permalink = f"https://www.reddit.com{permalink}"

    kind = (submission_meta or {}).get("kind", "unknown")
    title = (submission_meta or {}).get("title")
    external_url = (submission_meta or {}).get("external_url")

    parts = [body]

    if kind == "link" and external_url:
        # "Doug shared the article with a take" — bare URL on its own line so
        # the link-preview Worker renders it as a card.
        parts.append("")
        parts.append(external_url)
    else:
        # Self post (or unknown/media without a clean article URL): the comment
        # body is the value; cite the Reddit thread as the place of origin.
        title_link = (
            f"[{title}]({permalink})" if (title and permalink) else
            (f"[Comment thread]({permalink})" if permalink else "")
        )
        sub_clause = f" in r/{sub}" if sub else ""
        if title_link:
            footer = f"_Originally a Reddit comment on {title_link}{sub_clause}._"
        elif sub:
            footer = f"_Originally a Reddit comment{sub_clause}._"
        else:
            footer = None
        if footer:
            parts.append("")
            parts.append("---")
            parts.append(footer)

    categories = ["from-reddit", "archive"]
    if sub:
        categories.append(f"r-{sub.lower()}")
    return row["id"], "\n".join(parts), body, categories


def format_thread_rollup(link_id: str, rows: list[dict]) -> tuple[str, str, str, list[str]]:
    """
    Multi-comment thread format: chronological owner comments separated by
    a thin divider, with a single footer at the bottom linking back to the
    thread root on Reddit. Returns (rollup_id, content, classifier_text, categories).
    """
    rows = sorted(rows, key=lambda r: parse_date(r["date"]))
    sub = normalize_subreddit(rows[0].get("permalink") or rows[0].get("link") or "")

    lines: list[str] = []
    for i, r in enumerate(rows):
        body = (r.get("body") or "").strip()
        if not body:
            continue
        if i > 0:
            lines.append("")
            lines.append("────────")
            lines.append("")
        lines.append(body)

    # Single footer at the bottom of the rollup (no per-comment links — they'd
    # clutter the thread read-through). Use the thread URL not individual
    # comment permalinks.
    thread_url = normalize_thread_url(rows[0].get("link") or "")
    if thread_url and sub:
        lines.append("")
        lines.append("---")
        lines.append(
            f"_Originally a Reddit thread in r/{sub}. "
            f"[Discussion]({thread_url})._"
        )

    categories = ["from-reddit", "archive", "reddit-thread"]
    if sub:
        categories.append(f"r-{sub.lower()}")

    classifier_text = "\n\n".join((r.get("body") or "").strip() for r in rows if (r.get("body") or "").strip())
    # Use link_short (e.g. "20ewi") not full URL as the idempotency key.
    rollup_id = link_short_id(link_id) or link_id
    return rollup_id, "\n".join(lines), classifier_text, categories


def format_post_row(row: dict) -> tuple[str, str, str, list[str]]:
    title = (row.get("title") or "").strip()
    body = (row.get("body") or "").strip()
    url = (row.get("url") or "").strip()
    sub = normalize_subreddit(row.get("permalink") or "")
    permalink = row.get("permalink") or ""
    if permalink and not permalink.startswith("http"):
        permalink = f"https://www.reddit.com{permalink}"

    lines = []
    if sub:
        lines.append(f"Posted to [r/{sub}](https://www.reddit.com/r/{sub}):")
        lines.append("")
    if title:
        lines.append(f"**{title}**")
        lines.append("")
    if body:
        lines.append(body)
        lines.append("")
    if url and url != permalink:
        lines.append(url)
        lines.append("")
    if permalink:
        lines.append(f"— [permalink]({permalink})")

    classifier_text = f"{title}\n\n{body}".strip() or url
    categories = ["from-reddit", "archive", "reddit-post"]
    if sub:
        categories.append(f"r-{sub.lower()}")
    return row["id"], "\n".join(lines), classifier_text, categories


REMOVED_MARKERS = {"[removed]", "[deleted]"}


def is_dead_row(row: dict) -> bool:
    """True if this row's body is just Reddit's stub for mod-removed or
    OP-deleted content. We don't want to cross-post empty 'this content
    is no longer available' rows."""
    body = (row.get("body") or "").strip()
    return body in REMOVED_MARKERS or not body


def is_top_level(row: dict) -> bool:
    """True if this comment is a direct reply to the OP, not to another
    comment. Reddit's GDPR export marks direct OP replies by leaving the
    `parent` field empty OR by prefixing with 't3_' (the thread fullname).
    Anything else (bare comment id, 't1_' prefix) is a reply to another
    comment — skip those, the reader can click through to the thread
    for the full conversation."""
    parent = (row.get("parent") or "").strip()
    return parent == "" or parent.startswith("t3_")


def iter_csv(path: Path):
    with path.open(newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            yield row


def main():
    ap = argparse.ArgumentParser(
        description="Import a Reddit GDPR export into the social-bridge Worker. "
                    "Top-level comments only (no reply rollups). --since is REQUIRED "
                    "so a full-history run can't fire by accident — that footgun cost "
                    "211 unintended posts on 2026-05-30 before being caught."
    )
    ap.add_argument("--comments", type=Path, help="Path to comments.csv from Reddit export")
    ap.add_argument("--posts", type=Path, help="Path to posts.csv from Reddit export")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--since", required=True,
                    help="REQUIRED: only items on/after YYYY-MM-DD. No exceptions.")
    ap.add_argument("--until", help="Optional: only items on/before YYYY-MM-DD")
    ap.add_argument("--progress", default=str(HERE / ".progress-reddit-export.jsonl"))
    args = ap.parse_args()

    if not args.comments and not args.posts:
        sys.exit("provide at least one of --comments or --posts")

    progress = Progress(Path(args.progress))
    print(f"Resuming with {len(progress.done)} already-done items")

    sub_cache = SubmissionCache(HERE / ".submission-cache.json")
    print(f"Submission cache: {len(sub_cache.data)} entries")

    since = datetime.fromisoformat(args.since).replace(tzinfo=timezone.utc)
    until = datetime.fromisoformat(args.until).replace(tzinfo=timezone.utc) if args.until else None
    print(f"window: {since.date()} → {until.date() if until else 'now'}")

    # Dedup against rollups that already posted under the old behavior — for
    # any `reddit-export-thread:<link_short>` in the progress file, every
    # comment from that thread is implicitly already represented and must
    # not re-post. (Only matters for the small set of rollups Doug kept
    # intact pre-pivot; everything else has been cleaned up.)
    already_rolled_up_link_shorts = {
        e.split(":", 1)[1]
        for e in progress.done
        if e.startswith("reddit-export-thread:")
    }
    if already_rolled_up_link_shorts:
        print(f"will skip comments from {len(already_rolled_up_link_shorts)} thread(s) already posted as rollups")

    posted = skipped = errors = 0

    def in_window(dt: datetime) -> bool:
        if since and dt < since:
            return False
        if until and dt > until:
            return False
        return True

    def send(source: str, ident_local: str, content: str, classifier_text: str,
             categories: list[str], published: datetime):
        nonlocal posted, skipped, errors
        if not classifier_text.strip():
            skipped += 1
            return
        full_id = f"{source}:{ident_local}"
        if progress.has(full_id):
            skipped += 1
            return
        payload = {
            "source": source,
            "id": ident_local,
            "content": content,
            "text_for_classifier": classifier_text,
            "published": published.astimezone(timezone.utc).isoformat().replace("+00:00", "Z"),
            "categories": categories,
        }
        result = post_historical(payload, dry_run=args.dry_run)
        progress.add(full_id, result)
        if result.get("posted"):
            posted += 1
            print(f"[{posted:5d}] {payload['published'][:10]}  →  {result.get('destination'):30s}  {source} {ident_local}")
        elif result.get("dryRun"):
            print(f"[DRY  ] {payload['published'][:10]}  →  {result.get('classification'):10s}  {source} {ident_local}")
        elif result.get("skipped"):
            skipped += 1
        else:
            errors += 1
            print(f"[ERR  ] {full_id}  {result}")
        sleep_between()

    if args.comments:
        all_rows_raw = list(iter_csv(args.comments))
        dead = sum(1 for r in all_rows_raw if is_dead_row(r))
        replies = sum(1 for r in all_rows_raw if not is_dead_row(r) and not is_top_level(r))
        kept = [r for r in all_rows_raw if not is_dead_row(r) and is_top_level(r)]
        print(f"  filtered {dead} mod-removed/deleted-stub rows")
        print(f"  filtered {replies} reply-to-comment rows (top-level only)")
        print(f"  {len(kept)} top-level comments remain before date window")

        for row in sorted(kept, key=lambda r: parse_date(r["date"])):
            try:
                dt = parse_date(row["date"])
            except Exception as e:
                errors += 1
                print(f"[BADDATE] {row.get('id')}: {e}")
                continue
            if not in_window(dt):
                continue
            link_short = link_short_id(row.get("link") or "")
            if link_short and link_short in already_rolled_up_link_shorts:
                skipped += 1
                continue
            sub_id = submission_id_from_link(row.get("link") or "")
            sub_name = (row.get("subreddit") or "").strip()
            meta = (
                fetch_submission_metadata(sub_name, sub_id, sub_cache)
                if sub_id and sub_name
                else None
            )
            ident, content, ctext, cats = format_comment_row(row, meta)
            send("reddit-export-comment", ident, content, ctext, cats, dt)

    if args.posts:
        for row in iter_csv(args.posts):
            try:
                dt = parse_date(row["date"])
            except Exception as e:
                errors += 1
                print(f"[BADDATE] {row.get('id')}: {e}")
                continue
            if not in_window(dt):
                continue
            ident, content, ctext, cats = format_post_row(row)
            send("reddit-export-post", ident, content, ctext, cats, dt)

    print(f"\nDone. posted={posted} skipped={skipped} errors={errors}")


if __name__ == "__main__":
    main()
