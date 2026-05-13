# Invoice Export Formats Specification

**Date**: 2026-05-09  
**Domain**: Invoice Generator Tool  
**Status**: DRAFT

## Current State

Invoice Generator tool (`app/tools/invoice-generator/`) currently:
- Generates text-based invoice in plain format
- Exports as `.txt` file (not practical for real-world use)
- No PDF option available

**Location**: `app/tools/invoice-generator/page.tsx` line 151
```typescript
const handleDownloadPDF = () => {
  const textInvoice = generateTextInvoice(data);
  downloadAsFile(textInvoice, `invoice-${data.invoiceNumber}.txt`);
};
```

## Requirements

### Primary Export Format: PDF

Invoices MUST be downloadable as PDF for professional use:

**Why PDF**:
1. **Professional appearance** — formatted, branded document
2. **Email-safe** — can be attached and sent without display issues
3. **Print-ready** — proper page breaks, margins, fonts
4. **Legally recognized** — accepted as official invoice
5. **User expectation** — "Download Invoice" implies PDF, not .txt

### Secondary Format: Print to Browser

Users should be able to print directly from browser:

```typescript
const handlePrint = () => {
  window.print();
};
```

**CSS**: `@media print { }` rules should hide form, buttons, show invoice only

## PDF Generation Approach

### Option 1: Client-Side Library (jsPDF)

**Package**: `jspdf` + `html2canvas` (popular, ~100KB gzipped)

```typescript
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

async function downloadInvoiceAsPDF(data: InvoiceData) {
  const element = document.getElementById('invoice-preview');
  const canvas = await html2canvas(element);
  const pdf = new jsPDF();
  const imgData = canvas.toDataURL('image/png');
  pdf.addImage(imgData, 'PNG', 10, 10, 190, 270);
  pdf.save(`invoice-${data.invoiceNumber}.pdf`);
}
```

**Pros**:
- No server dependency
- Instant download
- Works offline
- User controls styling

**Cons**:
- Client-side library adds to bundle (~100KB)
- Image-based PDF (not searchable text)
- Layout issues with dynamic content

### Option 2: Simple HTML to PDF (pdfkit-like)

**Package**: `html2pdf` or `pdf-lib` (~50KB)

```typescript
import html2pdf from 'html2pdf.js';

function downloadInvoiceAsPDF(data: InvoiceData) {
  const element = document.getElementById('invoice-preview');
  html2pdf().set(options).fromElement(element).save(`invoice-${data.invoiceNumber}.pdf`);
}
```

**Pros**:
- Simpler API
- Smaller bundle
- Mostly text-based

**Cons**:
- Still client-side (bundle increase)
- Layout may need tweaking

### Option 3: Server-Side PDF (puppeteer/wkhtmltopdf)

**Package**: `puppeteer` or external API

```typescript
// API endpoint
const generatePDF = async (invoiceHTML: string) => {
  // Server-side rendering to PDF
  // Return PDF file
};
```

**Pros**:
- Consistent rendering across browsers
- No bundle size impact
- Fine-grained control
- Branded fonts/colors guaranteed

**Cons**:
- Requires server infrastructure
- API latency (100-500ms)
- Scalability considerations

### Recommendation

**Use Option 1 (jsPDF + html2canvas)** because:

1. Tool is client-side (no server state)
2. Instant generation (no network latency)
3. User already on the page with invoice data
4. ~100KB gzipped is acceptable for this tool
5. Aligns with "no signup, offline-capable" UX

## PDF Layout Specification

### Document Structure

```
┌─────────────────────────────────────┐
│  Company Header                     │
│  Company Name, Address, Contact     │
├─────────────────────────────────────┤
│  INVOICE                            │
│                                     │
│  Invoice #: INV-001                 │
│  Invoice Date: 2026-05-09           │
│  Due Date: 2026-06-08               │
├─────────────────────────────────────┤
│  Bill To:                           │
│  Client Name                        │
│  Client Address                     │
├─────────────────────────────────────┤
│  Description    Qty    Rate    Amt  │
├─────────────────────────────────────┤
│  Item 1         1      $100   $100  │
│  Item 2         2      $50    $100  │
├─────────────────────────────────────┤
│                    Subtotal: $200   │
│                    Tax (10%): $20   │
│                    Total:    $220   │
├─────────────────────────────────────┤
│  Notes:                             │
│  Payment due within 30 days         │
│                                     │
│  Terms & Conditions:                │
│  [terms content]                    │
├─────────────────────────────────────┤
│  © 2026 Top AI Tool Rank            │
│  Generated with Invoice Generator   │
└─────────────────────────────────────┘
```

### Formatting Rules

**Fonts**:
- Heading: 14pt, Bold
- Body: 11pt, Regular
- Amounts: 11pt, Monospace (for alignment)

**Colors**:
- Company header accent: brand blue (#2563eb)
- Section dividers: light gray (#e5e7eb)
- Total row: bold, emphasis

**Spacing**:
- Page margins: 0.5 inches (12.7mm)
- Section spacing: 12pt
- Item rows: 6pt line height

**Page Breaks**:
- Keep invoice header + client info together
- Items can flow across pages if needed
- Footer always on last page

## Implementation Steps

### Phase 1: Add PDF Generation Library

1. Install dependency: `npm install jspdf html2canvas`
2. Create PDF helper: `app/tools/invoice-generator/lib/pdf-generator.ts`
3. Implement export function

### Phase 2: Input Validation (REQUIRED FOR SECURITY)

Before PDF/print rendering, validate all user input:

```typescript
// Validation rules for invoice fields
const validateInvoiceField = (value: string, maxLength: number = 200): boolean => {
  // Check length
  if (value.length > maxLength) return false;
  // Reject HTML/script content — allow only printable ASCII + basic unicode
  return /^[\p{L}\p{N}\p{P}\s\-\_\.\,]+$/u.test(value);
};

const validateInvoiceNumber = (value: string): boolean => {
  // Allow alphanumeric, hyphens, underscores only for filename safety
  return /^[a-zA-Z0-9_-]{1,50}$/.test(value);
};

// Apply before PDF/print rendering:
if (!validateInvoiceNumber(data.invoiceNumber)) {
  throw new Error('Invoice number contains invalid characters');
}
```

### Phase 3: Print Styling

1. Create print-specific CSS in `app/tools/invoice-generator/styles.css`
2. Hide all form controls
3. Show only invoice preview section
4. Optimize for 8.5" x 11" page

## Code Changes Required

### File: `app/tools/invoice-generator/lib/pdf-generator.ts` (NEW)

```typescript
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import logger from '@/app/lib/logger'; // use framework logger, not console

export async function generateInvoicePDF(
  invoiceHTML: HTMLElement,
  invoiceNumber: string
): Promise<void> {
  try {
    logger.info('pdf.generation.start', { invoiceNumber });
    
    const canvas = await html2canvas(invoiceHTML, {
      scale: 2,
      useCORS: true,
      logging: false,
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

    pdf.save(`invoice-${invoiceNumber}.pdf`);
    logger.info('pdf.generation.ok', { invoiceNumber });
  } catch (error) {
    logger.error('pdf.generation.failed', { invoiceNumber, error: String(error) });
    throw new Error('Could not generate PDF. Please try again.');
  }
}
```

### File: `app/tools/invoice-generator/page.tsx` (MODIFY)

```typescript
import { generateInvoicePDF } from './lib/pdf-generator';

// ... in component

const handleDownloadPDF = async () => {
  const previewElement = document.getElementById('invoice-preview');
  if (previewElement && validateInvoiceNumber(data.invoiceNumber)) {
    try {
      await generateInvoicePDF(previewElement, data.invoiceNumber);
    } catch (error) {
      // Show error toast to user
      setErrorMessage('Failed to generate PDF. Please try again.');
    }
  }
};

const handlePrint = () => {
  // Use native print dialog — safer than window.open + document.write
  // This uses @media print CSS (defined below) to hide form, show preview only
  window.print();
};

return (
  // ... form ...
  <button onClick={handleDownloadPDF} disabled={!validation.valid}>
    ⬇️ Download as PDF
  </button>
  <button onClick={handlePrint} disabled={!validation.valid}>
    🖨️ Print
  </button>
  // ... rest of component ...
);
```

### File: `app/tools/invoice-generator/styles.css` (ADD PRINT STYLES)

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
    print-color-adjust: exact;
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

## Security Requirements

### Input Validation (MUST)

All invoice fields MUST be validated before rendering:

1. **Length limits** — Company name, client name ≤ 200 chars
2. **Character restrictions** — No HTML, scripts, or shell metacharacters
3. **Invoice number** — Only `[a-zA-Z0-9_-]`, max 50 chars (safe for filenames)

Pattern: `validateInvoiceField(value, maxLength)` returns true/false

### Print Method (MUST)

Use `window.print()` with `@media print` CSS. **Do NOT use `window.open() + document.write()`** — this is an XSS vector if innerHTML contains user input.

### Logging (MUST)

Use framework logger for PDF generation errors, not `console.error`. Error messages to user must NOT expose internal details.

### Bundle Security (SHOULD)

Pin exact versions of jsPDF and html2canvas in package.json to prevent supply chain attacks.

## Testing Checklist

- [ ] PDF downloads successfully
- [ ] PDF filename includes invoice number
- [ ] PDF displays on desktop and mobile viewers
- [ ] PDF is searchable (text-based, not image)
- [ ] Print preview shows invoice only (no form)
- [ ] Page breaks are correct for multi-page invoices
- [ ] Fonts and colors match design
- [ ] Bundle size increase acceptable (~100KB gzipped)
- [ ] No console errors during PDF generation

## Rollback Plan

If PDF generation fails or causes issues:

1. Temporarily revert to `.txt` export
2. Disable download button with message: "PDF download temporarily unavailable"
3. Provide manual print option as fallback
4. Log error for debugging

## Success Metrics

1. Users can download invoices as PDF
2. PDF is professional-looking and printable
3. No increase in support requests about invoice format
4. Bundle size impact < 150KB gzipped

---

**Status**: SPECIFICATION — Ready for implementation
