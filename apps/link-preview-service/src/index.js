/**
 * Link Preview Service — Cloudflare Worker
 *
 * Proxies link metadata fetching for doughatcher.com link preview cards.
 * Handles Reddit specially: resolves /s/ share links, calls the .json API
 * server-to-server (no CORS issues), and returns clean preview data.
 *
 * Endpoint: GET /preview?url=<encoded-url>
 * Response: { title, description, image, domain }
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

const REDDIT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; doughatcher-link-preview/1.0)',
  'Accept': 'application/json',
};

function getDomain(url) {
  try { return new URL(url).hostname.replace('www.', ''); } catch { return ''; }
}

function isRedditUrl(url) {
  const domain = getDomain(url);
  return domain.includes('reddit.com') || domain.includes('redd.it');
}

// Capitalise the first letter of a string.
function ucFirst(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

// Extract a human-readable title from a Reddit comments URL slug.
// /r/sub/comments/id/some_post_title/ → "Some post title"
function titleFromRedditSlug(url) {
  try {
    const parts = new URL(url).pathname.split('/').filter(Boolean);
    const idx = parts.indexOf('comments');
    if (idx !== -1 && parts[idx + 2]) {
      return ucFirst(decodeURIComponent(parts[idx + 2]).replace(/_/g, ' '));
    }
  } catch {}
  return null;
}

// For Reddit /s/ share links, follow the redirect to get the real post URL.
// Returns the resolved URL (which contains the post slug) even if the final
// response is 403 — we use the slug as a title fallback.
async function resolveRedditShareUrl(url) {
  const pathname = new URL(url).pathname;
  if (!/\/s\/[A-Za-z0-9]+\/?$/.test(pathname)) return url;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': REDDIT_HEADERS['User-Agent'] },
      redirect: 'follow',
    });
    // response.url is the final URL after all redirects, regardless of status
    if (res.url && res.url !== url) return res.url;
  } catch {}
  return url;
}

// Hostnames that serve Reddit's chrome (Snoo logo, subreddit avatars, UI
// assets) — when og:image points here, the image isn't actual post content,
// so the theme should render it as a small badge rather than a hero card.
const REDDIT_FALLBACK_IMAGE_HOSTS = new Set([
  'www.redditstatic.com',
  'redditstatic.com',
  'styles.redditmedia.com',
]);

function isRedditFallbackImage(imageUrl) {
  if (!imageUrl) return false;
  try {
    return REDDIT_FALLBACK_IMAGE_HOSTS.has(new URL(imageUrl).hostname);
  } catch {
    return false;
  }
}

// Titles Reddit serves when it is stonewalling rather than rendering the post:
// the logged-out interstitial, the 403 "Blocked" page, and the generic site
// titles. These are valid-looking strings, which is exactly why they used to
// get written to KV and pinned there — every one of these is a FAILURE, not
// metadata, and must never be cached.
const REDDIT_WALL_TITLES = new Set([
  'welcome to reddit',
  'blocked',
  'reddit',
  'reddit - dive into anything',
  'reddit - the heart of the internet',
  'log in or sign up',
]);

function isWallTitle(title) {
  if (!title) return true;
  return REDDIT_WALL_TITLES.has(title.trim().toLowerCase());
}

// Canonical cache key. The browser sends the URL exactly as it appears in the
// post (usually WITH a trailing slash); the warmer used to strip it, so the two
// sides wrote and read different keys and the warmed data was never seen.
// Both sides now go through this one rule: drop the query/fragment, drop the
// trailing slash, and normalise old./www. to a single host.
function normalizeUrl(url) {
  try {
    const u = new URL(url);
    u.search = '';
    u.hash = '';
    u.hostname = u.hostname.replace(/^old\./, 'www.');
    let s = u.toString();
    return s.endsWith('/') ? s.slice(0, -1) : s;
  } catch {
    return url;
  }
}

// Bump to invalidate the whole cache at once — old entries stay until their TTL
// but are never read again. v2 added image_is_fallback. v3 changes the key to a
// normalized URL and stops caching failures, so every v2 entry (many of which
// pinned Reddit's "Welcome to Reddit" wall) is abandoned here rather than purged.
const CACHE_VERSION = 'v3';

function cacheKeyFor(url) {
  return `preview:${CACHE_VERSION}:${normalizeUrl(url)}`;
}

async function fetchRedditMetadata(url) {
  const resolvedUrl = await resolveRedditShareUrl(url);

  // Try the JSON API — works from most IPs, but Reddit blocks Cloudflare egress.
  // We try anyway; if it works we get full metadata including preview images.
  try {
    const jsonUrl = resolvedUrl.replace(/\/?(\?.*)?$/, '.json$1');
    const res = await fetch(jsonUrl, { headers: REDDIT_HEADERS });
    if (res.ok) {
      const data = await res.json();
      const post = data[0]?.data?.children?.[0]?.data;
      if (post?.title && !isWallTitle(post.title)) {
        const badThumbnails = new Set(['self', 'default', 'nsfw', 'spoiler', 'image', '']);
        const previewImg =
          post.preview?.images?.[0]?.resolutions?.slice(-1)[0]?.url?.replace(/&amp;/g, '&') ||
          post.preview?.images?.[0]?.source?.url?.replace(/&amp;/g, '&') ||
          null;
        const thumbImg = post.thumbnail && !badThumbnails.has(post.thumbnail) ? post.thumbnail : null;
        const image = previewImg || thumbImg || null;
        return {
          title: post.title,
          description: post.selftext ? post.selftext.slice(0, 200) : null,
          image,
          domain: `r/${post.subreddit}`,
          image_is_fallback: isRedditFallbackImage(image),
        };
      }
    }
  } catch {}

  const subreddit = (() => {
    try {
      const parts = new URL(resolvedUrl).pathname.split('/').filter(Boolean);
      const rIdx = parts.indexOf('r');
      return rIdx !== -1 ? `r/${parts[rIdx + 1]}` : 'reddit.com';
    } catch { return 'reddit.com'; }
  })();

  // Fallback: old.reddit.com is server-rendered and returns proper OG tags.
  // Reddit rate-limits unauthenticated scraping hard and then 403s the caller,
  // so this is expected to fail more often than not from Worker egress. A throw
  // or a wall title both mean "no data" — neither is allowed to reach the cache.
  try {
    const oldUrl = resolvedUrl.replace('www.reddit.com', 'old.reddit.com');
    const htmlMeta = await fetchHtmlMetadata(oldUrl);
    if (!isWallTitle(htmlMeta.title)) {
      return {
        ...htmlMeta,
        domain: subreddit,
        image_is_fallback: isRedditFallbackImage(htmlMeta.image),
      };
    }
  } catch {}

  // Last resort: title from the URL slug. This is derived, not fetched, so it
  // is always available and never wrong — but it is also not the real title, so
  // it is marked provisional and deliberately NOT cached. The scheduled warmer
  // (which runs off-Worker, at low volume) fills in the real metadata later.
  const slugTitle = titleFromRedditSlug(resolvedUrl);
  if (!slugTitle) throw new Error('could not resolve Reddit post URL');
  return {
    title: slugTitle,
    description: null,
    image: null,
    domain: subreddit,
    provisional: true,
  };
}

// Extract OG/meta tags from HTML for non-Reddit URLs.
async function fetchHtmlMetadata(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': REDDIT_HEADERS['User-Agent'], Accept: 'text/html' },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const html = await res.text();

  const extract = (pattern) => {
    const m = html.match(pattern);
    return m ? m[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'") : null;
  };

  const title =
    extract(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/) ||
    extract(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/) ||
    extract(/<title[^>]*>([^<]+)<\/title>/) ||
    null;

  const description =
    extract(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/) ||
    extract(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/) ||
    extract(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/) ||
    null;

  const image =
    extract(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/) ||
    extract(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/) ||
    null;

  return { title, description, image, domain: getDomain(res.url || url) };
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS });
    }

    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return new Response(JSON.stringify({ error: 'url parameter required' }), {
        status: 400, headers: CORS_HEADERS,
      });
    }

    try {
      const cacheKey = cacheKeyFor(url);

      // Check KV cache first (kept warm by the scheduled warmer workflow).
      // Legacy poisoned entries are ignored rather than served, so the cards
      // self-heal without needing a manual purge.
      if (env?.PREVIEW_CACHE) {
        const cached = await env.PREVIEW_CACHE.get(cacheKey, 'json');
        if (cached && !isWallTitle(cached.title)) {
          return new Response(JSON.stringify(cached), {
            status: 200,
            headers: { ...CORS_HEADERS, 'Cache-Control': 'public, max-age=86400', 'X-Cache': 'HIT' },
          });
        }
      }

      const metadata = isRedditUrl(url)
        ? await fetchRedditMetadata(url)
        : await fetchHtmlMetadata(url);

      // Cache only real, verified metadata — never a wall title, never a
      // provisional slug-derived title. Reddit post titles are immutable, so a
      // good Reddit result is stored with NO expiry: fetched once, kept forever,
      // and never re-requested. Other sites can change their <title>, so those
      // keep a 7-day TTL.
      const cacheable =
        env?.PREVIEW_CACHE && !metadata.provisional && !isWallTitle(metadata.title);
      if (cacheable) {
        const opts = isRedditUrl(url) ? undefined : { expirationTtl: 604800 };
        await env.PREVIEW_CACHE.put(cacheKey, JSON.stringify(metadata), opts);
      }

      // A provisional (slug-derived) response must NOT sit in Cloudflare's edge
      // cache for a day, or the real title wouldn't appear until long after the
      // warmer filled KV in. Give it a short TTL so it refreshes promptly.
      const edgeTtl = cacheable ? 86400 : 300;
      return new Response(JSON.stringify(metadata), {
        status: 200,
        headers: { ...CORS_HEADERS, 'Cache-Control': `public, max-age=${edgeTtl}` },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message, domain: getDomain(url) }), {
        status: 200, // return 200 so caller gets partial data
        headers: CORS_HEADERS,
      });
    }
  },
};
