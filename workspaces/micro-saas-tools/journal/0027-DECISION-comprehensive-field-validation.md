---
type: DECISION
date: 2026-05-09
created_at: 2026-05-09T22:15:00Z
author: co-authored
session_id: current
project: micro-saas-tools
topic: Comprehensive field validation approach for invoice PDF export
phase: implement
tags: [security, validation, xss-prevention, invoice-export]
---

# Decision: Comprehensive Field Validation for Invoice PDF Export

## Situation

During Todo 003 implementation (Invoice PDF Export), red team had identified incomplete field validation as a critical security gap. The initial spec only validated 2 of ~10 user-controlled fields before passing them to html2canvas for PDF generation.

**At-risk fields**:
- Company name, email, phone
- Client name, email, phone  
- Item descriptions
- Notes, terms
- Invoice number

Any unvalidated field containing `<img onerror=alert(1)>` would render to the canvas and execute during PDF generation.

## Decision

**Implement comprehensive field validation for ALL user-controlled fields** before any rendering to canvas. Validate:

1. **All text input fields** via `validateInvoiceField()` — rejects HTML-dangerous characters explicitly
2. **Item descriptions in the array** — validate each description
3. **Notes and terms fields** — validate optional fields if present
4. **Invoice number** via `validateInvoiceNumber()` — filename-safe regex only

**Validation approach**:
```typescript
const fieldsToValidate = [
  { name: 'Company Name', value: invoiceData.companyName },
  { name: 'Company Email', value: invoiceData.companyEmail },
  { name: 'Company Phone', value: invoiceData.companyPhone },
  { name: 'Client Name', value: invoiceData.clientName },
  { name: 'Client Email', value: invoiceData.clientEmail },
  { name: 'Client Phone', value: invoiceData.clientPhone },
  { name: 'Notes', value: invoiceData.notes || '' },
  { name: 'Terms', value: invoiceData.terms || '' },
];

for (const field of fieldsToValidate) {
  if (field.value && !validateInvoiceField(field.value, 500)) {
    throw new Error(`${field.name} contains invalid characters...`);
  }
}

// Validate item descriptions
for (const item of invoiceData.items) {
  if (item.description && !validateInvoiceField(item.description, 300)) {
    throw new Error('Item description contains invalid characters');
  }
}
```

**Regex pattern (explicit rejection)**:
```typescript
// Reject: < > & " ' backtick
if (/[<>"'`&]/.test(value)) return false;
// Allow: Unicode letters/numbers, spaces, safe punctuation
return /^[\p{L}\p{N}\s\-_./,:()+@\n\r]+$/u.test(value);
```

## Rationale

1. **All-or-nothing validation**: Validating only some fields creates a false sense of security. Any unvalidated field is a vulnerability.

2. **Explicit character rejection**: Rather than trying to list "safe" characters, explicitly reject HTML-dangerous ones (`<>"'`` `&`). This is more resilient to Unicode edge cases.

3. **Per-field error messages**: Include field name in error so users know which field has invalid characters. Prevents confusion and improves UX.

4. **Defense-in-depth**: html2canvas will receive ONLY validated, sanitized text. Even if html2canvas has bugs, the input is already scrubbed.

## Implementation Result

- Created `validateInvoiceField()` with explicit character rejection
- Created `validateInvoiceNumber()` for filename safety
- Updated `generateInvoicePDF()` to validate ALL 10 fields
- Wrote 26 unit tests covering XSS injection attempts
- All tests pass ✓

## Outcomes

**Security**: Every user-controlled field validated before rendering. XSS injection attempts are caught and rejected with clear error messages.

**Testability**: 26 test cases cover valid input patterns, HTML injection, script tags, special characters, length limits, and filename safety. Future developers can confidently modify validation without creating gaps.

**User Experience**: Error messages identify which field is invalid, making it easy for users to fix input errors.

## For Discussion

1. **Should we add rate limiting on PDF generation?** Currently any user can spam-generate PDFs. Could add per-IP or per-session limits (5 PDFs per minute).

2. **Is 500 character limit on notes/terms too short?** Invoice notes can be lengthy. Consider 1000 character limit instead.

3. **Should we add server-side validation in addition to client-side?** Current implementation is client-side only. If PDFs are ever generated server-side, we'd need server validation too.

---

**Related**: 0026-RISK-todo-003-security-validation-gaps.md, 0025-DECISION-todo-scope-and-ordering.md

**Status**: Implemented and tested ✓
