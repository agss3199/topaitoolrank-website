# TODO-603: Replace Invoice Text Export with PDF Generation

**Status**: ACTIVE  
**Severity**: HIGH  
**Effort**: 1 implementation cycle (~90 min)  
**Implements**: specs/invoice-export-formats.md § Primary Export Format: PDF, § PDF Generation Approach (Option 1: jsPDF), § Security Requirements  
**Depends on**: nothing (self-contained tool change)  
**Blocks**: nothing

---

## Description

The Invoice Generator tool has a function named `handleDownloadPDF` that does not generate a PDF. It calls `generateTextInvoice()` and saves the result as `.txt`. Users clicking "Download Invoice" receive a plain text file — not useful for professional invoicing, not accepted by accountants, and not email-safe as an attachment.

The spec (`specs/invoice-export-formats.md`) requires PDF as the primary format and browser print as the secondary. This todo replaces the text export with real PDF generation using jsPDF + html2canvas, following the security constraints defined in the corrected analysis.

This todo is larger than the others (~90 min) but stays in one session because the scope is narrow: one tool, one library, one generator file, one CSS block.

---

## Acceptance Criteria

- [ ] `npm install jspdf html2canvas` completed; both appear in `package.json` dependencies
- [ ] `app/tools/invoice-generator/lib/pdf-generator.ts` exists and exports a `downloadInvoiceAsPDF(data: InvoiceData)` async function
- [ ] PDF generator validates all user-supplied string fields before rendering (rejects HTML tags, script content)
- [ ] Invoice number is validated as filesystem-safe before use in filename (`/^[a-zA-Z0-9_\-]+$/`)
- [ ] PDF generator uses a framework logger (not `console.error`) for error reporting
- [ ] `handleDownloadPDF` in `page.tsx` calls `downloadInvoiceAsPDF` instead of the old text export
- [ ] Downloading an invoice produces a `.pdf` file (not `.txt`)
- [ ] `@media print` CSS block is present in the tool's `styles.css`, hiding form controls and showing only the invoice preview
- [ ] A "Print" button triggers `window.print()` (not `window.open()`)
- [ ] An invoice with a filled-in number like `INV-001` downloads as `invoice-INV-001.pdf`
- [ ] An invoice with a blank invoice number falls back to `invoice-unnamed.pdf` (no crash)
- [ ] No XSS: user input containing `<script>alert(1)</script>` in any field does not execute when the PDF preview is rendered

---

## Subtasks

- [ ] Install jsPDF and html2canvas (Est: 5 min) — Verification: `cat package.json | grep -E "jspdf|html2canvas"` returns both entries
- [ ] Create `app/tools/invoice-generator/lib/pdf-generator.ts` with input validation and PDF generation (Est: 40 min) — Verification: TypeScript compiles without errors; function signature matches `downloadInvoiceAsPDF(data: InvoiceData): Promise<void>`
- [ ] Add input validation: strip/reject HTML in string fields before they reach the canvas (Est: 10 min) — Verification: pass `<script>alert(1)</script>` as a field value; confirm it is rejected or escaped before rendering
- [ ] Add filename safety validation for invoice number (Est: 5 min) — Verification: pass `../../etc/passwd` as invoice number; file downloads as `invoice-unnamed.pdf`
- [ ] Update `page.tsx` to call `downloadInvoiceAsPDF` instead of text export (Est: 10 min) — Verification: diff shows old call removed, new async call added with error handling
- [ ] Add `@media print` CSS to `styles.css` (Est: 10 min) — Verification: `window.print()` in browser shows only invoice preview, no form controls
- [ ] Add Print button to page.tsx that calls `window.print()` (Est: 5 min) — Verification: button appears in UI; clicking triggers browser print dialog
- [ ] Manual end-to-end test: fill form, click Download, verify PDF opens correctly in browser (Est: 5 min)

---

## Files to Change

| File | Change |
|------|--------|
| `package.json` | Add jspdf and html2canvas dependencies |
| `app/tools/invoice-generator/lib/pdf-generator.ts` | New file — PDF generation with input validation |
| `app/tools/invoice-generator/page.tsx` | Replace text export call with `downloadInvoiceAsPDF`; add Print button |
| `app/tools/invoice-generator/styles.css` | Add `@media print` block |

---

## Implementation Notes

### PDF Generation Pattern

The generator captures the `invoice-preview` DOM element as a canvas, then embeds that canvas into a PDF page. The element must have `id="invoice-preview"` on the rendered invoice markup.

```typescript
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function downloadInvoiceAsPDF(data: InvoiceData): Promise<void> {
  validateInvoiceData(data); // throws on invalid input

  const element = document.getElementById('invoice-preview');
  if (!element) {
    logger.error('invoice-generator: invoice-preview element not found');
    return;
  }

  const canvas = await html2canvas(element, { scale: 2 });
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const imgData = canvas.toDataURL('image/png');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

  const safeNumber = sanitizeFilename(data.invoiceNumber) || 'unnamed';
  pdf.save(`invoice-${safeNumber}.pdf`);
}
```

### Input Validation

All string fields from `InvoiceData` must be checked before rendering. Use a simple HTML-tag stripping check:

```typescript
function containsHtml(value: string): boolean {
  return /<[^>]+>/.test(value);
}

function validateInvoiceData(data: InvoiceData): void {
  const stringFields = [data.clientName, data.businessName, data.invoiceNumber, ...];
  for (const field of stringFields) {
    if (typeof field === 'string' && containsHtml(field)) {
      throw new Error('Invoice fields must not contain HTML markup');
    }
  }
}
```

### Filename Safety

```typescript
function sanitizeFilename(name: string): string {
  return /^[a-zA-Z0-9_\-]+$/.test(name) ? name : '';
}
```

### Print CSS

```css
@media print {
  .invoice-form,
  .invoice-actions,
  button {
    display: none !important;
  }
  .invoice-preview {
    display: block !important;
    width: 100%;
    margin: 0;
    padding: 0;
  }
}
```

### Why window.print() instead of window.open()

`window.open()` + `document.write()` with user-supplied content is an XSS vector. `window.print()` uses the already-rendered, already-validated page content and the browser's own print subsystem. It is the safe choice.

---

## Security Requirements (from corrected analysis)

1. Input validation on all user string fields before canvas rendering
2. Filename sanitization — invoice number must match `^[a-zA-Z0-9_\-]+$` or fall back to "unnamed"
3. No `window.open()` + `document.write()` — use `window.print()` only
4. Framework logger for errors — not `console.error`
5. No innerHTML assignment with unsanitized user content anywhere in the PDF flow

---

## Definition of Done

- [ ] All acceptance criteria verified
- [ ] TypeScript compiles without errors
- [ ] PDF downloads successfully with correct filename
- [ ] Print dialog opens and shows only invoice content
- [ ] Input with HTML tags is rejected before canvas render
- [ ] Commit message: `feat(invoice): replace text export with jsPDF generation and add print support`
