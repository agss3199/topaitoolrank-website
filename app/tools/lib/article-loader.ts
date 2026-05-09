import fs from 'fs';
import path from 'path';

export interface ArticleData {
  title: string;
  slug: string;
  category: string;
  tags: string[];
  publishedAt: string;
  updatedAt: string;
  content: string;
}

/**
 * Load article markdown file and parse frontmatter
 */
export async function loadArticle(slug: string): Promise<ArticleData | null> {
  try {
    const filePath = path.join(process.cwd(), 'content', 'articles', `${slug}.md`);

    if (!fs.existsSync(filePath)) {
      console.warn(`Article file not found: ${filePath}`);
      return null;
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');

    // Parse frontmatter
    const frontmatterMatch = fileContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!frontmatterMatch) {
      console.warn(`Invalid frontmatter in article: ${slug}`);
      return null;
    }

    const [, frontmatterStr, content] = frontmatterMatch;

    // Parse YAML frontmatter (simple parser for basic fields)
    const frontmatter: Record<string, string | string[]> = {};
    const lines = frontmatterStr.split('\n');

    for (const line of lines) {
      if (!line.trim()) continue;

      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) continue;

      const key = line.substring(0, colonIndex).trim();
      let value = line.substring(colonIndex + 1).trim();

      // Remove quotes
      value = value.replace(/^["']|["']$/g, '');

      // Handle arrays (tags field)
      if (key === 'tags') {
        // Parse ["tag1", "tag2"] format
        const tagsMatch = frontmatterStr.match(/tags:\s*\[(.*?)\]/);
        if (tagsMatch) {
          frontmatter[key] = tagsMatch[1]
            .split(',')
            .map(t => t.trim().replace(/["']/g, ''));
        }
      } else {
        frontmatter[key] = value;
      }
    }

    return {
      title: (frontmatter.title as string) || 'Untitled',
      slug: (frontmatter.slug as string) || slug,
      category: (frontmatter.category as string) || 'General',
      tags: (frontmatter.tags as string[]) || [],
      publishedAt: (frontmatter.publishedAt as string) || new Date().toISOString().split('T')[0],
      updatedAt: (frontmatter.updatedAt as string) || new Date().toISOString().split('T')[0],
      content: content.trim(),
    };
  } catch (error) {
    console.error(`Failed to load article ${slug}:`, error);
    return null;
  }
}

/**
 * Map tool names to article slugs
 */
export const toolArticleMap: Record<string, string> = {
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

/**
 * Get article slug for a tool
 */
export function getArticleSlugForTool(toolName: string): string {
  return toolArticleMap[toolName] || '';
}
