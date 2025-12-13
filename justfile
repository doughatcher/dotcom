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

# Show available commands
help:
    just --list
