---
id: "0034"
type: DISCOVERY
slug: race-conditions-async-state-patterns
date: 2026-05-06T16:30:00Z
---

# Discovery: Race Conditions in Async State Patterns

## What Was Discovered

Three separate race conditions were identified and fixed across WA Sender deployment:

1. **Session Persistence Race** — localStorage (sync) vs Supabase save (async + debounced)
2. **Auth Check Race** — useAuth loading (async) vs redirect check (sync)
3. **Debounce Lifetime Race** — useMemo deps causing debounce to recreate and lose pending calls

All three manifest as "silent data loss" or "state unexpectedly cleared."

## The Pattern

### Root Cause Template

Async operations + human-paced user interactions (refresh, navigation) create windows where **state exists in one place but not another**:

```
Timeline of Session Persistence Race:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
t=0    User uploads file
       ├→ localStorage.setItem()  [SYNC, immediate ✓]
       └→ debounce(saveToSupabase, 500ms) [ASYNC, queued]

t=100  User refreshes page [BEFORE debounce fires]
       ├→ app mounts
       └→ loadSessionFromSupabase()
          ├→ await fetch() returns {ok: true, session: null}
          │  (Supabase doesn't have it yet; debounce still in flight)
          └→ Code skips localStorage fallback
             ✗ Result: "Upload Your Data" (data lost)

t=150  [debounce finally fires, saves to Supabase]
       └→ Too late — user already saw empty state
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Common Characteristics

- **Timing-dependent** — bug only appears under specific user behavior (refresh at exact moment)
- **Silent** — no errors logged; UI just shows wrong state
- **Cross-layer** — involves frontend timing + backend timing + user timing
- **Hard to reproduce** — requires precise timing; works most of the time
- **Hard to debug** — stack traces don't help; need to understand async flow

## Affected Patterns

### Pattern 1: localStorage + Debounced Backend Save

```typescript
// User action: save to localStorage + queue backend save
localStorage.setItem(key, data);  // ✓ immediate
debouncedSave(data);              // queued, fires later

// Page refresh: load from backend, fallback to localStorage
const data = await fetch('/api/load');
if (data.ok && data.session) {      // might be null if debounce in flight
  setState(data.session);            // ✗ sets null if not saved yet
}
```

**Risk**: User refreshes during debounce window (100-500ms).

**Fix**: Add localStorage fallback when API returns success but null data.

### Pattern 2: Auth Hook Loading + Auth Check

```typescript
// useAuth loads from localStorage asynchronously
useEffect(() => {
  const token = localStorage.getItem('token');
  setSession(token);  // ← happens later
}, []);

// Auth check runs immediately
useEffect(() => {
  if (!loading && !session) {
    router.push('/login');  // ✗ redirects before session loads
  }
}, [session, loading]);
```

**Risk**: Redirect runs before useAuth loads from localStorage.

**Fix**: Guard redirect with localStorage fallback check.

### Pattern 3: Debounce Lifetime

```typescript
// Debounce recreated on dependency change
const debouncedSave = useCallback(
  debounce(saveHandler, 500),
  [userId]  // ✗ recreates when userId changes
);

// Pending calls are lost:
// t=0: debouncedSave() is queued
// t=10: userId changes
// → new debounce instance created
// → pending call discarded
```

**Risk**: Dependencies change while debounce call is pending.

**Fix**: Create debounce in useMemo with empty deps (stable closure).

## Guiding Principles for Prevention

### 1. **Synchronous > Asynchronous When Possible**

If user-facing state needs to persist, save to synchronous storage first:
```typescript
localStorage.setItem(key, data);      // ✓ guaranteed immediate
debouncedSaveToBackend(data);         // ✓ fire and forget, UI doesn't depend on it
```

NOT:
```typescript
const saved = await fetch('/api/save');  // ✗ UI waits for async
if (saved.ok) setUI(true);
```

### 2. **Fallback Chains**

State should load from multiple sources in order of reliability:
1. Fast/local source (localStorage, memory)
2. Backend source (API, database)
3. Default/empty (no data)

```typescript
const data = localStorage.getItem(key) 
          || await fetch(`/api/${key}`)  // if local stale
          || DEFAULT_EMPTY;              // if backend down
```

### 3. **Stable Closures Over Dependencies**

When using higher-order functions (debounce, memoize), prefer stable closures over reactive deps:

```typescript
// DO — stable closure, values captured at definition
const memoizedFn = useMemo(
  () => memoize((x) => expensive(x)),
  [] // never changes
);

// DO NOT — recreates when deps change
const memoizedFn = useCallback(
  memoize((x) => expensive(x)),
  [userId] // changes → new memoize → lost cache
);
```

### 4. **Guard Timers Against Unmount**

If using timers/debounces, clean up on unmount to avoid "setState on unmounted component":

```typescript
useEffect(() => {
  const id = setTimeout(() => doSomething(), 500);
  return () => clearTimeout(id);  // cleanup on unmount
}, []);
```

### 5. **Make State Transitions Explicit**

Don't rely on implicit async ordering. Use explicit state for "in-flight":

```typescript
// DO — explicit state machine
const [state, setState] = useState<'idle' | 'loading' | 'loaded' | 'error'>();

// DO NOT — rely on async ordering
const [data, setData] = useState(null);
const [loading, setLoading] = useState(false);
// Hard to reason about: is data stale while loading?
```

## Preventing This Class of Bug

### In Code Review

Look for:
1. async operations without fallback handling
2. timers/debounces recreated with changing deps
3. state loads that don't check multiple sources
4. redirects based on async state before async completes

### In Testing

Test:
1. Rapid user actions (refresh immediately after save)
2. Network delays (add 100-500ms latency to API)
3. Component lifecycle (unmount while async in flight)

### In Monitoring

Log:
1. When fallback was used (localStorage when API returns null)
2. When state was lost (user sees empty after save)
3. When redirect happened unexpectedly (auth race)

---

## Impact on Next Session

If you encounter "silent data loss" or "unexpected redirect":

1. **Suspect async races**: Look for localStorage + debounced save pattern
2. **Check state sources**: Is code checking all sources (localStorage, API, default)?
3. **Check timers**: Are debounces/timeouts created with stable closure?
4. **Check redirects**: Are guards checking both async result + sync source (localStorage)?

**Use artifacts**: Session Persistence Specialist agent + Session Debounce Safety rule have diagnostic procedures.

---

## References

- **0030**: Session persistence bug (specific incident)
- **0031**: Sidebar styling (CSS variables)
- **0032**: Sheet visibility (UI state management)
- **0033**: Codification decision (extracted patterns)

---

**Discovered**: 2026-05-06 16:30 UTC  
**Pattern Class**: Async state management race conditions  
**Frequency**: 3 incidents in single deployment cycle  
**Severity**: P0 (silent data loss)
