---
name: Session Debounce Safety
description: Prevent data loss in localStorage + debounced-save patterns
type: rule
paths:
  - "app/tools/*/page.tsx"
  - "app/api/sheets/*"
  - "lib/*.ts"
---

# Session Debounce Safety Rules

When using debounced auto-save with localStorage fallback (localStorage sync, backend async), race conditions occur between user refresh timing and debounce completion.

## MUST Rules

### 1. Three-Tier Fallback on Session Load

When loading session at app mount, handle all three cases:

```typescript
const loadSessionFromSupabase = async () => {
  const localStorageKey = `wa-sender-session-${userId}`;

  try {
    const res = await fetch(`/api/sheets/load?userId=${userId}`);
    const data = await res.json();

    // Tier 1: Supabase has fresh data
    if (data.ok && data.session) {
      applySessionData(data.session);
      localStorage.setItem(localStorageKey, JSON.stringify(data.session));
      return;
    }
    
    // Tier 2: Supabase returned success but no data (debounce in flight)
    if (data.ok && !data.session) {
      const cached = localStorage.getItem(localStorageKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          applySessionData(parsed);
        } catch (e) {
          console.warn('Failed to parse cached session:', e);
        }
      }
      return;
    }
    
    // Tier 3: API error or network failure
  } catch (err) {
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
};
```

**Why**: Supabase may return success (`ok: true`) before the debounced write completes, leaving `session: null`. Code must not interpret null as "no data" but as "not saved yet."

### 2. Auth Check Before useAuth Finishes

When auth hook loads localStorage asynchronously, guard redirect with localStorage fallback:

```typescript
useEffect(() => {
  if (!loading && !session) {
    // Check localStorage as fallback (useAuth might still be loading)
    const token = localStorage.getItem('wa-sender-access-token');
    if (!token) {
      router.push('/auth/login');
    }
    // If token exists, useAuth is still loading — don't redirect yet
  }
}, [session, loading, router]);
```

**Why**: `useAuth` loads localStorage in a separate useEffect. The auth-check useEffect may run before localStorage is loaded, causing premature redirect.

### 3. Debounce Created in useMemo with Empty Dependencies

Debounced save MUST be stable across renders to avoid losing pending calls:

```typescript
// DO — stable debounce across renders
const debouncedSave = useMemo(
  () => debounce(saveHandler, 500),
  [] // empty deps — function never recreated
);

// DO NOT — debounce recreated, pending calls cancelled
const debouncedSave = useCallback(
  debounce(saveHandler, 500),
  [userId, sessionState] // recreates when deps change
);
```

**Why**: If debounce is recreated on render, pending calls (waiting to fire after delay) are discarded, and the save never happens.

### 4. Debounce Delay Must Be Justified

Every debounced call MUST have a comment or const name explaining the delay:

```typescript
// DO — justified delay
const AUTOSAVE_DEBOUNCE_MS = 500; // Responsive feel (save fires after user stops typing)

const debouncedSave = useMemo(
  () => debounce(saveHandler, AUTOSAVE_DEBOUNCE_MS),
  []
);

// DO NOT — magic number
const debouncedSave = useMemo(
  () => debounce(saveHandler, 500),  // why 500? guessing?
  []
);
```

**Why**: Future refactors must understand the UX tradeoff (responsiveness vs. server load).

## MUST NOT

- **Skip localStorage fallback** when API returns `{ok: true, session: null}`

**Why**: That case is the entire race condition — the debounce is in flight.

- **Debounce in useCallback with dependencies** that cause re-creation

**Why**: Pending calls are lost when debounce recreates.

- **Redirect on !session before checking localStorage**

**Why**: useAuth might still be loading from localStorage.

## Verification Checklist

Before merging session-related changes:

1. **Manual test**: Upload data → wait 100ms (before 500ms debounce) → refresh → data loads ✓
2. **Code review**: All three fallback tiers exist in load logic ✓
3. **Grep check**: `grep -A 20 "if (data.ok && !data.session)"` returns your fallback code ✓
4. **Dependencies**: Debounce created in useMemo with `[]` dependencies ✓
5. **Comments**: Debounce delay has a justification comment ✓

## Related Rules

- `.claude/rules/project/debounce-server-calls.md` — debounce patterns
- `.claude/skills/project/wa-sender-deployment.md` — full session persistence guide
- `.claude/agents/project/session-persistence-specialist.md` — diagnosis and fixes

## Origin

Incident (2026-05-06): Users reported "data lost after upload and refresh." Root cause: debounce in flight when user refreshed → API returned success but null data → code skipped localStorage → data lost. Fixed by adding three-tier fallback in session load logic. All subsequent sessions must apply this pattern when using debounced saves with localStorage fallback.
