---
type: GAP
date: 2026-05-06
created_at: 2026-05-06T13:58:00Z
author: discovered-via-incident
session_id: critical-hotfix-post-deployment
project: page-modernization
topic: Smoke test gap - missing user-perspective route verification
phase: redteam
tags: [testing-gap, post-deploy-verification, ux-mismatch, routing, authentication]
---

# GAP: Smoke Test Gaps — Missing User-Perspective Route Verification

**Discovery**: Post-deployment smoke tests verified implementation routes (`/auth/login`) but not user-expected routes (`/login`).

**Impact**: Users accessing the natural authentication path (`/login`) saw 404 until hotfix deployed.

**Lesson**: Smoke tests must check both what was implemented AND what users expect to find.

---

## The Gap

### What Tests Checked (Implementation Perspective)

From deployment verification smoke tests (0011-DECISION):
```bash
for route in "/" "/auth/login" "/auth/signup" "/blogs" "/tools/wa-sender" "/privacy-policy" "/terms"; do
  curl -s -o /dev/null -w "$route: %{http_code}\n" "https://topaitoolrank.com${route}"
done

✓ /: 200 OK
✓ /auth/login: 200 OK      ← Checked
✓ /auth/signup: 200 OK
✓ /blogs: 200 OK
✓ /tools/wa-sender: 200 OK
✓ /privacy-policy: 200 OK
✓ /terms: 200 OK
```

All tests passed ✓ — because they tested the **implemented** routes.

### What Tests Missed (User-Expected Perspective)

```bash
# Users naturally try these paths first:
/login          ← NOT tested, returned 404
/signup         ← NOT tested, likely also 404
/contact        ← NOT tested
```

## Why This Happened

### Root Cause 1: Test Scope Mismatch

The smoke test suite was designed to verify "deployment success", which it defined as:
1. ✓ Build completes
2. ✓ Routes register
3. ✓ Implemented routes return 200

But it didn't include:
4. ✗ User-expected routes are accessible
5. ✗ Intuitive paths work (with redirects if needed)

### Root Cause 2: Cognitive Bias

When writing the smoke test, the developer (me) had just spent the session implementing `/auth/login`, so naturally tested `/auth/login`. The developer's mental model was "the route I just built works" rather than "users can find the route they expect".

### Root Cause 3: No Specification of User Paths

The `modernization-requirements.md` brief specified the **feature** ("login page") but not the **URL path** users would use.

Later, the implementation chose `/auth/login`, but there was no requirement that `/login` must also work.

---

## Standard Smoke Test Coverage (Missing Tier)

Current structure:
```
Tier 1: Pre-Deploy Validation
  ├─ Build gate ✓
  ├─ Type check gate ✓
  └─ Code quality gate ✓

Tier 2: Post-Deploy Smoke Tests (INCOMPLETE)
  ├─ Route registration ✓ (7/7 routes return 200)
  ├─ Asset verification ✓ (bundle hash matches)
  └─ Redirect verification ✗ (MISSING)

Tier 3: User Flow Validation (MISSING)
  ├─ Authentication paths ✗
  ├─ Shortcut paths ✗
  └─ Common misspellings ✗
```

### What Should Be Added

```
Tier 2.5: User-Expected Path Verification
  
# Redirect routes (should follow redirect and land on 200)
/login           → 307 → /auth/login → 200
/signup          → 307 → /auth/signup → 200

# Intuitive paths (if not directly available, document why)
/contact         → 404 (expected, no contact form)
/about           → 404 (expected, use / instead)

# Common variations
/login.html      → 404 (expected, .html not used in Next.js)
/login/          → handles trailing slash correctly
```

---

## How to Prevent This Gap

### 1. Extend Deployment Verification Script

```bash
# scripts/smoke-tests.sh

# Section 1: Implementation routes (current)
test_routes() {
  echo "=== Testing Implemented Routes ==="
  for route in "/" "/auth/login" "/auth/signup" "/blogs" "/tools/wa-sender"; do
    test_route "$route" 200
  done
}

# Section 2: User-expected redirect routes (NEW)
test_user_paths() {
  echo "=== Testing User-Expected Paths ==="
  
  # These should redirect to implementation routes
  test_redirect "/login" "/auth/login" 307
  test_redirect "/signup" "/auth/signup" 307
  
  # These can 404 if they don't exist
  test_route "/contact" 404
  test_route "/about" 404
}

test_redirect() {
  local user_path=$1
  local expected_dest=$2
  local expected_status=$3
  
  local final_status=$(curl -s -w "%{http_code}" "$user_path")
  [ "$final_status" = "$expected_status" ] && echo "✓ $user_path → $expected_dest [$expected_status]" || echo "✗ $user_path FAILED"
}

# Run both test suites
test_routes
test_user_paths
```

### 2. Add User Path Tests to Integration Suite

```typescript
// tests/integration/user-paths.test.ts
describe('User-Expected Path Verification', () => {
  const BASE_URL = 'https://topaitoolrank.com'
  
  describe('Authentication paths', () => {
    test('users can access /login (via redirect)', async () => {
      const response = await fetch(`${BASE_URL}/login`, { redirect: 'follow' })
      expect(response.status).toBe(200)
      expect(response.url).toContain('/auth/login')
    })
    
    test('users can access /signup (via redirect)', async () => {
      const response = await fetch(`${BASE_URL}/signup`, { redirect: 'follow' })
      expect(response.status).toBe(200)
      expect(response.url).toContain('/auth/signup')
    })
  })
  
  describe('Intuitive path variations', () => {
    test('trailing slash is handled', async () => {
      const response = await fetch(`${BASE_URL}/login/`)
      expect([200, 307]).toContain(response.status)
    })
  })
})
```

### 3. Document User-Expected Path Structure

```markdown
# User-Facing Routes

## Authentication (primary user journeys)

| User Action | Natural Path | Implemented As | Notes |
|---|---|---|---|
| Sign in | `/login` | `/auth/login` | Redirect from natural path ✓ |
| Sign up | `/signup` | `/auth/signup` | Redirect from natural path ✓ |

## Tools

| Tool | User Path | Route | Status |
|---|---|---|---|
| WA Sender | `/wa-sender` | `/tools/wa-sender` | Redirect? |

## Content

| Content | User Path | Route | Status |
|---|---|---|---|
| Blog | `/blog` | `/blogs` | Redirect? |

---

**Missing redirects should be added in this session.**
**Document the decision to keep or remove common shortcuts.**
```

---

## For Discussion

1. **Standard smoke test coverage**: Should every deployment include a "user-expected paths" verification tier, or is this project-specific?

2. **Redirect philosophy**: When routes don't match user expectations, should we:
   - Option A: Add redirects (what we did)
   - Option B: Move implementation to match user expectations (`app/login/` instead of `app/auth/login/`)
   - Option C: Document why the path exists and train users

3. **Automation**: Could a tool analyze deployed routes and suggest common shortcuts based on UX patterns (authentication paths, blog paths, contact paths)?

4. **Specification**: Should the brief include "user-expected paths" as a requirement, not just "implement login feature"?

---

**Scope**: Post-deployment smoke test suite  
**Severity**: HIGH (authentication paths are critical)  
**Root cause**: Smoke tests checked implementation, not UX expectations  
**Discovery**: User report 13 minutes post-deployment  
**Fix time**: 5 minutes (add redirect route)  

**Key insight**: Implementation and user expectations can diverge silently. Smoke tests must verify both.
