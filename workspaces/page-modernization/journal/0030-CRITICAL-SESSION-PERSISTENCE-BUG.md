---
id: "0030"
type: CRITICAL
slug: session-persistence-lost-on-refresh
date: 2026-05-06T14:45:00Z
severity: P0
status: FIXED
---

# Critical: Session Data Lost on Refresh After Upload

## What Happened

User uploads a file with contacts, application works normally. On page refresh, all data is lost and the application asks to upload again instead of restoring from database.

**Impact**: Complete data loss — users must re-upload files after every refresh, making the tool unusable.

## Root Cause

Race condition in session loading logic (`app/tools/wa-sender/page.tsx`, lines 289-330):

```typescript
const loadSessionFromSupabase = async () => {
  // ...
  if (data.ok && data.session) {
    applySessionData(data.session);
    localStorage.setItem(localStorageKey, JSON.stringify(data.session));
  }
  // No fallback if data.ok but data.session is null!
};
```

The issue occurs because:

1. User uploads file, data saves to localStorage **immediately** (synchronously)
2. Auto-save triggers Supabase save with **500ms debounce**
3. User refreshes page while debounce is still in flight
4. `loadSessionFromSupabase()` runs and calls `/api/sheets/load`
5. Supabase has no session yet (debounce still pending), returns `{ ok: true, session: null }`
6. The code checks `data.ok && data.session` — this is true && null = **false**
7. **No fallback to localStorage**, so nothing loads
8. Application renders as empty (no sheets loaded)

The code only had localStorage fallback for network errors, not for valid API responses with null data.

## Fix Applied

**Commit**: `894b5a8`  
**File**: `app/tools/wa-sender/page.tsx` (lines 317-327)

Added fallback when `data.ok === true` but `data.session === null`:

```typescript
if (data.ok && data.session) {
  applySessionData(data.session);
  localStorage.setItem(localStorageKey, JSON.stringify(data.session));
} else if (data.ok && !data.session) {
  // Supabase has no session for this user (new user or not yet saved)
  // Try localStorage as fallback (debounce might still be in flight)
  const cached = localStorage.getItem(localStorageKey);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      applySessionData(parsed);
    } catch (e) {
      console.warn('Failed to parse cached session:', e);
    }
  }
}
```

**Why this works**: When Supabase returns null, the code now checks localStorage as a fallback. The debounce save will eventually complete and update Supabase, but in the meantime, users see their data loaded from localStorage.

## Deployment

- **Commit**: `894b5a8`
- **Deployment**: `dpl_FgiGgVpEoGbtecyrKCvmYqfimT7V`
- **URL**: https://topaitoolrank.com
- **Build Time**: 37s
- **Status**: READY

## Verification

After deploying, users should:
1. ✅ Upload a file with contacts
2. ✅ Refresh the page immediately (before 500ms debounce completes)
3. ✅ See sheet data restored from localStorage while Supabase save is in flight
4. ✅ See data persist across multiple refreshes

## Why This Happens

Debounce was implemented to reduce API calls (good performance optimization), but the race condition between localStorage write (synchronous) and Supabase save (async, debounced) creates a window where:

- User has data in localStorage
- Supabase doesn't have it yet
- Code only checks Supabase, doesn't fallback to localStorage

## Prevention

**For future debounced saves:**

1. Always check localStorage when API returns null data
2. Consider reducing debounce delay for critical data (authentication, session state)
3. Add explicit save-in-flight indicator to UI (e.g., "Saving..." status)
4. Document the debounce behavior so developers understand the race condition

**Alternative approaches** (not implemented, but worth considering):

- Use shorter debounce (e.g., 200ms instead of 500ms) for critical session data
- Save to Supabase synchronously, debounce the Supabase calls instead
- Track save state and show warning if user navigates away before save completes

## Related Issues

- **0029**: Auth session race condition (similar timing issue, different cause)
- **0028**: Token mismatch (pre-authentication issue)

---

**Fixed by**: Commit 894b5a8  
**Deployed**: 2026-05-06 14:45 UTC  
**Status**: ✅ RESOLVED
