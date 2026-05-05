# 51-history-page-build

**Implements**: specs/wa-sender-history.md § UI: Send History Page  
**Depends On**: 50-history-api-build (API must be functional), 12-wa-sender-subroutes (messages/page.tsx exists as placeholder)  
**Capacity**: ~280 LOC load-bearing logic / 5 invariants (analytics cards calculated from API stats field, row click expands content, filter controls re-fetch from API, CSV export triggers download, retry creates new message log entry) / 3 call-graph hops (page → fetch messages+stats → display → modal / filter re-fetch) / Builds the full message history page: analytics summary cards, filtered paginated table, row expand for message detail, CSV export, and retry flow for failed messages.  
**Status**: ACTIVE

## Context

The messages sub-route currently shows "coming soon" from todo 12. This todo replaces it with the full history and analytics view. After this todo, users can see all their sent messages, filter by status/channel/date, and retry failed ones.

This is the highest-complexity UI page in Phase 2 due to: multiple filter dimensions, inline analytics, row expansion, and retry flow.

## Scope

**DO:**
- Replace `app/tools/wa-sender/messages/page.tsx` with the full history page
- **Analytics summary cards (top of page):**
  - Total sent (status "sent" + "read")
  - Failed count + failure rate %
  - Read count
  - (Optional) Average message length if API provides it
  - Cards read from `response.stats` (already computed server-side)
- **Filter controls:**
  - Status dropdown (All / Sent / Failed / Pending / Read)
  - Channel dropdown (All / WhatsApp / Email)
  - Date range picker (start_date, end_date)
  - Template filter dropdown (list from `GET /api/wa-sender/templates`)
  - Search bar (searches recipient name/phone/email)
  - Each filter change re-fetches from `GET /api/wa-sender/messages` with updated params
- **Message table:**
  - Columns: recipient (name or phone), channel badge, status badge, sent_at, actions
  - Sort by: sent_at (default DESC), status, channel
  - Pagination: 50 per page
  - Row click: expand/collapse inline to show full message content
  - Row with status "failed": shows "Retry" button
- **Message detail expand:**
  - Full message content
  - Recipient details (contact name if available)
  - Template name (if template_id set)
  - Timestamps: sent_at, read_at (if read)
  - Error message (if failed)
- **Export button:**
  - "Export CSV" calls `GET /api/wa-sender/messages?[current_filters]&format=csv` — but the current messages API doesn't have a CSV format option. Add this parameter to the API (or note the gap and add it).
  - Response triggers file download
- **Retry failed messages:**
  - "Retry" button on failed message rows
  - Opens a modal showing the recipient and original message content
  - "Resend" button: attempts resend (opens WhatsApp/Gmail link)
  - After user confirms send: calls `POST /api/wa-sender/messages` to log a new entry (status "sent")
  - Original message entry stays as "failed" (per spec: retry creates new log entry, not update)

**DO NOT:**
- Modify the original "failed" message record on retry (per spec)
- Add real-time updates via WebSocket (Phase 3)
- Show messages from other users (RLS handles this)

## Deliverables

**Modify:**
- `app/tools/wa-sender/messages/page.tsx` — full history page (replace "coming soon")

**Tests:**
- `__tests__/wa-sender-history-page.test.ts`

## Testing

**Unit tests (Tier 1):**
- `test_analytics_cards_show_correct_counts` — mock API with stats `{ sent_count: 10, failed_count: 2, pending_count: 0, read_count: 3 }`; cards show "10 Sent", "2 Failed", "3 Read"
- `test_failure_rate_calculated_correctly` — 2 failed out of 12 total (sent+failed+read); failure rate shows "16.7%"
- `test_message_table_renders_rows` — mock API returning 3 messages; 3 rows visible
- `test_status_filter_triggers_refetch` — change status filter to "Failed"; new API call with `?status=failed`
- `test_date_range_filter_triggers_refetch` — set date range; API called with `start_date` and `end_date` params
- `test_row_click_expands_content` — click a row; message content visible below it
- `test_row_click_again_collapses_content` — click expanded row again; content hidden
- `test_failed_row_shows_retry_button` — row with status "failed"; "Retry" button visible
- `test_retry_creates_new_message_log` — click Retry; complete retry flow; `POST /api/wa-sender/messages` called with same content, new sent_at
- `test_export_csv_triggers_download` — click Export CSV; `GET /api/wa-sender/messages` with current filters called

**Manual checks:**
- Open messages page — analytics cards visible with correct counts
- Filter by "Failed" — only failed messages shown; stats cards still show global counts
- Click a row — message content expands inline
- Click "Retry" on a failed message — retry modal appears; confirm resend; new row appears in list

## Implementation Notes

- Analytics cards source: `response.stats` from the API. These are global stats (not filter-scoped). Display them at the top of the page above the filter controls to avoid confusion.
- Failure rate: `(failed_count / (sent_count + failed_count + read_count + pending_count)) * 100`. Handle division by zero (0 total → "0%").
- Row expansion: use `useState<string | null>` for the expanded row ID. On click: if same ID, collapse (set null); if different ID, expand. Only one row expanded at a time.
- Template dropdown in filters: fetch from `GET /api/wa-sender/templates` once on page load. Show "All Templates" as the default option.
- Retry modal: show the recipient contact (name + phone/email) and the original message content. The user sees what they're retrying. "Resend" generates a new WhatsApp link or Gmail compose URL, opens it, then logs the new message. The logging call (`POST /api/wa-sender/messages`) must happen after the user confirms — not before.
- Export CSV for filtered results: the messages API needs a `format=csv` parameter. If this isn't in the current API (it's not in the spec's API definition), add it to the API in this todo and note the spec extension.
