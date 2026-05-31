"""
Reddit submission enricher — fetches submission metadata from old.reddit.com
unauth and caches it on disk by submission id.

Reddit killed the unauth JSON API in 2023, but old.reddit.com HTML for
submission pages still works in 2026 for the vast majority of subreddits
(verified 10/10 hit rate across a random sample of Doug's 2022-2025 parents).

We parse three things out of the HTML:
  - data-url attribute on the submission's <div class="thing">:
      - external URL (e.g. https://nytimes.com/...) → link post
      - /r/<sub>/...                                  → self post (no external URL)
      - https://i.redd.it/* or https://v.redd.it/*    → Reddit-hosted media
  - <title> tag — submission title (Reddit's HTML title is "<title> : r/<sub>")
  - "class=\"link self\"" on the same div — fallback self-post marker

Cache is a single JSON file at .submission-cache.json in the import/ dir.
"""
from __future__ import annotations

import json
import re
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Optional

USER_AGENT = "Mozilla/5.0 (compatible; doughatcher-archive/0.1)"
THROTTLE_SEC = 3.0   # old.reddit.com rate-limits aggressively past ~30 req/min
BACKOFF_SEC = 90.0   # wait this long after a 429 before resuming

# Reddit-hosted media domains. For these we still call it a "link post" so the
# article-URL rendering kicks in, but the caller may want to treat them as
# self-like (image/video, not a substantive article).
REDDIT_MEDIA_DOMAINS = ("i.redd.it", "v.redd.it", "redd.it", "i.reddituploads.com")


class SubmissionCache:
    def __init__(self, path: Path):
        self.path = path
        self.data: dict[str, dict] = {}
        if path.exists():
            try:
                self.data = json.loads(path.read_text())
            except Exception:
                self.data = {}

    def get(self, sub_id: str) -> Optional[dict]:
        return self.data.get(sub_id)

    def put(self, sub_id: str, value: dict) -> None:
        self.data[sub_id] = value
        # Flush every write — small file, simpler than tracking dirty state.
        self.path.write_text(json.dumps(self.data, indent=2, sort_keys=True))


_SUBMISSION_DATA_URL = re.compile(r'data-url="([^"]+)"')
_TITLE_TAG = re.compile(r"<title>([^<]+)</title>")
_TITLE_SUFFIX = re.compile(r"\s*:\s*(?:r/)?[A-Za-z0-9_]+$")  # strip " : r/SubName" or " : SubName"


def _classify(data_url: str) -> str:
    """Returns one of: 'self' | 'link' | 'media'."""
    if not data_url or data_url.startswith("/r/"):
        return "self"
    for d in REDDIT_MEDIA_DOMAINS:
        if d in data_url:
            return "media"
    return "link"


def _fetch(url: str) -> tuple[Optional[str], Optional[int]]:
    """Returns (body, status_code). status_code is None on URL/timeout errors."""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=15) as resp:
            return resp.read().decode("utf-8", errors="replace"), resp.status
    except urllib.error.HTTPError as e:
        return None, e.code
    except (urllib.error.URLError, TimeoutError):
        return None, None


def fetch_submission_metadata(subreddit: str, sub_id: str, cache: SubmissionCache) -> dict:
    """
    Fetch submission metadata via old.reddit.com HTML scrape.

    Returns a dict shaped:
      {
        "kind": "self" | "link" | "media" | "unknown",
        "external_url": str | None,   # only set for "link" / "media"
        "title": str | None,
      }

    Always returns a dict (never raises) — falls back to {"kind": "unknown"}
    on network errors so callers can render a safe self-post-style footer.

    Cached results are persisted across runs.
    """
    cached = cache.get(sub_id)
    if cached:
        return cached

    url = f"https://old.reddit.com/r/{subreddit}/comments/{sub_id}/"
    body, status = _fetch(url)

    # On 429, back off once and retry — Reddit's rate limit window is short.
    if status == 429:
        time.sleep(BACKOFF_SEC)
        body, status = _fetch(url)

    if not body:
        # Do NOT cache transient failures (429, 5xx, timeout) — let the next
        # run retry. Only cache hard 404s as "unknown" so we don't pound on
        # deleted submissions forever.
        if status == 404:
            result = {"kind": "unknown", "external_url": None, "title": None, "fail": "404"}
            cache.put(sub_id, result)
        time.sleep(THROTTLE_SEC)
        return {"kind": "unknown", "external_url": None, "title": None}

    durl_match = _SUBMISSION_DATA_URL.search(body)
    data_url = durl_match.group(1) if durl_match else ""
    kind = _classify(data_url)

    title = None
    tm = _TITLE_TAG.search(body)
    if tm:
        title = _TITLE_SUFFIX.sub("", tm.group(1)).strip()

    result = {
        "kind": kind,
        "external_url": data_url if kind in ("link", "media") else None,
        "title": title,
    }
    cache.put(sub_id, result)
    time.sleep(THROTTLE_SEC)
    return result


def submission_id_from_link(link_field: str) -> Optional[str]:
    """Extract the submission id from the CSV's `link` column."""
    m = re.search(r"/r/[^/]+/comments/([^/?#]+)", link_field or "")
    return m.group(1) if m else None
