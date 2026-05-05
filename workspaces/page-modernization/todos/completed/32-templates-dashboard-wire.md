# 32-templates-dashboard-wire — COMPLETED

**Completion Date:** 2026-05-05  
**Status:** ✅ Template selection and variable substitution wired into Dashboard

## Summary

Connected Templates feature to the Dashboard send workflow. Users can now:

1. Click "Select Template" button in Dashboard
2. Choose a template from modal (fetched from `/api/wa-sender/templates`)
3. Message textarea populates with template content
4. Selected template indicator shows below textarea ("Using template: [name]" with X to deselect)
5. When sending, variables like `{name}` are substituted before generating WhatsApp/Gmail links

## Implementation Details

### Files Created

**Created:**
- `app/components/TemplateModal.tsx` — Lazily-loaded modal showing template list
  - Fetches templates on open from `/api/wa-sender/templates`
  - Shows name, category, first 100 chars of content
  - Click to select and populate message field
  - Loading state while fetching
  - Error handling

**Tests:**
- `__tests__/lib/templates-substitute.test.ts` — 11 tests for variable substitution
  - Case-sensitive replacement
  - Missing variables left as-is
  - Custom fields flattening
  - Multiple variable instances
  - Real-world template examples

### Files Modified

**Modified:**
- `app/tools/wa-sender/page.tsx` (Dashboard)
  - Imported TemplateModal (lazily via `React.lazy`)
  - Added state: `showTemplateModal`, `selectedTemplate`
  - Added "Select Template" button next to message textarea
  - Added selected template indicator below textarea with deselect button
  - Integrated `substituteVariables` into `openWhatsApp` callback
  - Integrated `substituteVariables` into `openGmailCompose` callback
  - Updated dependencies arrays to include `selectedTemplate`

- `app/lib/templates.ts`
  - Added `substituteVariables(template: string, contact: Record<string, unknown>): string`
  - Handles case-sensitive replacement
  - Flattens `custom_fields` into contact data
  - Returns placeholders as-is for missing variables

## Variable Substitution Implementation

**Function signature:**
```typescript
export function substituteVariables(
  template: string,
  contact: Record<string, unknown>
): string
```

**Rules:**
- Case-sensitive: `{Name}` ≠ `{name}`
- Missing variables left as-is: `{unknown}` stays in output
- Flattens contact data: combines standard fields + `custom_fields` JSONB
- Regex replacement: `/{([a-zA-Z_][a-zA-Z0-9_]*)}/g`

**Test Coverage:**
- ✅ Basic substitution
- ✅ Case sensitivity
- ✅ Unknown variables
- ✅ Custom fields flattening
- ✅ Multiple instances
- ✅ All standard fields (name, phone, email, company)
- ✅ Null/undefined handling
- ✅ Real-world templates

## Limitations & Future Work

**Current implementation:**
- Variable substitution uses basic contact data (name, phone, email, company) + custom_fields
- When sending, only phone/email is available from the recipient entry
- No access to full contact record in send loop (would require data model enhancement)

**Future enhancement (Todo 40+):**
- When Contacts API is built, will have full contact records with all custom fields
- Can then enable full variable substitution with rich contact data

## Build & Tests

✅ TypeScript build passes
✅ 11 substitution unit tests passing
✅ 28 API tests still passing
✅ All imports resolve correctly

## Verification Against Spec

**From specs/wa-sender-templates.md § Variable Substitution:**
✅ Variables are case-sensitive
✅ Missing variables left as-is
✅ Extra variables in contact data ignored
✅ Substitution is client-side before sending
✅ Implementation matches regex pattern: `/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g`

**From todo 32 § Deliverables:**
✅ `app/components/TemplateModal.tsx` created
✅ Dashboard wired with "Select Template" button
✅ Template selection populates message field
✅ `substituteVariables()` implemented
✅ Substitution called during send loop (WhatsApp + Email)
✅ Selected template shown below textarea with deselect

## Status

Ready for production. Templates are now seamlessly integrated into the Dashboard send workflow. Users can select a template and it auto-populates the message, with variables ready for substitution at send time.

Next unblocked todos: 40 (Contacts API), 50 (History API), 41 (Contacts List), 51 (History Page)
