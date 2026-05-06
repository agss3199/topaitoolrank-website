# Vercel Next.js Deployment Verification

Knowledge for deploying Next.js 16 apps to Vercel with comprehensive post-deploy verification that confirms users are seeing new code, not stale cached assets.

## Quick Start: Deploy to Production

```bash
# Build verification (must pass first)
npm run build                  # Compiles TypeScript, generates .next/

# Deploy to Vercel production
vercel deploy --prod           # Ships to production URL

# Verify deployed commit
vercel inspect https://topaitoolrank.com | grep -i commit
# Expected: commit = HEAD (the commit you just shipped)
```

## The Critical Problem: "Deployed ≠ Users See New Code"

A Vercel deployment command can succeed while users still see stale code. This happens due to:
- CDN cache not invalidated
- Browser cache headers wrong
- Service worker still running old version
- Deployment pointing to wrong revision

**Solution:** Verify what users actually see via HTTP fetch, not just that the deploy command exited 0.

## Post-Deploy Verification (5 Steps)

### Step 1: Revision Check (10s)
```bash
vercel inspect https://topaitoolrank.com | grep -E "commit|sha"
# Expected: matches git rev-parse HEAD
```

Confirms the correct commit was deployed, not an older revision.

### Step 2: Fresh Asset Check (30s)
```bash
# Fetch live HTML (no cache)
LIVE_HTML=$(curl -fsSL -H "Cache-Control: no-cache" -H "Pragma: no-cache" https://topaitoolrank.com)

# Extract JS bundle hash from HTML
LIVE_BUNDLE=$(echo "$LIVE_HTML" | grep -oE '[0-9a-z]{12}\.js' | head -1)

# Extract expected hash from local build
EXPECTED_BUNDLE=$(cat .next/static/chunks/*.js | grep -oE '[0-9a-z]{12}\.js' | head -1)

# Compare
if [ "$LIVE_BUNDLE" = "$EXPECTED_BUNDLE" ]; then
  echo "✅ Fresh assets confirmed, bundle hash matches"
else
  echo "❌ CACHE/ROUTING FAILURE: live=$LIVE_BUNDLE expected=$EXPECTED_BUNDLE"
fi
```

**Why this matters:** If the bundle hash doesn't match, users are seeing old code despite the deploy command succeeding. This means:
- CDN returned cached HTML
- Browser returned cached JS
- Service worker served old version
- Traffic wasn't properly routed to the new revision

### Step 3: Smoke Test Routes (1-2m)
```bash
for route in "" "/auth/login" "/blogs" "/tools/wa-sender"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "https://topaitoolrank.com${route}")
  status="❌"
  [ "$code" = "200" ] && status="✅"
  echo "$status ${route:-/}: $code"
done
# Expected: all 200 OK
```

Tests that critical routes are accessible. A 404 or 500 indicates deployment incomplete.

### Step 4: API Smoke Test (30s)
```bash
# Test authenticated endpoint (example)
curl -H "Authorization: Bearer $VALID_JWT" \
  https://topaitoolrank.com/api/wa-sender/messages?limit=1
# Expected: 200 with message data (not 500, not 401)
```

Confirms APIs are wired correctly and can query database (if applicable).

### Step 5: Cache Headers Check (20s)
```bash
curl -I https://topaitoolrank.com | grep -i "cache-control\|age\|date"
# Expected:
# cache-control: public, max-age=0, must-revalidate  (HTML)
# OR cache-control: public, max-age=31536000, immutable  (static assets)
```

Verifies caching headers are correct. HTML should have `max-age=0` (always revalidate), static JS should have `max-age=31536000` (cache forever with immutable flag).

## Understanding Vercel Deployment Mechanics

### How Vercel Builds & Deploys Next.js 16

1. **Build Phase** — `npm run build` generates `.next/`
   - TypeScript compilation
   - React component bundling
   - Static pages pre-rendered
   - Dynamic routes registered
   - Output: `.next/` directory (ready to run)

2. **Upload Phase** — Vercel creates a deployment
   - All files in `.next/` uploaded
   - Created a revision (deployment ID)
   - Each revision is immutable

3. **Routing Phase** — Traffic routed to revision
   - Production alias (topaitoolrank.com) points to deployment
   - Vercel CDN serves assets
   - Old deployments kept for rollback

### What "Deploy Succeeded" Actually Means

```
vercel deploy --prod → exit 0
```

This only means:
- ✅ Upload to Vercel succeeded
- ✅ Revision created
- ✅ Domain alias updated to point to new revision

It does NOT mean:
- ❌ Users are seeing the new code
- ❌ CDN cache was invalidated
- ❌ Browser cache was cleared
- ❌ APIs are functional (no DB verification)

Therefore: **Post-deploy verification is mandatory.**

## Vercel CLI Commands Reference

```bash
# List all deployments
vercel list --prod

# Inspect a specific deployment
vercel inspect <deployment-url>
# Output includes: commit, creation time, state, routes

# Get current production commit
vercel inspect topaitoolrank.com | grep commit

# Rollback to previous deployment
vercel rollback <deployment-url>

# View logs from a deployment
vercel logs <deployment-url>

# Promote a deployment to production
vercel promote <deployment-url>
```

## Common Deployment Failures & Recovery

| Failure | Signal | Recovery |
|---------|--------|----------|
| Build failed | npm run build returns non-zero | Fix TypeScript errors, retry build |
| Deploy failed | vercel deploy --prod returns error | Check Vercel logs, fix config |
| Stale cache | Asset hash mismatch after deploy | Vercel auto-invalidates on successful deploy; check headers |
| Wrong commit deployed | vercel inspect shows old commit | Rollback or redeploy correct branch |
| CDN not updated | Route returns 200 but JS bundle is old | Wait 30s for CDN propagation, check cache-control headers |

## Database-First Deployment Coordination

When deploying with database changes:

1. **Apply Supabase migration** → 2-5 minutes
   - Verify tables exist and RLS is enabled
   - Verify indexes created
   - Database is now ready

2. **Deploy app to Vercel** → 1-3 minutes
   - Run build, upload to Vercel
   - Verify deployed commit matches HEAD

3. **Post-deploy verification** → 5 minutes
   - Revision check
   - Asset verification
   - Route smoke tests
   - API smoke tests (app can query new tables)

**Critical:** Database migration MUST complete before app deployment. App live but tables missing = 500 errors on all queries.

## Monitoring Post-Deployment

After deployment verification passes:

1. **First hour:** Monitor `/api/` endpoints in Vercel logs for unexpected errors
2. **First day:** Check Core Web Vitals (LCP, INP, CLS) are within targets
3. **Ongoing:** Monitor error rate, latency for WA Sender endpoints if applicable

## Related Skills

- `.claude/agents/project/deployment-coordinator.md` — complete deployment workflow
- `.claude/skills/project/supabase-deployment-patterns/` — database migration patterns
- `deploy/.last-deployed` — deployment state file for drift detection

## See Also

Sub-files in this skill:
- `asset-verification-patterns.md` — bundle hash extraction and verification
- `smoke-test-templates.md` — curl commands for common routes and APIs
- `cache-troubleshooting.md` — L1-L7 cache layers to check if assets stale
