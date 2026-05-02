# Step 3a: Revision Check

Verify the deployed commit matches your current HEAD.

## Command

```bash
vercel inspect <domain> --json
```

Extract the deployment ID and verify it matches your current code.

## Validation

```bash
DOMAIN="<your-domain.com>"

# Get deployed commit SHA from Vercel metadata
DEPLOYED=$(vercel inspect $DOMAIN --json | jq -r '.meta.githubCommitSha // .env.VERCEL_GIT_COMMIT_SHA // "unknown"')

# Get current HEAD
CURRENT=$(git rev-parse HEAD)

# Compare
if [ "$DEPLOYED" == "$CURRENT" ]; then
  echo "✓ Revision matches: $DEPLOYED"
else
  echo "⚠ Revision mismatch: deployed=$DEPLOYED current=$CURRENT"
  echo "  (Verify in Vercel dashboard that the correct commit was deployed)"
fi
```

## What It Catches

- Deploy command succeeded but wrong commit was pushed
- Vercel built from wrong branch
- Rollback happened silently
- Deploy pipeline picked old artifact

## Why It Matters

The deploy command can return 0 (success) while Vercel built a cached version from a previous commit. This check confirms the exact code now running in production.
