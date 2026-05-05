# 42-contacts-import-page

**Implements**: specs/wa-sender-contacts.md § UI: Contacts Management Page (Import sub-page)  
**Depends On**: 40-contacts-api-build (import API must be functional), 41-contacts-list-page (import page is a sub-route under contacts)  
**Capacity**: ~220 LOC load-bearing logic / 5 invariants (file upload, column mapping UI auto-detect + manual override, deduplication toggle, progress indicator, error summary after import) / 3 call-graph hops (page → file upload → POST /api/wa-sender/contacts/import → result display) / Builds the import sub-page with file upload, column mapping, deduplication toggle, progress simulation, error summary, and import history list.  
**Status**: ACTIVE

## Context

The import page is the most complex UI in the contacts feature. Users upload an Excel file, map columns to contact fields, choose whether to deduplicate, and run the import. After import, they see a summary (imported, duplicates merged, errors) and a history of previous imports.

## Scope

**DO:**
- Create `app/tools/wa-sender/contacts/import/page.tsx`
- **File upload section:**
  - Drag-and-drop + click-to-browse file input accepting `.xlsx`, `.xls`, `.csv`
  - Preview first 5 rows of the file after upload to confirm correct file
  - File size indicator; reject > 5MB with an error message before API call
- **Column mapping UI:**
  - After file preview: auto-detect columns (e.g., column header contains "phone" → map to Phone field)
  - Show mapping dropdowns for each column: "Map to: Name / Phone / Email / Company / Custom Field"
  - User can manually override any auto-detected mapping
  - "Custom Field" option: if user selects this, the column becomes a custom_field with the original column header as key
- **Deduplication toggle:**
  - Checkbox "Merge duplicate contacts (by phone)" — enabled by default
  - Tooltip explaining the deduplication behavior
- **Import button:**
  - Disabled until file is uploaded and at least one of (Phone / Email) column is mapped
  - On click: POST to `/api/wa-sender/contacts/import` with file + column mapping as metadata
  - Show progress bar while waiting for API response (simulate progress at 10% intervals since the API is synchronous — actual progress tracking is a Phase 3 enhancement)
- **Result summary:**
  - After import: show imported count, duplicates merged count, error count
  - If errors > 0: show error table with row number and error description
  - "View Contacts" button navigates to contacts list
- **Import history:**
  - Below the form: list of previous imports fetched from `GET /api/wa-sender/contacts` (filter by import_session_id presence, or use a separate endpoint if added)
  - Each import shows: file name, date, imported count

**DO NOT:**
- Implement real-time progress via WebSocket (Phase 3)
- Allow uploading files larger than 5MB (client-side rejection before API)
- Auto-submit on file selection — require user to review mapping first

## Deliverables

**Create:**
- `app/tools/wa-sender/contacts/import/page.tsx` — full import UI

**Tests:**
- `__tests__/wa-sender-contacts-import-page.test.ts`

## Testing

**Unit tests (Tier 1):**
- `test_import_page_rejects_file_over_5mb` — select a 6MB file; error message shown; import button stays disabled
- `test_import_page_shows_file_preview` — select a valid Excel file with 3 rows; preview shows those 3 rows
- `test_column_mapping_auto_detects_phone_column` — file with column header "Phone Number"; mapping auto-sets to Phone field
- `test_column_mapping_auto_detects_email_column` — same for email column
- `test_import_button_disabled_without_phone_or_email` — map all columns to Custom Field; import button disabled
- `test_import_button_enabled_with_phone_mapped` — map at least one column to Phone; button enabled
- `test_deduplication_toggle_default_on` — deduplication checkbox checked by default
- `test_import_calls_api_with_file` — click import; POST to `/api/wa-sender/contacts/import` with correct multipart data
- `test_result_summary_shows_imported_count` — mock API returning `{ imported: 45, duplicates_merged: 5, errors: [] }`; summary shows these numbers
- `test_result_error_table_shows_on_errors` — mock API returning 2 errors; error table with 2 rows shown

**Manual checks:**
- Upload a real Excel file with Name, Phone, Email columns — preview shows first 5 rows
- Column mapping dropdowns pre-filled with correct guesses
- Click Import — progress bar animates; summary appears with counts
- Upload file with some invalid phone formats — errors listed in summary

## Implementation Notes

- Column auto-detection: case-insensitive match. "Phone", "phone", "Phone Number", "Mobile", "Cell" → Phone field. "Email", "email", "Email Address" → Email field. "Name", "Full Name" → Name field. "Company", "Organization" → Company field. Everything else → "Custom Field" (unmapped by default, user can change).
- Column mapping is passed to the API as part of the form data. The import API receives the raw file plus a `column_mapping` JSON: `{ "A": "phone", "B": "name", "C": "company", "D": "custom:promo_code" }`. The "custom:" prefix signals a custom field with the given key name.
- Progress bar: since the API returns synchronously after processing, use a fake progress animation while the fetch is in-flight. Increment by 10% every 300ms up to 90%; set to 100% when response arrives.
- Import history: if the API doesn't have a dedicated endpoint for import history, call `GET /api/wa-sender/contacts` and read import metadata from the response. Alternatively, add `GET /api/wa-sender/contacts/import/history` — add this endpoint if needed (note it as a spec gap, add to spec, implement in API).
