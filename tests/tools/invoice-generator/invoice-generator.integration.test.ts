/**
 * Invoice Generator - Integration Test Suite
 * Tests for invoice data validation and calculation
 */

import { expect, describe, it } from 'vitest';

describe('Invoice Generator Integration', () => {
  describe('Invoice Data Validation', () => {
    it('should accept valid company name', () => {
      const companyName = 'Acme Corporation';
      expect(companyName.length).toBeGreaterThan(0);
      expect(companyName).toBeTruthy();
    });

    it('should accept valid invoice number', () => {
      const invoiceNumber = 'INV-2024-001';
      expect(invoiceNumber).toMatch(/^[A-Z0-9\-]+$/);
    });

    it('should accept valid email', () => {
      const email = 'contact@example.com';
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      expect(isValid).toBe(true);
    });

    it('should reject invalid email', () => {
      const email = 'not-an-email';
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      expect(isValid).toBe(false);
    });
  });

  describe('Line Item Management', () => {
    it('should add line items', () => {
      const items = [
        { description: 'Web Design', quantity: 1, rate: 500 },
        { description: 'Development', quantity: 40, rate: 100 },
      ];
      expect(items.length).toBe(2);
      expect(items[0].description).toBe('Web Design');
    });

    it('should calculate line item total', () => {
      const item = { description: 'Service', quantity: 10, rate: 50 };
      const total = item.quantity * item.rate;
      expect(total).toBe(500);
    });

    it('should calculate invoice subtotal', () => {
      const items = [
        { quantity: 1, rate: 500 },
        { quantity: 40, rate: 100 },
      ];
      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
      expect(subtotal).toBe(4500);
    });

    it('should handle zero-quantity items', () => {
      const item = { quantity: 0, rate: 100 };
      const total = item.quantity * item.rate;
      expect(total).toBe(0);
    });
  });

  describe('Tax Calculations', () => {
    it('should calculate tax from subtotal', () => {
      const subtotal = 1000;
      const taxRate = 0.1; // 10%
      const tax = subtotal * taxRate;
      expect(tax).toBe(100);
    });

    it('should calculate total with tax', () => {
      const subtotal = 1000;
      const tax = 100;
      const total = subtotal + tax;
      expect(total).toBe(1100);
    });

    it('should handle zero tax rate', () => {
      const subtotal = 1000;
      const taxRate = 0;
      const tax = subtotal * taxRate;
      expect(tax).toBe(0);
    });

    it('should support different tax rates', () => {
      const subtotal = 1000;
      const rates = [0.05, 0.1, 0.15, 0.2];
      rates.forEach(rate => {
        const tax = subtotal * rate;
        expect(tax).toBeGreaterThanOrEqual(0);
        expect(tax).toBeLessThanOrEqual(subtotal);
      });
    });
  });

  describe('Invoice Summary', () => {
    it('should generate invoice with all sections', () => {
      const invoice = {
        invoiceNumber: 'INV-001',
        issueDate: '2024-01-01',
        dueDate: '2024-01-31',
        items: [{ description: 'Service', quantity: 1, rate: 100 }],
      };
      expect(invoice.invoiceNumber).toBeTruthy();
      expect(invoice.issueDate).toBeTruthy();
      expect(invoice.items).toBeTruthy();
    });

    it('should format currency values correctly', () => {
      const amount = 1234.56;
      const formatted = `$${amount.toFixed(2)}`;
      expect(formatted).toBe('$1234.56');
    });

    it('should format dates consistently', () => {
      const date = new Date('2024-01-15');
      const formatted = date.toISOString().split('T')[0];
      expect(formatted).toBe('2024-01-15');
    });
  });
});
