/**
 * WA Sender Templates - Database Helper Tests
 * Tier 2 Integration Tests (Real Supabase, RLS verification)
 *
 * Tests the database helper functions: getTemplates, createTemplate, getTemplate, updateTemplate, deleteTemplate
 * RLS is verified: different users cannot see/modify each other's templates
 *
 * Run with: npm test -- wa-sender-templates-db --run
 * Requires: Real Supabase environment with tables created (todo 20)
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import {
  createAuthenticatedClient,
  cleanupUserData,
  TEST_USER_A,
  TEST_USER_B,
} from '@/app/lib/db/test-helpers';
import * as db from '@/app/lib/db/wa-sender';

// Skip if Supabase env vars missing
const skipIfNoSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL ? describe : describe.skip;

skipIfNoSupabase('WA Sender Templates Database (Tier 2 Integration)', () => {
  let clientA: ReturnType<typeof createAuthenticatedClient>;
  let clientB: ReturnType<typeof createAuthenticatedClient>;

  beforeEach(() => {
    clientA = createAuthenticatedClient(TEST_USER_A);
    clientB = createAuthenticatedClient(TEST_USER_B);
  });

  afterEach(async () => {
    // Cleanup test data
    try {
      await cleanupUserData(clientA, 'wa_sender_templates', TEST_USER_A);
      await cleanupUserData(clientB, 'wa_sender_templates', TEST_USER_B);
    } catch (error) {
      // Silently ignore cleanup errors
    }
  });

  // =========================================================================
  // CREATE TEMPLATE TESTS
  // =========================================================================

  describe('createTemplate', () => {
    test('creates template with valid input', async () => {
      const result = await db.createTemplate(clientA, {
        name: 'Welcome Message',
        content: 'Hi {name}, welcome to {company}!',
        description: 'Generic welcome template',
        category: 'greeting',
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe('Welcome Message');
      expect(result.content).toBe('Hi {name}, welcome to {company}!');
      expect(result.description).toBe('Generic welcome template');
      expect(result.category).toBe('greeting');
      expect(result.variables).toEqual(['company', 'name']); // Sorted
    });

    test('rejects template with missing name', async () => {
      await expect(
        db.createTemplate(clientA, {
          name: '',
          content: 'Hi {name}',
        })
      ).rejects.toThrow('Template name is required');
    });

    test('rejects template with content too long', async () => {
      const longContent = 'x'.repeat(1001);
      await expect(
        db.createTemplate(clientA, {
          name: 'Test',
          content: longContent,
        })
      ).rejects.toThrow('Template content must be 1000 characters or less');
    });

    test('rejects template with invalid category', async () => {
      await expect(
        db.createTemplate(clientA, {
          name: 'Test',
          content: 'Test content',
          category: 'invalid_category',
        })
      ).rejects.toThrow('Invalid category');
    });

    test('rejects duplicate template name for same user', async () => {
      await db.createTemplate(clientA, {
        name: 'Unique Name',
        content: 'Content 1',
      });

      await expect(
        db.createTemplate(clientA, {
          name: 'Unique Name',
          content: 'Different content',
        })
      ).rejects.toThrow('A template with this name already exists');
    });

    test('allows same template name for different users', async () => {
      const nameA = await db.createTemplate(clientA, {
        name: 'Shared Name',
        content: 'User A content',
      });

      const nameB = await db.createTemplate(clientB, {
        name: 'Shared Name',
        content: 'User B content',
      });

      expect(nameA.id).not.toBe(nameB.id);
      expect(nameA.name).toBe(nameB.name);
    });

    test('extracts variables from content', async () => {
      const result = await db.createTemplate(clientA, {
        name: 'Promo',
        content: 'Hi {firstName}, use code {code} for {discount}% off',
      });

      expect(result.variables).toEqual(['code', 'discount', 'firstName']); // Sorted
    });

    test('rejects invalid variable syntax', async () => {
      await expect(
        db.createTemplate(clientA, {
          name: 'Invalid',
          content: 'Hi {123}, invalid syntax',
        })
      ).rejects.toThrow('Invalid template content');
    });
  });

  // =========================================================================
  // GET TEMPLATES TESTS
  // =========================================================================

  describe('getTemplates', () => {
    test('returns all templates for user', async () => {
      await db.createTemplate(clientA, {
        name: 'Template 1',
        content: 'Content 1',
        category: 'greeting',
      });

      await db.createTemplate(clientA, {
        name: 'Template 2',
        content: 'Content 2',
        category: 'promotional',
      });

      const templates = await db.getTemplates(clientA);

      expect(templates).toHaveLength(2);
      expect(templates[0].name).toMatch(/Template [12]/);
      expect(templates[1].name).toMatch(/Template [12]/);
    });

    test('filters templates by category', async () => {
      await db.createTemplate(clientA, {
        name: 'Greeting 1',
        content: 'Content 1',
        category: 'greeting',
      });

      await db.createTemplate(clientA, {
        name: 'Promo 1',
        content: 'Content 2',
        category: 'promotional',
      });

      const greetings = await db.getTemplates(clientA, 'greeting');

      expect(greetings).toHaveLength(1);
      expect(greetings[0].category).toBe('greeting');
    });

    test('RLS: User B cannot see User A templates', async () => {
      await db.createTemplate(clientA, {
        name: 'Secret Template',
        content: 'Only User A should see this',
      });

      const userBTemplates = await db.getTemplates(clientB);

      expect(userBTemplates).toHaveLength(0);
    });

    test('returns empty array when no templates exist', async () => {
      const templates = await db.getTemplates(clientA);
      expect(templates).toEqual([]);
    });
  });

  // =========================================================================
  // GET SINGLE TEMPLATE TESTS
  // =========================================================================

  describe('getTemplate', () => {
    test('fetches single template by id', async () => {
      const created = await db.createTemplate(clientA, {
        name: 'Single Template',
        content: 'Hi {name}',
      });

      const fetched = await db.getTemplate(clientA, created.id);

      expect(fetched).toBeDefined();
      expect(fetched?.id).toBe(created.id);
      expect(fetched?.name).toBe('Single Template');
      expect(fetched?.variables).toEqual(['name']);
    });

    test('returns null for non-existent id', async () => {
      const fetched = await db.getTemplate(clientA, 'non-existent-id');
      expect(fetched).toBeNull();
    });

    test('RLS: User B cannot fetch User A template', async () => {
      const created = await db.createTemplate(clientA, {
        name: 'User A Only',
        content: 'Secret content',
      });

      const result = await db.getTemplate(clientB, created.id);

      expect(result).toBeNull(); // RLS returns null, not error
    });
  });

  // =========================================================================
  // UPDATE TEMPLATE TESTS
  // =========================================================================

  describe('updateTemplate', () => {
    test('updates template content', async () => {
      const created = await db.createTemplate(clientA, {
        name: 'Original',
        content: 'Hi {name}',
      });

      const updated = await db.updateTemplate(clientA, created.id, {
        content: 'Hello {name}, welcome to {company}',
      });

      expect(updated?.content).toBe('Hello {name}, welcome to {company}');
      expect(updated?.variables).toEqual(['company', 'name']); // Re-extracted
    });

    test('updates template name', async () => {
      const created = await db.createTemplate(clientA, {
        name: 'Old Name',
        content: 'Content',
      });

      const updated = await db.updateTemplate(clientA, created.id, {
        name: 'New Name',
      });

      expect(updated?.name).toBe('New Name');
    });

    test('rejects duplicate name for user', async () => {
      await db.createTemplate(clientA, {
        name: 'First',
        content: 'Content 1',
      });

      const second = await db.createTemplate(clientA, {
        name: 'Second',
        content: 'Content 2',
      });

      await expect(
        db.updateTemplate(clientA, second.id, {
          name: 'First', // Already exists
        })
      ).rejects.toThrow('A template with this name already exists');
    });

    test('RLS: User B cannot update User A template', async () => {
      const created = await db.createTemplate(clientA, {
        name: 'User A Template',
        content: 'Content',
      });

      const result = await db.updateTemplate(clientB, created.id, {
        name: 'Hacked',
      });

      expect(result).toBeNull(); // RLS prevents update
    });

    test('returns null for non-existent id', async () => {
      const result = await db.updateTemplate(clientA, 'non-existent-id', {
        name: 'New Name',
      });

      expect(result).toBeNull();
    });
  });

  // =========================================================================
  // DELETE TEMPLATE TESTS
  // =========================================================================

  describe('deleteTemplate', () => {
    test('deletes template by id', async () => {
      const created = await db.createTemplate(clientA, {
        name: 'To Delete',
        content: 'Content',
      });

      const deleted = await db.deleteTemplate(clientA, created.id);
      expect(deleted).toBe(true);

      const fetched = await db.getTemplate(clientA, created.id);
      expect(fetched).toBeNull();
    });

    test('RLS: User B cannot delete User A template', async () => {
      const created = await db.createTemplate(clientA, {
        name: 'User A Template',
        content: 'Content',
      });

      const deleted = await db.deleteTemplate(clientB, created.id);
      expect(deleted).toBe(true); // Delete returns true, but RLS prevents actual deletion

      // Verify template still exists for User A
      const fetched = await db.getTemplate(clientA, created.id);
      expect(fetched).not.toBeNull();
    });
  });

  // =========================================================================
  // FULL CRUD CYCLE TEST
  // =========================================================================

  test('full CRUD cycle works end-to-end', async () => {
    // CREATE
    const created = await db.createTemplate(clientA, {
      name: 'Full Cycle Test',
      content: 'Hi {firstName} {lastName}, welcome!',
      description: 'A complete test',
      category: 'greeting',
    });

    expect(created.id).toBeDefined();
    expect(created.variables).toEqual(['firstName', 'lastName']);

    // READ (single)
    const fetched = await db.getTemplate(clientA, created.id);
    expect(fetched?.name).toBe('Full Cycle Test');

    // READ (list)
    const list = await db.getTemplates(clientA);
    expect(list.length).toBeGreaterThan(0);
    expect(list.some((t) => t.id === created.id)).toBe(true);

    // UPDATE
    const updated = await db.updateTemplate(clientA, created.id, {
      content: 'Hello {firstName}!',
    });
    expect(updated?.variables).toEqual(['firstName']);

    // DELETE
    const deleted = await db.deleteTemplate(clientA, created.id);
    expect(deleted).toBe(true);

    // VERIFY DELETED
    const notFound = await db.getTemplate(clientA, created.id);
    expect(notFound).toBeNull();
  });
});
