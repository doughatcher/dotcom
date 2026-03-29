# Micro.blog Platform Quirks & Solutions

This document captures platform-specific behaviors and solutions for Micro.blog hosting.

## Issue: 404 on Section Index Pages

**Severity:** High (breaks navigation)

### Problem

A section page that works locally at `http://localhost:1313/section/` returns 404 on Micro.blog.

### Root Cause

**Missing tracked files in git due to `.gitignore`** - The `content/` directory is in `.gitignore`, which means most content files are NOT tracked by git. Micro.blog syncs from GitHub, so it only gets the files that are explicitly tracked (added with `git add -f`).

For a section to work on Micro.blog, you need **BOTH** files tracked in git:

```
content/
├── section.md          # Must be tracked in git (git add -f)
└── section/
    ├── _index.md       # Must be tracked in git (git add -f)
    └── post-1.md       # Can be untracked (managed by Micro.blog)
```

**Why this matters:**
- Local Hugo builds use ALL files in `content/` (even untracked ones)
- Micro.blog only gets files tracked in git
- If either `.md` or `_index.md` is missing from git, the section 404s on Micro.blog
- But it works locally because the files exist on disk

### Symptoms

- Page works locally: `http://localhost:1313/section/`
- Page 404s on Micro.blog
- Other similar pages work fine on both platforms
- Individual posts in the section work fine

### Solution

**Ensure BOTH section files are tracked in git** (even though `content/` is in `.gitignore`):

```bash
# For a section with posts:
git add -f content/section.md
git add -f content/section/_index.md
git commit -m "Add section files for Micro.blog"
git push
```

### How to Fix Existing Issues

1. **Check what content files are tracked in git:**
   ```bash
   git ls-files content/
   ```

2. **For sections that 404 on Micro.blog but work locally:**
   ```bash
   # Check if BOTH files exist locally
   ls -la content/section.md
   ls -la content/section/_index.md

   # Add both to git (force because content/ is ignored)
   git add -f content/section.md
   git add -f content/section/_index.md

   # Commit and push
   git commit -m "Add section files for Micro.blog sync"
   git push
   ```

3. **Wait for Micro.blog to rebuild** (usually 1-2 minutes after push)

### Prevention

**Critical understanding: `content/` is in `.gitignore`**

Most content is managed directly on Micro.blog and NOT synced via GitHub. Only structural files need to be tracked in git.

**What to track vs. what to ignore:**

Track in git (git add -f):
- `content/section.md` - Section definition files
- `content/section/_index.md` - Section index pages
- Any standalone pages needed for site structure

Don't track (let Micro.blog manage):
- Individual blog posts in date folders
- Photo posts
- Reply posts
- Any content created through Micro.blog web interface

### Examples in This Repository

**Current tracked content:**
```bash
$ git ls-files content/
content/consulting.md
```

### Hugo Best Practices for Micro.blog

1. **Section Structure**: Sections need BOTH `.md` and `_index.md` files tracked in git
2. **Gitignore Awareness**: Remember `content/` is ignored - use `git add -f` for structural files
3. **Local vs Production**: Local Hugo sees all files; Micro.blog only sees tracked files
4. **Testing**: Always test on Micro.blog after pushing structural changes
5. **Content Management**: Let Micro.blog manage individual posts (don't track them in git)
6. **Verify Tracking**: Use `git ls-files content/` to see what Micro.blog will receive

## Cache Busting

When modifying CSS or JavaScript files, ensure cache busting is in place:

```html
<link rel="stylesheet" href="/css/main.css?v={{ now.Unix }}">
<script src="/js/app.js?v={{ now.Unix }}"></script>
```

- `{{ now.Unix }}` generates a Unix timestamp at Hugo build time
- Forces browsers to fetch the new version after each deployment
- Apply to all CSS/JS files in `static/`
- Do NOT apply to external CDN resources (they have their own versioning)

## Related Files

- **Theme Dev Rules**: `.clinerules`
- **Deploy Scripts**: `.github/deploy/`
- **Workflows**: `.github/workflows/`

---

**Last Updated:** February 2026
**Hugo Version:** As configured by Micro.blog
