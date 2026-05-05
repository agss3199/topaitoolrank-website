# 13-wa-sender-session-persistence

**Implements**: specs/wa-sender-core.md § Backwards Compatibility, § Send Workflow (session persistence aspects)  
**Depends On**: 12-wa-sender-subroutes (Dashboard must be consuming context before persistence can be verified end-to-end)  
**Capacity**: ~120 LOC load-bearing logic / 4 invariants (existing sessions load on first visit, localStorage key unchanged, auto-save 500ms, session state includes file metadata + columns + normalized numbers) / 3 call-graph hops (mount → localStorage read → loadSession → Supabase fetch → populate context) / Validates that session load-on-mount correctly restores Dashboard state from a Supabase `wa_sender_sessions` record, and that auto-save persists context changes.  
**Status**: ACTIVE

## Context

Phase 1 users have active sessions stored in Supabase `wa_sender_sessions` with the localStorage key `wa-sender-session-${userId}`. After the sub-route refactor (todo 12), those sessions must still load seamlessly. A user returning to the tool after the upgrade must see their previous file and state without re-uploading.

The context's auto-save behavior was introduced in todo 10, but this todo validates the full end-to-end round-trip: load → modify → auto-save → reload → load again.

## Scope

**DO:**
- Verify that `loadSession()` in the context provider correctly reads from `wa_sender_sessions` and populates `file` metadata, `columns`, `numbers`, `recipients`, `message_content`
- Verify that `saveSession()` correctly writes the updated context back to `wa_sender_sessions` via `UPDATE` (not INSERT — sessions are upserted in Phase 1)
- Write the integration test that:
  1. Seeds a Supabase test session with known values
  2. Mounts the WASenderProvider
  3. Verifies that the context reflects the seeded values after mount
- Verify the localStorage key format in the provider matches `wa-sender-session-${userId}` exactly
- Add a session cleanup hook: on explicit logout or tool unmount, clear the context state (but do NOT delete the Supabase session record — that is user data)

**DO NOT:**
- Change the localStorage key format
- Delete existing session records on refactor
- Implement new session fields beyond what Phase 1 already persists — only ensure existing fields round-trip correctly
- Block the Dashboard render while the session is loading — show a loading spinner but allow interaction to begin

## Deliverables

**Modify:**
- `app/tools/wa-sender/context.ts` — ensure `loadSession` and `saveSession` are fully implemented (may have been stubs in todo 10)

**Tests:**
- `__tests__/wa-sender-session-persistence.test.ts` — integration and unit tests for session round-trip

## Testing

**Unit tests (Tier 1):**
- `test_load_session_populates_columns` — mock Supabase returning `{ columns: ['Name', 'Phone'] }`; after `loadSession`, context `columns` equals `['Name', 'Phone']`
- `test_load_session_populates_message_content` — mock Supabase returning `{ message_content: 'Hello {name}' }`; `message_content` in context is set
- `test_save_session_calls_supabase_update` — modify context; after 500ms debounce; verify Supabase `.update()` was called with the correct session ID
- `test_load_session_handles_not_found` — session ID in localStorage but no Supabase record; `error` in context is set to a user-friendly message; Dashboard still renders
- `test_localStorage_key_includes_user_id` — verify the key written to localStorage is `wa-sender-session-${user.id}` (not `wa_sender_session_id` or any other format)

**Integration check (Tier 2 — requires Supabase test environment):**
- `test_session_round_trip_persists_and_restores` — create a session record, read it via loadSession, modify context fields, wait for auto-save to fire, re-read from Supabase, verify stored values match context

**Manual checks:**
- Open WA Sender fresh (no existing session) — no errors; Dashboard usable
- Upload a file, wait 600ms (auto-save fires), close browser tab, reopen — verify file metadata and columns are restored
- Verify `localStorage.getItem('wa-sender-session-' + userId)` contains the session ID (open DevTools Application tab)

## Implementation Notes

- The `File` object from the browser cannot be serialized to JSON or stored in Supabase. Session persistence must store only file metadata (name, size, type) plus the parsed data (the actual cell values). On reload, the File input will show "no file selected" but the parsed data (columns, numbers) will be restored from the session. This is the expected behavior.
- `loadSession` should set `loading: true` before the Supabase call and `loading: false` in both success and error paths.
- The auto-save timer should be reset whenever `loading` is `true` — do not save during an in-progress load.
- If the session record in Supabase was deleted externally (e.g., user cleared data in another tab), `loadSession` receives null/404. Clear the localStorage key in this case to avoid infinite retry on next mount.
