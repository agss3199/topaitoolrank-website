import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import logger from '@/app/lib/logger';

/**
 * Validate a general invoice text field.
 * Allows: Unicode letters, numbers, spaces, hyphens, underscores, periods, slashes, commas, colons, parentheses, plus, at-sign, newlines.
 * Explicitly rejects: < > & " ' ` (HTML/script-significant characters).
 */
export function validateInvoiceField(value: string, maxLength: number = 200): boolean {
  if (!value || value.length > maxLength) return false;
  // Reject HTML-dangerous characters explicitly
  if (/[<>"'`&]/.test(value)) return false;
  // Allow safe characters: Unicode letters/numbers, whitespace, common punctuation
  return /^[\p{L}\p{N}\s\-_./,:()+@\n\r]+$/u.test(value);
}

/**
 * Validate invoice number for filename safety.
 * Allows only alphanumeric, hyphens, underscores (1-50 chars).
 */
export function validateInvoiceNumber(value: string): boolean {
  return /^[a-zA-Z0-9_-]{1,50}$/.test(value);
}

export interface InvoicePDFData {
  invoiceNumber: string;
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  items: Array<{ description: string; quantity: number | string; rate: number | string }>;
  notes?: string;
  terms?: string;
}

export async function generateInvoicePDF(
  invoiceHTML: HTMLElement,
  invoiceData: InvoicePDFData
): Promise<void> {
  // Validate all inputs before processing
  if (!validateInvoiceNumber(invoiceData.invoiceNumber)) {
    throw new Error('Invoice number contains invalid characters');
  }

  const fieldsToValidate: Array<{ name: string; value: string }> = [
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

  try {
    logger.info('pdf.generation.start', { invoiceNumber: invoiceData.invoiceNumber });

    const canvas = await html2canvas(invoiceHTML, {
      scale: 2,
      useCORS: true,
      logging: false,
      allowTaint: false,
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
    const imgData = canvas.toDataURL('image/png');

    while (remainingHeight > 0) {
      const pageHeight = pdfHeight - 20;
      pdf.addImage(imgData, 'PNG', 10, yPosition, imgWidth, imgHeight);

      if (remainingHeight > pageHeight) {
        remainingHeight -= pageHeight;
        yPosition = -pageHeight;
        pdf.addPage();
      } else {
        remainingHeight = 0;
      }
    }

    pdf.save(`invoice-${invoiceData.invoiceNumber}.pdf`);
    logger.info('pdf.generation.ok', { invoiceNumber: invoiceData.invoiceNumber });
  } catch (error) {
    logger.error('pdf.generation.failed', {
      invoiceNumber: invoiceData.invoiceNumber || 'unknown',
      errorType: error instanceof Error ? error.constructor.name : typeof error,
    });
    throw new Error('Could not generate PDF. Please try again.');
  }
}
