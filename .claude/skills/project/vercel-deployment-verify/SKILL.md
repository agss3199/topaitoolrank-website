# Vercel Deployment Verification Skill

Verify that a Vercel deployment is live and serving the new code to users.

## Situational Awareness

This skill documents the 5-step post-deploy verification process for Vercel Next.js applications. Used after `vercel deploy --prod` to confirm users are seeing the new code.

**Why verification matters**: A deploy command returning exit code 0 does NOT mean users see the new code. Verification must fetch from the live URL and confirm the bundle hash matches expected code.

**When to use**: After every production deployment (or at least before considering the deploy "done").

## Quick Checklist

After running `vercel deploy --prod`, execute these verification steps in order:

| Step | Verification | Expected | Details |
|------|---|---|---|
| **3a** | Verify deployed commit matches HEAD | Revision matches current HEAD | See `01-revision-check.md` for validation script |
| **3b** | Confirm new revision receiving 100% traffic | `readyState: READY`, traffic at 100% | See `02-traffic-check.md` for verification command |
| **3c** | Fetch live URL and verify bundle hash | Live bundle hash = expected hash | See `03-asset-check.md` for the critical user-visible check |
| **3d** | Test critical routes for HTTP 200 | All routes return 200, valid responses | See `04-smoke-tests.md` for route list and functional tests |
| **3e** | Verify CDN cache cleared | Assets loading fresh (auto-handled by Vercel) | See `05-cache-invalidation.md` for manual fallback if 3c fails |

## Implementation Details

See sub-files:
- `01-revision-check.md` — Verify deployed commit matches HEAD
- `02-traffic-check.md` — Confirm new revision receiving 100% traffic
- `03-asset-check.md` — Fetch live URL and verify bundle hash
- `04-smoke-tests.md` — Test all critical user-facing routes
- `05-cache-invalidation.md` — Verify CDN cache cleared
