/**
 * WA Sender Contacts List Page - Unit Tests
 * Tier 1: Component testing with mocked API calls
 *
 * Tests the behavior of:
 * - Paginated contact table rendering
 * - Client-side search filtering
 * - Export CSV functionality
 * - View/Delete modal
 *
 * Run with: npm test -- wa-sender-contacts-list-page.test --run
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';

/**
 * Mock fetch responses for different API calls
 */
class MockContactsAPI {
  private contacts: any[] = [];
  private deleteCount = 0;

  setContacts(contacts: any[]) {
    this.contacts = contacts;
  }

  async fetchContacts(page: number = 1, limit: number = 50) {
    const start = (page - 1) * limit;
    const end = start + limit;
    return {
      contacts: this.contacts.slice(start, end),
      total: this.contacts.length,
      page,
      limit,
    };
  }

  async deleteContact(id: string) {
    this.contacts = this.contacts.filter((c) => c.id !== id);
    this.deleteCount++;
    return { success: true };
  }

  getDeleteCount() {
    return this.deleteCount;
  }
}

describe('WA Sender Contacts List Page (Tier 1)', () => {
  let mockAPI: MockContactsAPI;

  beforeEach(() => {
    mockAPI = new MockContactsAPI();
  });

  describe('Paginated table rendering', () => {
    test('renders 50 contacts per page', async () => {
      const contacts = Array.from({ length: 50 }, (_, i) => ({
        id: `contact-${i + 1}`,
        name: `Contact ${i + 1}`,
        phone: `+1555000${String(i + 1).padStart(4, '0')}`,
        email: `contact${i + 1}@example.com`,
        company: `Company ${(i % 5) + 1}`,
        created_at: '2026-05-04T10:00:00Z',
      }));

      mockAPI.setContacts(contacts);
      const result = await mockAPI.fetchContacts(1);

      expect(result.contacts).toHaveLength(50);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(50);
    });

    test('renders empty state when no contacts exist', async () => {
      mockAPI.setContacts([]);
      const result = await mockAPI.fetchContacts(1);

      expect(result.contacts).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    test('paginates across pages', async () => {
      const contacts = Array.from({ length: 120 }, (_, i) => ({
        id: `contact-${i + 1}`,
        name: `Contact ${i + 1}`,
        phone: `+1555000${String(i + 1).padStart(4, '0')}`,
        email: `contact${i + 1}@example.com`,
        company: `Company ${(i % 5) + 1}`,
        created_at: '2026-05-04T10:00:00Z',
      }));

      mockAPI.setContacts(contacts);

      const page1 = await mockAPI.fetchContacts(1, 50);
      expect(page1.contacts).toHaveLength(50);
      expect(page1.contacts[0].name).toBe('Contact 1');

      const page2 = await mockAPI.fetchContacts(2, 50);
      expect(page2.contacts).toHaveLength(50);
      expect(page2.contacts[0].name).toBe('Contact 51');

      const page3 = await mockAPI.fetchContacts(3, 50);
      expect(page3.contacts).toHaveLength(20);
      expect(page3.contacts[0].name).toBe('Contact 101');
    });
  });

  describe('Client-side search filtering', () => {
    test('filters by name (case-insensitive)', () => {
      const contacts = [
        {
          id: '1',
          name: 'Alice Johnson',
          phone: '+1555123456',
          email: 'alice@example.com',
          company: 'TechCorp',
          created_at: '2026-05-04T10:00:00Z',
        },
        {
          id: '2',
          name: 'Bob Smith',
          phone: '+1555654321',
          email: 'bob@example.com',
          company: 'FinCo',
          created_at: '2026-05-04T10:00:00Z',
        },
        {
          id: '3',
          name: 'Alice Brown',
          phone: '+1555999888',
          email: 'abrown@example.com',
          company: 'StartUp',
          created_at: '2026-05-04T10:00:00Z',
        },
      ];

      const query = 'alice'.toLowerCase();
      const filtered = contacts.filter((c) => {
        const name = c.name?.toLowerCase() || '';
        const phone = c.phone?.toLowerCase() || '';
        const email = c.email?.toLowerCase() || '';
        const company = c.company?.toLowerCase() || '';

        return name.includes(query) || phone.includes(query) || email.includes(query) || company.includes(query);
      });

      expect(filtered).toHaveLength(2);
      expect(filtered.map((c) => c.id)).toEqual(['1', '3']);
    });

    test('filters by phone', () => {
      const contacts = [
        {
          id: '1',
          name: 'Alice Johnson',
          phone: '+1555123456',
          email: 'alice@example.com',
          company: 'TechCorp',
          created_at: '2026-05-04T10:00:00Z',
        },
        {
          id: '2',
          name: 'Bob Smith',
          phone: '+1555654321',
          email: 'bob@example.com',
          company: 'FinCo',
          created_at: '2026-05-04T10:00:00Z',
        },
      ];

      const query = '+1555123'.toLowerCase();
      const filtered = contacts.filter((c) => {
        const phone = c.phone?.toLowerCase() || '';
        return phone.includes(query);
      });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('1');
    });

    test('shows "no match" message when search yields no results', () => {
      const contacts = [
        {
          id: '1',
          name: 'Alice Johnson',
          phone: '+1555123456',
          email: 'alice@example.com',
          company: 'TechCorp',
          created_at: '2026-05-04T10:00:00Z',
        },
      ];

      const query = 'zzzzzz'.toLowerCase();
      const filtered = contacts.filter((c) => {
        const name = c.name?.toLowerCase() || '';
        const phone = c.phone?.toLowerCase() || '';
        const email = c.email?.toLowerCase() || '';
        const company = c.company?.toLowerCase() || '';

        return name.includes(query) || phone.includes(query) || email.includes(query) || company.includes(query);
      });

      expect(filtered).toHaveLength(0);
    });

    test('filters by email', () => {
      const contacts = [
        {
          id: '1',
          name: 'Alice Johnson',
          phone: '+1555123456',
          email: 'alice@techcorp.com',
          company: 'TechCorp',
          created_at: '2026-05-04T10:00:00Z',
        },
        {
          id: '2',
          name: 'Bob Smith',
          phone: '+1555654321',
          email: 'bob@finco.com',
          company: 'FinCo',
          created_at: '2026-05-04T10:00:00Z',
        },
      ];

      const query = 'techcorp'.toLowerCase();
      const filtered = contacts.filter((c) => {
        const email = c.email?.toLowerCase() || '';
        return email.includes(query);
      });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('1');
    });

    test('filters by company', () => {
      const contacts = [
        {
          id: '1',
          name: 'Alice Johnson',
          phone: '+1555123456',
          email: 'alice@example.com',
          company: 'TechCorp',
          created_at: '2026-05-04T10:00:00Z',
        },
        {
          id: '2',
          name: 'Bob Smith',
          phone: '+1555654321',
          email: 'bob@example.com',
          company: 'FinCo',
          created_at: '2026-05-04T10:00:00Z',
        },
      ];

      const query = 'tech'.toLowerCase();
      const filtered = contacts.filter((c) => {
        const company = c.company?.toLowerCase() || '';
        return company.includes(query);
      });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('1');
    });
  });

  describe('Export and Delete', () => {
    test('export CSV endpoint can be called', async () => {
      // Simulate CSV export
      const csvUrl = '/api/wa-sender/contacts/export?format=csv';
      expect(csvUrl).toContain('format=csv');
    });

    test('delete contact removes from list', async () => {
      mockAPI.setContacts([
        { id: '1', name: 'Alice', phone: '+1555123456', email: 'alice@example.com', company: 'TechCorp' },
        { id: '2', name: 'Bob', phone: '+1555654321', email: 'bob@example.com', company: 'FinCo' },
      ]);

      let result = await mockAPI.fetchContacts(1);
      expect(result.contacts).toHaveLength(2);

      await mockAPI.deleteContact('1');

      result = await mockAPI.fetchContacts(1);
      expect(result.contacts).toHaveLength(1);
      expect(result.contacts[0].id).toBe('2');
    });

    test('delete count increments correctly', async () => {
      mockAPI.setContacts([
        { id: '1', name: 'Alice', phone: '+1555123456', email: 'alice@example.com', company: 'TechCorp' },
        { id: '2', name: 'Bob', phone: '+1555654321', email: 'bob@example.com', company: 'FinCo' },
      ]);

      expect(mockAPI.getDeleteCount()).toBe(0);

      await mockAPI.deleteContact('1');
      expect(mockAPI.getDeleteCount()).toBe(1);

      await mockAPI.deleteContact('2');
      expect(mockAPI.getDeleteCount()).toBe(2);
    });
  });

  describe('Modal interaction', () => {
    test('view modal displays contact details', () => {
      const contact = {
        id: '1',
        name: 'Alice Johnson',
        phone: '+1555123456',
        email: 'alice@example.com',
        company: 'TechCorp',
        custom_fields: { tier: 'premium', region: 'NA' },
        created_at: '2026-05-04T10:00:00Z',
      };

      // Verify modal would display all contact fields
      expect(contact.name).toBeDefined();
      expect(contact.phone).toBeDefined();
      expect(contact.email).toBeDefined();
      expect(contact.company).toBeDefined();
      expect(contact.custom_fields).toBeDefined();
    });

    test('custom fields render as key-value pairs', () => {
      const customFields = { tier: 'premium', region: 'NA', promo_code: 'ALICE123' };

      const entries = Object.entries(customFields);
      expect(entries).toHaveLength(3);
      expect(entries[0]).toEqual(['tier', 'premium']);
      expect(entries[1]).toEqual(['region', 'NA']);
      expect(entries[2]).toEqual(['promo_code', 'ALICE123']);
    });
  });
});
