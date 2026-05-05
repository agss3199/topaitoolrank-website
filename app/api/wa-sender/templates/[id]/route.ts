import { NextRequest, NextResponse } from 'next/server';
import { verifyTokenFromRequest } from '@/app/lib/api-auth';

/**
 * GET /api/wa-sender/templates/[id]
 * Fetch a single template by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = verifyTokenFromRequest(req);
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  // Stub: template not found for now
  // Full implementation in todo 30
  return NextResponse.json(
    { error: 'Template not found' },
    { status: 404 }
  );
}

/**
 * PUT /api/wa-sender/templates/[id]
 * Update a template
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const payload = verifyTokenFromRequest(req);
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json(
    { error: 'Not implemented yet. Coming in Phase 2.' },
    { status: 501 }
  );
}

/**
 * DELETE /api/wa-sender/templates/[id]
 * Delete a template
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const payload = verifyTokenFromRequest(req);
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json(
    { error: 'Not implemented yet. Coming in Phase 2.' },
    { status: 501 }
  );
}
