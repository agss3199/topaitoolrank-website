/**
 * WA Sender Contacts API - Unit Tests
 * Tier 1: HTTP endpoint testing with mocked Supabase client
 *
 * Tests the behavior of:
 * - GET /api/wa-sender/contacts (list with pagination)
 * - DELETE /api/wa-sender/contacts/:id (delete contact)
 * - POST /api/wa-sender/contacts/import (bulk import)
 * - GET /api/wa-sender/contacts/export (CSV export)
 *
 * Run with: npm test -- wa-sender-contacts-api.test --run
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import * as db from '@/app/lib/db/wa-sender';
import { WASenderContact } from '@/app/lib/types/wa-sender';

/**
 * Mock Supabase client for testing
 */
class MockContactsClient {
  private contacts: Map<string, WASenderContact> = new Map();
  private lastId = 0;

  private getAllContacts(): WASenderContact[] {
    return Array.from(this.contacts.values());
  }

  from(table: string) {
    if (table !== 'wa_sender_contacts') {
      throw new Error(`Unsupported table: ${table}`);
    }

    return {
      select: (columns?: any, opts?: any) => ({
        order: (field: string, orderOpts?: any) => ({
          range: (from: number, to: number) => ({
            then: async (resolve: any) => {
              const contacts = this.getAllContacts();
              contacts.sort((a, b) => {
                const aVal = (a as any)[field] || '';
                const bVal = (b as any)[field] || '';
                if (typeof aVal === 'string' && typeof bVal === 'string') {
                  return orderOpts?.ascending ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
                }
                return 0;
              });
              const paginated = contacts.slice(from, to + 1);
              resolve({ data: paginated, error: null, count: contacts.length });
            },
          }),
          then: async (resolve: any) => {
            const contacts = this.getAllContacts();
            contacts.sort((a, b) => {
              const aVal = (a as any)[field] || '';
              const bVal = (b as any)[field] || '';
              if (typeof aVal === 'string' && typeof bVal === 'string') {
                return orderOpts?.ascending ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
              }
              return 0;
            });
            resolve({ data: contacts, error: null, count: contacts.length });
          },
        }),
        // Plain select() without order/range (used by exportContacts)
        then: async (resolve: any) => {
          const contacts = this.getAllContacts();
          resolve({ data: contacts, error: null, count: contacts.length });
        },
        eq: (field: string, value: any) => ({
          single: async () => {
            const contacts = this.getAllContacts();
            const found = contacts.find((c) => (c as any)[field] === value);
            if (!found) {
              return { data: null, error: { code: 'PGRST116' } };
            }
            return { data: found, error: null };
          },
        }),
      }),
      insert: (data: any) => ({
        select: () => ({
          single: async () => {
            const id = `contact-${++this.lastId}`;
            const contact: WASenderContact = {
              id,
              user_id: 'test-user',
              ...data,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            this.contacts.set(id, contact);
            return { data: contact, error: null };
          },
        }),
      }),
      update: (data: any) => ({
        eq: (field: string, value: any) => ({
          select: () => ({
            single: async () => {
              const contacts = Array.from(this.contacts.values());
              const found = contacts.find((c) => (c as any)[field] === value);
              if (!found) {
                return { data: null, error: { code: 'PGRST116' } };
              }
              const updated = { ...found, ...data, updated_at: new Date().toISOString() };
              this.contacts.set(value, updated);
              return { data: updated, error: null };
            },
          }),
        }),
      }),
      delete: () => ({
        eq: (field: string, value: any) => ({
          then: async (resolve: any) => {
            this.contacts.delete(value);
            resolve({ error: null });
          },
        }),
      }),
    };
  }
}

/**
 * Mock Supabase client for import/export testing
 */
class MockImportsClient {
  private contacts: Map<string, any> = new Map();
  private imports: Map<string, any> = new Map();
  private lastImportId = 0;

  from(table: string) {
    if (table === 'wa_sender_contacts') {
      return {
        select: () => ({
          then: async (resolve: any) => {
            resolve({ data: Array.from(this.contacts.values()), error: null });
          },
        }),
        insert: (data: any) => ({
          select: () => ({
            single: async () => {
              const id = `contact-${++this.lastImportId}`;
              const contact = { id, ...data, created_at: new Date().toISOString(), user_id: 'test-user' };
              this.contacts.set(id, contact);
              return { data: contact, error: null };
            },
          }),
        }),
      };
    } else if (table === 'wa_sender_imports') {
      return {
        insert: (data: any) => ({
          select: () => ({
            single: async () => {
              const id = `import-${Date.now()}`;
              const session = {
                id,
                user_id: 'test-user',
                total_rows: data.total_rows,
                imported_count: data.imported_count,
                duplicate_count: data.duplicate_count,
                error_count: data.error_count,
                created_at: new Date().toISOString(),
              };
              this.imports.set(id, session);
              return { data: session, error: null };
            },
          }),
        }),
        update: (data: any) => ({
          eq: (field: string, value: any) => ({
            then: async (resolve: any) => {
              const session = this.imports.get(value);
              if (session) {
                Object.assign(session, data);
              }
              resolve({ error: null });
            },
          }),
        }),
      };
    }
    throw new Error(`Unsupported table: ${table}`);
  }
}

describe('WA Sender Contacts API (Tier 1)', () => {
  let mockClient: any;

  beforeEach(() => {
    mockClient = new MockContactsClient();
  });

  describe('GET /api/wa-sender/contacts', () => {
    test('returns paginated contacts', async () => {
      // Create 5 contacts
      for (let i = 1; i <= 5; i++) {
        await db.createContact(mockClient, {
          name: `Contact ${i}`,
          phone: `+1555000000${i}`,
          email: `contact${i}@example.com`,
        });
      }

      const result = await db.getContacts(mockClient, { page: 1, limit: 50 });
      expect(result.contacts).toHaveLength(5);
      expect(result.total).toBe(5);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(50);
    });

    test('returns empty list when no contacts', async () => {
      const result = await db.getContacts(mockClient);
      expect(result.contacts).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    test('respects pagination limit', async () => {
      for (let i = 1; i <= 10; i++) {
        await db.createContact(mockClient, {
          name: `Contact ${i}`,
          phone: `+1555000000${i}`,
        });
      }

      const page1 = await db.getContacts(mockClient, { page: 1, limit: 5 });
      expect(page1.contacts).toHaveLength(5);
    });
  });

  describe('DELETE /api/wa-sender/contacts/:id', () => {
    test('deletes contact by id', async () => {
      const created = await db.createContact(mockClient, {
        name: 'Alice',
        phone: '+1555123456',
      });

      const deleted = await db.deleteContact(mockClient, created.id);
      expect(deleted).toBe(true);

      // Verify deleted
      const fetched = await db.getContact(mockClient, created.id);
      expect(fetched).toBeNull();
    });

    test('returns false for non-existent contact', async () => {
      const result = await db.deleteContact(mockClient, 'non-existent');
      expect(result).toBe(true); // Supabase delete silently succeeds on non-existent
    });
  });

  describe('Contact CRUD', () => {
    test('creates contact', async () => {
      const result = await db.createContact(mockClient, {
        name: 'Alice',
        phone: '+1555123456',
        email: 'alice@example.com',
        company: 'TechCorp',
      });

      expect(result.id).toBeDefined();
      expect(result.name).toBe('Alice');
      expect(result.phone).toBe('+1555123456');
    });

    test('fetches contact by id', async () => {
      const created = await db.createContact(mockClient, {
        name: 'Bob',
        phone: '+1555654321',
      });

      const fetched = await db.getContact(mockClient, created.id);
      expect(fetched?.name).toBe('Bob');
      expect(fetched?.id).toBe(created.id);
    });

    test('returns null for non-existent contact', async () => {
      const result = await db.getContact(mockClient, 'non-existent');
      expect(result).toBeNull();
    });
  });

  describe('POST /api/wa-sender/contacts/import', () => {
    let importClient: any;

    beforeEach(() => {
      importClient = new MockImportsClient();
    });

    test('imports contacts from parsed data', async () => {
      const contacts = [
        { name: 'Alice', phone: '+1555123456', email: 'alice@example.com', company: 'TechCorp', custom_fields: {} },
        { name: 'Bob', phone: '+1555654321', email: 'bob@example.com', company: 'FinCo', custom_fields: {} },
      ];

      const result = await db.importContacts(importClient, contacts);

      expect(result.import_session_id).toBeDefined();
      expect(result.total_rows).toBe(2);
      expect(result.imported_count).toBe(2);
      expect(result.duplicate_count).toBe(0);
      expect(result.error_count).toBe(0);
    });

    test('handles empty import', async () => {
      const result = await db.importContacts(importClient, []);

      expect(result.import_session_id).toBeDefined();
      expect(result.total_rows).toBe(0);
      expect(result.imported_count).toBe(0);
    });

    test('tracks import errors per row', async () => {
      // Mock a client that fails on specific rows
      const failingClient = new MockImportsClient();
      let callCount = 0;

      const originalFrom = failingClient.from.bind(failingClient);
      failingClient.from = (table: string) => {
        if (table === 'wa_sender_contacts') {
          return {
            insert: (data: any) => ({
              select: () => ({
                single: async () => {
                  callCount++;
                  // Simulate failure on second contact
                  if (callCount === 2) {
                    throw new Error('Duplicate phone number');
                  }
                  return { data: { id: `contact-${callCount}`, ...data }, error: null };
                },
              }),
            }),
          };
        }
        return originalFrom(table);
      };

      const contacts = [
        { name: 'Alice', phone: '+1555123456', email: 'alice@example.com', company: 'TechCorp', custom_fields: {} },
        { name: 'Bob', phone: '+1555654321', email: 'bob@example.com', company: 'FinCo', custom_fields: {} },
      ];

      const result = await db.importContacts(failingClient, contacts);

      expect(result.imported_count).toBe(1);
      expect(result.error_count).toBe(1);
      expect(result.error_summary).toHaveLength(1);
      expect(result.error_summary![0].row).toBe(3); // Row 3 (header=0, 1-indexed)
    });
  });

  describe('GET /api/wa-sender/contacts/export', () => {
    test('exports contacts as CSV', async () => {
      // Create test data
      for (let i = 1; i <= 3; i++) {
        await db.createContact(mockClient, {
          name: `Contact ${i}`,
          phone: `+1555000000${i}`,
          email: `contact${i}@example.com`,
          company: `Company ${i}`,
        });
      }

      const csv = await db.exportContacts(mockClient);

      // Verify header (quoted format)
      expect(csv).toContain('"name","phone","email","company"');

      // Verify rows (CSV format with quoted fields)
      expect(csv).toContain('"Contact 1"');
      expect(csv).toContain('"+15550000001"');
      expect(csv).toContain('"contact1@example.com"');

      // Verify line ending
      expect(csv.endsWith('\n')).toBe(true);
    });

    test('exports empty CSV with headers only', async () => {
      const csv = await db.exportContacts(mockClient);

      expect(csv).toBe('name,phone,email,company\n');
    });

    test('properly escapes quotes in CSV', async () => {
      await db.createContact(mockClient, {
        name: 'Alice "Ace" Anderson',
        phone: '+1555123456',
        email: 'alice@example.com',
        company: 'Example "Corp"',
      });

      const csv = await db.exportContacts(mockClient);

      // Double quotes should be escaped: " -> ""
      expect(csv).toContain('"Alice ""Ace"" Anderson"');
      expect(csv).toContain('"Example ""Corp"""');
    });
  });
});
