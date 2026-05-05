# 52-history-dashboard-wire

**Implements**: specs/wa-sender-history.md § Workflow Integration (message logging in Dashboard), § Message Lifecycle (Send Flow)  
**Depends On**: 50-history-api-build (POST /api/wa-sender/messages must be functional), 12-wa-sender-subroutes (Dashboard send flow exists)  
**Capacity**: ~100 LOC load-bearing logic / 3 invariants (every successful send logs a message, every failed send logs with status "failed" + error_message, retry creates new log not update) / 2 call-graph hops (Dashboard send → POST /api/wa-sender/messages → response) / Wires the send workflow in Dashboard to log every message send (success and failure) to the history API, enabling the Messages tab to show a complete audit trail.  
**Status**: ACTIVE

## Context

The Messages tab (todo 51) shows history from `wa_sender_messages`. But nothing is writing to that table yet. This todo adds the logging call to the Dashboard's send loop: after each send attempt (whether successful or failed), a POST to `/api/wa-sender/messages` records the outcome.

This is the final wire in the WA Sender track. After this todo, the full flow works: Dashboard sends → history logged → Messages tab shows history.

## Scope

**DO:**
- Modify the Dashboard's send function (the loop that processes each recipient):
  - Before send attempt: optionally create a "pending" record (or skip pending and go straight to sent/failed)
  - After successful send (WhatsApp link opened / Gmail compose opened): call `POST /api/wa-sender/messages` with `status: "sent"`, `sent_at: new Date().toISOString()`, recipient info, content (after variable substitution), `template_id` (from context.selectedTemplate), `contact_id` (from context.selectedContacts if the recipient came from saved contacts)
  - After failed send: call `POST /api/wa-sender/messages` with `status: "failed"`, `error_message: error.message`
- Add a "View in History" link in the Dashboard's post-send summary section that navigates to `/tools/wa-sender/messages`
- Ensure logging failure does NOT block or retry the send — a failure to log is non-fatal (show a console warning, not a user-facing error)

**DO NOT:**
- Block the send on logging — fire-and-forget pattern for logging (do not await if it delays UX)
- Update the existing session save (wa_sender_sessions) to include message log IDs — that is a Phase 3 enhancement
- Create message records for test sends or previews — only log on actual send confirmation

## Deliverables

**Modify:**
- `app/tools/wa-sender/page.tsx` (Dashboard) — add POST /api/wa-sender/messages calls in send loop

**Tests:**
- `__tests__/wa-sender-history-dashboard-wire.test.ts`

## Testing

**Unit tests (Tier 1):**
- `test_send_logs_message_as_sent_on_success` — mock successful send; verify `POST /api/wa-sender/messages` called with `status: "sent"`
- `test_send_logs_message_as_failed_on_error` — mock send throwing error; verify POST called with `status: "failed"` and `error_message` set
- `test_send_includes_template_id_when_template_selected` — context has `selectedTemplate: { id: "uuid123" }`; POST body includes `template_id: "uuid123"`
- `test_send_includes_contact_id_when_contact_selected` — recipient came from `selectedContacts`; POST body includes `contact_id`
- `test_logging_failure_does_not_block_next_send` — POST to messages API throws; send loop continues to next recipient without crashing
- `test_send_summary_shows_view_history_link` — after send completes; "View in History" link visible in summary section

**Manual checks:**
- Complete a send in Dashboard (send to 2 test contacts)
- Navigate to Messages tab — verify 2 new entries with status "sent" and correct content
- Force an error on one send (e.g., invalid phone) — navigate to Messages tab; one "failed" entry with error message visible
- Verify "View in History" link in send summary navigates to messages tab

## Implementation Notes

- Fire-and-forget pattern for logging: `createMessage(payload).catch(err => console.warn('Failed to log message:', err))`. Do NOT `await` inside the send loop unless you are willing to accept latency per message.
- For bulk sends (many recipients in a single session), batch the logging calls rather than doing one POST per recipient. If the `POST /api/wa-sender/messages` endpoint only accepts single messages, make multiple calls in parallel: `await Promise.allSettled(recipients.map(r => logMessage(r)))`. `allSettled` ensures all log attempts complete (or fail) without blocking on individual failures.
- The `sent_at` timestamp for bulk sends: per spec, "Bulk sends log all messages in the same second (sent_at is the same for all)." Use `const sentAt = new Date().toISOString()` before the send loop and use that value for all recipients in the batch.
- Variable substitution must happen BEFORE logging: the logged `content` field should contain the final sent message (with variables substituted), not the template with `{name}` placeholders. This is important for the audit trail to be useful.
- `contact_id` mapping: when building the send list from `context.selectedContacts`, include the `id` field from the contact object. When building from file upload (no saved contacts), `contact_id` is null.
