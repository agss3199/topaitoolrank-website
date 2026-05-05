import { NextRequest, NextResponse } from 'next/server';
import { verifyTokenFromRequest } from '@/app/lib/api-auth';

/**
 * GET /api/wa-sender/templates
 * Fetch all templates for the authenticated user
 */
export async function GET(req: NextRequest) {
  const payload = verifyTokenFromRequest(req);
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Stub: return empty templates array for now
  // Full implementation in todo 30
  return NextResponse.json(
    { templates: [] },
    { status: 200 }
  );
}

/**
 * POST /api/wa-sender/templates
 * Create a new template
 * Not yet implemented (todo 30)
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
