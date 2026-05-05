# WA Sender Templates

## Overview

Message templates are reusable text snippets with variable placeholders. Users save templates once and select them during send workflow, eliminating retyping and reducing errors.

## Template Schema

Stored in Supabase `wa_sender_templates` table:

```sql
CREATE TABLE wa_sender_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  description TEXT,
  category VARCHAR(50),  -- e.g., "greeting", "offer", "support"
  variables JSON,  -- ["name", "company", "promo_code"] — extracted at save time
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  CONSTRAINT unique_user_template UNIQUE(user_id, name)
);

CREATE INDEX idx_wa_templates_user ON wa_sender_templates(user_id);
```

## Template Structure

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "name": "Weekly Promo",
  "content": "Hi {name}, we have a special offer for {company}. Use code {promo_code} for 20% off. Valid until Friday.",
  "description": "Generic weekly promotion message",
  "category": "promotional",
  "variables": ["name", "company", "promo_code"],
  "created_at": "2026-05-04T10:00:00Z",
  "updated_at": "2026-05-04T10:00:00Z"
}
```

## Variable Extraction

Variables are placeholders in `{curly_braces}`. On save, the system extracts all unique variables:

```
Content: "Hi {name}, we have a special offer for {company}. Use code {promo_code} for 20% off."
Extracted: ["name", "company", "promo_code"]
```

Validation rules:
- Variables MUST be alphanumeric + underscore: `{[a-zA-Z_][a-zA-Z0-9_]*}`
- Invalid syntax like `{name with spaces}` or `{123}` rejected with user-friendly error
- Duplicate variables in content are deduplicated in the `variables` array

## API Endpoints

### GET /api/wa-sender/templates

List all templates for the authenticated user.

**Query params:**
- `category` (optional) — filter by category

**Response:**
```json
{
  "templates": [
    {
      "id": "uuid",
      "name": "Weekly Promo",
      "description": "...",
      "category": "promotional",
      "variables": ["name", "company", "promo_code"],
      "created_at": "2026-05-04T10:00:00Z"
    }
  ]
}
```

**Error cases:**
- 401: Not authenticated
- 500: Database error

### POST /api/wa-sender/templates

Create a new template.

**Request:**
```json
{
  "name": "Weekly Promo",
  "content": "Hi {name}, we have a special offer for {company}. Use code {promo_code} for 20% off.",
  "description": "Generic weekly promotion message",
  "category": "promotional"
}
```

**Validation:**
- `name` required, max 100 chars, must be unique per user
- `content` required, max 1000 chars
- `description` optional, max 500 chars
- `category` optional, must match predefined list if provided
- Variables auto-extracted and validated

**Response (201):**
```json
{
  "id": "uuid",
  "name": "Weekly Promo",
  "content": "...",
  "variables": ["name", "company", "promo_code"],
  "created_at": "2026-05-04T10:00:00Z"
}
```

**Error cases:**
- 400: Missing required fields, validation failed
- 409: Template name already exists for this user
- 401: Not authenticated

### GET /api/wa-sender/templates/:id

Fetch a single template by ID.

**Response (200):**
```json
{
  "id": "uuid",
  "name": "Weekly Promo",
  "content": "...",
  "description": "...",
  "category": "promotional",
  "variables": ["name", "company", "promo_code"],
  "created_at": "2026-05-04T10:00:00Z",
  "updated_at": "2026-05-04T10:00:00Z"
}
```

**Error cases:**
- 404: Template not found or user not owner
- 401: Not authenticated

### PUT /api/wa-sender/templates/:id

Update a template.

**Request:**
```json
{
  "name": "Weekly Promo v2",
  "content": "...",
  "description": "...",
  "category": "promotional"
}
```

**Validation:** Same as POST. Variables re-extracted from new content.

**Response (200):** Updated template object

**Error cases:**
- 400: Validation failed
- 404: Template not found or not owner
- 409: New name already exists for user
- 401: Not authenticated

### DELETE /api/wa-sender/templates/:id

Delete a template.

**Response (204):** No content

**Error cases:**
- 404: Template not found or not owner
- 401: Not authenticated

## UI: Template CRUD Page

Located at `app/tools/wa-sender/templates/page.tsx`

### Features

1. **List** — Paginated table of all templates
   - Columns: name, category, variable count, created_at, actions (edit, delete)
   - Sort by: name, category, created_at
   - Filter by: category

2. **Create** — Form to create new template
   - Fields: name, content (textarea with 1000-char counter), category (dropdown), description
   - Variable preview: Shows extracted variables below content box
   - Save button: Disabled until valid
   - Cancel button: Returns to list

3. **Edit** — Form to update existing template
   - Pre-populated with current values
   - Same fields as create
   - Variable preview updates as user types
   - Save / Cancel buttons

4. **Delete** — Confirmation modal
   - "Are you sure you want to delete [template name]?"
   - Delete button triggers DELETE endpoint
   - On success: remove from list, show success toast
   - On error: show error toast with message

### Template Selection in Dashboard

When user is in the send workflow (Dashboard), they can:
1. Click "Select Template" button
2. Modal opens showing template list (simplified: name, category, preview first 100 chars)
3. Click a template to select it
4. Content is populated in the message textarea
5. User can edit the content or use as-is

Selected template ID is stored in context: `useWASender().selectedTemplate`

## Categories

Predefined template categories (stored in code, not database):

```json
[
  { "id": "greeting", "label": "Greeting" },
  { "id": "promotional", "label": "Promotional Offer" },
  { "id": "support", "label": "Customer Support" },
  { "id": "notification", "label": "Notification" },
  { "id": "appointment", "label": "Appointment Reminder" },
  { "id": "followup", "label": "Follow-up" },
  { "id": "other", "label": "Other" }
]
```

## Variable Substitution

When sending a message with a template, variables are substituted from contact data:

Template: `"Hi {name}, we have a special offer for {company}. Use code {promo_code} for 20% off."`

Contact data: `{ "name": "Alice", "company": "TechCorp", "promo_code": "SAVE20" }`

Result: `"Hi Alice, we have a special offer for TechCorp. Use code SAVE20 for 20% off."`

Substitution rules:
- Variables are case-sensitive: `{Name}` ≠ `{name}`
- Missing variable → variable placeholder left as-is: `"Hi Alice, code is {promo_code}"` if promo_code not in contact
- Extra variables in contact data are ignored
- Substitution is done client-side before sending (no secrets passed to API)

## Security & Permissions

### RLS Policies

```sql
-- Only owner can read
CREATE POLICY "users can read own templates" ON wa_sender_templates
  FOR SELECT USING (auth.uid() = user_id);

-- Only owner can insert
CREATE POLICY "users can create templates" ON wa_sender_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Only owner can update
CREATE POLICY "users can update own templates" ON wa_sender_templates
  FOR UPDATE USING (auth.uid() = user_id);

-- Only owner can delete
CREATE POLICY "users can delete own templates" ON wa_sender_templates
  FOR DELETE USING (auth.uid() = user_id);
```

### Payload Validation

- Max content length: 1000 chars (covers typical message lengths)
- Max name length: 100 chars
- Max description length: 500 chars
- Max templates per user: Unlimited (no soft cap)

## Implementation Notes

- Variable extraction is regex-based: `/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g`
- Categories dropdown is static (defined in FE code or constants file)
- Template modal in Dashboard is lazy-loaded (not needed unless user clicks "Select Template")
- All API responses include `created_at` and `updated_at` for debugging
