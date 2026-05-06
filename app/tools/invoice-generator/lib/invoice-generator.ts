/**
 * Invoice Generator - Core Logic
 * Generate and export professional invoices as PDF
 */

export interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
}

export interface InvoiceData {
  // Company info
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  companyAddress: string;

  // Invoice details
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;

  // Client info
  clientName: string;
  clientEmail: string;
  clientAddress: string;

  // Items
  items: InvoiceItem[];

  // Additional
  notes?: string;
  terms?: string;
  taxRate?: number; // percentage
}

/**
 * Calculate subtotal of invoice items
 */
export function calculateSubtotal(items: InvoiceItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
}

/**
 * Calculate tax amount
 */
export function calculateTax(subtotal: number, taxRate: number = 0): number {
  return (subtotal * taxRate) / 100;
}

/**
 * Calculate total amount due
 */
export function calculateTotal(subtotal: number, tax: number): number {
  return subtotal + tax;
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency: string = "USD"): string {
  const symbols: { [key: string]: string } = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    INR: "₹",
  };

  const symbol = symbols[currency] || "$";
  return `${symbol}${amount.toFixed(2)}`;
}

/**
 * Format date
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

/**
 * Validate invoice data
 */
export function validateInvoiceData(data: InvoiceData): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Company info validation
  if (!data.companyName?.trim()) errors.push("Company name is required");
  if (!data.companyEmail?.trim()) errors.push("Company email is required");

  // Invoice details validation
  if (!data.invoiceNumber?.trim()) errors.push("Invoice number is required");
  if (!data.invoiceDate) errors.push("Invoice date is required");
  if (!data.dueDate) errors.push("Due date is required");

  const invoiceDate = new Date(data.invoiceDate);
  const dueDate = new Date(data.dueDate);
  if (dueDate < invoiceDate) {
    errors.push("Due date must be after invoice date");
  }

  // Client info validation
  if (!data.clientName?.trim()) errors.push("Client name is required");
  if (!data.clientEmail?.trim()) errors.push("Client email is required");

  // Items validation
  if (!data.items || data.items.length === 0) {
    errors.push("At least one invoice item is required");
  }

  for (const item of data.items) {
    if (!item.description?.trim()) errors.push("Item description is required");
    if (item.quantity <= 0) errors.push("Item quantity must be greater than 0");
    if (item.rate < 0) errors.push("Item rate cannot be negative");
  }

  // Tax validation
  if (data.taxRate !== undefined) {
    if (data.taxRate < 0 || data.taxRate > 100) {
      errors.push("Tax rate must be between 0 and 100");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate CSV export of invoice
 */
export function generateCSVExport(data: InvoiceData): string {
  const lines: string[] = [];

  // Header
  lines.push("INVOICE");
  lines.push("");

  // Company info
  lines.push("FROM:");
  lines.push(`${data.companyName},${data.companyEmail},${data.companyPhone}`);
  lines.push(`${data.companyAddress}`);
  lines.push("");

  // Invoice details
  lines.push("TO:");
  lines.push(`${data.clientName},${data.clientEmail}`);
  lines.push(`${data.clientAddress}`);
  lines.push("");

  // Invoice details
  lines.push(`Invoice Number,${data.invoiceNumber}`);
  lines.push(`Invoice Date,${data.invoiceDate}`);
  lines.push(`Due Date,${data.dueDate}`);
  lines.push("");

  // Items
  lines.push("Description,Quantity,Rate,Amount");
  const subtotal = calculateSubtotal(data.items);
  for (const item of data.items) {
    const amount = item.quantity * item.rate;
    lines.push(
      `"${item.description}",${item.quantity},${item.rate.toFixed(2)},${amount.toFixed(2)}`
    );
  }
  lines.push("");

  // Totals
  const tax = calculateTax(subtotal, data.taxRate);
  const total = calculateTotal(subtotal, tax);

  lines.push(`Subtotal,,${subtotal.toFixed(2)}`);
  if (data.taxRate && data.taxRate > 0) {
    lines.push(`Tax (${data.taxRate}%),,${tax.toFixed(2)}`);
  }
  lines.push(`Total,,${total.toFixed(2)}`);

  if (data.notes) {
    lines.push("");
    lines.push("Notes:");
    lines.push(data.notes);
  }

  return lines.join("\n");
}

/**
 * Generate plain text invoice
 */
export function generateTextInvoice(data: InvoiceData): string {
  const subtotal = calculateSubtotal(data.items);
  const tax = calculateTax(subtotal, data.taxRate);
  const total = calculateTotal(subtotal, tax);

  let text = `INVOICE\n`;
  text += `${"=".repeat(60)}\n\n`;

  text += `FROM:\n${data.companyName}\n${data.companyEmail}\n${data.companyPhone}\n${data.companyAddress}\n\n`;

  text += `TO:\n${data.clientName}\n${data.clientEmail}\n${data.clientAddress}\n\n`;

  text += `Invoice #: ${data.invoiceNumber}\n`;
  text += `Date: ${formatDate(data.invoiceDate)}\n`;
  text += `Due: ${formatDate(data.dueDate)}\n\n`;

  text += `ITEMS:\n${"-".repeat(60)}\n`;
  text += `Description                          Qty    Rate    Amount\n`;
  text += `${"-".repeat(60)}\n`;

  for (const item of data.items) {
    const amount = item.quantity * item.rate;
    const desc = item.description.substring(0, 35).padEnd(35);
    text += `${desc} ${String(item.quantity).padStart(4)} ${String(item.rate.toFixed(2)).padStart(6)} ${String(amount.toFixed(2)).padStart(9)}\n`;
  }

  text += `${"-".repeat(60)}\n`;
  text += `Subtotal: ${formatCurrency(subtotal)}\n`;

  if (data.taxRate && data.taxRate > 0) {
    text += `Tax (${data.taxRate}%): ${formatCurrency(tax)}\n`;
  }

  text += `${"=".repeat(60)}\n`;
  text += `TOTAL: ${formatCurrency(total)}\n`;
  text += `${"=".repeat(60)}\n`;

  if (data.notes) {
    text += `\nNOTES:\n${data.notes}\n`;
  }

  if (data.terms) {
    text += `\nTERMS & CONDITIONS:\n${data.terms}\n`;
  }

  return text;
}

/**
 * Calculate invoice statistics
 */
export function getInvoiceStats(data: InvoiceData): {
  itemCount: number;
  subtotal: number;
  tax: number;
  total: number;
  daysUntilDue: number;
} {
  const subtotal = calculateSubtotal(data.items);
  const tax = calculateTax(subtotal, data.taxRate);
  const total = calculateTotal(subtotal, tax);

  const dueDate = new Date(data.dueDate);
  const today = new Date();
  const daysUntilDue = Math.ceil(
    (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    itemCount: data.items.length,
    subtotal,
    tax,
    total,
    daysUntilDue,
  };
}
