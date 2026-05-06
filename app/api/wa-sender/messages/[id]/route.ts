import { NextRequest, NextResponse } from 'next/server';
import { verifyTokenFromRequest, extractToken } from '@/app/lib/api-auth';
import { createAuthenticatedClient } from '@/app/lib/db/client';
import * as db from '@/app/lib/db/wa-sender';

/**
 * GET /api/wa-sender/messages/[id]
 * Fetch a single message by ID
 *
 * Response: WASenderMessage (200) or { error } (401, 404, 500)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const t0 = performance.now();
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();
  const { id } = await params;

  console.info('message.get.start', { requestId, id });

  try {
    const payload = verifyTokenFromRequest(req);
    if (!payload) {
      console.warn('message.get.auth_failed', { requestId });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = extractToken(req);
    if (!token) {
      console.warn('message.get.auth_failed', { requestId });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = createAuthenticatedClient(token);
    const message = await db.getMessage(client, id);

    if (!message) {
      console.warn('message.get.not_found', { requestId, id });
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    console.info('message.get.ok', {
      requestId,
      id,
      latencyMs: performance.now() - t0,
    });

    return NextResponse.json(message);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('message.get.error', {
      requestId,
      id,
      error: message,
      latencyMs: performance.now() - t0,
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PUT /api/wa-sender/messages/[id]
 * Update message status (e.g., mark as read)
 * Only allows updating status and read_at fields
 *
 * Request body: { status?, read_at? }
 * Response: WASenderMessage (200) or { error } (400, 401, 404, 500)
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const t0 = performance.now();
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();
  const { id } = await params;

  console.info('message.update.start', { requestId, id });

  try {
    const payload = verifyTokenFromRequest(req);
    if (!payload) {
      console.warn('message.update.auth_failed', { requestId });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = extractToken(req);
    if (!token) {
      console.warn('message.update.auth_failed', { requestId });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { status, read_at } = body;

    // Validate that only allowed fields are being updated
    const allKeys = Object.keys(body);
    const allowedKeys = ['status', 'read_at'];
    const invalidKeys = allKeys.filter((key) => !allowedKeys.includes(key));
    if (invalidKeys.length > 0) {
      console.warn('message.update.invalid_fields', { requestId, invalidKeys });
      return NextResponse.json(
        { error: `Cannot update fields: ${invalidKeys.join(', ')}. Only status and read_at are allowed.` },
        { status: 400 }
      );
    }

    const client = createAuthenticatedClient(token);
    const message = await db.updateMessage(client, id, {
      status,
      read_at,
    });

    if (!message) {
      console.warn('message.update.not_found', { requestId, id });
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    console.info('message.update.ok', {
      requestId,
      id,
      latencyMs: performance.now() - t0,
    });

    return NextResponse.json(message);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    // Check for validation errors
    if (
      message.includes('required') ||
      message.includes('Status') ||
      message.includes('must be')
    ) {
      console.warn('message.update.validation_failed', { requestId, error: message });
      return NextResponse.json({ error: message }, { status: 400 });
    }

    console.error('message.update.error', {
      requestId,
      id,
      error: message,
      latencyMs: performance.now() - t0,
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
