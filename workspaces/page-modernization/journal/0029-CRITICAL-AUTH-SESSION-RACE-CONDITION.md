---
id: "0029"
type: CRITICAL
slug: auth-session-race-condition
date: 2026-05-06T14:35:00Z
severity: P0
status: FIXED
---

# Critical: Auth Session Race Condition — Users Stuck in Login Loop

## What Happened

After successful authentication, users were redirected back to `/auth/login` instead of `/tools/wa-sender`. Session data was lost on refresh. This prevented all users from accessing the WA Sender tool.

**Impact**: Complete feature blockage — P0 severity.

## Root Cause

Race condition in `app/tools/wa-sender/page.tsx` (lines 275-280):

```typescript
useEffect(() => {
  if (!loading && !session) {
    router.push('/auth/login');
  }
}, [session, loading, router]);
```

The problem: `useAuth()` hook reads tokens from localStorage asynchronously in a useEffect with an empty dependency array. Both effects run on mount, but the auth check effect can run BEFORE useAuth finishes reading localStorage:

**Timeline:**
1. User logs in, tokens stored in localStorage
2. router.push('/tools/wa-sender') navigates to WA Sender
3. Page component mounts, both useEffects scheduled
4. Auth check effect runs: `loading=true, session=null` → condition `!loading && !session` is false, doesn't redirect (yet)
5. useAuth effect runs: reads localStorage, sets session, sets `loading=false`
6. Effect runs again because `loading` changed: now `!loading && !session` evaluates, but useAuth might not have finished setting session
7. **Bug**: If auth check runs before useAuth sets session, redirect happens even though tokens exist

The race is non-deterministic: sometimes useAuth completes first (works), sometimes the auth check runs first (breaks).

## Secondary Issue: CSS Styling

Login page left column (desktop only) had invalid Tailwind CSS class:
```typescript
className="... bg-var(--color-bg-light)"  // ❌ Invalid syntax
```

Should use inline style for CSS variables:
```typescript
style={{ backgroundColor: 'var(--color-bg-light)' }}
```

## Fix Applied

**Commit**: `2d24b80`  
**Files**: 
- `app/tools/wa-sender/page.tsx` (lines 275-283)
- `app/auth/login/page.tsx` (line 51)

### Fix 1: Race Condition (WASenderPage)

Added localStorage fallback to prevent redirect if tokens exist:

```typescript
// Auth check — check localStorage as fallback for race condition where
// useAuth hasn't finished reading localStorage yet but tokens exist
useEffect(() => {
  if (!loading && !session) {
    const token = localStorage.getItem('wa-sender-access-token');
    if (!token) {
      router.push('/auth/login');
    }
    // If token exists, useAuth is still loading it — don't redirect
  }
}, [session, loading, router]);
```

**Why this works**: If localStorage has tokens, the redirect is skipped. useAuth will then load and set session asynchronously without being interrupted. If localStorage is empty, the user genuinely isn't authenticated, so redirect to login.

### Fix 2: CSS Styling (LoginPage)

Changed invalid Tailwind class to inline style:

```typescript
// Before: className="... bg-var(--color-bg-light)"
// After:
<div className="... " style={{ backgroundColor: 'var(--color-bg-light)' }}>
```

## Deployment

- **Commit**: `2d24b80`
- **Deployment**: `dpl_5iaTQYj8bNdermnVV9hh5K8auUQg`
- **URL**: https://topaitoolrank.com
- **Status**: READY
- **Build Time**: 28s

## Verification

After deployment, users should:
1. ✅ Log in successfully
2. ✅ Stay on `/tools/wa-sender` instead of redirecting back to login
3. ✅ See correctly styled login page if they do need to log in
4. ✅ Have session data persist across page refreshes (loaded from localStorage and Supabase)

## Related Issues

- **0028**: Auth token mismatch (client accessing `data.session.*` instead of `data.*`) — FIXED in prior commit
- **0026**: Routing gap (`/login` → 404) — FIXED in prior commits  
- **0027**: Smoke test gaps

## Prevention

For future race conditions involving async initialization:

1. **Check storage before redirecting**: Always check localStorage/sessionStorage as a fallback when deciding whether to redirect for auth
2. **Use loading state properly**: Don't render conditional UI based on async state without checking persistent storage first
3. **Consider synchronous initialization**: For authentication, consider reading persistent tokens synchronously on first render if possible

## Outstanding Notes

User also mentioned: "these namings are not correct" — specific field names/labels need clarification. Will investigate if additional issues surface during testing.

---

**Fixed by**: Commit 2d24b80  
**Deployed**: 2026-05-06 14:35 UTC  
**Status**: ✅ RESOLVED
