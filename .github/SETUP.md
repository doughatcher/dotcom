# GitHub Action Setup for Micro.blog Theme Reload

This repository includes a GitHub Action that automatically reloads your Micro.blog theme whenever you push changes to the main branch.

## Required Configuration

You need to configure the following in your GitHub repository settings:

### Repository Variables

Go to **Settings → Secrets and variables → Actions → Variables** and add:

- `MICROBLOG_THEME_ID`: Your theme ID (e.g., `86755`)
  - You can find this in the URL when editing your theme on Micro.blog
  - Example: `https://micro.blog/account/themes/86755/info` → theme ID is `86755`

### Repository Secrets

Go to **Settings → Secrets and variables → Actions → Secrets** and add:

- `MICROBLOG_APP_TOKEN`: Your Micro.blog app token
  - This is a token generated specifically for API access
  - Example: `6C4BD8649164EA9B6F18`
  
#### How to get your app token:

1. Log into [micro.blog](https://micro.blog)
2. Go to **Account → App tokens**
3. Either use an existing token or create a new one
4. Copy the token value
5. Paste it as the `MICROBLOG_APP_TOKEN` secret in your GitHub repository

**Benefits of using an app token:**
- More secure than session cookies
- Won't expire like session cookies
- Purpose-built for API integrations

## How It Works

When you push changes to the `main` branch, the GitHub Action will:

1. Automatically trigger
2. Send a POST request to `https://micro.blog/account/themes/reload`
3. Tell Micro.blog to reload your theme with the latest changes

This is the same action that happens when you manually click the "Reload" button in the Micro.blog theme editor.

## Testing

After setting up the variables and secrets:

1. Make a small change to any file
2. Commit and push to the main branch
3. Check the **Actions** tab in your GitHub repository
4. You should see the workflow run successfully
5. Your Micro.blog theme should be updated automatically

## Troubleshooting

- **401 Unauthorized**: Your session cookie may have expired. Get a fresh one from your browser.
- **404 Not Found**: Check that your `MICROBLOG_THEME_ID` is correct.
- **Workflow doesn't trigger**: Make sure you're pushing to the `main` branch.
