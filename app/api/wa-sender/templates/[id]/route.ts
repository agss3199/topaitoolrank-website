import { NextRequest, NextResponse } from 'next/server';
import { verifyTokenFromRequest, extractToken } from '@/app/lib/api-auth';
import { createAuthenticatedClient } from '@/app/lib/db/client';
import * as db from '@/app/lib/db/wa-sender';

/**
 * GET /api/wa-sender/templates/[id]
 * Fetch a single template by ID
 *
 * Response: WASenderTemplate (200) or { error } (401, 404)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = verifyTokenFromRequest(req);
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const token = extractToken(req);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = createAuthenticatedClient(token);
    const template = await db.getTemplate(client, id);

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(template, { status: 200 });
  } catch (error) {
    console.error('[GET /api/wa-sender/templates/[id]]', error);
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/wa-sender/templates/[id]
 * Update a template
 *
 * Request body: { name?, content?, description?, category? }
 * Response: WASenderTemplate (200) or { error } (400, 401, 404, 409)
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = verifyTokenFromRequest(req);
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const token = extractToken(req);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const client = createAuthenticatedClient(token);

    const template = await db.updateTemplate(client, id, {
      name: body.name,
      content: body.content,
      description: body.description,
      category: body.category,
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(template, { status: 200 });
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

    console.error('[PUT /api/wa-sender/templates/[id]]', error);
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/wa-sender/templates/[id]
 * Delete a template
 *
 * Response: 204 No Content (success) or { error } (401, 404, 500)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = verifyTokenFromRequest(req);
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const token = extractToken(req);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = createAuthenticatedClient(token);

    // Check if template exists before deleting
    const existing = await db.getTemplate(client, id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    await db.deleteTemplate(client, id);

    // Return 204 No Content on success
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[DELETE /api/wa-sender/templates/[id]]', error);
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}
