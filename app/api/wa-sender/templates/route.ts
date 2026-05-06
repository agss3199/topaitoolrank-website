import { NextRequest, NextResponse } from 'next/server';
import { verifyTokenFromRequest, extractToken } from '@/app/lib/api-auth';
import { createAuthenticatedClient } from '@/app/lib/db/client';
import * as db from '@/app/lib/db/wa-sender';

/**
 * GET /api/wa-sender/templates
 * List all templates for the authenticated user
 * Optional query param: ?category=promotional
 *
 * Response: { templates: WASenderTemplate[] } (200) or { error } (401, 500)
 */
export async function GET(req: NextRequest) {
  const t0 = performance.now();
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();
  const category = req.nextUrl.searchParams.get('category') || undefined;

  console.info('templates.list.start', { requestId, category });

  try {
    const payload = verifyTokenFromRequest(req);
    if (!payload) {
      console.warn('templates.list.auth_failed', { requestId });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = extractToken(req);
    if (!token) {
      console.warn('templates.list.auth_failed', { requestId });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = createAuthenticatedClient(token);
    const templates = await db.getTemplates(client, category);

    console.info('templates.list.ok', {
      requestId,
      count: templates.length,
      latencyMs: performance.now() - t0,
    });

    return NextResponse.json({ templates });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('templates.list.error', {
      requestId,
      error: message,
      latencyMs: performance.now() - t0,
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/wa-sender/templates
 * Create a new template
 *
 * Request body: { name, content, description?, category? }
 * Response: WASenderTemplate (201) or { error } (400, 401, 409, 500)
 */
export async function POST(req: NextRequest) {
  const t0 = performance.now();
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();

  console.info('templates.create.start', { requestId });

  try {
    const payload = verifyTokenFromRequest(req);
    if (!payload) {
      console.warn('templates.create.auth_failed', { requestId });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = extractToken(req);
    if (!token) {
      console.warn('templates.create.auth_failed', { requestId });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, content, description, category } = body;

    const client = createAuthenticatedClient(token);
    const template = await db.createTemplate(client, {
      name,
      content,
      description,
      category,
    });

    console.info('templates.create.ok', {
      requestId,
      templateId: template.id,
      latencyMs: performance.now() - t0,
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    // Check for 409 Conflict (duplicate name)
    if ((error as any).status === 409) {
      console.warn('templates.create.duplicate_name', { requestId });
      return NextResponse.json(
        { error: 'A template with this name already exists' },
        { status: 409 }
      );
    }

    // Check for validation errors
    if (
      message.includes('required') ||
      message.includes('must be') ||
      message.includes('Invalid') ||
      message.includes('characters')
    ) {
      console.warn('templates.create.validation_failed', { requestId, error: message });
      return NextResponse.json({ error: message }, { status: 400 });
    }

    console.error('templates.create.error', {
      requestId,
      error: message,
      latencyMs: performance.now() - t0,
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
