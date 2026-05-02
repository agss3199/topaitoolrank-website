# Step 3c: User-Visible Asset Check

Fetch the live site and verify users see the new code bundle.

## Command

```bash
DOMAIN="<your-domain.com>"

# Fetch live HTML with no-cache headers, extract bundle hash
LIVE_HTML=$(curl -fsSL -H "Cache-Control: no-cache" -H "Pragma: no-cache" https://$DOMAIN)
LIVE_BUNDLE=$(echo "$LIVE_HTML" | grep -oE 'index-[A-Za-z0-9_-]+\.js' | head -1)

# Expected bundle hash from local build output
EXPECTED_BUNDLE=$(cat .next/static/index-*.js 2>/dev/null | head -1 | xargs -I {} basename {})

if [ ! -z "$LIVE_BUNDLE" ] && [ "$LIVE_BUNDLE" == "$EXPECTED_BUNDLE" ]; then
  echo "✓ Live bundle matches expected: $LIVE_BUNDLE"
elif [ -z "$LIVE_BUNDLE" ]; then
  echo "✗ Could not extract bundle hash from live HTML — check the grep pattern for your framework"
else
  echo "✗ Bundle mismatch: live=$LIVE_BUNDLE expected=$EXPECTED_BUNDLE"
  echo "  (This usually indicates CDN cache or stale assets — run 05-cache-invalidation.md)"
fi
```

## What It Catches

- CDN serving stale bundle (cache not invalidated)
- Browser cache returning old HTML
- Service worker stale
- Wrong revision activated
- Traffic routed to old container

## Why It Matters

This is the most critical check. The deploy command can return 0, the revision can be correct, traffic can be on the new deployment, but users still see old code if ANY cache layer is stale. This is the only proof that users are actually seeing the new code.
