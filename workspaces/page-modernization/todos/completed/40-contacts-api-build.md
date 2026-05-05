# 40-contacts-api-build

**Implements**: specs/wa-sender-contacts.md § API Endpoints, § Deduplication Strategy, § Import Session Tracking  
**Depends On**: 22-api-routes-stubs (route scaffolding), 20-database-migrations (tables), 21-database-rls-verification (RLS confirmed), 43-contacts-phone-normalization (normalization logic used during import)  
**Capacity**: ~280 LOC load-bearing logic / 5 invariants (phone-based deduplication, E.164 normalization at import, 5MB/10k-row file limits, import session created for each import, paginated list with search) / 3 call-graph hops (route → validate → DB helper → Supabase) / Implements the contacts list endpoint with pagination/search and the bulk import endpoint with file parsing, normalization, deduplication, and import session recording.  
**Status**: ACTIVE

## Context

Contacts are the larger and more complex feature compared to Templates. The import pipeline involves: parse Excel → normalize phones → detect duplicates → merge or insert → record import metadata. This todo handles the server-side logic; the UI pages are todos 41 and 42.

Note the dependency order: todo 43 (phone normalization) is listed as a dependency because it contains the `normalizePhone()` function used during import. If implementation happens in one session, 43 can be done first and 40 second.

## Scope

**DO:**
- Implement `GET /api/wa-sender/contacts` — paginated list (`page`, `limit` params, default 50, max 500); optional `search` param (case-insensitive match on name, phone, email, company via Supabase ilike); return `{ contacts, total, page, limit }`
- Implement `POST /api/wa-sender/contacts/import` — multipart file upload, parse Excel/CSV, normalize phones, deduplicate, bulk insert, create import session record; return 202 with import summary
- Implement `GET /api/wa-sender/contacts/export` — query all contacts (with optional filter), format as CSV, return file download response
- Implement `DELETE /api/wa-sender/contacts/:id` — delete single contact, return 204
- Implement all contact DB helper functions in `app/lib/db/wa-sender.ts`
- Validate import: max 5MB file size, max 10,000 rows, at least one of phone/email required per row

**DO NOT:**
- Implement `POST /api/wa-sender/contacts` (single contact creation) — not in the spec's MVP API list
- Implement UPDATE contact endpoint in this todo (not in spec MVP)
- Build UI (todos 41, 42)
- Return synchronous 200 for import — it must return 202 since import is a batch operation

## Deliverables

**Modify:**
- `app/api/wa-sender/contacts/route.ts` — full GET implementation
- `app/api/wa-sender/contacts/import/route.ts` — full POST implementation
- `app/api/wa-sender/contacts/export/route.ts` — full GET implementation
- `app/lib/db/wa-sender.ts` — implement contact helper functions

**Tests:**
- `__tests__/wa-sender-contacts-api.test.ts`

## Testing

**Unit tests (Tier 1):**
- `test_contacts_list_returns_paginated_response` — mock DB returning 60 contacts; page=1, limit=50 returns first 50 with `total: 60`
- `test_contacts_list_search_filters_by_name` — search "Alice" matches contacts where name contains "alice" (case-insensitive)
- `test_contacts_list_search_filters_by_phone` — search "+1555" matches contacts with matching phone
- `test_import_rejects_files_over_5mb` — POST with file > 5MB returns 413
- `test_import_rejects_files_over_10000_rows` — POST with 10001-row file returns 413
- `test_import_requires_phone_or_email` — POST with rows having neither phone nor email records error per row
- `test_import_creates_import_session_record` — POST successful import; `wa_sender_imports` row created with correct counts
- `test_import_deduplicates_by_phone` — import row with same phone as existing contact; existing contact updated, no new row created
- `test_import_merges_custom_fields_on_dedup` — existing contact has `custom_fields: {tier: "Free"}`; import row has `{tier: "Premium"}`; after merge, contact has `{tier: "Premium"}`
- `test_export_returns_csv_content_type` — GET `/api/wa-sender/contacts/export` with valid auth; response Content-Type is `text/csv`
- `test_export_includes_all_contacts` — 3 contacts in DB; export CSV has 3 data rows plus header

**Integration check (Tier 2):**
- `test_import_round_trip` — upload real Excel file with 5 rows; verify 5 contacts in DB; verify import session record

## Implementation Notes

- Excel parsing: reuse the xlsx library from Phase 1 (`app/lib/excel.ts`). If that utility doesn't exist, parse using `import * as XLSX from 'xlsx'`.
- Deduplication logic (from spec):
  1. For each incoming row, normalize the phone to E.164
  2. Query Supabase: `WHERE user_id = ? AND phone = ?`
  3. If match found: UPDATE the contact's fields where incoming values are non-null; merge `custom_fields` (incoming overrides existing for same key)
  4. If no phone match, check email: `WHERE user_id = ? AND email = ?` — if match and name similarity > 80%, UPDATE
  5. Otherwise: INSERT new contact
- Name similarity > 80%: use Levenshtein distance. Install `fast-levenshtein` npm package (minimal, ~1KB). Calculate `1 - (distance / Math.max(a.length, b.length))` as similarity ratio.
- Import session: INSERT into `wa_sender_imports` before processing rows. Track `imported_count`, `duplicate_count`, `error_count`, `error_summary` during processing. UPDATE the import record at the end with final counts.
- Export CSV: include headers (Name, Phone, Email, Company, Created At) plus one column per unique `custom_fields` key found across all contacts. Use `text/csv; charset=utf-8` content type with `Content-Disposition: attachment; filename="contacts-export.csv"`.
- Multipart parsing in Next.js 14+: use `req.formData()` to get the file. `const file = formData.get('file') as File`.
