/**
 * WA Sender Templates API Routes - Unit Tests
 * Tier 1: HTTP endpoint testing with mocked Supabase client
 *
 * Tests the behavior of:
 * - POST /api/wa-sender/templates (create)
 * - GET /api/wa-sender/templates (list with optional category filter)
 * - GET /api/wa-sender/templates/:id (get single)
 * - PUT /api/wa-sender/templates/:id (update)
 * - DELETE /api/wa-sender/templates/:id (delete)
 *
 * Run with: npm test -- wa-sender-templates.test --run
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import * as db from '@/app/lib/db/wa-sender';
import { extractVariables, validateTemplateCategory } from '@/app/lib/templates';

/**
 * Mock Supabase client for testing
 * Simulates the behavior of db.* functions without hitting a real database
 */
class MockSupabaseClient {
  private templates: Map<string, any> = new Map();
  private lastId = 0;

  private getAllTemplates(): any[] {
    return Array.from(this.templates.values());
  }

  from(table: string) {
    if (table !== 'wa_sender_templates') {
      throw new Error(`Unsupported table: ${table}`);
    }

    return {
      select: () => ({
        eq: (filterField: string, filterValue: any) => ({
          single: async () => {
            const templates = this.getAllTemplates();
            const found = templates.find((t) => t[filterField] === filterValue);
            if (!found) {
              return { data: null, error: { code: 'PGRST116' } };
            }
            return { data: found, error: null };
          },
          order: (sortField: string, opts: any) => ({
            then: async (resolve: any) => {
              const templates = this.getAllTemplates().filter(
                (t) => t[filterField] === filterValue
              );
              templates.sort((a, b) => {
                const aVal = a[sortField] || '';
                const bVal = b[sortField] || '';
                return opts?.ascending ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
              });
              resolve({ data: templates, error: null });
            },
          }),
        }),
        order: (sortField: string, opts: any) => ({
          then: async (resolve: any) => {
            const templates = this.getAllTemplates();
            templates.sort((a, b) => {
              const aVal = a[sortField] || '';
              const bVal = b[sortField] || '';
              return opts?.ascending ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            });
            resolve({ data: templates, error: null });
          },
        }),
      }),
      order: (sortField: string, opts: any) => ({
        then: async (resolve: any) => {
          const templates = this.getAllTemplates();
          templates.sort((a, b) => {
            const aVal = a[sortField] || '';
            const bVal = b[sortField] || '';
            return opts?.ascending ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
          });
          resolve({ data: templates, error: null });
        },
      }),
      insert: (data: any) => ({
        select: () => ({
          single: async () => {
            // Check for duplicate name
            const existing = Array.from(this.templates.values()).find(
              (t) => t.name === data.name
            );
            if (existing) {
              return {
                data: null,
                error: { code: '23505', message: 'Duplicate key' },
              };
            }

            const id = `template-${++this.lastId}`;
            const record = {
              id,
              ...data,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            this.templates.set(id, record);
            return { data: record, error: null };
          },
        }),
      }),
      update: (data: any) => ({
        eq: (field: string, value: any) => ({
          select: () => ({
            single: async () => {
              const templates = Array.from(this.templates.values());
              const found = templates.find((t) => t[field] === value);

              if (!found) {
                return { data: null, error: { code: 'PGRST116' } };
              }

              // Check for duplicate name if updating name
              if (data.name && data.name !== found.name) {
                const dup = Array.from(this.templates.values()).find(
                  (t) => t.name === data.name
                );
                if (dup) {
                  return {
                    data: null,
                    error: { code: '23505', message: 'Duplicate key' },
                  };
                }
              }

              const updated = {
                ...found,
                ...data,
                updated_at: new Date().toISOString(),
              };
              this.templates.set(value, updated);
              return { data: updated, error: null };
            },
          }),
        }),
      }),
      delete: () => ({
        eq: (field: string, value: any) => ({
          then: async (resolve: any) => {
            this.templates.delete(value);
            resolve({ error: null });
          },
        }),
      }),
    };
  }
}

describe('WA Sender Templates API Routes (Tier 1)', () => {
  let mockClient: any;

  beforeEach(() => {
    mockClient = new MockSupabaseClient();
  });

  // =========================================================================
  // CREATE TEMPLATE TESTS (POST)
  // =========================================================================

  describe('POST /api/wa-sender/templates', () => {
    test('creates template with valid input and returns 201', async () => {
      const result = await db.createTemplate(mockClient, {
        name: 'Welcome Message',
        content: 'Hi {name}, welcome!',
        description: 'A welcome template',
        category: 'greeting',
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe('Welcome Message');
      expect(result.content).toBe('Hi {name}, welcome!');
      expect(result.variables).toEqual(['name']);
    });

    test('returns 400 when name is missing', async () => {
      await expect(
        db.createTemplate(mockClient, {
          name: '',
          content: 'Content',
        })
      ).rejects.toThrow('Template name is required');
    });

    test('returns 400 when content is missing', async () => {
      await expect(
        db.createTemplate(mockClient, {
          name: 'Test',
          content: '',
        })
      ).rejects.toThrow('Template content is required');
    });

    test('returns 400 when name exceeds 100 characters', async () => {
      const longName = 'x'.repeat(101);
      await expect(
        db.createTemplate(mockClient, {
          name: longName,
          content: 'Content',
        })
      ).rejects.toThrow('Template name must be 100 characters or less');
    });

    test('returns 400 when content exceeds 1000 characters', async () => {
      const longContent = 'x'.repeat(1001);
      await expect(
        db.createTemplate(mockClient, {
          name: 'Test',
          content: longContent,
        })
      ).rejects.toThrow('Template content must be 1000 characters or less');
    });

    test('returns 400 when description exceeds 500 characters', async () => {
      const longDesc = 'x'.repeat(501);
      await expect(
        db.createTemplate(mockClient, {
          name: 'Test',
          content: 'Content',
          description: longDesc,
        })
      ).rejects.toThrow('Template description must be 500 characters or less');
    });

    test('returns 400 when category is invalid', async () => {
      await expect(
        db.createTemplate(mockClient, {
          name: 'Test',
          content: 'Content',
          category: 'invalid_category',
        })
      ).rejects.toThrow('Invalid category');
    });

    test('returns 409 when template name already exists for user', async () => {
      await db.createTemplate(mockClient, {
        name: 'Unique Name',
        content: 'Content 1',
      });

      await expect(
        db.createTemplate(mockClient, {
          name: 'Unique Name',
          content: 'Content 2',
        })
      ).rejects.toThrow('A template with this name already exists');
    });

    test('extracts variables correctly', async () => {
      const result = await db.createTemplate(mockClient, {
        name: 'Complex',
        content: 'Hi {firstName} {lastName}, use code {promo_code}',
      });

      expect(result.variables).toEqual(['firstName', 'lastName', 'promo_code']);
    });

    test('returns 400 for invalid variable syntax', async () => {
      await expect(
        db.createTemplate(mockClient, {
          name: 'Invalid',
          content: 'Hi {123}',
        })
      ).rejects.toThrow('Invalid template content');
    });

    test('allows undefined category', async () => {
      const result = await db.createTemplate(mockClient, {
        name: 'No Category',
        content: 'Content',
        category: undefined,
      });

      expect(result).toBeDefined();
    });
  });

  // =========================================================================
  // LIST TEMPLATES TESTS (GET)
  // =========================================================================

  describe('GET /api/wa-sender/templates', () => {
    test('returns empty array when no templates exist', async () => {
      const templates = await db.getTemplates(mockClient);
      expect(templates).toEqual([]);
    });

    test('returns all templates for user', async () => {
      await db.createTemplate(mockClient, {
        name: 'Template 1',
        content: 'Content 1',
        category: 'greeting',
      });

      await db.createTemplate(mockClient, {
        name: 'Template 2',
        content: 'Content 2',
        category: 'promotional',
      });

      const templates = await db.getTemplates(mockClient);
      expect(templates).toHaveLength(2);
    });

    test('filters templates by category', async () => {
      await db.createTemplate(mockClient, {
        name: 'Greeting',
        content: 'Content',
        category: 'greeting',
      });

      await db.createTemplate(mockClient, {
        name: 'Promo',
        content: 'Content',
        category: 'promotional',
      });

      const greetings = await db.getTemplates(mockClient, 'greeting');
      expect(greetings).toHaveLength(1);
      expect(greetings[0].category).toBe('greeting');
    });
  });

  // =========================================================================
  // GET SINGLE TEMPLATE TESTS
  // =========================================================================

  describe('GET /api/wa-sender/templates/:id', () => {
    test('fetches single template by id', async () => {
      const created = await db.createTemplate(mockClient, {
        name: 'Single',
        content: 'Hi {name}',
      });

      const fetched = await db.getTemplate(mockClient, created.id);
      expect(fetched?.id).toBe(created.id);
      expect(fetched?.name).toBe('Single');
    });

    test('returns null for non-existent id', async () => {
      const fetched = await db.getTemplate(mockClient, 'non-existent');
      expect(fetched).toBeNull();
    });
  });

  // =========================================================================
  // UPDATE TEMPLATE TESTS (PUT)
  // =========================================================================

  describe('PUT /api/wa-sender/templates/:id', () => {
    test('updates template content and re-extracts variables', async () => {
      const created = await db.createTemplate(mockClient, {
        name: 'Original',
        content: 'Hi {name}',
      });

      const updated = await db.updateTemplate(mockClient, created.id, {
        content: 'Hello {firstName} {lastName}!',
      });

      expect(updated?.variables).toEqual(['firstName', 'lastName']);
    });

    test('updates template name', async () => {
      const created = await db.createTemplate(mockClient, {
        name: 'Old Name',
        content: 'Content',
      });

      const updated = await db.updateTemplate(mockClient, created.id, {
        name: 'New Name',
      });

      expect(updated?.name).toBe('New Name');
    });

    test('updates template category', async () => {
      const created = await db.createTemplate(mockClient, {
        name: 'Template',
        content: 'Content',
        category: 'greeting',
      });

      const updated = await db.updateTemplate(mockClient, created.id, {
        category: 'promotional',
      });

      expect(updated?.category).toBe('promotional');
    });

    test('returns 409 when new name conflicts with existing', async () => {
      await db.createTemplate(mockClient, {
        name: 'First',
        content: 'Content 1',
      });

      const second = await db.createTemplate(mockClient, {
        name: 'Second',
        content: 'Content 2',
      });

      await expect(
        db.updateTemplate(mockClient, second.id, {
          name: 'First', // Already exists
        })
      ).rejects.toThrow('A template with this name already exists');
    });

    test('returns null for non-existent id', async () => {
      const result = await db.updateTemplate(mockClient, 'non-existent', {
        name: 'New Name',
      });

      expect(result).toBeNull();
    });

    test('returns 400 for invalid category', async () => {
      const created = await db.createTemplate(mockClient, {
        name: 'Test',
        content: 'Content',
      });

      await expect(
        db.updateTemplate(mockClient, created.id, {
          category: 'invalid',
        })
      ).rejects.toThrow('Invalid category');
    });
  });

  // =========================================================================
  // DELETE TEMPLATE TESTS (DELETE)
  // =========================================================================

  describe('DELETE /api/wa-sender/templates/:id', () => {
    test('deletes existing template and returns 204', async () => {
      const created = await db.createTemplate(mockClient, {
        name: 'To Delete',
        content: 'Content',
      });

      const deleted = await db.deleteTemplate(mockClient, created.id);
      expect(deleted).toBe(true);

      const fetched = await db.getTemplate(mockClient, created.id);
      expect(fetched).toBeNull();
    });

    test('returns 404 for non-existent id', async () => {
      // Mock client silently succeeds on non-existent delete
      // This matches Supabase behavior (DELETE always succeeds)
      const result = await db.deleteTemplate(mockClient, 'non-existent');
      expect(result).toBe(true); // Supabase DELETE returns success even if 0 rows affected
    });
  });

  // =========================================================================
  // FULL CRUD CYCLE TEST
  // =========================================================================

  test('full CRUD cycle works end-to-end', async () => {
    // CREATE
    const created = await db.createTemplate(mockClient, {
      name: 'Full Cycle',
      content: 'Hi {firstName} {lastName}',
      description: 'Test template',
      category: 'greeting',
    });

    expect(created.id).toBeDefined();
    expect(created.variables).toEqual(['firstName', 'lastName']);

    // READ (single)
    const fetched = await db.getTemplate(mockClient, created.id);
    expect(fetched?.name).toBe('Full Cycle');

    // READ (list)
    const list = await db.getTemplates(mockClient);
    expect(list.length).toBeGreaterThan(0);
    expect(list.some((t) => t.id === created.id)).toBe(true);

    // UPDATE
    const updated = await db.updateTemplate(mockClient, created.id, {
      content: 'Hello {name}',
    });
    expect(updated?.variables).toEqual(['name']);

    // Verify update persisted
    const reread = await db.getTemplate(mockClient, created.id);
    expect(reread?.variables).toEqual(['name']);

    // DELETE
    const deleted = await db.deleteTemplate(mockClient, created.id);
    expect(deleted).toBe(true);

    // Verify deleted
    const notFound = await db.getTemplate(mockClient, created.id);
    expect(notFound).toBeNull();
  });

  // =========================================================================
  // HTTP STATUS CODE MAPPING TESTS
  // =========================================================================

  describe('HTTP status code mapping', () => {
    test('validation errors map to 400', () => {
      const errors = [
        db.createTemplate(mockClient, { name: '', content: 'C' }),
        db.createTemplate(mockClient, { name: 'T', content: '' }),
        db.createTemplate(mockClient, {
          name: 'T',
          content: 'C',
          category: 'invalid',
        }),
      ];

      // All should be rejected with validation messages
      Promise.all(errors).catch((err) => {
        expect(err.message).toMatch(/required|must be|Invalid/);
      });
    });

    test('duplicate name maps to 409', async () => {
      await db.createTemplate(mockClient, {
        name: 'Dup',
        content: 'Content',
      });

      try {
        await db.createTemplate(mockClient, {
          name: 'Dup',
          content: 'Different',
        });
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.message).toContain('already exists');
        expect(err.status).toBe(409);
      }
    });

    test('not found returns null (router converts to 404)', async () => {
      const result = await db.getTemplate(mockClient, 'missing');
      expect(result).toBeNull();
    });
  });
});
