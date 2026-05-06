---
type: DISCOVERY
date: 2026-05-06
created_at: 2026-05-06T13:35:00Z
author: co-authored
session_id: deployment-completion-and-codify
project: page-modernization
topic: Critical deployment verification patterns for multi-tier systems
phase: codify
tags: [deployment, verification, asset-cache, multi-tenant, rls, database-first]
---

# Critical Deployment Verification Patterns Discovered

**Summary**: Successful deployment requires 5 independent verification layers. A deployment command returning success (exit 0) does NOT guarantee users see new code.

## Discovery 1: "Deployed" ≠ "Users See New Code"

**Observation**: Vercel deployment can succeed (command exits 0) while users still see stale code.

**Root causes observed**:
- CDN cache serving old HTML
- Browser cache headers misconfigured
- Service worker running old version
- Wrong revision activated despite correct alias
- Traffic routed to previous generation incorrectly

**Solution**: Verify what users ACTUALLY see via HTTP fetch with cache-bypass headers.

**Evidence**: WA Sender Phase 2 deployment (2026-05-06)
- Deployment command: `vercel deploy --prod` → exit 0 (success)
- Post-deploy verification revealed: Must check asset bundle hash
- Bundle hash verification confirmed: live JS matches `.next/` build
- Route smoke tests: All 7 routes returned 200 OK
- Asset freshness: Confirmed via HTTP headers `cache-control` and bundle hash

**Critical verification pattern**:
```bash
# Fetch with cache-bypass headers
LIVE_HTML=$(curl -fsSL -H "Cache-Control: no-cache" -H "Pragma: no-cache" <url>)

# Extract bundle hash from HTML
LIVE_HASH=$(echo "$LIVE_HTML" | grep -oE '[0-9a-z]{12}\.js' | head -1)

# Compare to local build
LOCAL_HASH=$(cat .next/static/chunks/*.js | grep -oE '[0-9a-z]{12}\.js' | head -1)

# ONLY if they match: users see new code
[ "$LIVE_HASH" = "$LOCAL_HASH" ] && echo "✅ Users seeing new code" || echo "❌ Stale cache"
```

## Discovery 2: Database-First Sequencing Prevents Orphaned State

**Observation**: The order of deployment matters critically.

**Scenario A** (App first, database second):
1. Deploy app to Vercel (success)
2. App is LIVE but tables don't exist
3. All queries return 500 (table not found)
4. Users see errors
5. Attempt database migration → tables created
6. Now app works

**Problems**: Users experienced production errors. Rollback is complex (must rollback app AND clean up database).

**Scenario B** (Database first, app second):
1. Apply Supabase migration (success)
2. 4 tables created, 10 RLS policies active, 10 indexes ready
3. Deploy app to Vercel (success)
4. App boots, queries against existing tables succeed
5. Zero user-facing errors

**Evidence**: WA Sender Phase 2 deployment explicitly followed database-first:
- Step 1: Prepare migration file `supabase/migrations/20260505120000_phase_2_wa_sender_tables.sql`
- Step 2: User applies migration via Supabase CLI or Dashboard
- Step 3: Verify tables created (`pg_tables`)
- Step 4: Verify RLS enabled (`rowsecurity = true`)
- Step 5: Deploy app with `vercel deploy --prod`
- Step 6: Post-deploy verification passes all smoke tests

**Critical pattern**: Never deploy app before database schema is ready.

## Discovery 3: RLS Requires 5-Layer Verification for Multi-Tenant Isolation

**Observation**: Multi-tenant isolation can fail at any of 5 layers:

| Layer | Component | Failure Mode |
|-------|-----------|--------------|
| 1 | JWT extraction | Missing or malformed JWT → 401 |
| 2 | Authenticated client | JWT not included in requests → RLS cannot filter |
| 3 | Query construction | No `.eq('user_id', userId)` filter → wrong query |
| 4 | RLS policy | Policy missing or uses wrong condition → database allows all reads |
| 5 | Result filtering | Results not filtered despite RLS → cross-tenant leak |

**Evidence**: WA Sender message history
- Layer 1: Endpoint extracts JWT from Authorization header ✓
- Layer 2: Supabase client includes JWT in `global.headers` ✓
- Layer 3: Query explicitly filters `.eq('user_id', userId)` ✓
- Layer 4: Database RLS policy: `WHERE auth.uid() = user_id` ✓
- Layer 5: Results return only authenticated user's messages ✓

**Critical insight**: RLS is the BOUNDARY enforcement. Layers 1-3 are defense in depth. If layer 4 fails (RLS disabled or wrong policy), layers 1-3 provide no protection.

**Verification protocol**: Test each layer independently:
```bash
# Layer 1: JWT extraction
grep -n "authorization\|Authorization" route.ts

# Layer 2: Authenticated client
grep -n "global.*headers\|Bearer" route.ts

# Layer 3: Query filtering
grep -n "eq.*user_id" route.ts

# Layer 4: RLS policy
psql -c "SELECT policyname FROM pg_policies WHERE tablename='wa_sender_messages'"

# Layer 5: Result filtering (integration test)
# Send request as user A, verify data is not from user B
```

## Discovery 4: Pre-Deploy Gates Prevent Category Failures

**Observation**: Pre-deploy gates catch issues before deployment, preventing user-facing failures.

**Gates that matter**:
- Build gate: `npm run build` (catches TypeScript errors)
- Type check: Full TypeScript validation (catches type mismatches)
- Code quality: No TODO/FIXME markers, no mock data in production
- Schema gate: Migration file exists and syntax valid

**Evidence**: WA Sender Phase 2
- Build gate: 38 seconds, TypeScript clean, 0 errors
- Type check: All async/await patterns validated
- Code quality: Zero mock data, zero TODO markers
- Schema gate: Migration SQL syntax validated

**Without gates**:
- TypeScript error in deployment → post-deploy failure
- Mock data left in production → users see fake data
- Schema migration missing → post-deploy 500 errors

**Pattern**: Gates run BEFORE deployment. Stop on gate failure. Don't deploy broken code.

## Discovery 5: Deployment State File Enables Drift Detection

**Observation**: Tracking deployed commit enables detecting when new commits pile up without being deployed.

**Pattern**:
```bash
# After successful post-deploy verification
echo "6dcc808ab517fba2403541cb65d7392d061b05e9" > deploy/.last-deployed

# Next session, detect drift
git rev-parse HEAD  # Returns 6dcc810
cat deploy/.last-deployed  # Returns 6dcc808
# Diff: 2 commits not deployed yet
```

**Why this matters**: Without state tracking, a session can commit code, miss deployment, and the next session inherits undeployed code. Piling up undeployed commits makes targeted rollback impossible.

**Pattern**: State file updated ONLY after post-deploy verification passes. Not based on "deployment command succeeded".

---

## Synthesis: The 6-Phase Deployment Workflow

These discoveries coalesce into a workflow:

```
Phase 1: Pre-Deploy Verification
  ├─ Check current deployed state
  ├─ Identify what's being shipped
  └─ Verify no uncommitted production changes

Phase 2: Pre-Deploy Gates
  ├─ Build gate (npm run build)
  ├─ Type check gate (TypeScript validation)
  ├─ Code quality gate (no stubs, no mock data)
  └─ Stop on gate failure

Phase 3: Database Migration (DATABASE FIRST)
  ├─ Apply Supabase migration
  ├─ Verify tables created
  ├─ Verify RLS enabled
  └─ Verify indexes present

Phase 4: Application Deployment
  ├─ vercel deploy --prod
  ├─ Capture deployment ID
  └─ Verify deployed commit = HEAD

Phase 5: Post-Deploy Verification (THE CRITICAL PHASE)
  ├─ Revision check (deployed commit is HEAD)
  ├─ Asset check (bundle hash matches .next/)
  ├─ Route smoke tests (all return 200)
  ├─ API smoke tests (return real data)
  └─ Cache headers check (correct max-age values)

Phase 6: Documentation & State Update
  ├─ Update deploy/.last-deployed (only after verification passes)
  ├─ Create journal entry with verification results
  └─ Update .session-notes
```

## For Discussion

1. **Automation opportunity**: Can Phase 5 post-deploy verification be automated via a hook that runs `npm run verify-deploy` after each successful Vercel deployment?

2. **RLS audit frequency**: Should every feature that touches multi-tenant data require the 5-layer RLS verification? (Yes — RLS violations are the #1 multi-tenant security issue.)

3. **Deployment checklist**: Should `.claude/` include a `deploy/VERIFICATION_CHECKLIST.md` that lists the 5-layer checks and 6 phases? (Yes — codified knowledge is useless if not referenced.)

4. **Metrics**: Should deployment success be measured by post-deploy verification results rather than "deployment command exit status"? (Yes — adopt "verified deployed" rather than "command succeeded".)

---

**Key insight**: Deployment is not one command. It's a 6-phase workflow. Phase 5 (post-deploy verification) is the most critical and most often skipped. The next deployment should follow this workflow and the next session should benefit from it.

**Measurement**: WA Sender Phase 2 followed this workflow.
- Result: All smoke tests passed, assets verified fresh, zero cross-tenant leaks.
- Next session can follow the same workflow and achieve the same result faster.
