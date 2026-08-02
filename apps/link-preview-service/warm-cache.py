#!/usr/bin/env python3
"""
Warm the link-preview KV cache with real Reddit metadata.

Why this exists
---------------
Reddit rate-limits unauthenticated scraping to a small per-IP budget and then
returns 403 "Blocked". The Worker used to fetch Reddit at render time, so a
single visitor loading a page with 20 Reddit links spent the whole budget at
once, got walled, and cached the wall. Rendering and fetching were coupled to
each other when they should not be: the site is read constantly, but new posts
appear every few days.

So the Worker no longer fetches Reddit on a cache miss (it falls back to a
title derived from the URL slug), and this script does the fetching instead:
off the render path, at low volume, once per URL, forever.

Behaviour
---------
* Reads each site's feed.json — no backup artifact needed.
* Skips any URL that already has good metadata in KV. Reddit post titles are
  immutable, so a URL is fetched exactly once, ever.
* Refetches URLs whose cached entry is a wall title, so existing poisoned
  entries heal on the next run.
* Sleeps between Reddit requests to stay well under the anonymous budget.
* Uses the Reddit OAuth API when REDDIT_CLIENT_ID/REDDIT_CLIENT_SECRET are set
  (free, and not subject to the anonymous block); otherwise falls back to
  scraping old.reddit.com more slowly.
* Never writes a wall title to KV, and writes with no expiry.

Required env: CLOUDFLARE_ACCOUNT_ID, KV_NAMESPACE_ID,
              and CLOUDFLARE_API_TOKEN or (CLOUDFLARE_EMAIL + CLOUDFLARE_API_KEY)
Optional env: REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, DRY_RUN=1
"""

import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

FEEDS = [
    "https://doughatcher.com/feed.json",
    "https://superterran.net/feed.json",
    "https://leaning.blue/feed.json",
]

UA = "python:doughatcher-link-preview:2.0 (by /u/superterran)"

# Keep in sync with REDDIT_WALL_TITLES in src/index.js.
WALL_TITLES = {
    "welcome to reddit",
    "blocked",
    "reddit",
    "reddit - dive into anything",
    "reddit - the heart of the internet",
    "log in or sign up",
}

# Seconds between Reddit requests. Anonymous scraping needs a wide gap; the
# authenticated API allows ~100 requests/minute, so it can go much faster.
SLEEP_ANON = 8.0
SLEEP_OAUTH = 1.5

# Must match CACHE_VERSION in src/index.js.
CACHE_VERSION = "v3"

ACCOUNT_ID = os.environ.get("CLOUDFLARE_ACCOUNT_ID", "")
NAMESPACE_ID = os.environ.get("KV_NAMESPACE_ID", "")
DRY_RUN = os.environ.get("DRY_RUN") == "1"


def is_wall_title(title):
    return not title or title.strip().lower() in WALL_TITLES


def normalize_url(url):
    """Canonical cache key form. Must match normalizeUrl() in src/index.js."""
    p = urllib.parse.urlsplit(url)
    host = re.sub(r"^old\.", "www.", p.netloc)
    s = urllib.parse.urlunsplit((p.scheme, host, p.path, "", ""))
    return s[:-1] if s.endswith("/") else s


def cf_headers():
    token = os.environ.get("CLOUDFLARE_API_TOKEN")
    if token:
        return {"Authorization": f"Bearer {token}"}
    email = os.environ.get("CLOUDFLARE_EMAIL")
    key = os.environ.get("CLOUDFLARE_API_KEY")
    if email and key:
        return {"X-Auth-Email": email, "X-Auth-Key": key}
    sys.exit("need CLOUDFLARE_API_TOKEN, or CLOUDFLARE_EMAIL + CLOUDFLARE_API_KEY")


def kv_url(key):
    return (
        f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}"
        f"/storage/kv/namespaces/{NAMESPACE_ID}/values/{urllib.parse.quote(key, safe='')}"
    )


def kv_get(key):
    req = urllib.request.Request(kv_url(key), headers=cf_headers())
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None
        raise
    except (json.JSONDecodeError, urllib.error.URLError):
        return None


def kv_put(key, value):
    """Write with no expiry — fetched once, kept forever."""
    if DRY_RUN:
        return True
    body, boundary = [], "----warmcache"
    body.append(f"--{boundary}\r\nContent-Disposition: form-data; name=\"value\"\r\n\r\n{json.dumps(value)}\r\n")
    body.append(f"--{boundary}\r\nContent-Disposition: form-data; name=\"metadata\"\r\n\r\n{{}}\r\n")
    body.append(f"--{boundary}--\r\n")
    data = "".join(body).encode()
    headers = cf_headers()
    headers["Content-Type"] = f"multipart/form-data; boundary={boundary}"
    req = urllib.request.Request(kv_url(key), data=data, headers=headers, method="PUT")
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode()).get("success", False)


def get_oauth_token():
    cid = os.environ.get("REDDIT_CLIENT_ID")
    secret = os.environ.get("REDDIT_CLIENT_SECRET")
    if not (cid and secret):
        return None
    import base64

    auth = base64.b64encode(f"{cid}:{secret}".encode()).decode()
    req = urllib.request.Request(
        "https://www.reddit.com/api/v1/access_token",
        data=b"grant_type=client_credentials",
        headers={"Authorization": f"Basic {auth}", "User-Agent": UA},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read().decode()).get("access_token")
    except Exception as e:
        print(f"  ! OAuth token request failed ({e}); falling back to anonymous")
        return None


def subreddit_of(url):
    parts = [p for p in urllib.parse.urlsplit(url).path.split("/") if p]
    if "r" in parts:
        i = parts.index("r")
        if i + 1 < len(parts):
            return f"r/{parts[i + 1]}"
    return "reddit.com"


def title_from_slug(url):
    parts = [p for p in urllib.parse.urlsplit(url).path.split("/") if p]
    if "comments" in parts:
        i = parts.index("comments")
        if i + 2 < len(parts):
            t = urllib.parse.unquote(parts[i + 2]).replace("_", " ")
            return t[:1].upper() + t[1:]
    return None


def fetch_via_oauth(url, token):
    path = urllib.parse.urlsplit(url).path
    api = f"https://oauth.reddit.com{path}.json?raw_json=1"
    req = urllib.request.Request(
        api, headers={"Authorization": f"Bearer {token}", "User-Agent": UA}
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        data = json.loads(r.read().decode())
    post = data[0]["data"]["children"][0]["data"]
    if not post.get("title") or is_wall_title(post["title"]):
        return None
    images = (post.get("preview") or {}).get("images") or []
    image = None
    if images:
        res = images[0].get("resolutions") or []
        image = (res[-1]["url"] if res else images[0]["source"]["url"]).replace("&amp;", "&")
    ups, ncom = post.get("ups"), post.get("num_comments")
    desc = f"Posted in r/{post['subreddit']} by u/{post.get('author')}"
    if ups is not None and ncom is not None:
        desc += f" • {ups:,} points and {ncom:,} comments"
    return {
        "title": post["title"],
        "description": desc,
        "image": image,
        "domain": f"r/{post['subreddit']}",
    }


def fetch_via_scrape(url):
    old = url.replace("www.reddit.com", "old.reddit.com")
    req = urllib.request.Request(old, headers={"User-Agent": UA, "Accept": "text/html"})
    with urllib.request.urlopen(req, timeout=30) as r:
        html = r.read().decode("utf-8", "replace")

    def og(prop):
        m = re.search(rf'<meta\s+property="og:{prop}"\s+content="([^"]*)"', html)
        return m.group(1).replace("&amp;", "&") if m else None

    title = og("title")
    if is_wall_title(title):
        return None
    return {
        "title": title,
        "description": og("description"),
        "image": og("image"),
        "domain": subreddit_of(url),
    }


def collect_urls():
    found = set()
    for feed in FEEDS:
        try:
            req = urllib.request.Request(feed, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=30) as r:
                data = json.loads(r.read().decode())
        except Exception as e:
            print(f"! could not read {feed}: {e}")
            continue
        blob = json.dumps(data)
        for m in re.findall(r'https://(?:www\.)?reddit\.com/[^\s"\'<>\\)]+', blob):
            if "/comments/" in m:
                found.add(normalize_url(m))
        print(f"  {feed}: {len(found)} cumulative reddit URL(s)")
    return sorted(found)


def main():
    if not ACCOUNT_ID or not NAMESPACE_ID:
        sys.exit("CLOUDFLARE_ACCOUNT_ID and KV_NAMESPACE_ID are required")

    print("Collecting Reddit URLs from site feeds...")
    urls = collect_urls()
    print(f"Found {len(urls)} unique Reddit URL(s)\n")

    token = get_oauth_token()
    mode = "OAuth API" if token else "anonymous scrape"
    sleep_for = SLEEP_OAUTH if token else SLEEP_ANON
    print(f"Fetch mode: {mode}\n")

    skipped = warmed = failed = 0
    for url in urls:
        key = f"preview:{CACHE_VERSION}:{url}"
        cached = kv_get(key)
        if cached and not is_wall_title(cached.get("title")):
            skipped += 1
            continue

        reason = "poisoned" if cached else "missing"
        print(f"  [{reason}] {url}")
        meta = None
        try:
            meta = fetch_via_oauth(url, token) if token else fetch_via_scrape(url)
        except Exception as e:
            print(f"    fetch failed: {e}")

        if not meta:
            # Blocked, walled, or deleted. Write NOTHING — the Worker will keep
            # serving the slug-derived title until a later run succeeds.
            failed += 1
            print("    -> no usable metadata; leaving uncached")
        else:
            kv_put(key, meta)
            warmed += 1
            print(f"    -> cached: {meta['title'][:60]}")

        time.sleep(sleep_for)

    print(f"\nDone. warmed={warmed} skipped={skipped} failed={failed}")
    # A run where everything failed means we are blocked; surface it, but do not
    # fail the build, since the site degrades gracefully to slug titles.
    if warmed == 0 and failed > 0:
        print("::warning::no URLs could be warmed this run (likely rate-limited)")


if __name__ == "__main__":
    main()
