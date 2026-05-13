# Risk: XSS Vulnerability in Initial PDF Export Spec

**Date**: 2026-05-09  
**Type**: RISK  
**Severity**: CRITICAL  
**Status**: FIXED (before implementation)

## What Happened

During red team validation of the analysis phase, security reviewer found a cross-site scripting (XSS) vulnerability in the invoice PDF export specification.

## The Vulnerability

**Location**: Initial `specs/invoice-export-formats.md` code example (lines 303-309)

```typescript
// VULNERABLE CODE (removed)
const handlePrint = () => {
  const printWindow = window.open('', '', 'height=600,width=800');
  if (printWindow) {
    printWindow.document.write(previewElement.innerHTML);  // ← XSS VECTOR
    printWindow.document.close();
    printWindow.print();
  }
};
```

## Root Cause

The spec used `innerHTML` to write user-supplied invoice data (company name, client name, item descriptions) into a new window's document without sanitization. If any field contains HTML or JavaScript:

```
Client Name: <img src=x onerror=alert(document.cookie)>
```

The script executes in the new window when `document.write()` parses the HTML.

## Impact

- **Severity**: CRITICAL
- **Scope**: User-controlled invoice fields (all text inputs) can execute arbitrary JavaScript
- **Consequence**: Cookie theft, session hijacking, malware injection possible
- **Detection**: Zero tests would catch this (spec existed, wasn't reviewed pre-implementation)

## How It Was Found

Red team security-reviewer audited the specification before any code was written. This is why red team validation happens during analysis phase — to catch architectural issues before implementation burns effort.

## Fix Applied

**Spec**: `specs/invoice-export-formats.md` (updated)

1. **Removed** the vulnerable `window.open() + document.write(innerHTML)` pattern entirely
2. **Replaced** with `window.print()` + `@media print` CSS (safe approach):
   - Prints current page, not a new window
   - Uses CSS to hide form, show invoice only
   - No raw HTML manipulation

3. **Added** input validation:
   ```typescript
   const validateInvoiceField = (value: string, maxLength: number = 200): boolean => {
     if (value.length > maxLength) return false;
     return /^[\p{L}\p{N}\p{P}\s\-\_\.\,]+$/u.test(value);
   };
   ```

4. **Added** filename safety:
   ```typescript
   const validateInvoiceNumber = (value: string): boolean => {
     return /^[a-zA-Z0-9_-]{1,50}$/.test(value);
   };
   ```

5. **Added** framework logging (not console):
   ```typescript
   logger.info('pdf.generation.start', { invoiceNumber });
   logger.error('pdf.generation.failed', { error: String(error) });
   ```

## Lessons

1. **Specs are security-critical** — XSS vectors can hide in example code
2. **Red team pre-implementation** — Catches issues before implementation waste
3. **Review specification code** — Not just architecture, but actual code samples
4. **Window.print + CSS approach** — Safer than window manipulation for PDFs

## Files Updated

- `specs/invoice-export-formats.md` — Vulnerabilities removed, security requirements added
- `workspaces/micro-saas-tools/01-analysis/03-corrected-findings.md` — Notes security fixes

## Status

✅ Fixed before any implementation code written  
✅ Integrated into specification  
✅ Will be validated in red team during `/redteam` phase post-implementation
