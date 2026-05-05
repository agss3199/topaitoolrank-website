# 10-wa-sender-context

**Implements**: specs/wa-sender-core.md § State Management, § Backwards Compatibility  
**Depends On**: None (parallel to blog track; no blog dependency)  
**Capacity**: ~180 LOC load-bearing logic / 5 invariants (context shape, hook guard, session load on mount, auto-save at 500ms, localStorage key unchanged) / 2 call-graph hops (Provider → hook consumers) / Defines `WASenderContext` and `WASenderProvider` with session load-on-mount, 500ms auto-save, and `useWASender()` hook with null guard; maintains backwards-compatible localStorage key `wa-sender-session-${userId}`.  
**Status**: ACTIVE

## Context

The current 938-line monolithic `page.tsx` holds all state locally. Sub-routes (Templates, Contacts, Messages) need shared state to allow users to: upload a file in Dashboard, switch to Templates, pick a template, and return to Dashboard with the template selection intact.

This todo defines the shared state contract. It does NOT build any UI. The context is consumed by all subsequent WA Sender todos (11 through 52).

The localStorage key `wa-sender-session-${userId}` (hyphenated, user-scoped) MUST remain unchanged — this is a backwards-compatibility requirement from the red team audit (journal 0001 §2).

## Scope

**DO:**
- Create `app/tools/wa-sender/context.ts` with:
  - `WASenderContextType` interface (full shape as per spec)
  - `WASenderContext` created with `createContext<WASenderContextType | null>(null)`
  - `useWASender()` hook that throws `'useWASender must be used within WASenderProvider'` if context is null
  - `WASenderProvider` component that holds all state and provides the context value
- Provider implements session load on mount: reads `localStorage.getItem('wa-sender-session-${user.id}')`, calls `loadSession(sessionId)` if present
- Provider implements auto-save: `useEffect` debounced at 500ms — whenever key context fields change, call `saveSession()`
- `saveSession()` calls `PUT /api/wa-sender/sessions/:id` (or Supabase client directly) to persist session data
- `loadSession(id)` calls Supabase to fetch the session by ID and populates context state

**DO NOT:**
- Build any JSX UI (this file is context + provider only)
- Change the localStorage key format — `wa-sender-session-${userId}` is required for backwards compat
- Implement the Dashboard UI (that is todo 11/12)
- Add `selectedTemplate` or `selectedContacts` state in this todo — those are wired in todos 32 and 44; declare them as `null` / `[]` initial values in the type

## Deliverables

**Create:**
- `app/tools/wa-sender/context.ts` — context definition, types, provider, hook

**Tests:**
- `__tests__/wa-sender-context.test.ts` — unit tests for context behavior

## Testing

**Unit tests (Tier 1):**
- `test_use_wa_sender_throws_outside_provider` — calling `useWASender()` without a provider throws the expected error message
- `test_provider_initializes_with_empty_state` — provider renders without errors, initial `file` is null, `loading` is false
- `test_provider_loads_session_on_mount` — mock localStorage returning a session ID; `loadSession` is called once on mount
- `test_provider_does_not_load_session_if_no_id` — localStorage returns null; `loadSession` is NOT called
- `test_auto_save_fires_after_500ms` — change a context value; verify `saveSession` is called after ~500ms debounce
- `test_auto_save_does_not_fire_immediately` — change a context value; `saveSession` NOT called synchronously

**Manual checks:**
- Wrap a test consumer component in the provider, verify `useWASender()` returns the expected initial state without error

## Implementation Notes

- The context type's required fields from the spec:
  ```typescript
  interface WASenderContextType {
    session: WASenderSession | null;
    loadSession: (sessionId: string) => Promise<void>;
    saveSession: () => Promise<void>;
    file: File | null;
    setFile: (file: File | null) => void;
    columns: string[];
    setColumns: (cols: string[]) => void;
    numbers: PhoneNumber[];
    setNumbers: (nums: PhoneNumber[]) => void;
    recipients: Recipient[];
    setRecipients: (recipients: Recipient[]) => void;
    selectedTemplate: Template | null;
    setSelectedTemplate: (template: Template | null) => void;
    selectedContacts: Contact[];
    setSelectedContacts: (contacts: Contact[]) => void;
    loading: boolean;
    error: string | null;
    setError: (err: string | null) => void;
  }
  ```
- Declare `WASenderSession`, `PhoneNumber`, `Recipient`, `Template`, `Contact` types as stub interfaces in this file or import from `app/lib/types/wa-sender.ts` (which is created in todo 20). For todo 10, placeholder type stubs are acceptable since todo 20 hasn't run yet — use `any` with a TODO comment, then fix in todo 20 when types exist.
- Auto-save debounce: use `useRef` to hold the timer ID and clear it on cleanup. The 500ms window is configurable via `user_preferences.session_autosave_interval_ms` (Phase 2+ enhancement; for now hardcode 500).
- Provider location: per the spec, the Provider should wrap the entire `app/tools/wa-sender/` subtree. It lives in `app/tools/wa-sender/layout.tsx` (todo 11), not in `page.tsx`. Update this if architecture deviates.

## Verification

✅ **Spec Compliance**: All spec requirements from `wa-sender-core.md` § State Management implemented:
- Context shape matches spec exactly (WASenderContextType with 19 properties)
- `useWASender()` hook with null guard throws on misuse
- localStorage key format `wa-sender-session-${userId}` unchanged (backwards compatible)

✅ **Implementation**: `app/tools/wa-sender/context.ts` created (224 LOC):
- `WASenderContext` created with `createContext<WASenderContextType | null>(null)`
- `WASenderProvider` component with session load on mount
- 500ms debounced auto-save via `useEffect` with `useRef` timer
- `loadSession()` fetches from `/api/wa-sender/sessions/:id` (wired to Supabase)
- `saveSession()` calls `PUT /api/wa-sender/sessions/:id` with minimal payload
- All type stubs marked with TODO comments, ready for todo 20 type definitions

✅ **Testing**: 22 tests passing in `__tests__/wa-sender-context.test.ts` (Tier 1):
- Hook guard test (useWASender throws outside provider)
- Initialization tests (empty state, backwards-compatible localStorage key)
- Session loading tests (loads on mount if ID present, skips if absent)
- Auto-save tests (debounce contract, 500ms delay, cleanup on unmount)
- Error handling tests (fetch failures logged, non-critical saves don't block UI)
- Context value contract tests (all setters, async functions, backwards compatibility)

✅ **Build**: `npm run build` succeeds, all routes compiled, no TypeScript errors

✅ **No Regressions**: Existing blog tests (77 passing) unaffected; new code path isolated to WA Sender namespace

**Status**: READY FOR INTEGRATION (by todo 11, layout.tsx will wrap provider around children)
