/**
 * WA Sender Templates API Tests
 * Tests for GET /api/wa-sender/templates and POST /api/wa-sender/templates
 * As well as GET /api/wa-sender/templates/[id], PUT, DELETE via [id]/route.ts
 *
 * Spec reference: specs/wa-sender-templates.md
 * Todo reference: 30-templates-api-build.md
 */

import { describe, test, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { loadEnvConfig } from '@next/env';
import { createClient } from '@supabase/supabase-js';
import * as db from '@/app/lib/db/wa-sender';
import { extractVariables, validateTemplateCategory } from '@/app/lib/templates';

// Load environment variables
loadEnvConfig(process.cwd());

const TEST_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const TEST_SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

describe('WA Sender Templates API', () => {
  let testClient: ReturnType<typeof createClient>;
  const testUserId = 'test-user-' + Math.random().toString(36).substr(2, 9);

  beforeAll(() => {
    // Create a test Supabase client
    testClient = createClient(TEST_SUPABASE_URL, TEST_SUPABASE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  });

  describe('Variable Extraction', () => {
    test('extractVariables finds valid placeholders', () => {
      const content = 'Hi {name}, code {promo_code}';
      const vars = extractVariables(content);
      expect(vars).toEqual(['name', 'promo_code']);
    });

    test('extractVariables deduplicates', () => {
      const content = '{name} and {name} again';
      const vars = extractVariables(content);
      expect(vars).toEqual(['name']);
    });

    test('extractVariables rejects invalid syntax', () => {
      expect(() => {
        extractVariables('Hi {123}');
      }).toThrow('Invalid variable syntax');

      expect(() => {
        extractVariables('Hi {name with spaces}');
      }).toThrow('Invalid variable syntax');
    });

    test('extractVariables accepts valid underscore', () => {
      const vars = extractVariables('{first_name} {_private}');
      expect(vars.sort()).toEqual(['_private', 'first_name']);
    });
  });

  describe('Category Validation', () => {
    test('validateTemplateCategory accepts predefined categories', () => {
      expect(validateTemplateCategory('greeting')).toBe(true);
      expect(validateTemplateCategory('promotional')).toBe(true);
      expect(validateTemplateCategory('support')).toBe(true);
      expect(validateTemplateCategory('notification')).toBe(true);
      expect(validateTemplateCategory('appointment')).toBe(true);
      expect(validateTemplateCategory('followup')).toBe(true);
      expect(validateTemplateCategory('other')).toBe(true);
    });

    test('validateTemplateCategory accepts undefined', () => {
      expect(validateTemplateCategory(undefined)).toBe(true);
    });

    test('validateTemplateCategory rejects invalid categories', () => {
      expect(validateTemplateCategory('invalid')).toBe(false);
      expect(validateTemplateCategory('custom')).toBe(false);
    });
  });

  describe('Create Template', () => {
    test('createTemplate stores and extracts variables', async () => {
      const template = await db.createTemplate(testClient, {
        name: 'Test Greeting ' + Date.now(),
        content: 'Hi {name}, welcome {company}!',
        description: 'A simple greeting',
        category: 'greeting',
      });

      expect(template.id).toBeDefined();
      expect(template.name).toBe('Test Greeting ' + Date.now());
      expect(template.variables).toEqual(['company', 'name']);
      expect(template.category).toBe('greeting');

      // Cleanup
      await db.deleteTemplate(testClient, template.id);
    });

    test('createTemplate rejects missing name', async () => {
      await expect(
        db.createTemplate(testClient, {
          name: '',
          content: 'Test content',
        })
      ).rejects.toThrow('name is required');
    });

    test('createTemplate rejects name > 100 chars', async () => {
      await expect(
        db.createTemplate(testClient, {
          name: 'a'.repeat(101),
          content: 'Test content',
        })
      ).rejects.toThrow('100 characters');
    });

    test('createTemplate rejects missing content', async () => {
      await expect(
        db.createTemplate(testClient, {
          name: 'Test',
          content: '',
        })
      ).rejects.toThrow('content is required');
    });

    test('createTemplate rejects content > 1000 chars', async () => {
      await expect(
        db.createTemplate(testClient, {
          name: 'Test',
          content: 'a'.repeat(1001),
        })
      ).rejects.toThrow('1000 characters');
    });

    test('createTemplate rejects description > 500 chars', async () => {
      await expect(
        db.createTemplate(testClient, {
          name: 'Test',
          content: 'Test',
          description: 'a'.repeat(501),
        })
      ).rejects.toThrow('500 characters');
    });

    test('createTemplate rejects invalid category', async () => {
      await expect(
        db.createTemplate(testClient, {
          name: 'Test',
          content: 'Test',
          category: 'invalid_category',
        })
      ).rejects.toThrow('Invalid category');
    });

    test('createTemplate rejects invalid variable syntax', async () => {
      await expect(
        db.createTemplate(testClient, {
          name: 'Test',
          content: 'Hi {123invalid}',
        })
      ).rejects.toThrow('Invalid template content');
    });

    test('createTemplate enforces unique name per user', async () => {
      const templateName = 'Unique Test ' + Date.now();
      const template1 = await db.createTemplate(testClient, {
        name: templateName,
        content: 'Content 1',
      });

      try {
        await expect(
          db.createTemplate(testClient, {
            name: templateName,
            content: 'Content 2',
          })
        ).rejects.toThrow();
      } finally {
        await db.deleteTemplate(testClient, template1.id);
      }
    });
  });

  describe('Get Templates', () => {
    let template1: any, template2: any;

    beforeEach(async () => {
      template1 = await db.createTemplate(testClient, {
        name: 'Greeting ' + Date.now(),
        content: 'Hello {name}',
        category: 'greeting',
      });

      template2 = await db.createTemplate(testClient, {
        name: 'Promo ' + Date.now(),
        content: 'Special offer {code}',
        category: 'promotional',
      });
    });

    test('getTemplates returns all templates', async () => {
      const templates = await db.getTemplates(testClient);
      expect(templates.length).toBeGreaterThanOrEqual(2);
      expect(templates.some((t) => t.id === template1.id)).toBe(true);
      expect(templates.some((t) => t.id === template2.id)).toBe(true);
    });

    test('getTemplates filters by category', async () => {
      const greetings = await db.getTemplates(testClient, 'greeting');
      expect(greetings.some((t) => t.id === template1.id)).toBe(true);
      expect(greetings.some((t) => t.id === template2.id)).toBe(false);
    });

    test('getTemplates returns sorted by updated_at DESC', async () => {
      const templates = await db.getTemplates(testClient);
      for (let i = 0; i < templates.length - 1; i++) {
        const current = new Date(templates[i].updated_at).getTime();
        const next = new Date(templates[i + 1].updated_at).getTime();
        expect(current).toBeGreaterThanOrEqual(next);
      }
    });

    afterEach(async () => {
      await db.deleteTemplate(testClient, template1.id);
      await db.deleteTemplate(testClient, template2.id);
    });
  });

  describe('Get Single Template', () => {
    let template: any;

    beforeEach(async () => {
      template = await db.createTemplate(testClient, {
        name: 'Single Test ' + Date.now(),
        content: 'Hi {name}',
        category: 'greeting',
      });
    });

    test('getTemplate returns template by ID', async () => {
      const fetched = await db.getTemplate(testClient, template.id);
      expect(fetched).toBeDefined();
      expect(fetched?.id).toBe(template.id);
      expect(fetched?.name).toBe(template.name);
    });

    test('getTemplate returns null for non-existent ID', async () => {
      const fetched = await db.getTemplate(testClient, 'non-existent-id');
      expect(fetched).toBeNull();
    });

    afterEach(async () => {
      await db.deleteTemplate(testClient, template.id);
    });
  });

  describe('Update Template', () => {
    let template: any;

    beforeEach(async () => {
      template = await db.createTemplate(testClient, {
        name: 'Update Test ' + Date.now(),
        content: 'Original {content}',
        description: 'Original description',
        category: 'greeting',
      });
    });

    test('updateTemplate updates fields', async () => {
      const updated = await db.updateTemplate(testClient, template.id, {
        name: 'Updated ' + Date.now(),
        description: 'New description',
      });

      expect(updated?.name).toContain('Updated');
      expect(updated?.description).toBe('New description');
      expect(updated?.content).toBe('Original {content}'); // unchanged
    });

    test('updateTemplate re-extracts variables on content change', async () => {
      const updated = await db.updateTemplate(testClient, template.id, {
        content: 'Hello {name} and {company}',
      });

      expect(updated?.variables).toEqual(['company', 'name']);
    });

    test('updateTemplate rejects name > 100 chars', async () => {
      await expect(
        db.updateTemplate(testClient, template.id, {
          name: 'a'.repeat(101),
        })
      ).rejects.toThrow('100 characters');
    });

    test('updateTemplate rejects invalid content', async () => {
      await expect(
        db.updateTemplate(testClient, template.id, {
          content: 'Hi {123}',
        })
      ).rejects.toThrow('Invalid template content');
    });

    test('updateTemplate returns null for non-existent ID', async () => {
      const result = await db.updateTemplate(testClient, 'non-existent-id', {
        name: 'New name',
      });
      expect(result).toBeNull();
    });

    afterEach(async () => {
      await db.deleteTemplate(testClient, template.id);
    });
  });

  describe('Delete Template', () => {
    let template: any;

    beforeEach(async () => {
      template = await db.createTemplate(testClient, {
        name: 'Delete Test ' + Date.now(),
        content: 'To be deleted',
      });
    });

    test('deleteTemplate deletes template', async () => {
      const deleted = await db.deleteTemplate(testClient, template.id);
      expect(deleted).toBe(true);

      const fetched = await db.getTemplate(testClient, template.id);
      expect(fetched).toBeNull();
    });

    test('deleteTemplate returns true even for non-existent ID', async () => {
      const deleted = await db.deleteTemplate(testClient, 'non-existent-id');
      expect(deleted).toBe(true); // Supabase delete doesn't error on missing rows
    });
  });
});
