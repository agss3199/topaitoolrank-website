import { NextRequest, NextResponse } from 'next/server';
import { verifyTokenFromRequest } from '@/app/lib/api-auth';

/**
 * GET /api/wa-sender/contacts
 * Fetch paginated contacts for the authenticated user
 */
export async function GET(req: NextRequest) {
  const payload = verifyTokenFromRequest(req);
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Query parameters for pagination
  const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');

  // Stub: return empty paginated response for now
  // Full implementation in todo 40
  return NextResponse.json(
    {
      contacts: [],
      total: 0,
      page,
      limit,
    },
    { status: 200 }
  );
}

/**
 * POST /api/wa-sender/contacts
 * Create or upsert a contact
 * Not yet implemented (todo 40)
 */
export async function POST(req: NextRequest) {
  const payload = verifyTokenFromRequest(req);
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json(
    { error: 'Not implemented yet. Coming in Phase 2.' },
    { status: 501 }
  );
}
