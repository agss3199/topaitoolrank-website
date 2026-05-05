import { NextRequest, NextResponse } from 'next/server';
import { verifyTokenFromRequest, extractToken } from '@/app/lib/api-auth';
import { createAuthenticatedClient } from '@/app/lib/db/client';
import * as db from '@/app/lib/db/wa-sender';

/**
 * GET /api/wa-sender/templates
 * Fetch all templates for the authenticated user
 *
 * Query parameters:
 * - category: Optional filter by template category
 *
 * Response: { templates: WASenderTemplate[] }
 */
export async function GET(req: NextRequest) {
  const payload = verifyTokenFromRequest(req);
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const token = extractToken(req);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = createAuthenticatedClient(token);

    // Optional category filter
    const category = req.nextUrl.searchParams.get('category') || undefined;

    const templates = await db.getTemplates(client, category);

    return NextResponse.json({ templates }, { status: 200 });
  } catch (error) {
    console.error('[GET /api/wa-sender/templates]', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/wa-sender/templates
 * Create a new template
 *
 * Request body:
 * {
 *   name: string (required, max 100 chars)
 *   content: string (required, max 1000 chars)
 *   description?: string (max 500 chars)
 *   category?: string (must match predefined list)
 * }
 *
 * Response: { id, name, content, variables, created_at } (201)
 */
export async function POST(req: NextRequest) {
  const payload = verifyTokenFromRequest(req);
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const token = extractToken(req);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const client = createAuthenticatedClient(token);

    const template = await db.createTemplate(client, {
      name: body.name,
      content: body.content,
      description: body.description,
      category: body.category,
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);

    // Check for 409 Conflict (duplicate name)
    if ((error as any).status === 409) {
      return NextResponse.json(
        { error: 'A template with this name already exists' },
        { status: 409 }
      );
    }

    // Handle validation errors
    if (
      errorMsg.includes('required') ||
      errorMsg.includes('must be') ||
      errorMsg.includes('Invalid')
    ) {
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    console.error('[POST /api/wa-sender/templates]', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}
