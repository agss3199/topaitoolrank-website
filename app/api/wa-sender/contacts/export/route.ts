import { NextRequest, NextResponse } from 'next/server';
import { verifyTokenFromRequest, extractToken } from '@/app/lib/api-auth';
import { createAuthenticatedClient } from '@/app/lib/db/client';
import * as db from '@/app/lib/db/wa-sender';

/**
 * POST /api/wa-sender/contacts/export
 * Export all contacts as CSV or Excel file
 *
 * Query params:
 * - format: 'csv' or 'xlsx' (default: csv)
 * - filter: optional JSON filter like {"company": "TechCorp"}
 *
 * Response: File attachment with proper headers
 * Formats: CSV (name,phone,email,company with escaped quotes)
 */
export async function POST(req: NextRequest) {
  const payload = verifyTokenFromRequest(req);
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const token = extractToken(req);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const format = req.nextUrl.searchParams.get('format') || 'csv';
    if (format !== 'csv' && format !== 'xlsx') {
      return NextResponse.json(
        { error: 'Invalid format. Must be "csv" or "xlsx"' },
        { status: 400 }
      );
    }

    const client = createAuthenticatedClient(token);
    const csv = await db.exportContacts(client);

    // For now, only support CSV (XLSX would require additional library)
    if (format !== 'csv') {
      return NextResponse.json(
        { error: 'XLSX format not yet supported. Use format=csv' },
        { status: 501 }
      );
    }

    console.log('[POST /api/wa-sender/contacts/export]', {
      format,
      size_bytes: csv.length,
      lines: csv.split('\n').length - 1, // Exclude final newline
    });

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': 'attachment; filename="contacts.csv"',
        'content-length': String(Buffer.byteLength(csv, 'utf-8')),
      },
    });
  } catch (error) {
    console.error('[POST /api/wa-sender/contacts/export]', error);
    return NextResponse.json(
      { error: 'Failed to export contacts' },
      { status: 500 }
    );
  }
}
