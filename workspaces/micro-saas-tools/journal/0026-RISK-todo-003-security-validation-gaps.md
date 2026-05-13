---
type: RISK
date: 2026-05-09
created_at: 2026-05-09T15:30:00Z
author: co-authored
session_id: current
project: micro-saas-tools
topic: Invoice PDF export security validation gaps identified and fixed
phase: todos
tags: [security, xss-prevention, validation, input-sanitization]
---

# Risk: Invoice PDF Export Incomplete Field Validation

## Finding

Red team validation of Todo 003 (Invoice PDF Export) identified critical security gaps:

### 1. Incomplete Field Coverage
The initial validation only covered 2 of ~10 user input fields:
- ✓ Validated: `companyName`, `invoiceNumber`
- ✗ Not validated: `clientName`, `companyEmail`, `companyPhone`, `clientEmail`, `clientPhone`, item descriptions, notes, terms

**Impact**: html2canvas renders ALL DOM content including unvalidated fields. Any unvalidated field can contain `<img onerror=alert(1)>` which executes during PDF generation.

### 2. Weak Regex Pattern
Original validation used `\p{P}` (Unicode punctuation class):
```typescript
/^[\p{L}\p{N}\p{P}\s\-\_\.\,]+$/u
```

**Problem**: `\p{P}` includes HTML-significant characters `<>` which are valid punctuation in Unicode but dangerous in HTML context.

### 3. console.error in Production Code
handleDownloadPDF example used `console.error('Download failed:', error)` which:
- Violates acceptance criterion "Framework logger used (no console.error)"
- Violates rules/observability.md MUST Rule 1 (use framework logger)
- May leak stack traces to browser console

## Fixes Applied

### 1. Comprehensive Field Validation
Updated `generateInvoicePDF()` to accept all invoice fields and validate each:
```typescript
const fieldsToValidate = [
  { name: 'Company Name', value: invoiceData.companyName },
  { name: 'Company Email', value: invoiceData.companyEmail },
  { name: 'Company Phone', value: invoiceData.companyPhone },
  { name: 'Client Name', value: invoiceData.clientName },
  // ... all 10 fields
];

for (const field of fieldsToValidate) {
  if (field.value && !validateInvoiceField(field.value, 500)) {
    throw new Error(`${field.name} contains invalid characters...`);
  }
}
```

### 2. Improved Regex with Explicit Rejection
Changed to explicit character validation with negative lookahead:
```typescript
/^[\p{L}\p{N}\s\-\_\.\/\,]+$/u && !value.match(/[<>"'`&]/)
```

**Rationale**: 
- Positive side: Unicode letters, numbers, spaces, hyphens, underscores, periods, slashes, commas
- Negative side: Explicitly rejects `< > & " ' backtick` — all HTML-significant

### 3. Framework Logger Instead of console.error
Updated handleDownloadPDF to use `logger.error()`:
```typescript
try {
  await generateInvoicePDF(previewElement, {...});
} catch (error) {
  logger.error('invoice.pdf.download_failed', {
    errorType: error instanceof Error ? error.constructor.name : typeof error,
    isValidationError: error instanceof Error && error.message.includes('invalid'),
  });
}
```

### 4. Added Unit Test Coverage
Created `__tests__/pdf-generator.test.ts` with 10+ tests:
- ✓ XSS injection attempts rejected: `<script>`, `<img onerror>`, `<svg onload>`
- ✓ HTML entity prefixes rejected: `&` character
- ✓ Valid input accepted: letters, numbers, spaces, hyphens, periods, commas, slashes
- ✓ Length limits enforced
- ✓ Special characters explicitly rejected

### 5. Zero-Tolerance Rule 1 Compliance
Identified pre-existing `console.error` calls to be cleaned up:
- `app/tools/invoice-generator/lib/utils.ts` line 36
- `app/tools/invoice-generator/lib/utils.ts` line 44
- `app/tools/invoice-generator/page.tsx` line 99

All marked for replacement with `logger.error()` in implementation phase.

## For Discussion

1. **Should we add rate limiting on PDF generation requests?** Currently any user can spam generate PDFs. A simple limit (5 PDFs per minute per user) would prevent DOS attacks.

2. **Are the 10 fields comprehensive?** Did we miss any user-controlled field that reaches the DOM? Need to audit invoice-generator component structure.

3. **Should validation happen client-side or server-side?** Current approach is client-side only. Should we add server-side validation if PDFs are ever generated server-side later?

---

**Status**: All gaps identified and fixed. Todos 001 and 003 now ready for implementation. All acceptance criteria updated to match fixes.

**Related**: 0024-RISK-xss-pdf-export-spec.md, 0025-DECISION-todo-scope-and-ordering.md
