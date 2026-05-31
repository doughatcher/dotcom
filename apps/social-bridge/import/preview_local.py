#!/usr/bin/env python3
"""
Local rollup preview — no Worker, no Micropub, no Anthropic.

Reads a comments.csv (and optionally posts.csv) and renders what
import_reddit_export.py WOULD POST to /ingest/historical, with the same
grouping and formatting logic. Writes each rendered post to stdout or a
directory for review.

Usage:
    uv run preview_local.py --comments fixtures/comments-sample.csv
    uv run preview_local.py --comments path/to/comments.csv --out /tmp/preview
    uv run preview_local.py --comments path/to/comments.csv --posts path/to/posts.csv --out /tmp/preview
"""
from __future__ import annotations

import argparse
import sys
from collections import defaultdict
from pathlib import Path

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE))
from import_reddit_export import (  # noqa: E402
    format_comment_row,
    format_post_row,
    format_thread_rollup,
    is_dead_row,
    iter_csv,
    parse_date,
)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--comments", type=Path)
    ap.add_argument("--posts", type=Path)
    ap.add_argument("--out", type=Path, help="Write previews to this directory (one file per post)")
    ap.add_argument("--limit", type=int, default=0, help="Limit posts rendered (0 = no limit)")
    args = ap.parse_args()

    if not args.comments and not args.posts:
        sys.exit("provide at least one of --comments or --posts")

    if args.out:
        args.out.mkdir(parents=True, exist_ok=True)
        for p in args.out.glob("*.md"):
            p.unlink()

    rendered = 0

    def emit(source: str, ident: str, content: str, categories: list[str], published, kind: str):
        nonlocal rendered
        date_prefix = published.isoformat()[:10]
        rendered += 1
        header = (
            f"=== {kind:<7s}  {date_prefix}  {source}:{ident}  "
            f"categories={','.join(categories)} ===\n"
        )
        if args.out:
            slug = f"{date_prefix}__{source}__{ident}.md"
            (args.out / slug).write_text(header + content + "\n")
        else:
            print(header + content)
            print()
        return args.limit and rendered >= args.limit

    if args.comments:
        rows_raw = list(iter_csv(args.comments))
        rows = [r for r in rows_raw if not is_dead_row(r)]
        dropped = len(rows_raw) - len(rows)
        if dropped:
            print(f"# dropped {dropped} [removed]/[deleted] stub rows", file=sys.stderr)
        by_thread: dict[str, list[dict]] = defaultdict(list)
        for r in rows:
            link = (r.get("link") or "").strip() or f"orphan:{r['id']}"
            try:
                parse_date(r["date"])
            except Exception:
                continue
            by_thread[link].append(r)
        print(f"# {len(rows)} rows → {len(by_thread)} threads "
              f"({sum(1 for rs in by_thread.values() if len(rs) > 1)} multi-comment)\n",
              file=sys.stderr)
        sorted_threads = sorted(
            by_thread.items(),
            key=lambda kv: min(parse_date(r["date"]) for r in kv[1]),
        )
        for link_id, group in sorted_threads:
            earliest = min(parse_date(r["date"]) for r in group)
            if len(group) == 1:
                ident, content, _ctext, cats = format_comment_row(group[0])
                if emit("reddit-export-comment", ident, content, cats, earliest, "single"):
                    return
            else:
                ident, content, _ctext, cats = format_thread_rollup(link_id, group)
                if emit("reddit-export-thread", ident, content, cats, earliest, "rollup"):
                    return

    if args.posts:
        for row in iter_csv(args.posts):
            try:
                dt = parse_date(row["date"])
            except Exception:
                continue
            ident, content, _ctext, cats = format_post_row(row)
            if emit("reddit-export-post", ident, content, cats, dt, "post"):
                return

    print(f"\n# Rendered {rendered} posts", file=sys.stderr)
    if args.out:
        print(f"# Output in {args.out}", file=sys.stderr)


if __name__ == "__main__":
    main()
