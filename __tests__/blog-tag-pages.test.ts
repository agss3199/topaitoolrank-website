/**
 * Blog Tag Pages - Unit Tests
 * TDD: Tests written first, implementation follows.
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';

// We'll import from blog.ts once slugifyTag is implemented
import { slugifyTag } from '@/app/lib/blog';

describe('Blog Tag Pages', () => {
  describe('slugifyTag()', () => {
    test('converts spaces to hyphens', () => {
      expect(slugifyTag('AI Agents')).toBe('ai-agents');
    });

    test('removes punctuation', () => {
      expect(slugifyTag('Web3 & Blockchain')).toBe('web3-blockchain');
    });

    test('lowercases input', () => {
      expect(slugifyTag('Code Generation')).toBe('code-generation');
    });

    test('collapses multiple hyphens', () => {
      expect(slugifyTag('AI -- Tools')).toBe('ai-tools');
    });

    test('trims leading and trailing hyphens', () => {
      expect(slugifyTag('-Leading')).toBe('leading');
      expect(slugifyTag('Trailing-')).toBe('trailing');
    });

    test('handles already-slugified input', () => {
      expect(slugifyTag('ai-agents')).toBe('ai-agents');
    });

    test('handles numbers', () => {
      expect(slugifyTag('GPT 4o')).toBe('gpt-4o');
    });
  });

  describe('Tag page generation', () => {
    beforeEach(() => {
      vi.resetModules();
    });

    test('generateStaticParams returns unique tag slugs', async () => {
      vi.doMock('@/app/lib/blog', async (importOriginal) => {
        const original = await importOriginal<typeof import('@/app/lib/blog')>();
        return {
          ...original,
          getAllPosts: vi.fn().mockResolvedValue([
            { tags: ['AI Agents', 'Code'], status: 'published', slug: 'post-1' },
            { tags: ['AI Agents', 'Web3'], status: 'published', slug: 'post-2' },
          ]),
        };
      });

      const { generateStaticParams } = await import(
        '@/app/(blog)/tag/[tag]/page'
      );
      const params = await generateStaticParams();

      // Should be array of {tag} objects
      expect(Array.isArray(params)).toBe(true);
      expect(params.length).toBeGreaterThan(0);
      params.forEach((p: { tag: string }) => {
        expect(p).toHaveProperty('tag');
        expect(typeof p.tag).toBe('string');
      });

      // No duplicates
      const slugs = params.map((p: { tag: string }) => p.tag);
      expect(new Set(slugs).size).toBe(slugs.length);
    });

    test('page filters posts by matching tag slug', async () => {
      vi.doMock('@/app/lib/blog', async (importOriginal) => {
        const original = await importOriginal<typeof import('@/app/lib/blog')>();
        return {
          ...original,
          getAllPosts: vi.fn().mockResolvedValue([
            { tags: ['AI Agents', 'Code'], status: 'published', slug: 'post-1', title: 'Post 1' },
            { tags: ['Web3'], status: 'published', slug: 'post-2', title: 'Post 2' },
            { tags: ['AI Agents'], status: 'published', slug: 'post-3', title: 'Post 3' },
          ]),
        };
      });

      const { getFilteredPosts } = await import('@/app/(blog)/tag/[tag]/page');
      const filtered = await getFilteredPosts('ai-agents');

      expect(filtered).toHaveLength(2);
      expect(filtered.map((p: { slug: string }) => p.slug)).toContain('post-1');
      expect(filtered.map((p: { slug: string }) => p.slug)).toContain('post-3');
    });

    test('page excludes draft posts', async () => {
      vi.doMock('@/app/lib/blog', async (importOriginal) => {
        const original = await importOriginal<typeof import('@/app/lib/blog')>();
        return {
          ...original,
          getAllPosts: vi.fn().mockResolvedValue([
            { tags: ['AI Agents'], status: 'published', slug: 'post-1', title: 'Published' },
            { tags: ['AI Agents'], status: 'draft', slug: 'post-2', title: 'Draft' },
          ]),
        };
      });

      const { getFilteredPosts } = await import('@/app/(blog)/tag/[tag]/page');
      const filtered = await getFilteredPosts('ai-agents');

      expect(filtered).toHaveLength(1);
      expect(filtered[0].slug).toBe('post-1');
    });
  });
});
