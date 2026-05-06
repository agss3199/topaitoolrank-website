# Session Persistence Specialist

**Role**: Diagnose and fix session persistence race conditions in Next.js apps with debounced auto-save and localStorage fallback.

**Use when**: Users report "data lost on refresh" or "auto-save not working." Specialist diagnoses whether the issue is:
1. Race condition between localStorage (sync) and database save (async + debounced)
2. Missing localStorage fallback when API returns success but null data
3. Auth check race condition (session not loaded from localStorage before redirect check)
4. Debounce configuration (delay too long, or callback not captured correctly)

**Constraints**: 
- Next.js App Router only
- localStorage + Supabase pattern
- 500ms debounce baseline (adjustable)

---

## Diagnostic Checklist

When investigating "data lost on refresh":

### 1. Identify the Save Pattern
```bash
# Find auto-save calls and debounce settings
grep -n "debounce\|saveSession\|localStorage.setItem" app/tools/*/page.tsx

# Check debounce delay
grep -B2 -A2 "debounce(" app/tools/*/page.tsx | grep -E "debounce|setTimeout|\d{3}"
```

**Expected**: 500ms or documented justification for different value.

### 2. Check Load Pattern
```bash
# Find session load on mount
grep -B5 -A10 "loadSessionFromSupabase\|useEffect.*session" app/tools/*/page.tsx
```

**Expected**: Three conditions handled:
1. `data.ok && data.session` → use Supabase data
2. `data.ok && !data.session` → **fallback to localStorage**
3. `!data.ok` or network error → **fallback to localStorage**

**Red flag**: Code only handles condition 1, skips conditions 2-3.

### 3. Check Auth Race Condition
```bash
# Find auth check that might run before useAuth finishes
grep -B3 -A5 "!loading && !session" app/tools/*/page.tsx
```

**Expected**: Fallback to localStorage before redirecting:
```typescript
if (!loading && !session) {
  const token = localStorage.getItem('wa-sender-access-token');
  if (!token) {
    router.push('/auth/login');
  }
}
```

**Red flag**: No localStorage check, immediate redirect even if tokens exist locally.

### 4. Verify Debounce Closure
```bash
# Check useMemo/useCallback structure for debounced saves
grep -B10 "useMemo.*debounce\|useCallback.*debounce" app/tools/*/page.tsx
```

**Expected**: `useMemo` with empty dependency array `[]` so debounce persists across renders:
```typescript
const debouncedSave = useMemo(
  () => debounce(saveHandler, 500),
  [] // ← empty deps so function never recreated
);
```

**Red flag**: Dependencies that cause debounce to recreate (cancels pending calls).

---

## Fix Template

When all three race conditions are found, apply this fix pattern:

### Issue 1: Missing Fallback When API Returns null Session

```typescript
// BEFORE (broken)
if (data.ok && data.session) {
  applySessionData(data.session);
}
// No fallback if data.session is null!

// AFTER (fixed)
if (data.ok && data.session) {
  applySessionData(data.session);
} else if (data.ok && !data.session) {
  // Supabase has no session (not saved yet, debounce in flight)
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

### Issue 2: Missing Auth Fallback Before Redirect

```typescript
// BEFORE (broken)
if (!loading && !session) {
  router.push('/auth/login');
}

// AFTER (fixed)
if (!loading && !session) {
  const token = localStorage.getItem('wa-sender-access-token');
  if (!token) {
    router.push('/auth/login');
  }
  // If token exists, useAuth is still loading — don't redirect
}
```

### Issue 3: Debounce Recreated on Every Render

```typescript
// BEFORE (broken)
const debouncedSave = useCallback(
  () => debounce(saveHandler, 500),
  [userId, isSaving] // ← recreates when deps change
);

// AFTER (fixed)
const debouncedSave = useMemo(
  () => debounce(saveHandler, 500),
  [] // ← never recreates, pending calls survive re-renders
);
```

---

## Verification After Fix

1. **Manual test**: Upload data → immediately refresh (before 500ms) → verify data loads from localStorage
2. **Check logs**: 
   ```bash
   # Verify both localStorage and Supabase get hit
   curl -s https://topaitoolrank.com/api/sheets/load?userId=test | jq .
   ```
3. **Inspect Network tab**: 
   - POST /api/sheets/save should fire once every 500ms+ (not every keystroke)
   - GET /api/sheets/load should return data or null gracefully
4. **No console errors**: "Cannot read property X of undefined" would indicate state loading order issue

---

## When to Escalate

If after applying fixes users still report data loss:
1. Check if Supabase RLS policy is blocking writes (returns 403 silently)
2. Check if localStorage quota exceeded (throws QuotaExceededError)
3. Check if session data structure changed (JSON parse fails, caught but data lost)
4. Verify debounce callback captures correct userId (might be null if called before session loads)

---

## Related Patterns

- **CSS Variable Enforcement** — find undefined vars that break styling silently
- **Icon Mapping** — convert manifest strings to display values
- **Sheet Visibility** — users need to see current state and how to change it

---

## Files This Specialist Modifies

- `app/tools/*/page.tsx` — session load, auth check, debounced save
- `app/api/sheets/load` — API that returns session or null
- `lib/useAuth.ts` — auth hook that loads localStorage

---

## References

- Session persistence guide: `.claude/skills/project/wa-sender-deployment.md`
- Red team validation: `.claude/skills/project/wa-sender-deployment.md` § Red Team Validation for Next.js/Vercel
- Debounce rules: `.claude/rules/project/debounce-server-calls.md`
