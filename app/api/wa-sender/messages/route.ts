import { NextRequest, NextResponse } from 'next/server';
import { verifyTokenFromRequest, extractToken } from '@/app/lib/api-auth';
import { createAuthenticatedClient } from '@/app/lib/db/client';
import * as db from '@/app/lib/db/wa-sender';

/**
 * GET /api/wa-sender/messages
 * Fetch paginated messages for the authenticated user with filtering and stats
 *
 * Query params:
 *   page (default 1), limit (default 50, max 500)
 *   status (sent|failed|pending|read)
 *   channel (whatsapp|email)
 *   start_date, end_date (ISO timestamp range)
 *   template_id
 *   search (matches recipient_phone or recipient_email)
 *
 * Response: { messages: [], total, page, limit, stats: { sent_count, failed_count, pending_count, read_count } }
 */
export async function GET(req: NextRequest) {
  const t0 = performance.now();
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();

  console.info('messages.list.start', { requestId });

  try {
    const payload = verifyTokenFromRequest(req);
    if (!payload) {
      console.warn('messages.list.auth_failed', { requestId });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = extractToken(req);
    if (!token) {
      console.warn('messages.list.auth_failed', { requestId });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');
    const status = req.nextUrl.searchParams.get('status') || undefined;
    const channel = req.nextUrl.searchParams.get('channel') || undefined;
    const startDate = req.nextUrl.searchParams.get('start_date') || undefined;
    const endDate = req.nextUrl.searchParams.get('end_date') || undefined;
    const templateId = req.nextUrl.searchParams.get('template_id') || undefined;
    const search = req.nextUrl.searchParams.get('search') || undefined;

    const client = createAuthenticatedClient(token);
    const result = await db.getMessages(client, {
      page,
      limit,
      status: status as any,
      channel: channel as any,
      start_date: startDate,
      end_date: endDate,
      template_id: templateId,
      search,
    });

    console.info('messages.list.ok', {
      requestId,
      count: result.messages.length,
      total: result.total,
      latencyMs: performance.now() - t0,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('messages.list.error', {
      requestId,
      error: message,
      latencyMs: performance.now() - t0,
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/wa-sender/messages
 * Create a new message (log sent message)
 *
 * Request body: { contact_id?, recipient_phone?, recipient_email?, content, template_id?, channel, status? }
 * Response: WASenderMessage (201) or { error } (400, 401, 500)
 */
export async function POST(req: NextRequest) {
  const t0 = performance.now();
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();
  const contentLength = req.headers.get('content-length');
  const maxSize = 100 * 1024; // 100KB for message

  console.info('messages.create.start', { requestId });

  try {
    // Validate payload size
    if (contentLength && parseInt(contentLength) > maxSize) {
      console.warn('messages.create.payload_too_large', { requestId });
      return NextResponse.json(
        { error: `Request body exceeds ${maxSize / 1024}KB limit` },
        { status: 413 }
      );
    }

    const payload = verifyTokenFromRequest(req);
    if (!payload) {
      console.warn('messages.create.auth_failed', { requestId });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = extractToken(req);
    if (!token) {
      console.warn('messages.create.auth_failed', { requestId });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { contact_id, recipient_phone, recipient_email, content, template_id, channel } = body;

    const client = createAuthenticatedClient(token);
    const message = await db.createMessage(client, {
      contact_id,
      recipient_phone,
      recipient_email,
      content,
      template_id,
      channel,
    });

    console.info('messages.create.ok', {
      requestId,
      messageId: message.id,
      latencyMs: performance.now() - t0,
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    // Check for validation errors
    if (
      message.includes('required') ||
      message.includes('must be') ||
      message.includes('Channel') ||
      message.includes('Status')
    ) {
      console.warn('messages.create.validation_failed', { requestId, error: message });
      return NextResponse.json({ error: message }, { status: 400 });
    }

    console.error('messages.create.error', {
      requestId,
      error: message,
      latencyMs: performance.now() - t0,
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
