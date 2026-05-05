# 41-contacts-list-page

**Implements**: specs/wa-sender-contacts.md § UI: Contacts Management Page (List, Export, View/Edit)  
**Depends On**: 40-contacts-api-build (contacts API must be functional), 12-wa-sender-subroutes (contacts route exists as placeholder — BUT note: the spec does not list contacts as a top-level nav route; contacts is accessed within Dashboard; verify routing architecture before implementing)  
**Capacity**: ~250 LOC load-bearing logic / 4 invariants (pagination at 50/page, search is client-side for snappy UX, export triggers file download, view modal shows full contact) / 3 call-graph hops (page → fetch contacts → display → modal) / Builds the contacts management page with paginated table, client-side search, export button, and view/delete per-row actions.  
**Status**: ACTIVE

## Context

Per the spec: "Contact list search is client-side filtering (not server-side query) for snappy UX." This means the page fetches all contacts (up to the pagination limit) and filters them in the browser. The server-side search parameter from the API is available but the spec explicitly delegates search to the client for responsiveness.

Note on routing: the spec says contacts is accessed within Dashboard for recipient selection, not as a top-level nav item. However, the architecture (spec wa-sender-core.md) shows `contacts/page.tsx` as a sub-route. This page exists as a dedicated management surface, just not in the top-level nav. It is reachable by a link from the Dashboard's "Manage Contacts" button.

## Scope

**DO:**
- Create `app/tools/wa-sender/contacts/page.tsx` — the contact management page (full list, search, export, view/delete)
- **List view:**
  - Paginated table (50 contacts per page) showing: name, phone, email, company, created_at, actions
  - "Import Contacts" button — links to `/tools/wa-sender/contacts/import`
  - "Export" dropdown — CSV or Excel format options
  - Sort by: name, phone, company, created_at
- **Client-side search:**
  - Search bar above table
  - Filters the already-fetched page of contacts by name, phone, email, company (case-insensitive substring match)
  - Does NOT re-fetch from API on each keystroke
  - Shows "No contacts match your search" when empty
- **Export:**
  - "Export CSV" calls `GET /api/wa-sender/contacts/export?format=csv`; triggers browser download
  - "Export Excel" calls same with `?format=xlsx`
- **View modal:**
  - Click row to open contact detail modal
  - Shows all fields including custom_fields
  - Delete button with confirmation
  - Close button

**DO NOT:**
- Implement the import flow (todo 42)
- Implement the contact selection for Dashboard (todo 44)
- Add inline edit within the list — view modal shows data only; full edit is out of Phase 2 MVP scope

## Deliverables

**Create:**
- `app/tools/wa-sender/contacts/page.tsx` — full contacts management page

**Tests:**
- `__tests__/wa-sender-contacts-list-page.test.ts`

## Testing

**Unit tests (Tier 1):**
- `test_contacts_list_renders_paginated_table` — mock API returning 50 contacts; all visible in table
- `test_contacts_list_shows_empty_state` — mock API returning 0 contacts; "No contacts yet" message shown
- `test_client_search_filters_by_name` — 50 contacts loaded; type "Alice" in search; only matching contacts visible (no new API call)
- `test_client_search_filters_by_phone` — type "+1555" in search; contacts with matching phone visible
- `test_client_search_no_match_shows_empty_message` — type "zzzzzz"; "No contacts match your search" shown
- `test_export_csv_triggers_download` — click "Export CSV"; verify `GET /api/wa-sender/contacts/export?format=csv` called
- `test_view_modal_opens_on_row_click` — click a contact row; modal appears with contact's name
- `test_delete_contact_removes_from_list` — open view modal; click delete; confirm; contact disappears from table

**Manual checks:**
- Visit `/tools/wa-sender/contacts` — contacts table visible
- Search for a contact name — instant filtering without page reload
- Click "Export CSV" — CSV file downloads
- Click a row — modal with full contact details opens
- Delete a contact — removed from list, success toast shown

## Implementation Notes

- Client-side search: maintain a `filteredContacts` state that is derived from the full `contacts` array (the current page). Update `filteredContacts` on every change to the search query. The search only operates on the current page of data — it does NOT search across all pages. This is the spec's explicit choice ("client-side filtering for snappy UX").
- Export trigger: Use a hidden `<a>` element or `window.open()` with the export API URL. The API returns the file with `Content-Disposition: attachment` so the browser will download it.
- Custom fields display in view modal: iterate `Object.entries(contact.custom_fields || {})` and render as key-value pairs. Use a two-column layout for clarity.
- Pagination: fetch next page from API when user clicks "Next page." The client-side search applies to the current page only — this is the trade-off for snappy UX (per spec).
- The "Import Contacts" link navigates to `app/tools/wa-sender/contacts/import/page.tsx` (todo 42). Both pages are under the same layout.tsx so the ToolShell and context are preserved.
