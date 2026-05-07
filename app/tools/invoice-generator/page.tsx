"use client";

export const dynamic = 'force-dynamic';
export const dynamicParams = false;

import { useState, useEffect, useMemo } from "react";
import styles from "./styles.css";
import {
  calculateSubtotal,
  calculateTax,
  calculateTotal,
  formatCurrency,
  formatDate,
  generateTextInvoice,
  validateInvoiceData,
  type InvoiceData,
  type InvoiceItem,
} from "./lib/invoice-generator";
import {
  downloadAsFile,
  generateInvoiceNumber,
  formatDateForInput,
  getDateNDaysFromNow,
  saveTolocalStorage,
  loadFromlocalStorage,
} from "./lib/utils";
import { cls } from "../lib/css-module-safe";

const LOCALSTORAGE_KEY = "ig-data";

export default function InvoiceGeneratorPage() {
  const [data, setData] = useState<InvoiceData>({
    companyName: "",
    companyEmail: "",
    companyPhone: "",
    companyAddress: "",
    invoiceNumber: generateInvoiceNumber(),
    invoiceDate: formatDateForInput(new Date()),
    dueDate: getDateNDaysFromNow(30),
    clientName: "",
    clientEmail: "",
    clientAddress: "",
    items: [{ description: "", quantity: 1, rate: 0 }],
    notes: "",
    terms: "",
    taxRate: 0,
  });

  const [showPreview, setShowPreview] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const saved = loadFromlocalStorage(LOCALSTORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setData(parsed);
      } catch {
        // Invalid JSON, use defaults
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    saveTolocalStorage(LOCALSTORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const validation = useMemo(() => validateInvoiceData(data), [data]);

  const stats = useMemo(() => {
    const subtotal = calculateSubtotal(data.items);
    const tax = calculateTax(subtotal, data.taxRate);
    const total = calculateTotal(subtotal, tax);
    return { subtotal, tax, total };
  }, [data.items, data.taxRate]);

  const handleCompanyChange = (field: keyof InvoiceData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleInvoiceChange = (field: keyof InvoiceData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleClientChange = (field: keyof InvoiceData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (
    index: number,
    field: keyof InvoiceItem,
    value: string | number
  ) => {
    const newItems = [...data.items];
    if (field === "quantity" || field === "rate") {
      newItems[index] = { ...newItems[index], [field]: Number(value) };
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    setData(prev => ({ ...prev, items: newItems }));
  };

  const handleAddItem = () => {
    setData(prev => ({
      ...prev,
      items: [...prev.items, { description: "", quantity: 1, rate: 0 }],
    }));
  };

  const handleRemoveItem = (index: number) => {
    setData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleDownloadPDF = () => {
    const textInvoice = generateTextInvoice(data);
    downloadAsFile(textInvoice, `invoice-${data.invoiceNumber}.txt`);
  };

  return (
    <div className={cls(styles, "invoice-generator")}>
      <header className={cls(styles, "invoice-generator__header")}>
        <h1>Invoice Generator</h1>
        <p>Create and download professional invoices</p>
      </header>

      <main className={cls(styles, "invoice-generator__main")}>
        <div className={cls(styles, "invoice-generator__container")}>
          {/* Form section */}
          <section className={cls(styles, "invoice-generator__form-section")}>
            {/* Company Info */}
            <fieldset className={cls(styles, "invoice-generator__fieldset")}>
              <legend className={cls(styles, "invoice-generator__legend")}>Company Information</legend>
              <div className={cls(styles, "invoice-generator__field-grid")}>
                <input
                  type="text"
                  placeholder="Company Name *"
                  value={data.companyName}
                  onChange={e => handleCompanyChange("companyName", e.target.value)}
                  className={cls(styles, "invoice-generator__input")}
                />
                <input
                  type="email"
                  placeholder="Company Email *"
                  value={data.companyEmail}
                  onChange={e => handleCompanyChange("companyEmail", e.target.value)}
                  className={cls(styles, "invoice-generator__input")}
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={data.companyPhone}
                  onChange={e => handleCompanyChange("companyPhone", e.target.value)}
                  className={cls(styles, "invoice-generator__input")}
                />
                <textarea
                  placeholder="Address"
                  value={data.companyAddress}
                  onChange={e => handleCompanyChange("companyAddress", e.target.value)}
                  className={cls(styles, "invoice-generator__textarea")}
                />
              </div>
            </fieldset>

            {/* Invoice Details */}
            <fieldset className={cls(styles, "invoice-generator__fieldset")}>
              <legend className={cls(styles, "invoice-generator__legend")}>Invoice Details</legend>
              <div className={cls(styles, "invoice-generator__field-grid")}>
                <input
                  type="text"
                  placeholder="Invoice Number *"
                  value={data.invoiceNumber}
                  onChange={e => handleInvoiceChange("invoiceNumber", e.target.value)}
                  className={cls(styles, "invoice-generator__input")}
                />
                <input
                  type="date"
                  value={data.invoiceDate}
                  onChange={e => handleInvoiceChange("invoiceDate", e.target.value)}
                  className={cls(styles, "invoice-generator__input")}
                />
                <input
                  type="date"
                  value={data.dueDate}
                  onChange={e => handleInvoiceChange("dueDate", e.target.value)}
                  className={cls(styles, "invoice-generator__input")}
                />
              </div>
            </fieldset>

            {/* Client Info */}
            <fieldset className={cls(styles, "invoice-generator__fieldset")}>
              <legend className={cls(styles, "invoice-generator__legend")}>Client Information</legend>
              <div className={cls(styles, "invoice-generator__field-grid")}>
                <input
                  type="text"
                  placeholder="Client Name *"
                  value={data.clientName}
                  onChange={e => handleClientChange("clientName", e.target.value)}
                  className={cls(styles, "invoice-generator__input")}
                />
                <input
                  type="email"
                  placeholder="Client Email *"
                  value={data.clientEmail}
                  onChange={e => handleClientChange("clientEmail", e.target.value)}
                  className={cls(styles, "invoice-generator__input")}
                />
                <textarea
                  placeholder="Client Address *"
                  value={data.clientAddress}
                  onChange={e => handleClientChange("clientAddress", e.target.value)}
                  className={cls(styles, "invoice-generator__textarea")}
                />
              </div>
            </fieldset>

            {/* Items */}
            <fieldset className={cls(styles, "invoice-generator__fieldset")}>
              <legend className={cls(styles, "invoice-generator__legend")}>Line Items</legend>
              <div className={cls(styles, "invoice-generator__items")}>
                {data.items.map((item, idx) => (
                  <div key={idx} className={cls(styles, "invoice-generator__item")}>
                    <input
                      type="text"
                      placeholder="Description *"
                      value={item.description}
                      onChange={e => handleItemChange(idx, "description", e.target.value)}
                      className={cls(styles, "invoice-generator__input")}
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={e => handleItemChange(idx, "quantity", e.target.value)}
                      className={cls(styles, "invoice-generator__input-number")}
                      min="0"
                    />
                    <input
                      type="number"
                      placeholder="Rate"
                      value={item.rate}
                      onChange={e => handleItemChange(idx, "rate", e.target.value)}
                      className={cls(styles, "invoice-generator__input-number")}
                      min="0"
                      step="0.01"
                    />
                    <span className={cls(styles, "invoice-generator__amount")}>
                      {formatCurrency(item.quantity * item.rate)}
                    </span>
                    {data.items.length > 1 && (
                      <button
                        onClick={() => handleRemoveItem(idx)}
                        className={cls(styles, "invoice-generator__remove-item-btn")}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={handleAddItem}
                className={cls(styles, "invoice-generator__add-item-btn")}
              >
                + Add Item
              </button>
            </fieldset>

            {/* Tax & Notes */}
            <fieldset className={cls(styles, "invoice-generator__fieldset")}>
              <legend className={cls(styles, "invoice-generator__legend")}>Additional</legend>
              <div className={cls(styles, "invoice-generator__field-grid")}>
                <input
                  type="number"
                  placeholder="Tax Rate (%)"
                  value={data.taxRate || ""}
                  onChange={e => handleInvoiceChange("taxRate", e.target.value || "0")}
                  className={cls(styles, "invoice-generator__input")}
                  min="0"
                  max="100"
                  step="0.01"
                />
              </div>
              <textarea
                placeholder="Notes (optional)"
                value={data.notes}
                onChange={e => handleInvoiceChange("notes", e.target.value)}
                className={cls(styles, "invoice-generator__textarea")}
              />
              <textarea
                placeholder="Terms & Conditions (optional)"
                value={data.terms}
                onChange={e => handleInvoiceChange("terms", e.target.value)}
                className={cls(styles, "invoice-generator__textarea")}
              />
            </fieldset>

            {!validation.valid && (
              <div className={cls(styles, "invoice-generator__errors")}>
                {validation.errors.map((error, idx) => (
                  <p key={idx}>✕ {error}</p>
                ))}
              </div>
            )}

            <div className={cls(styles, "invoice-generator__actions")}>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className={cls(styles, "invoice-generator__btn")}
                disabled={!validation.valid}
              >
                {showPreview ? "Hide" : "Show"} Preview
              </button>
              <button
                onClick={handleDownloadPDF}
                className={cls(styles, "invoice-generator__btn")}
                disabled={!validation.valid}
              >
                ⬇️ Download Invoice
              </button>
            </div>
          </section>

          {/* Preview section */}
          {showPreview && validation.valid && (
            <section className={cls(styles, "invoice-generator__preview-section")}>
              <h2 className={cls(styles, "invoice-generator__preview-title")}>Preview</h2>
              <div className={cls(styles, "invoice-generator__preview")}>
                <pre className={cls(styles, "invoice-generator__preview-text")}>
                  {generateTextInvoice(data)}
                </pre>
              </div>
            </section>
          )}
        </div>

        {/* Summary */}
        {validation.valid && (
          <aside className={cls(styles, "invoice-generator__summary")}>
            <h3>Summary</h3>
            <div className={cls(styles, "invoice-generator__summary-item")}>
              <span>Items:</span>
              <span>{data.items.length}</span>
            </div>
            <div className={cls(styles, "invoice-generator__summary-item")}>
              <span>Subtotal:</span>
              <span>{formatCurrency(stats.subtotal)}</span>
            </div>
            {data.taxRate > 0 && (
              <div className={cls(styles, "invoice-generator__summary-item")}>
                <span>Tax ({data.taxRate}%):</span>
                <span>{formatCurrency(stats.tax)}</span>
              </div>
            )}
            <div className={cls(styles, "invoice-generator__summary-total")}>
              <span>Total:</span>
              <span>{formatCurrency(stats.total)}</span>
            </div>
          </aside>
        )}
      </main>

      <footer className={cls(styles, "invoice-generator__footer")}>
        <p>
          <small>
            Free tool by{" "}
            <a href="/" className={cls(styles, "invoice-generator__link")}>
              topaitoolrank.com
            </a>
          </small>
        </p>
      </footer>
    </div>
  );
}

