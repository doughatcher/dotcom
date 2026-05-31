#!/usr/bin/env python3
"""
Facebook DYI export importer.

Walks the unzipped Facebook "Download Your Information" tree, extracts
your posts with original timestamps and attachments, POSTs each to the
Worker's /ingest/historical endpoint.

Usage:
  uv run import_facebook_export.py --dir /path/to/facebook-export \\
                                    [--dry-run] [--since 2010-01-01] [--until 2015-12-31]

Expected layout (FB's format as of 2024+, JSON export):
  facebook-export/
    your_facebook_activity/
      posts/
        your_posts__check_ins__photos_and_videos_1.json
        your_posts__check_ins__photos_and_videos_2.json
        ...
    (or older path: posts/your_posts_*.json )

Each JSON file contains an array; each item typically looks like:
  {
    "timestamp": 1357938298,
    "data": [{"post": "text here"}],
    "title": "Doug Hatcher updated his status.",
    "attachments": [
      {"data": [{"external_context": {"name": "...", "url": "https://..."}}]},
      {"data": [{"media": {"uri": "photos/...jpg", "creation_timestamp": ..., "description": "..."}}]}
    ]
  }

FB's encoding is mojibake'd UTF-8 (latin-1 over UTF-8); we decode robustly.
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE))
from _bridge import Progress, post_historical, sleep_between  # noqa: E402


def fix_mojibake(s):
    """Facebook ships JSON encoded as latin-1 bytes of UTF-8. Reverse it."""
    if isinstance(s, str):
        try:
            return s.encode("latin-1").decode("utf-8")
        except (UnicodeEncodeError, UnicodeDecodeError):
            return s
    if isinstance(s, list):
        return [fix_mojibake(x) for x in s]
    if isinstance(s, dict):
        return {k: fix_mojibake(v) for k, v in s.items()}
    return s


def iter_post_files(root: Path):
    candidates = [
        root / "your_facebook_activity" / "posts",
        root / "posts",
        root,
    ]
    for d in candidates:
        if d.is_dir():
            yield from sorted(d.glob("your_posts*.json"))


def extract_text(item: dict) -> str:
    bits = []
    for d in item.get("data") or []:
        if isinstance(d, dict):
            if d.get("post"):
                bits.append(d["post"])
            elif d.get("text"):
                bits.append(d["text"])
    return "\n\n".join(bits).strip()


def extract_attachments(item: dict) -> list[dict]:
    out = []
    for a in item.get("attachments") or []:
        for d in a.get("data") or []:
            if "external_context" in d:
                ec = d["external_context"]
                out.append({"type": "link", "url": ec.get("url"), "name": ec.get("name")})
            elif "media" in d:
                m = d["media"]
                out.append({
                    "type": "media",
                    "uri": m.get("uri"),
                    "description": m.get("description"),
                    "title": m.get("title"),
                })
            elif "place" in d:
                p = d["place"]
                out.append({"type": "place", "name": p.get("name"), "url": p.get("url")})
    return out


def format_item(item: dict) -> tuple[str, str, str, list[str]]:
    """Returns (id, content, classifier_text, categories)."""
    text = extract_text(item)
    atts = extract_attachments(item)
    ts = item.get("timestamp") or 0
    # Stable id for idempotency — FB doesn't always provide a post id in DYI.
    # Use timestamp + a hash of the text/atts.
    import hashlib
    h = hashlib.sha1(
        (str(ts) + text + json.dumps(atts, sort_keys=True)).encode("utf-8", errors="replace")
    ).hexdigest()[:12]
    ident = f"{ts}-{h}"

    lines = []
    if text:
        lines.append(text)
    if atts:
        if text:
            lines.append("")
        for a in atts:
            if a["type"] == "link" and a.get("url"):
                label = a.get("name") or a["url"]
                lines.append(f"[{label}]({a['url']})")
            elif a["type"] == "media":
                bits = [b for b in [a.get("title"), a.get("description")] if b]
                if bits:
                    lines.append("📷 " + " — ".join(bits))
                elif a.get("uri"):
                    lines.append(f"📷 (attached: {a['uri']})")
            elif a["type"] == "place" and a.get("name"):
                lines.append(f"📍 {a['name']}")

    classifier_text = text or " ".join(
        (a.get("name") or a.get("description") or a.get("title") or "") for a in atts
    ).strip()

    content = "\n".join(lines) if lines else "(empty post)"
    categories = ["from-facebook", "archive"]
    return ident, content, classifier_text, categories


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", required=True, type=Path, help="Path to unzipped FB DYI export root")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--since", help="Only items on/after YYYY-MM-DD")
    ap.add_argument("--until", help="Only items on/before YYYY-MM-DD")
    ap.add_argument("--progress", default=str(HERE / ".progress-facebook-export.jsonl"))
    args = ap.parse_args()

    if not args.dir.is_dir():
        sys.exit(f"not a directory: {args.dir}")

    progress = Progress(Path(args.progress))
    print(f"Resuming with {len(progress.done)} already-done items")
    since = datetime.fromisoformat(args.since).replace(tzinfo=timezone.utc) if args.since else None
    until = datetime.fromisoformat(args.until).replace(tzinfo=timezone.utc) if args.until else None

    posted = skipped = errors = 0
    seen_files = 0

    for fp in iter_post_files(args.dir):
        seen_files += 1
        raw = json.loads(fp.read_text(encoding="utf-8"))
        items = fix_mojibake(raw) if isinstance(raw, list) else fix_mojibake(raw.get("posts", []))
        for item in items:
            ts = item.get("timestamp")
            if not ts:
                continue
            published_dt = datetime.fromtimestamp(ts, tz=timezone.utc)
            if since and published_dt < since:
                continue
            if until and published_dt > until:
                continue

            ident, content, classifier_text, categories = format_item(item)
            if not classifier_text.strip():
                skipped += 1
                continue
            full_id = f"facebook-export:{ident}"
            if progress.has(full_id):
                skipped += 1
                continue

            payload = {
                "source": "facebook-export",
                "id": ident,
                "content": content,
                "text_for_classifier": classifier_text,
                "published": published_dt.isoformat().replace("+00:00", "Z"),
                "categories": categories,
            }
            try:
                result = post_historical(payload, dry_run=args.dry_run)
                progress.add(full_id, result)
                if result.get("posted"):
                    posted += 1
                    print(f"[{posted:5d}] {payload['published'][:10]}  →  {result.get('destination'):30s}  fb {ident}")
                elif result.get("dryRun"):
                    print(f"[DRY  ] {payload['published'][:10]}  →  {result.get('classification'):10s}  fb {ident}")
                elif result.get("skipped"):
                    skipped += 1
                else:
                    errors += 1
                    print(f"[ERR  ] {full_id}  {result}")
                sleep_between()
            except Exception as e:
                errors += 1
                print(f"[FAIL] {full_id}: {e}")

    print(f"\nScanned {seen_files} JSON file(s). posted={posted} skipped={skipped} errors={errors}")


if __name__ == "__main__":
    main()
