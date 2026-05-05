import { NextRequest, NextResponse } from 'next/server';
import { verifyTokenFromRequest } from '@/app/lib/api-auth';

/**
 * POST /api/wa-sender/contacts/import
 * Import contacts from file (CSV/JSON)
 * Not yet implemented (todo 40)
 */
export async function POST(req: NextRequest) {
  const contentLength = req.headers.get('content-length');
  const maxSize = 4 * 1024 * 1024; // 4MB for contact imports

  if (contentLength && parseInt(contentLength) > maxSize) {
    return NextResponse.json(
      { error: `Request body exceeds ${maxSize / 1024 / 1024}MB limit` },
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
