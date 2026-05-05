# 50-history-api-build

**Implements**: specs/wa-sender-history.md § API Endpoints, § Analytics Calculations, § Message Lifecycle  
**Depends On**: 22-api-routes-stubs (route scaffolding), 20-database-migrations (tables), 21-database-rls-verification (RLS confirmed)  
**Capacity**: ~200 LOC load-bearing logic / 5 invariants (stats calculated server-side in GET response, filter by status/channel/date range/template, POST accepts contact_id or recipient_phone/email, PUT only allows status/read_at updates, auth on all routes) / 3 call-graph hops (route → validate → DB helper → Supabase) / Implements the message history API with pagination, multi-dimensional filtering, server-side stats calculation, message creation (log), and status update.  
**Status**: ACTIVE

## Context

Message history is the audit trail of all sends. The API must support the analytics dashboard on the history page (todo 51) by returning aggregate stats alongside paginated message rows in a single response. This avoids a separate stats endpoint and a second round-trip.

The POST endpoint is called by the Dashboard during each send (todo 52). The PUT endpoint allows marking messages as "read."

## Scope

**DO:**
- Implement `GET /api/wa-sender/messages` — paginated list with filters:
  - `page`, `limit` (default 50, max 500)
  - `status` filter: `sent | failed | pending | read`
  - `channel` filter: `whatsapp | email`
  - `start_date`, `end_date` (ISO timestamp range on `sent_at`)
  - `template_id` filter
  - `search` (case-insensitive match on recipient_phone, recipient_email; join on contacts for name)
  - Sort: `sent_at DESC` (default)
  - Response includes `stats` object: `{ sent_count, failed_count, pending_count, read_count }` calculated over ALL user messages (not just the current page)
- Implement `POST /api/wa-sender/messages` — log a message send; validate that either `contact_id` or at least one of `recipient_phone`/`recipient_email` is provided; validate `channel` and `status` against allowed values; insert and return 201
- Implement `GET /api/wa-sender/messages/:id` — fetch single message; include contact name if `contact_id` is set (JOIN or separate lookup)
- Implement `PUT /api/wa-sender/messages/:id` — only allow updating `status` and `read_at`; if status → "read", require `read_at`; return 200 or 404
- Implement all message DB helper functions in `app/lib/db/wa-sender.ts`

**DO NOT:**
- Implement DELETE for messages (not in spec — messages are an audit trail)
- Implement real-time status webhooks (Phase 3)
- Add server-sent events for live updates (Phase 3)
- Calculate analytics with a separate query — combine with the paginated list response

## Deliverables

**Modify:**
- `app/api/wa-sender/messages/route.ts` — full GET (list + stats), POST implementation
- `app/api/wa-sender/messages/[id]/route.ts` — full GET, PUT implementation
- `app/lib/db/wa-sender.ts` — implement message helper functions

**Tests:**
- `__tests__/wa-sender-history-api.test.ts`

## Testing

**Unit tests (Tier 1):**
- `test_messages_list_includes_stats_in_response` — mock DB returning mix of sent/failed messages; response has `stats.sent_count` and `stats.failed_count` with correct values
- `test_messages_filter_by_status` — GET with `?status=failed`; only failed messages returned
- `test_messages_filter_by_channel` — GET with `?channel=whatsapp`; only whatsapp messages returned
- `test_messages_filter_by_date_range` — GET with `start_date` and `end_date`; only messages within range returned
- `test_messages_search_by_phone` — GET with `?search=+1555`; matching messages returned
- `test_create_message_returns_201` — POST with valid body; returns 201 with `id`, `status`, `sent_at`
- `test_create_message_requires_contact_or_recipient` — POST with neither `contact_id` nor `recipient_phone` nor `recipient_email`; returns 400
- `test_create_message_validates_channel` — POST with `channel: "sms"`; returns 400 (not in allowed values)
- `test_create_message_validates_status` — POST with `status: "queued"`; returns 400
- `test_update_message_allows_status_change` — PUT with `{ status: "read", read_at: "..." }`; returns 200
- `test_update_message_rejects_content_change` — PUT with `{ content: "new content" }`; returns 400 (content not updatable)
- `test_update_message_requires_read_at_for_read_status` — PUT with `{ status: "read" }` (no read_at); returns 400

**Integration check (Tier 2):**
- `test_message_history_round_trip` — POST 3 messages; GET list; verify all 3 appear with correct stats

## Implementation Notes

- Stats calculation: use Supabase's aggregate queries. Run a COUNT(*) GROUP BY status query on `wa_sender_messages WHERE user_id = ?` to get all status counts in one DB call. Then build the `stats` object from the result.
- The `search` parameter searches across `recipient_phone`, `recipient_email`, and (if contact_id is set) the associated contact's name. Supabase doesn't do joins in the client library easily — use a Postgres function or a raw query via `supabase.rpc()` for the search+join case. Alternatively: search only phone/email server-side; note in the UI that name search requires contact selection (simpler approach if join is complex).
- Status transition rules: `pending → sent | failed`, `sent → read`. Only allow transitions that make sense. `read` cannot transition back to `sent`.
- Date range filtering: `sent_at >= start_date AND sent_at <= end_date`. Convert FE timezone to UTC server-side using `new Date(start_date).toISOString()`.
- The `stats` in the response cover ALL user messages, not just the filtered subset. This gives the analytics cards a global picture while the table shows filtered results. This is consistent with the spec: "Analytics summary (top of page)" shows overall metrics, not filter-specific.
