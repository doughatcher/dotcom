# Micro.blog Development Tasks

# Authenticate to Micro.blog via email
auth:
    python3 .github/deploy/microblog_auth.py

# Deploy theme changes to Micro.blog
deploy:
    python3 .github/deploy/microblog_deploy.py --all

# Backup content from Micro.blog
backup:
    python3 .github/deploy/microblog_backup.py --all

# Backup and download only (no extraction)
backup-download:
    python3 .github/deploy/microblog_backup.py --export-only

# Extract content from existing backup ZIP
backup-extract ZIP_FILE:
    python3 .github/deploy/microblog_backup.py --extract-only {{ZIP_FILE}}

# Validate session cookie
validate:
    python3 .github/deploy/microblog_deploy.py --validate-only

# Configure git identity from .env file
git-config:
    #!/usr/bin/env bash
    set -euo pipefail
    if [ -f .env ]; then
        source .env
        if [ -n "${GIT_USER_NAME:-}" ] && [ -n "${GIT_USER_EMAIL:-}" ]; then
            git config user.name "$GIT_USER_NAME"
            git config user.email "$GIT_USER_EMAIL"
            echo "✅ Git identity configured:"
            echo "   Name:  $(git config user.name)"
            echo "   Email: $(git config user.email)"
        else
            echo "❌ GIT_USER_NAME and GIT_USER_EMAIL must be set in .env file"
            exit 1
        fi
    else
        echo "❌ .env file not found"
        exit 1
    fi

# Show available commands
help:
    just --list
