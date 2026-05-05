import { NextRequest, NextResponse } from 'next/server';
import { verifyTokenFromRequest, extractToken } from '@/app/lib/api-auth';
import { createAuthenticatedClient } from '@/app/lib/db/client';
import * as db from '@/app/lib/db/wa-sender';
import * as XLSX from 'xlsx';

/**
 * GET /api/wa-sender/contacts
 * Fetch paginated contacts for the authenticated user
 *
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 50, max: 500)
 * - search: Search term (matches name, phone, email, company)
 *
 * Response: { contacts, total, page, limit }
 */
export async function GET(req: NextRequest) {
  const payload = verifyTokenFromRequest(req);
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const token = extractToken(req);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = createAuthenticatedClient(token);
    const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');
    const search = req.nextUrl.searchParams.get('search') || undefined;

    const result = await db.getContacts(client, { page, limit, search });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('[GET /api/wa-sender/contacts]', error);
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/wa-sender/contacts/import
 * Import contacts from Excel file
 * Not implemented in this route (use /import/route.ts instead)
 */
export async function POST(req: NextRequest) {
  const payload = verifyTokenFromRequest(req);
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json(
    { error: 'Use POST /api/wa-sender/contacts/import for file uploads' },
    { status: 400 }
  );
}
