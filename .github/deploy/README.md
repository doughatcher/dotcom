# Micro.blog Automated Deployment

This directory contains scripts and configuration for automated deployment of Micro.blog themes via GitHub Actions.

## Overview

Micro.blog doesn't provide traditional API tokens or CI/CD integration for theme template deployment. This solution works around that limitation by:

1. **Email-based Authentication**: Uses Micro.blog's "Sign in with email" feature to obtain a session cookie
2. **Session Cookie Caching**: Stores the session cookie (7-day expiry) to avoid re-authentication on every deployment
3. **Theme Reload**: POSTs to `/account/themes/reload` to sync theme files from GitHub
4. **Build Automation**: Visits `/account/logs` to trigger site rebuild
5. **Build Monitoring**: Polls `/posts/check` to monitor build completion

## Quick Start

### Local Testing

```bash
# 1. Install dependencies
cd .github/deploy
pip3 install -r requirements.txt

# 2. Set environment variables (create .env file in repo root)
export GMAIL_EMAIL="your@gmail.com"
export GMAIL_APP_PASSWORD="your-app-password"
export MICROBLOG_EMAIL="your@microblog-email.com"
export MICROBLOG_SITE_ID="12345"
export MICROBLOG_THEME_ID="67890"

# 3. Authenticate (saves .session-cookie)
python3 microblog_auth.py

# 4. Deploy
python3 microblog_deploy.py --all
```

### GitHub Actions

The workflow at `.github/workflows/deploy.yml` runs automatically on pushes to `main` that modify:
- `layouts/**`
- `static/**`
- `theme.toml`
- `plugin.json`

Required GitHub secrets and variables:
- **Secret**: `GMAIL_APP_PASSWORD`
- **Variables**: `GMAIL_EMAIL`, `MICROBLOG_EMAIL`, `MICROBLOG_SITE_ID`, `MICROBLOG_THEME_ID`

## Setup Instructions

### 1. Get Gmail App Password

1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification (if not already enabled)
3. Go to https://myaccount.google.com/apppasswords
4. Select app: "Mail" and device: "Other (Custom name)"
5. Enter name like "Micro.blog Deployment" and click Generate
6. Copy the 16-character password (without spaces)

### 2. Find Your Micro.blog IDs

**Site ID:**
1. Go to https://micro.blog/account
2. Click on your site settings
3. The URL will contain your site ID: `/account/sites/{SITE_ID}`

**Theme ID:**
1. Go to Design → Edit Custom Themes
2. Click on your theme
3. The URL will contain your theme ID: `/account/themes/{THEME_ID}/info`

### 3. Configure GitHub Secrets

In your GitHub repository:
1. Go to Settings → Secrets and variables → Actions
2. Add secret: `GMAIL_APP_PASSWORD` (your Gmail app password)
3. Add variables:
   - `GMAIL_EMAIL` (your Gmail address)
   - `MICROBLOG_EMAIL` (your Micro.blog email)
   - `MICROBLOG_SITE_ID` (your site ID)
   - `MICROBLOG_THEME_ID` (your theme ID)

## Files

- `microblog_auth.py` - Email authentication and session cookie capture
- `microblog_deploy.py` - Template reload, rebuild trigger, and build monitoring
- `requirements.txt` - Python dependencies
- `README.md` - This file

## Troubleshooting

### Session Cookie Expired

Re-authenticate locally:
```bash
python3 .github/deploy/microblog_auth.py
```

### Gmail Authentication Issues

Make sure you're using an **app password**, not your regular Gmail password.

### Build Times Out

Typical builds complete in 15-50 seconds. If timing out consistently, check build logs at https://micro.blog/account/logs

## Support

For issues or questions, see the Micro.blog help forum at https://help.micro.blog
