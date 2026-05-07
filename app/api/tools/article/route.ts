import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * GET /api/tools/article?tool=json-formatter
 * Returns article content for a tool
 */
export async function GET(request: NextRequest) {
  try {
    const toolParam = request.nextUrl.searchParams.get('tool');

    if (!toolParam) {
      return NextResponse.json(
        { error: 'Missing tool parameter' },
        { status: 400 }
      );
    }

    // Map tool names to article slugs
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

    const articleSlug = toolArticleMap[toolParam];
    if (!articleSlug) {
      return NextResponse.json(
        { error: 'Unknown tool' },
        { status: 404 }
      );
    }

    // Read article file
    const filePath = path.join(
      process.cwd(),
      'content',
      'articles',
      `${articleSlug}.md`
    );

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');

    // Extract content after frontmatter
    const frontmatterMatch = fileContent.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
    const content = frontmatterMatch ? frontmatterMatch[1].trim() : fileContent;

    return NextResponse.json({
      tool: toolParam,
      slug: articleSlug,
      content,
    });
  } catch (error) {
    console.error('Error loading article:', error);
    return NextResponse.json(
      { error: 'Failed to load article' },
      { status: 500 }
    );
  }
}
