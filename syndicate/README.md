# Syndication

Cross-post doughatcher.com articles to dev.to while keeping
doughatcher.com as the canonical source.

## How it works

```
feed.json  →  syndicate.py  →  adapters/devto.py  →  dev.to (auto-post w/ canonical URL)
```

`syndicated.json` tracks what's been syndicated where so we never double-post.

## Why dev.to

dev.to honors `canonical_url` in the article payload — Google attributes
the content to doughatcher.com, dev.to gets a copy that surfaces to
their audience. No SEO penalty.

This sits alongside (not replacing) the existing label-triggered LinkedIn
syndication in `.github/workflows/syndicate-on-label.yml`. dev.to is
auto, LinkedIn is intentional / on-demand.

## Operation

In CI, `.github/workflows/syndicate-devto.yml` runs twice daily, posts new
feed items to dev.to, and commits tracking back to the repo.

Locally:

```bash
just syndicate-install   # one-time
just syndicate-dry       # see what would happen without posting
just syndicate           # run for real
```

## Secrets

Local: `syndicate/.env` (gitignored, copy from `.env.example`).
CI: GitHub Actions secret `DEVTO_API_KEY`.

dev.to API key: https://dev.to/settings/extensions
