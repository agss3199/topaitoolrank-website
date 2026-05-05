import { NextRequest, NextResponse } from 'next/server';
import { verifyTokenFromRequest } from '@/app/lib/api-auth';

/**
 * GET /api/wa-sender/messages
 * Fetch paginated messages for the authenticated user
 */
export async function GET(req: NextRequest) {
  const payload = verifyTokenFromRequest(req);
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Query parameters for pagination
  const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');
  const status = req.nextUrl.searchParams.get('status');
  const channel = req.nextUrl.searchParams.get('channel');

  // Stub: return empty paginated response with stats for now
  // Full implementation in todo 50
  return NextResponse.json(
    {
      messages: [],
      total: 0,
      page,
      limit,
      stats: {
        sent_count: 0,
        failed_count: 0,
        pending_count: 0,
        read_count: 0,
      },
    },
    { status: 200 }
  );
}

/**
 * POST /api/wa-sender/messages
 * Send a new message via WhatsApp or Email
 * Not yet implemented (todo 50)
 */
export async function POST(req: NextRequest) {
  const contentLength = req.headers.get('content-length');
  const maxSize = 100 * 1024; // 100KB for message

  if (contentLength && parseInt(contentLength) > maxSize) {
    return NextResponse.json(
      { error: `Request body exceeds ${maxSize / 1024}KB limit` },
      { status: 413 }
    );
  }

  const payload = verifyTokenFromRequest(req);
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json(
    { error: 'Not implemented yet. Coming in Phase 2.' },
    { status: 501 }
  );
}
