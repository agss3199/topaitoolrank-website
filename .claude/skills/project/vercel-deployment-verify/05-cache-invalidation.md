# Step 3e: Cache Invalidation

Verify CDN cache was cleared after deployment. This is the FINAL verification step.

## Vercel Auto-Invalidation

Vercel automatically invalidates the CDN cache on every successful `vercel deploy --prod`:

1. **On-demand invalidation** — assets with new content hashes are automatically served
2. **HTML revalidation** — HTML files are served with `Cache-Control: max-age=0` (no-cache, always fetch from origin)
3. **Static asset caching** — versioned assets (`.js`, `.css`, `.woff2` with content hashes) cache for 1 year

**Result**: Users always see the latest HTML, and linked assets (with hashes) are automatically new.

## Manual Invalidation (Fallback)

If the post-deploy asset check (Step 3c) shows a stale bundle AFTER deployment, run manual cache bypass:

```bash
DOMAIN="<your-domain.com>"

# Option 1: Force rebuild (most reliable)
vercel redeploy

# Option 2: Wait 5 minutes for TTL expiration (asset cache is short-lived)
echo "Waiting 5 minutes for CDN edge cache to expire..."
sleep 300

# Option 3: Flush with no-cache header (for verification)
curl -fsSL -H "Cache-Control: no-cache" -H "Pragma: no-cache" https://$DOMAIN > /dev/null
```

Then re-run the asset check (Step 3c) to confirm the new bundle is live.

## What It Catches

- Stale HTML from CDN despite `Cache-Control` headers
- Service worker caching old bundles
- Browser cache still holding previous version
- ISR revalidation failed (Next.js 13+)

## Pass Criteria

✓ Asset check (Step 3c) passes on first run (no manual invalidation needed)
✓ OR asset check passes after manual invalidation (CDN was slow, but recoverable)
✗ Asset check fails even after manual invalidation (routing/deployment issue, not cache)

## Relationship to Other Steps

This step is the FALLBACK if Step 3c (asset check) fails. If:

- **Step 3a passes** (revision is correct) + **3b passes** (traffic 100%) + **3c FAILS** (asset stale) → suspect cache layer → run this step
- **Step 3c passes** (asset is new) → cache is working, skip this step
- **Step 3a OR 3b fails** → route/traffic issue, this step is irrelevant

The majority of deployments need only Steps 3a, 3b, 3c, and 3d. Step 3e is insurance against CDN edge cases.
