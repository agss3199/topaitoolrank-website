# 44-contacts-dashboard-wire

**Implements**: specs/wa-sender-contacts.md § Contact Selection in Dashboard  
**Depends On**: 41-contacts-list-page (contacts API functional), 12-wa-sender-subroutes (Dashboard uses context), 10-wa-sender-context (selectedContacts state declared)  
**Capacity**: ~150 LOC load-bearing logic / 4 invariants (contact selection modal multi-select, selected contacts populate Dashboard recipient list, selectedContacts stored in context, "Or import new contacts" link works) / 3 call-graph hops (Dashboard button → modal → fetch contacts → select → context update → recipient list update) / Wires the contact selection modal into the Dashboard: "Select Contacts" button, paginated modal list with checkboxes, "Use Selected" populates the recipient send list.  
**Status**: ACTIVE

## Context

Contacts management (todo 41) allows users to manage their persistent contact library. This todo connects that library to the send workflow: the user is in Dashboard, clicks "Select Contacts," picks contacts from a modal, and the selected contacts populate the recipient list (replacing or supplementing the file-uploaded recipients).

Parallel to how todo 32 wired Templates to Dashboard, this todo wires Contacts to Dashboard.

## Scope

**DO:**
- Add "Select Contacts" button to the Dashboard recipient section (alongside the existing file upload)
- Create `app/components/ContactModal.tsx` — paginated contact selector with:
  - List view: name, phone, email, company per row
  - Checkboxes for multi-select
  - Pagination (50 per page) with "Load more" or page controls
  - Search bar (calls `GET /api/wa-sender/contacts?search=query` — server-side for the modal, not client-side)
  - "Use Selected" button: closes modal and populates Dashboard
  - "Or import new contacts" link: navigates to `/tools/wa-sender/contacts/import` (preserves context)
  - Selected count badge: "3 contacts selected"
- On "Use Selected": set `context.selectedContacts` to the selected contacts array; populate the Dashboard's recipient list with phone numbers from those contacts
- Show count badge on the Dashboard button: "Select Contacts (3)" when contacts are selected
- "Clear contacts" button on the badge to reset `selectedContacts` and recipient list

**DO NOT:**
- Re-implement the full contacts list page — the modal is a simplified view for selection only
- Replace file-upload recipients with contacts — the user should be able to combine (or we show a choice; per spec: "Use Selected" populates the send list, implying replace). Follow spec: "Use Selected" populates Dashboard send workflow.
- Build or render custom_fields in the modal — show name, phone, email, company only

## Deliverables

**Create:**
- `app/components/ContactModal.tsx` — paginated contact selector modal

**Modify:**
- `app/tools/wa-sender/page.tsx` (Dashboard) — add "Select Contacts" button, selected contacts badge, wire to context
- `app/tools/wa-sender/context.ts` — ensure `selectedContacts` and `setSelectedContacts` are properly typed (was placeholder in todo 10)

**Tests:**
- `__tests__/wa-sender-contacts-dashboard-wire.test.ts`

## Testing

**Unit tests (Tier 1):**
- `test_contact_modal_opens_on_button_click` — click "Select Contacts"; modal appears
- `test_contact_modal_shows_contact_list` — mock API returning 3 contacts; all visible with checkboxes
- `test_contact_selection_checkboxes_work` — check 2 contacts; "2 contacts selected" badge visible
- `test_use_selected_populates_dashboard` — select 2 contacts; click "Use Selected"; recipient list in Dashboard contains those 2 contacts' phone numbers
- `test_use_selected_stores_in_context` — after "Use Selected"; `context.selectedContacts` contains the 2 contacts
- `test_badge_count_updates_on_selection` — select 3 contacts; "Select Contacts (3)" shown on Dashboard button
- `test_clear_contacts_resets_selection` — click "Clear contacts"; badge disappears; `context.selectedContacts` is empty array; recipient list cleared
- `test_import_link_navigates_correctly` — click "Or import new contacts" link; navigates to import page

**Manual checks:**
- Click "Select Contacts" in Dashboard — modal with contact list appears
- Search for "Alice" — only Alice's contacts shown
- Check 3 contacts, click "Use Selected" — modal closes; recipient list now shows 3 contacts
- Badge on button shows "(3)"
- Clear contacts — recipient list clears

## Implementation Notes

- `ContactModal` uses server-side search (unlike the contacts list page which uses client-side). This is because the modal operates on the full contact library (potentially thousands of contacts) whereas the list page only shows the current fetched page. The modal calls `GET /api/wa-sender/contacts?search=query&limit=50` on each debounced query change.
- The modal is lazy-loaded (same pattern as TemplateModal in todo 32). Use `React.lazy()` or `dynamic()`.
- When user selects contacts in the modal, those contacts are collected in local modal state. Only when "Use Selected" is clicked does the selection propagate to the context. "Cancel" discards the modal's local selection.
- "Populate Dashboard recipient list": the Dashboard's recipient list accepts entries with at minimum a phone number. Set `recipients` in context to the contact objects (they have phone). Existing recipients from file upload are replaced — this matches the spec's "Use Selected button populates Dashboard send workflow."
- Multi-select state: maintain a `Set<string>` of selected contact IDs in the modal's local state. On checkbox toggle, add/remove from the set. On "Use Selected," convert to array and call `setSelectedContacts`.
