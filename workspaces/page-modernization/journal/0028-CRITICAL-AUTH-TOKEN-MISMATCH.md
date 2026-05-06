---
id: "0028"
type: CRITICAL
slug: auth-token-mismatch
date: 2026-05-06T14:20:00Z
severity: P0
status: FIXED
---

# Critical: Authentication Token Response Structure Mismatch

## What Happened

Users reported "Login failed. Please try again" error on `/auth/login` despite successfully authenticating (network tab showed valid JWT tokens in API response). This blocked all authentication to the WA Sender tool, making the application unusable.

**Impact**: Complete authentication flow failure for all users — P0 severity.

## Root Cause

Client-side code in `app/auth/login/page.tsx` expected API response with nested token structure:
```javascript
data.session.accessToken  // undefined — does not exist
data.session.refreshToken // undefined — does not exist
data.session.userId       // undefined — does not exist
data.session.email        // undefined — does not exist
```

But API (`app/api/auth/login/route.ts`) returned flat structure:
```javascript
{
  ok: true,
  accessToken: "eyJhbGciOiJIUzI1NiIs...",
  refreshToken: "eyJhbGciOiJIUzI1NiIs...",
  userId: "e7e8c62e-dcc3-43e7-a5b4-655e9b8acfd5",
  email: "abhishekgupta3199@gmail.com",
  tool: "wa-sender",
  expiresIn: 3600
}
```

Accessing `data.session.accessToken` returned `undefined`, causing the implicit `try/catch` to treat it as a failed login and show the error message.

## Investigation

1. **API verification**: Confirmed `/api/auth/login` returns valid JWT tokens
2. **Network tab**: Verified response contains `accessToken`, `refreshToken`, `userId`, `email` at top level
3. **Code review**: Found lines 35-38 of `app/auth/login/page.tsx` incorrectly nesting token access
4. **Scope**: Issue isolated to single file; no similar patterns in other auth endpoints

## Fix Applied

**Commit**: `f27069a`
**File**: `app/auth/login/page.tsx` (lines 35-38)

```diff
- localStorage.setItem('wa-sender-access-token', data.session.accessToken);
- localStorage.setItem('wa-sender-refresh-token', data.session.refreshToken);
- localStorage.setItem('wa-sender-user-id', data.session.userId);
- localStorage.setItem('wa-sender-user-email', data.session.email);

+ localStorage.setItem('wa-sender-access-token', data.accessToken);
+ localStorage.setItem('wa-sender-refresh-token', data.refreshToken);
+ localStorage.setItem('wa-sender-user-id', data.userId);
+ localStorage.setItem('wa-sender-user-email', data.email);
```

**Deployment**: `dpl_AZcSG45wkY6QDv74kLoS8FnMwVYp` (2026-05-06 14:20 UTC)  
**Live**: https://topaitoolrank.com

## Verification

1. ✅ Build: 14.0s, zero errors
2. ✅ Deployment: `READY` status
3. ✅ Aliased: https://topaitoolrank.com
4. ✅ Network: `/api/auth/login` returns correct response structure
5. ✅ Client: localStorage correctly stores tokens from flat response

## Prevention

1. **Contract alignment**: API response structure and client access patterns were never formally specified
2. **Integration test gap**: No Tier 2 integration test verifying the full auth flow (request → response → token storage → redirect)
3. **Type safety**: TypeScript types could have caught the `.session` accessor mismatch if the response type was declared

### Next Session Todos

- Add Tier 2 integration test for login flow end-to-end (authenticate, store tokens, verify localStorage)
- Define API response types in `types/auth.ts` to prevent future field name mismatches
- Add smoke test to verify login flow returns valid tokens and client can store them

## Related

- **0026-RISK**: Critical routing gap — `/login` returned 404 (FIXED via redirects)
- **0027-GAP**: Smoke test gaps — missing user-perspective verification

---

**Investigated by**: Autonomous validation (redteam phase)  
**Fixed by**: Commit f27069a  
**Deployed**: 2026-05-06 14:20 UTC  
**Status**: ✅ RESOLVED AND VERIFIED
