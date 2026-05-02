---
type: DISCOVERY
date: 2026-05-01
title: Deploy Command Exit 0 Does NOT Mean Users See New Code
slug: deployment-vs-users-seeing-code
---

# Discovery: Deploy Command Exit 0 Does NOT Mean Users See New Code

## The Pattern

A deployment command returning exit code 0 (success) is the *beginning* of verification, not the end. Users may not see the new code for several reasons:

1. **Stale HTML from CDN** — The HTML shell may be cached and not revalidated
2. **Service worker cache** — A service worker may serve old bundle references
3. **Browser cache** — Users' browsers may have cached the old HTML
4. **Traffic still on old revision** — New revision exists but domain alias hasn't been updated
5. **ISR revalidation failed** — On-demand revalidation didn't trigger
6. **Wrong commit deployed** — Deploy succeeded but incorrect code was shipped

## Why This Matters

Users interact with the live HTTP surface, not with the deploy command. The only proof that users see new code is to:

1. Fetch the live URL yourself (bypassing local cache)
2. Extract a content hash from the response (e.g., bundle filename)
3. Compare it to what you expected to deploy
4. Verify it matches

Everything else (deploy exit status, revision state, traffic routing) is a prerequisite. The asset hash check is the final proof.

## Real-World Impact

- **Phase 5.7 incident**: CSS fixes deployed, users saw old styles for 6 hours until CDN edge cache expired
- **Phase 5.9 incident**: New feature shipped but traffic still routing to old revision because domain alias wasn't updated
- **Phase 5.11 incident**: Trust plane "enabled" but never invoked in production (orphan code pattern)

All three passed the deploy command. All three required the user-visible asset check to catch.

## Implementation

See `deployment-verification.md` § Step 3c (User-Visible Asset Check) for the complete protocol. The command:

```bash
LIVE_HTML=$(curl -fsSL -H "Cache-Control: no-cache" https://$DOMAIN)
LIVE_BUNDLE=$(echo "$LIVE_HTML" | grep -oE 'index-[A-Za-z0-9_-]+\.js' | head -1)
```

This fetches the live URL with no-cache headers, extracts the bundle filename, and verifies it's the new code. No infrastructure permission required, no API keys, 100% observable.

## Future Policy

- Every production deployment must run this check
- No deployment is "done" until the asset check passes
- "Committed" does not mean "deployed" (see `/deploy --check` for pre-commit drift detection)
- Deployment verification is not a QA task — it's an operator task that runs after every deploy
