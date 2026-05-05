import { NextRequest, NextResponse } from 'next/server';
import { verifyTokenFromRequest } from '@/app/lib/api-auth';

/**
 * GET /api/wa-sender/contacts/export
 * Export contacts as CSV
 * Not yet implemented (todo 40)
 */
export async function GET(req: NextRequest) {
  const payload = verifyTokenFromRequest(req);
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Stub: return empty CSV for now
  // Full implementation in todo 40
  const csv = 'name,phone,email,company\n'; // Just headers for now

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="contacts.csv"',
    },
  });
}
