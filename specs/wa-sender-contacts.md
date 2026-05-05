# WA Sender Contacts

## Overview

Persistent contact management eliminates re-uploading contact lists. Users import contacts once, deduplicate, and reuse across sends.

## Contact Schema

Stored in Supabase `wa_sender_contacts` table:

```sql
CREATE TABLE wa_sender_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(100),
  company VARCHAR(100),
  custom_fields JSONB,  -- arbitrary key-value for template variables
  import_session_id UUID REFERENCES wa_sender_imports(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_wa_contacts_user ON wa_sender_contacts(user_id);
CREATE INDEX idx_wa_contacts_phone ON wa_sender_contacts(user_id, phone);
CREATE INDEX idx_wa_contacts_email ON wa_sender_contacts(user_id, email);
```

## Contact Structure

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "name": "Alice Johnson",
  "phone": "+1-555-123-4567",
  "email": "alice@techcorp.com",
  "company": "TechCorp",
  "custom_fields": {
    "promo_code": "ALICE123",
    "tier": "premium",
    "region": "NA"
  },
  "import_session_id": "uuid",
  "created_at": "2026-05-04T10:00:00Z",
  "updated_at": "2026-05-04T10:00:00Z"
}
```

## API Endpoints

### GET /api/wa-sender/contacts

List contacts with pagination and filtering.

**Query params:**
- `page` (default: 1)
- `limit` (default: 50, max: 500)
- `search` (optional) — search by name, phone, email, company

**Response:**
```json
{
  "contacts": [
    {
      "id": "uuid",
      "name": "Alice Johnson",
      "phone": "+1-555-123-4567",
      "email": "alice@techcorp.com",
      "company": "TechCorp"
    }
  ],
  "total": 1250,
  "page": 1,
  "limit": 50
}
```

### POST /api/wa-sender/contacts/import

Bulk import contacts from Excel file.

**Request:**
- Multipart form: `file` (Excel file)
- Optional: `deduplicate` (boolean, default: true) — merge duplicate contacts

**Validation:**
- File max size: 5MB
- Max rows: 10,000 per import
- Required columns: at least one of (phone, email)
- Optional columns: name, company, + any custom columns

**Deduplication logic:**
- If phone exists for user: update existing contact with new fields
- If email exists but not phone: check if same person by name similarity
- Custom fields are merged (new values override old)

**Response (202):**
```json
{
  "import_id": "uuid",
  "status": "processing",
  "total_rows": 500,
  "imported": 450,
  "duplicates_merged": 50,
  "errors": [
    {
      "row": 15,
      "error": "Invalid email format"
    }
  ]
}
```

**Error cases:**
- 400: File format invalid, missing required columns
- 413: File too large or too many rows
- 401: Not authenticated

### DELETE /api/wa-sender/contacts/:id

Delete a single contact.

**Response (204):** No content

### POST /api/wa-sender/contacts/export

Export contacts to CSV or Excel.

**Query params:**
- `format` (csv | xlsx, default: csv)
- `filter` (optional) — JSON filter like `{"company": "TechCorp"}`

**Response:** File download

## UI: Contacts Management Page

Located at `app/tools/wa-sender/contacts/page.tsx`

### Features

1. **List** — Paginated table with 50 contacts per page
   - Columns: name, phone, email, company, import_date, actions (view, delete)
   - Search bar: searches name, phone, email, company
   - Sort by: name, phone, company, created_at

2. **Import** — Dedicated sub-page at `/tools/wa-sender/contacts/import/page.tsx`
   - File upload (Excel/CSV)
   - Column mapping UI (for non-standard column names)
   - Deduplication toggle
   - Progress bar showing rows processed
   - Error summary at end (if any)
   - Import history list below form

3. **Export** — Download button in list header
   - Dropdown: CSV or Excel format
   - Checkbox: select contacts to export (or all)
   - Trigger download

4. **View/Edit** — Click row to view contact details
   - Modal or side panel with full contact data
   - Edit button to update name, company, custom fields
   - Delete button with confirmation
   - Back to list

### Contact Selection in Dashboard

In the send workflow, users can:
1. Click "Select Contacts" button
2. Modal opens with paginated contact list
3. Checkboxes to select multiple contacts
4. "Use Selected" button populates Dashboard send workflow
5. Alternatively, "Or import new contacts" button opens import flow

Selected contacts IDs stored in context: `useWASender().selectedContacts`

## Deduplication Strategy

During import, contacts are deduplicated by:

1. **Phone number** (primary key)
   - Normalize phone numbers to canonical format (E.164)
   - If phone exists for user: merge new fields into existing contact

2. **Email** (secondary)
   - If email exists but phone doesn't
   - Check name similarity (> 80% match by Levenshtein distance)
   - If match: merge into existing contact

3. **No match**: Create new contact

Example:

```
Import row:  { name: "Alice J.", phone: "+1-555-1234", email: "alice@company.com" }
Existing:    { name: "Alice Johnson", phone: "+1-555-1234", email: "alice@company.com" }
Result:      Existing contact updated (name field unchanged, all data already present)

Import row:  { name: "Alice", phone: "+1-555-1234", company: "NewCorp" }
Existing:    { name: "Alice Johnson", phone: "+1-555-1234", company: "OldCorp" }
Result:      Company field updated to "NewCorp"; name unchanged
```

## Custom Fields

Custom fields allow template variables beyond standard columns:

Excel file:
```
| Name  | Phone       | Company  | Promo Code | Tier    |
|-------|-------------|----------|------------|---------|
| Alice | +1-555-1234 | TechCorp | ALICE123   | Premium |
```

Custom fields extracted:
- Standard: name, phone, company
- Custom: promo_code, tier

When selecting this contact for a send with template `"Hi {name}, tier {tier}, code {promo_code}"`:
- Variables substituted from both standard + custom fields
- Result: `"Hi Alice, tier Premium, code ALICE123"`

Custom fields are stored as JSONB in the database for flexibility.

## Import Session Tracking

Each import is recorded with metadata:

```sql
CREATE TABLE wa_sender_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  file_name VARCHAR(255),
  total_rows INT,
  imported_count INT,
  duplicate_count INT,
  error_count INT,
  error_summary JSONB,
  created_at TIMESTAMP DEFAULT now()
);
```

This allows users to:
- See import history (which file, when, how many contacts)
- Rollback an import (delete all contacts from that import_session_id)

## Security & Permissions

### RLS Policies

```sql
CREATE POLICY "users can read own contacts" ON wa_sender_contacts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users can create contacts" ON wa_sender_contacts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users can update own contacts" ON wa_sender_contacts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "users can delete own contacts" ON wa_sender_contacts
  FOR DELETE USING (auth.uid() = user_id);
```

### Payload Validation

- Max phone: 20 chars (fits E.164 + extensions)
- Max email: 100 chars
- Max name: 100 chars
- Max company: 100 chars
- Max custom_fields: 1KB
- File upload max: 5MB
- Max rows per import: 10,000

## Phone Number Normalization

Contacts are normalized to E.164 format at import time:

```
Input: "555-123-4567" (detected as US based on IP or user setting)
Output: "+1-555-123-4567"

Input: "+44 1632 960000" (already international)
Output: "+441632960000"

Input: "0207946 0958" (UK number without +)
Output: "+442079460958"
```

Normalization library: `libphonenumber-js` or similar. Store original + normalized versions if needed for user reference.

## Implementation Notes

- Contact list search is client-side filtering (not server-side query) for snappy UX
- Import modal shows real-time progress bar (rows processed / total rows)
- Custom fields are dynamically extracted (no predefined schema)
- Deduplication is optional but recommended to avoid duplicate sends
- "Import session" tracks which contacts came from which upload for potential rollback
