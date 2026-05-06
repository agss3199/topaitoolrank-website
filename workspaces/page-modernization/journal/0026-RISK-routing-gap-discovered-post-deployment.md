---
type: RISK
date: 2026-05-06
created_at: 2026-05-06T13:55:00Z
author: discovered-by-user-report
session_id: critical-hotfix-post-deployment
project: page-modernization
topic: Critical routing gap - /login returns 404 post-deployment
phase: redteam
tags: [production-incident, routing, user-access-blocking, hotfix, smoke-test-gap]
---

# RISK: Critical Routing Gap — /login Returns 404

**Status**: 🔴 CRITICAL (post-deployment discovery) → ✅ FIXED

**Impact**: Users cannot access login page via natural path `/login` — 404 error blocks authentication flow

**Timeline**:
- 2026-05-06 13:40 — User reports `/login` returning 404
- 2026-05-06 13:45 — Root cause identified: no `/login` route (only `/auth/login` exists)
- 2026-05-06 13:50 — Fix deployed: redirect `/login` → `/auth/login`
- 2026-05-06 13:55 — Verification complete: live routes working, both paths 200 OK

---

## The Problem

Post-deployment smoke tests verified `/auth/login` returns 200 OK ✓

But users naturally try `/login` (without the `/auth/` prefix), which returned **404 Not Found**.

### Evidence

**Before fix**:
```bash
curl -I https://www.topaitoolrank.com/login
# HTTP/1.1 404 Not Found
```

**After fix**:
```bash
curl -I -L https://www.topaitoolrank.com/login
# HTTP/1.1 307 Temporary Redirect
# Location: /auth/login
# HTTP/1.1 200 OK
```

---

## Why This Gap Existed

### 1. Smoke Test Incomplete

The post-deployment verification checked `/auth/login`:
```bash
for route in "" "/auth/login" "/blogs" "/tools/wa-sender"; do
  # ✓ /auth/login returns 200 OK
done
```

But it did NOT check `/login` (without `/auth/`):
```bash
# ❌ /login was not tested
```

**Root cause**: Smoke test path was `/auth/login`, not `/login`. The two are different routes.

### 2. UX Mismatch

Users expect the shortest path to authentication:
- Natural: `/login` (3 path segments: `/` + `login`)
- Actual: `/auth/login` (4 path segments: `/` + `auth` + `/` + `login`)

Authentication is so fundamental that users skip the extra directory level.

### 3. No Redirect Route

The codebase had:
```
app/auth/login/page.tsx       ← Renders login UI
app/api/auth/login/route.ts   ← API endpoint
```

But NO:
```
app/login/route.ts            ← Redirect /login → /auth/login
```

---

## The Fix

**File**: `app/login/route.ts`

```typescript
import { redirect } from 'next/navigation'

export async function GET() {
  redirect('/auth/login')
}
```

**Why this works**:
- Next.js sees request to `/login`
- Route handler calls `redirect('/auth/login')`
- Browser follows redirect (307 Temporary Redirect)
- Lands on `/auth/login` page (200 OK)

**Verification** (post-fix):
```bash
# www subdomain (user's natural path)
curl -I -L https://www.topaitoolrank.com/login
# HTTP/1.1 307 Temporary Redirect → Location: /auth/login
# HTTP/1.1 200 OK ✓

# Root domain
curl -I -L https://topaitoolrank.com/login
# HTTP/1.1 307 Temporary Redirect → Location: /auth/login
# HTTP/1.1 200 OK ✓
```

---

## Why This Wasn't Caught Before

### Smoke Test Gap

The smoke test suite from deployment verification (0011-DECISION) tested:
```bash
✅ /
✅ /auth/login
✅ /auth/signup
✅ /blogs
✅ /tools/wa-sender
✅ /privacy-policy
✅ /terms
```

But these are the **documented routes**, not the **user-expected routes**.

Users don't read documentation — they try `/login` before `/auth/login`.

### No Unit or E2E Test Coverage

The codebase likely lacks a test that:
1. Navigates to `/login`
2. Expects a redirect (not a render)
3. Asserts final destination is `/auth/login`

---

## Lessons Learned

### 1. Smoke Tests Must Include UX Paths, Not Just Implemented Paths

Add a second smoke test tier:
```bash
# Tier 1: Implemented routes (already tested)
/auth/login → 200

# Tier 2: User-expected routes (MISSING)
/login → 307 + follow → 200
/signup → 307 + follow → 200
/contact → 307 + follow → 200 (or 404 with friendly message)
```

### 2. Redirect Routes Are Routes

Routes that redirect (not render) are as critical as routes that render:
- A 404 on `/login` breaks authentication flow completely
- A working `/login` → `/auth/login` redirect is transparent to users

Both must be tested.

### 3. Post-Deployment Verification Needs User Perspective

Verification checklist should include:
- **Tech perspective**: "Is the route implemented?" → `/auth/login` ✓
- **User perspective**: "Can a user reach the page?" → `/login` ✓

The tech perspective passed. The user perspective failed.

---

## Prevention Going Forward

### 1. Expanded Smoke Test Suite

```bash
# app/smoke-tests.sh
test_route() {
  local url=$1
  local expected_final=$2
  
  # Follow redirects, check final destination
  final=$(curl -L -s "$url" | grep -o '<h1>.*</h1>' | head -1)
  
  [ -n "$final" ] && echo "✓ $url → $expected_final" || echo "✗ $url FAILED"
}

test_route "https://topaitoolrank.com/login" "Sign In"
test_route "https://topaitoolrank.com/auth/login" "Sign In"
test_route "https://topaitoolrank.com/signup" "Sign Up"
```

### 2. Add Redirect Test Cases

```typescript
// tests/integration/routes/redirects.test.ts
describe('Redirect routes', () => {
  test('/login redirects to /auth/login', async () => {
    const res = await fetch('https://localhost:3000/login')
    expect(res.status).toBe(307) // Temporary redirect
    expect(res.headers.get('location')).toBe('/auth/login')
  })
  
  test('/signup redirects to /auth/signup', async () => {
    // Same pattern
  })
})
```

### 3. UX Path Documentation

Add a section to README documenting user-facing paths vs implementation paths:

```markdown
## User-Facing Routes

Users access these paths naturally:
- `/login` → redirects to `/auth/login` ✓
- `/signup` → redirects to `/auth/signup` ✓

Implementation detail:
- Auth pages live in `/app/auth/` directory
- But are accessible via `/auth/` prefix in production
```

---

## For Discussion

1. **Redirect strategy**: Should all single-word authentication paths (`/login`, `/signup`, `/register`) redirect to their `/auth/` equivalents, or should we move the actual pages to the root level?

2. **Test coverage**: Should redirect routes be tested as part of the Tier 2 integration test suite, or as a separate smoke test suite?

3. **UX documentation**: Should we document "user-expected paths" separately from "implemented paths" to catch these gaps?

4. **Post-deploy verification**: Should the deployment verification script include a "UX paths" tier in addition to the "technical routes" tier?

---

**Severity**: 🔴 CRITICAL (authentication completely blocked for users trying `/login`)  
**Time to discovery**: ~13 minutes post-deployment  
**Time to fix**: ~5 minutes  
**Root cause**: Smoke test incomplete (checked `/auth/login`, not `/login`)  
**Fix deployed**: Commit 9299592 (redirect route added)  
**Verification**: Live routes confirmed working (307 redirect, final destination 200 OK)

**Key insight**: User-expected paths are as critical as implemented paths. Post-deployment smoke tests must include both.
