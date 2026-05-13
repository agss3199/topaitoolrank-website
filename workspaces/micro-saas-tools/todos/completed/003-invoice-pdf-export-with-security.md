# Todo 003: Implement Invoice PDF Export (Secure)

**Priority**: 🟠 HIGH (Feature completeness)  
**Effort**: ~1.5 hours (1-2 focus blocks)  
**Depends on**: Todo 001 (header compensation) must complete before this, as invoice page uses Header  
**Implements**: `specs/invoice-export-formats.md` § Implementation Steps, Security Requirements

## Description

Invoice generator currently exports as plaintext (.txt file), which is not practical for professional invoicing. Users expect PDF format that is printable, email-safe, and accountant-friendly. The implementation must include security hardening to prevent XSS attacks from user-supplied invoice fields.

## Acceptance Criteria

- [ ] `npm install jspdf html2canvas` completes successfully
- [ ] Dependencies pinned to specific versions (no floating `^` or `~`)
- [ ] `app/tools/invoice-generator/lib/pdf-generator.ts` created with full PDF generation logic
- [ ] **All user input fields** (company name, email, phone, client name, client email, client phone, item descriptions, notes, terms) validated against HTML/script injection before rendering
- [ ] Invoice number validated to allow only `[a-zA-Z0-9_-]` (safe for filenames)
- [ ] Validation explicitly rejects characters: `< > & " ' ` ` (backtick)
- [ ] PDF exports with correct filename: `invoice-{invoiceNumber}.pdf`
- [ ] Print button uses `window.print()` + `@media print` CSS (NOT `window.open()`)
- [ ] Framework logger used for ALL error handling (no `console.error` in new code)
- [ ] Pre-existing `console.error` calls removed from `lib/utils.ts` and `page.tsx` (Zero-Tolerance Rule 1)
- [ ] Unit tests added: `app/tools/invoice-generator/__tests__/pdf-generator.test.ts`
  - [ ] `validateInvoiceField` rejects XSS payloads: `<script>`, `<img onerror>`, `<svg onload>`, backticks, angle brackets
  - [ ] `validateInvoiceField` accepts valid input: letters, numbers, spaces, hyphens, periods, commas, slashes
  - [ ] `validateInvoiceNumber` rejects invalid filenames: slashes, dots, spaces, Unicode
  - [ ] `generateInvoicePDF` throws on any invalid field
- [ ] Visual test: Fill form with valid data → click "Download as PDF" → PDF downloads and displays correctly
- [ ] Security test: Fill any field with `<img src=x onerror=alert(1)>` → validation rejects, logger records event, no alert
- [ ] Security test: Fill any field with `<script>alert(1)</script>` → validation rejects
- [ ] Security test: Fill any field with backticks or angle brackets → validation rejects
- [ ] Print test: Click "Print" button → browser print dialog opens showing invoice only (form hidden)
- [ ] No console errors or warnings
- [ ] Build succeeds with 0 TypeScript errors
- [ ] No `TODO` comments in production code (Zero-Tolerance Rule 2)

## Changes Required

### Step 1: Install Dependencies

```bash
npm install jspdf html2canvas
```

### Step 2: Create `app/tools/invoice-generator/lib/pdf-generator.ts`

```typescript
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import logger from '@/app/lib/logger';

// Input validation helpers
function validateInvoiceField(value: string, maxLength: number = 200): boolean {
  if (!value || value.length > maxLength) return false;
  // Reject HTML/script tags and special characters
  // Allow: letters, numbers, spaces, hyphens, underscores, periods, commas, slashes
  // Explicitly reject: < > & " ' backticks (HTML/script-significant)
  return /^[\p{L}\p{N}\s\-\_\.\/\,]+$/u.test(value) && 
         !value.match(/[<>"'`&]/);
}

function validateInvoiceNumber(value: string): boolean {
  // Allow only alphanumeric, hyphens, underscores (safe for filenames)
  return /^[a-zA-Z0-9_-]{1,50}$/.test(value);
}

export async function generateInvoicePDF(
  invoiceHTML: HTMLElement,
  invoiceData: {
    invoiceNumber: string;
    companyName: string;
    companyEmail: string;
    companyPhone: string;
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    items: Array<{ description: string; quantity: string; rate: string }>;
    notes?: string;
    terms?: string;
  }
): Promise<void> {
  try {
    // Validate all inputs before processing
    if (!validateInvoiceNumber(invoiceData.invoiceNumber)) {
      throw new Error('Invoice number contains invalid characters');
    }
    
    // Validate all text fields
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
        throw new Error(`${field.name} contains invalid characters or exceeds length limit`);
      }
    }

    // Validate item descriptions
    for (const item of invoiceData.items) {
      if (item.description && !validateInvoiceField(item.description, 300)) {
        throw new Error('Item description contains invalid characters');
      }
    }

    logger.info('pdf.generation.start', { invoiceNumber: invoiceData.invoiceNumber });

    const canvas = await html2canvas(invoiceHTML, {
      scale: 2,
      useCORS: true,
      logging: false,
      allowTaint: false, // Strict CORS only
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth - 20; // 10mm margins
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let yPosition = 10;
    let remainingHeight = imgHeight;

    while (remainingHeight > 0) {
      const pageHeight = pdfHeight - 20;
      if (remainingHeight > pageHeight) {
        pdf.addImage(
          canvas.toDataURL('image/png'),
          'PNG',
          10,
          yPosition,
          imgWidth,
          imgHeight
        );
        remainingHeight -= pageHeight;
        yPosition = -pageHeight;
        pdf.addPage();
      } else {
        pdf.addImage(
          canvas.toDataURL('image/png'),
          'PNG',
          10,
          yPosition,
          imgWidth,
          imgHeight
        );
        remainingHeight = 0;
      }
    }

    pdf.save(`invoice-${invoiceData.invoiceNumber}.pdf`);
    logger.info('pdf.generation.ok', { invoiceNumber: invoiceData.invoiceNumber });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('pdf.generation.failed', {
      invoiceNumber: invoiceData?.invoiceNumber || 'unknown',
      errorType: error instanceof Error ? error.constructor.name : typeof error,
    });
    throw new Error('Could not generate PDF. Please try again.');
  }
}

export { validateInvoiceField, validateInvoiceNumber };
```

### Step 3: Update `app/tools/invoice-generator/page.tsx`

1. Import the PDF generator:
```typescript
import { generateInvoicePDF, validateInvoiceField } from './lib/pdf-generator';
```

2. Update `handleDownloadPDF` function (use framework logger, validate all fields):
```typescript
import logger from '@/app/lib/logger';

const handleDownloadPDF = async () => {
  const previewElement = document.getElementById('invoice-preview');
  if (!previewElement || !data.companyName || !data.clientName) {
    logger.warn('invoice.pdf.incomplete_form', {
      hasPreview: !!previewElement,
      hasCompanyName: !!data.companyName,
      hasClientName: !!data.clientName,
    });
    return;
  }

  try {
    await generateInvoicePDF(previewElement, {
      invoiceNumber: data.invoiceNumber,
      companyName: data.companyName,
      companyEmail: data.companyEmail || '',
      companyPhone: data.companyPhone || '',
      clientName: data.clientName,
      clientEmail: data.clientEmail || '',
      clientPhone: data.clientPhone || '',
      items: data.items || [],
      notes: data.notes || '',
      terms: data.terms || '',
    });
  } catch (error) {
    logger.error('invoice.pdf.download_failed', {
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      isValidationError: error instanceof Error && error.message.includes('invalid characters'),
    });
    // Show error toast to user (implement toast UI as needed)
  }
};
```

3. Add `handlePrint` function (replaces any existing print logic):
```typescript
const handlePrint = () => {
  // Use native print dialog — safer than window.open + document.write
  // @media print CSS (below) hides form, shows preview only
  window.print();
};
```

4. Update button UI:
```tsx
<button
  onClick={handleDownloadPDF}
  className={cls(styles, "invoice-generator__btn")}
  disabled={!validation.valid}
>
  ⬇️ Download as PDF
</button>
<button
  onClick={handlePrint}
  className={cls(styles, "invoice-generator__btn")}
  disabled={!validation.valid}
>
  🖨️ Print
</button>
```

### Step 4: Add `@media print` CSS to `app/tools/invoice-generator/styles.css`

```css
/* Print stylesheet — hides form, shows invoice only */
@media print {
  /* Hide everything except invoice preview */
  .invoice-generator__header,
  .invoice-generator__form-section,
  .invoice-generator__actions,
  .invoice-generator__summary,
  .invoice-generator__footer {
    display: none;
  }

  /* Show preview full page */
  .invoice-generator__preview-section {
    display: block;
    margin: 0;
    padding: 0;
    box-shadow: none;
  }

  .invoice-generator__preview {
    page-break-inside: avoid;
    print-color-adjust: exact; /* Preserve colors in print */
  }

  /* Optimize for printing */
  body {
    background: white;
    color: black;
  }

  @page {
    margin: 0.5in;
    size: letter;
  }
}
```

### Step 5: Clean up pre-existing console.error calls (Zero-Tolerance Rule 1)

**Pre-existing failures found:**
- `app/tools/invoice-generator/lib/utils.ts` line 36: `console.error(...)`
- `app/tools/invoice-generator/lib/utils.ts` line 44: `console.error(...)`
- `app/tools/invoice-generator/page.tsx` line 99: `console.error(...)`

Replace all three with framework logger:
```typescript
// Before
console.error('message', error);

// After
logger.error('event.key', { /* context object */ });
```

## Unit Test File: `app/tools/invoice-generator/__tests__/pdf-generator.test.ts`

Create this file with comprehensive validation tests:

```typescript
import { validateInvoiceField, validateInvoiceNumber } from '../lib/pdf-generator';

describe('pdf-generator validation', () => {
  describe('validateInvoiceField', () => {
    it('accepts valid input: letters, numbers, spaces', () => {
      expect(validateInvoiceField('John Doe Company 123')).toBe(true);
    });

    it('accepts valid punctuation: hyphens, periods, commas, slashes', () => {
      expect(validateInvoiceField('John-Doe, Inc. 123 Main St/Apt 5')).toBe(true);
    });

    it('rejects HTML angle brackets', () => {
      expect(validateInvoiceField('<img src=x>')).toBe(false);
      expect(validateInvoiceField('hello<script>alert(1)</script>')).toBe(false);
      expect(validateInvoiceField('hello>world')).toBe(false);
    });

    it('rejects script tags and event handlers', () => {
      expect(validateInvoiceField('<script>alert(1)</script>')).toBe(false);
      expect(validateInvoiceField('<img src=x onerror=alert(1)>')).toBe(false);
      expect(validateInvoiceField('<svg onload=alert(1)>')).toBe(false);
    });

    it('rejects double quotes, single quotes, backticks', () => {
      expect(validateInvoiceField('hello "world"')).toBe(false);
      expect(validateInvoiceField("hello 'world'")).toBe(false);
      expect(validateInvoiceField('hello `world`')).toBe(false);
    });

    it('rejects ampersands (HTML entity prefix)', () => {
      expect(validateInvoiceField('R&D Department')).toBe(false);
    });

    it('rejects content exceeding maxLength', () => {
      const longString = 'a'.repeat(201);
      expect(validateInvoiceField(longString, 200)).toBe(false);
    });

    it('accepts empty string', () => {
      expect(validateInvoiceField('')).toBe(false); // empty is falsy
    });
  });

  describe('validateInvoiceNumber', () => {
    it('accepts alphanumeric, hyphens, underscores', () => {
      expect(validateInvoiceNumber('INV-2026-001')).toBe(true);
      expect(validateInvoiceNumber('inv_20260509')).toBe(true);
    });

    it('rejects slashes and dots', () => {
      expect(validateInvoiceNumber('INV/2026/001')).toBe(false);
      expect(validateInvoiceNumber('INV.2026.001')).toBe(false);
    });

    it('rejects spaces and special characters', () => {
      expect(validateInvoiceNumber('INV 001')).toBe(false);
      expect(validateInvoiceNumber('INV@001')).toBe(false);
    });

    it('rejects content exceeding 50 characters', () => {
      const longNumber = 'a'.repeat(51);
      expect(validateInvoiceNumber(longNumber)).toBe(false);
    });
  });
});
```

## Implementation Notes

- **Comprehensive Validation**: ALL text input fields (emails, phones, addresses, item descriptions, notes, terms) validated before rendering to canvas
- **Validation Regex**: Explicitly rejects `< > & " ' `` ` characters. Uses Unicode letter/number categories `\p{L}\p{N}` to support international names while preventing injection
- **Security**: Input validation happens BEFORE passing to `html2canvas`. No raw HTML from user inputs reaches the canvas
- **XSS Prevention**: The spec originally used `window.open() + document.write(innerHTML)` which is unsafe. We use `window.print()` with `@media print` CSS instead
- **Logging**: Uses framework logger, not `console.error`, per `rules/observability.md`. Error messages don't echo raw user input to logs (prevents stored XSS)
- **Zero-Tolerance Compliance**: Pre-existing `console.error` calls in `lib/utils.ts` and `page.tsx` removed in this todo (Rule 1)
- **PDF Library Choice**: `jsPDF` + `html2canvas` chosen (client-side) over server-side approach for instant generation, no network latency, and works offline
- **Filename Safety**: Invoice number regex-validated before use in filename
- **Print Method**: `window.print()` is the safest approach — uses browser's native print dialog
- **Dependency Pinning**: All dependencies pinned to specific versions (no `^` or `~`) to prevent supply chain surprises

## Testing Plan

### Functional Testing
1. Fill invoice form with valid data
2. Click "Download as PDF" → file downloads as `invoice-{number}.pdf`
3. Open PDF in viewer → all fields display correctly
4. Click "Print" → browser print dialog opens
5. In print preview → form hidden, invoice visible only

### Security Testing
1. Fill Company Name field with `<img src=x onerror=alert(1)>`
2. Try to download PDF → validation should reject with error
3. Fill with `<script>alert(1)</script>`
4. Try to download PDF → validation should reject
5. Check browser console → no JavaScript errors, no alerts

### Cross-Browser Testing
1. Test in Chrome/Edge (Chromium)
2. Test in Firefox
3. Test in Safari (if possible)
4. Verify PDF renders correctly in all browsers

## Dependencies

- Depends on: Todo 001 (header must be in place; invoice page includes Header)
- Can run in parallel with: Todo 002, Todo 004

## Next

→ After completion, run `/redteam` to validate PDF generation and security
