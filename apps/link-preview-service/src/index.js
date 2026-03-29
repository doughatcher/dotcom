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
      if (post?.title) {
        const badThumbnails = new Set(['self', 'default', 'nsfw', 'spoiler', 'image', '']);
        const previewImg =
          post.preview?.images?.[0]?.resolutions?.slice(-1)[0]?.url?.replace(/&amp;/g, '&') ||
          post.preview?.images?.[0]?.source?.url?.replace(/&amp;/g, '&') ||
          null;
        const thumbImg = post.thumbnail && !badThumbnails.has(post.thumbnail) ? post.thumbnail : null;
        return {
          title: post.title,
          description: post.selftext ? post.selftext.slice(0, 200) : null,
          image: previewImg || thumbImg || null,
          domain: `r/${post.subreddit}`,
        };
      }
    }
  } catch {}

  // Fallback: Reddit JSON API is blocked from Cloudflare IPs.
  // old.reddit.com is server-rendered and returns proper OG tags including og:image.
  const oldUrl = resolvedUrl.replace('www.reddit.com', 'old.reddit.com');
  const htmlMeta = await fetchHtmlMetadata(oldUrl);
  if (htmlMeta.title) {
    const subreddit = (() => {
      try {
        const parts = new URL(resolvedUrl).pathname.split('/').filter(Boolean);
        const rIdx = parts.indexOf('r');
        return rIdx !== -1 ? `r/${parts[rIdx + 1]}` : 'reddit.com';
      } catch { return 'reddit.com'; }
    })();
    return { ...htmlMeta, domain: subreddit };
  }

  // Last resort: title from URL slug, no image
  const slugTitle = titleFromRedditSlug(resolvedUrl);
  if (!slugTitle) throw new Error('could not resolve Reddit post URL');
  return { title: slugTitle, description: null, image: null, domain: 'reddit.com' };
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
      // Check KV cache first (populated by GitHub Actions at deploy time)
      if (env?.PREVIEW_CACHE) {
        const cacheKey = `preview:${url}`;
        const cached = await env.PREVIEW_CACHE.get(cacheKey, 'json');
        if (cached) {
          return new Response(JSON.stringify(cached), {
            status: 200,
            headers: { ...CORS_HEADERS, 'Cache-Control': 'public, max-age=86400', 'X-Cache': 'HIT' },
          });
        }
      }

      const metadata = isRedditUrl(url)
        ? await fetchRedditMetadata(url)
        : await fetchHtmlMetadata(url);

      // Write to KV cache for future requests (TTL: 7 days)
      if (env?.PREVIEW_CACHE && metadata.title) {
        const cacheKey = `preview:${url}`;
        await env.PREVIEW_CACHE.put(cacheKey, JSON.stringify(metadata), { expirationTtl: 604800 });
      }

      return new Response(JSON.stringify(metadata), {
        status: 200,
        headers: { ...CORS_HEADERS, 'Cache-Control': 'public, max-age=86400' },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message, domain: getDomain(url) }), {
        status: 200, // return 200 so caller gets partial data
        headers: CORS_HEADERS,
      });
    }
  },
};
