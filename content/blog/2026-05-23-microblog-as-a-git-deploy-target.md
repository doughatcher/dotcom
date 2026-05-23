---
title: "Micro.blog Will Deploy Your Custom Hugo Theme from GitHub — Here's What Their Docs Skip"
date: 2026-05-23
pillar: "Wild Card"
tags: [microblog, hugo, github-actions, deployment, indieweb, static-site]
linkedin_copy: |
  Micro.blog can host a fully custom Hugo theme that deploys from GitHub Actions on every push to main. Their docs don't really cover this — most people use the in-platform theme editor and never look back — but the pieces are all there if you want a real git-and-CI workflow.

  I run two sites this way: doughatcher.com (personal blog) and experiencedigest.org (Adobe Commerce security digest). Same toolchain, same deploy script, different content models.

  The architecture is split: the THEME lives in a GitHub repo and gets deployed on push; the CONTENT lives in Micro.blog's CMS and gets posted via Micropub. Theme = layouts, partials, static, config.json. Content = anything users see as a post. The deploy hits an authenticated POST /account/themes/reload on Micro.blog and Micro.blog pulls the latest from GitHub.

  The gotchas are mostly undocumented and you only find them once you've hit them:

  1. Theme reload syncs the root of data/ but skips subdirectories. data/authors/doug-hatcher.yaml will not load. You have to put the same data under params in config.json.

  2. Custom section types (type: blog in _index.md) get the section list rendered but not the individual single pages — they 404. Drop the explicit type and let Hugo infer it from the folder name.

  3. Auth is email magic-link only. No API key. The deploy script polls Gmail IMAP for the sign-in mail, follows the link, and caches the resulting session cookie with a daily key in GitHub Actions cache. Re-auths only when the cache misses.

  4. Hugo's contextual escape inside href="…" will URL-encode your already-encoded values, producing https%253A%252F%252F in your social share links. Wrap the composed URL with safeURL to skip the second pass.

  5. og:image must be 1200x630 for LinkedIn. A square favicon gets auto-cropped and you'll ship a clipped logo to every share preview until you ship a real social card.

  Working example with full open source: experiencedigest.org → github.com/doughatcher/experience-digest. The deploy script, the auth flow, and the GitHub Actions workflow are all there to copy.

  Full post with the architecture diagram and the actual GitHub Actions snippets: {{url}}
---

Most people on Micro.blog use the in-platform theme editor and never touch git. That works fine and I would not push them off it. But if you want a real git-and-CI workflow on top of Micro.blog — pull requests, code review, automated deploys, the whole tooling stack — the platform supports it and almost nobody writes about how.

I run two sites this way. [doughatcher.com](https://doughatcher.com) is this blog. [experiencedigest.org](https://experiencedigest.org) is an Adobe Commerce security bulletin digest with a custom theme, an editorial blog section, and a Python scraper that posts new CVEs and advisories via Micropub. Same deploy toolchain on both, same Python deploy script, different content models. The experience-digest repo is open source ([github.com/doughatcher/experience-digest](https://github.com/doughatcher/experience-digest)) and is the easiest reference if you want to see the whole pattern in one place.

What follows is the architecture, the actual deploy pipeline, and the five things their docs do not tell you that I have hit in production.

## The split between theme and content

Micro.blog's hosting model is a clean split that took me a while to internalize.

The **theme** is layouts, partials, static assets, data, `config.json`, and `theme.toml`. It lives in a GitHub repo. Micro.blog pulls it from that repo on demand when you trigger a theme reload.

The **content** is posts, replies, photos, podcasts — anything a user reads. It lives in Micro.blog's CMS, posted via [Micropub](https://micropub.spec.indieweb.org/) or through the web/mobile UIs. The git repo doesn't (and shouldn't) hold it.

When Micro.blog renders the site, it runs Hugo against the union of the two: theme files from your GitHub repo + content from its database. The result is a static site served at your custom domain.

The reason this is useful is that the parts of a blog where you actually want version control — layouts, CSS, deploy logic, anything you would code-review — all live in git. The parts you would not put in git anyway — daily posts, scheduled drafts, photo attachments — stay in the CMS where they belong.

## The actual deploy

The deploy is two HTTP calls dressed up in some auth glue.

```yaml
# .github/workflows/deploy.yml — abbreviated
on:
  push:
    branches: [main]
    paths:
      - 'layouts/**'
      - 'static/**'
      - 'data/**'
      - 'config.json'
      - 'theme.toml'
      - 'content/blog/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
      - run: pip install -r .github/deploy/requirements.txt
      - uses: actions/cache@v4   # daily session cookie
        with:
          path: .session-cookie
          key: microblog-session-${{ github.repository }}-${{ steps.cache-key.outputs.date_prefix }}
      - run: python3 .github/deploy/microblog_auth.py --output .session-cookie
        if: steps.cache-session.outputs.cache-hit != 'true'
      - run: python3 .github/deploy/microblog_deploy.py --all --timeout 120
```

The Python deploy script does this:

1. Validate the cached session cookie (a `GET /account/logs` that redirects to `/signin` if expired).
2. `POST /account/themes/reload` with the theme ID — Micro.blog goes and pulls fresh files from your GitHub repo.
3. `GET /account/logs` again to kick the rebuild.
4. Poll `/posts/check` until `publishing_status` goes idle. Typical completion is 15–50 seconds.

That's it. There is no Micro.blog webhook, no public API key, no GitHub App. Auth is the only complicated piece.

## Auth is email magic-link, which is fine

Micro.blog has no API key for the dashboard endpoints. The only way to authenticate is the magic-link sign-in email. The deploy script automates around it:

1. `POST /account/signin` with your email — Micro.blog sends a sign-in email.
2. Poll Gmail IMAP for a message from `help@micro.blog` with subject "sign-in".
3. Extract the magic link from the email body, follow it, capture the `rack.session` cookie.
4. Save the cookie to a file and use it as `Cookie:` header for the deploy calls.

Sounds heavy, but it's only painful on the first run of the day. The GitHub Actions cache key includes today's date, so the cookie persists across runs until it expires. Most deploys hit the cache and skip the email dance entirely. You will need a Gmail account with an App Password (not your main password) to read the inbox over IMAP — that goes in `GMAIL_APP_PASSWORD` as a repo secret.

## What their docs don't tell you

These are the five gotchas I hit in production. Each cost me a non-trivial debugging session.

### 1. Theme reload doesn't sync `data/` subdirectories

I wrote a Hugo partial that read author info from `data/authors/<slug>.yaml`. It worked locally. It silently rendered nothing on Micro.blog. The build wasn't erroring — `$.Site.Data.authors` was just nil.

After staring at it for an hour I confirmed: Micro.blog's theme reload pulls root-level `data/*` files but not subdirectories. The fix was to move author definitions into `params.authors` inside `config.json`, which IS in the sync set. The Hugo partial reads `$.Site.Params.authors` instead and everything works.

### 2. Custom section types break the single-page output

If you have a `content/blog/_index.md` with `type: blog`, Micro.blog will render the `/blog/` list page just fine. It will emit links to every individual blog post. Every one of those links will 404.

The reason — best as I can tell — is that Micro.blog's hosted Hugo only generates single-page output for sections whose types it recognizes (post, page, etc.). Custom types like "blog" make the list but not the singles. The fix is to remove `type: blog` from `_index.md` entirely. Hugo's layout resolution still finds `layouts/blog/single.html` by section name, and Micro.blog generates the single pages because the section now has no explicit type override.

### 3. Hugo's contextual escape double-encodes URLs in `href`

This one cost me an evening because the symptom was silent — LinkedIn's share dialog kept opening with an empty preview card. The cause was that my social-share partial did:

```html
{{ $encodedUrl := .Permalink | urlquery }}
<a href="https://www.linkedin.com/sharing/share-offsite/?url={{ $encodedUrl }}">
```

Hugo's HTML template engine applies a contextual URL escaper to values placed inside `href="…"`. So my pre-encoded value got encoded a second time. The `%` in `%3A` became `%25`, producing `https%253A%252F%252F` in the rendered URL. LinkedIn couldn't decode that and showed an empty share dialog.

The fix is to compose the full URL explicitly and wrap with `safeURL`:

```hugo
{{ $href := printf "https://www.linkedin.com/sharing/share-offsite/?url=%s" (urlquery .Permalink) | safeURL }}
<a href="{{ $href }}">
```

`safeURL` tells Hugo "this URL is already safe, don't re-escape." Same bug had silently broken every other share button — X, Facebook, Reddit, HN, Bluesky, mailto. Worth grepping your own theme.

### 4. og:image needs to be 1200×630, not a square favicon

If your `og:image` points at a 512×512 favicon, LinkedIn will crop it to 1200×630 by chopping the bottom off. You will get a "clipped logo" preview that looks broken. Twitter does the same thing if your `twitter:card` is `summary` (square) instead of `summary_large_image` (landscape).

Solution: ship a real 1200×630 social card with your wordmark, tagline, and brand mark. Reference it as the default `og:image` in `baseof.html`, allow per-post overrides via `image:` in frontmatter. After updating, run the post URL through [LinkedIn's Post Inspector](https://www.linkedin.com/post-inspector/) to force a re-scrape — LinkedIn caches OG meta for about seven days.

### 5. The theme ID is invisible config

Each Micro.blog theme has a numeric ID visible in the URL when you're editing it (`/account/themes/<id>/info`). The deploy script needs this ID to know which theme to reload, and it's an easy thing to get wrong — particularly if you migrate from one theme to another and forget to update the environment variable on the CI side. Your deploys will succeed, the build will run, and absolutely nothing will change on production because you're reloading the wrong theme.

Mine is set as a GitHub Actions repository variable (`MICROBLOG_THEME_ID`) so I can change it without touching code. Worth treating it as deployment config from day one rather than hardcoding it.

## Where to start

If you want to copy the pattern: [github.com/doughatcher/experience-digest](https://github.com/doughatcher/experience-digest) has the entire deploy toolchain. `.github/deploy/` is the Python (auth + reload + poll), `.github/workflows/deploy.yml` is the GitHub Actions wiring, `config.json` is the Hugo + Micro.blog config layered together. The site it deploys to is [experiencedigest.org](https://experiencedigest.org). Fork, swap the theme ID and the Micro.blog account email, and you have a working git-backed deployment for your own Micro.blog site.

Micro.blog is more capable as a hosting target than they market it as. The platform handles what platforms are good at — content management, Micropub, ActivityPub federation, IndieAuth — and gets out of your way for the parts you want in git. The five gotchas above are the cost of admission. Pay them once and the rest of the workflow is pleasant.
