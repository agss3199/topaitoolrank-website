import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('GET /api/tools/article', () => {
  const toolArticleMap: Record<string, string> = {
    'json-formatter': 'json-formatter-guide',
    'word-counter': 'word-counter-guide',
    'email-subject-tester': 'email-subject-line-guide',
    'ai-prompt-generator': 'ai-prompt-writing-guide',
    'utm-link-builder': 'utm-link-building-guide',
    'invoice-generator': 'invoice-generator-guide',
    'seo-analyzer': 'seo-analysis-guide',
    'whatsapp-link-generator': 'whatsapp-link-guide',
    'whatsapp-message-formatter': 'whatsapp-message-formatter-guide',
  };

  describe('Article Files Exist', () => {
    Object.entries(toolArticleMap).forEach(([tool, slug]) => {
      it(`article file exists for ${tool}`, () => {
        const filePath = path.join(
          process.cwd(),
          'content',
          'articles',
          `${slug}.md`
        );
        expect(fs.existsSync(filePath)).toBe(true);
      });

      it(`article file for ${tool} contains frontmatter`, () => {
        const filePath = path.join(
          process.cwd(),
          'content',
          'articles',
          `${slug}.md`
        );
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content).toMatch(/^---\n[\s\S]*?\n---\n/);
      });

      it(`article file for ${tool} contains content after frontmatter`, () => {
        const filePath = path.join(
          process.cwd(),
          'content',
          'articles',
          `${slug}.md`
        );
        const content = fs.readFileSync(filePath, 'utf-8');
        const match = content.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
        expect(match).toBeDefined();
        expect(match?.[1]?.trim().length).toBeGreaterThan(100);
      });

      it(`article for ${tool} meets minimum word count`, () => {
        const filePath = path.join(
          process.cwd(),
          'content',
          'articles',
          `${slug}.md`
        );
        const content = fs.readFileSync(filePath, 'utf-8');
        const match = content.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
        const articleContent = match?.[1] || '';
        const wordCount = articleContent.split(/\s+/).length;
        expect(wordCount).toBeGreaterThanOrEqual(1900);
      });
    });
  });

  describe('Cross-Linking', () => {
    Object.entries(toolArticleMap).forEach(([tool, slug]) => {
      it(`article for ${tool} has cross-tool links`, () => {
        const filePath = path.join(
          process.cwd(),
          'content',
          'articles',
          `${slug}.md`
        );
        const content = fs.readFileSync(filePath, 'utf-8');
        const linkMatches = content.match(/\[.*?\]\(\/tools\/[a-z-]*\)/g) || [];
        expect(linkMatches.length).toBeGreaterThanOrEqual(2);
        expect(linkMatches.length).toBeLessThanOrEqual(3);
      });

      it(`article for ${tool} has valid tool links`, () => {
        const filePath = path.join(
          process.cwd(),
          'content',
          'articles',
          `${slug}.md`
        );
        const content = fs.readFileSync(filePath, 'utf-8');
        const linkMatches = content.match(/\/tools\/[a-z-]*/g) || [];
        const validTools = Object.keys(toolArticleMap);

        linkMatches.forEach(link => {
          const toolName = link.replace('/tools/', '');
          expect(validTools).toContain(toolName);
        });
      });
    });
  });

  describe('Content Quality', () => {
    it('all articles have YAML frontmatter with title', () => {
      Object.values(toolArticleMap).forEach(slug => {
        const filePath = path.join(
          process.cwd(),
          'content',
          'articles',
          `${slug}.md`
        );
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content).toMatch(/title:/);
      });
    });

    it('all articles have category field', () => {
      Object.values(toolArticleMap).forEach(slug => {
        const filePath = path.join(
          process.cwd(),
          'content',
          'articles',
          `${slug}.md`
        );
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content).toMatch(/category:/);
      });
    });

    it('all articles have publishedAt date', () => {
      Object.values(toolArticleMap).forEach(slug => {
        const filePath = path.join(
          process.cwd(),
          'content',
          'articles',
          `${slug}.md`
        );
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content).toMatch(/publishedAt:/);
      });
    });
  });

  describe('XSS Prevention in Content', () => {
    it('no articles contain script tags', () => {
      Object.values(toolArticleMap).forEach(slug => {
        const filePath = path.join(
          process.cwd(),
          'content',
          'articles',
          `${slug}.md`
        );
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content).not.toMatch(/<script[^>]*>/i);
      });
    });

    it('no articles contain javascript: URLs', () => {
      Object.values(toolArticleMap).forEach(slug => {
        const filePath = path.join(
          process.cwd(),
          'content',
          'articles',
          `${slug}.md`
        );
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content).not.toMatch(/javascript:/i);
      });
    });

    it('no articles contain onerror event handlers', () => {
      Object.values(toolArticleMap).forEach(slug => {
        const filePath = path.join(
          process.cwd(),
          'content',
          'articles',
          `${slug}.md`
        );
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content).not.toMatch(/onerror=/i);
      });
    });
  });
});
