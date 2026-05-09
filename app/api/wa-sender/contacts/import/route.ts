import { NextRequest, NextResponse } from 'next/server';
import { verifyTokenFromRequest, extractToken } from '@/app/lib/api-auth';
import { createAuthenticatedClient } from '@/app/lib/db/client';
import * as db from '@/app/lib/db/wa-sender';
import * as XLSX from 'xlsx';

/**
 * POST /api/wa-sender/contacts/import
 * Import contacts from Excel/CSV file
 *
 * Request: multipart/form-data with file field
 * Validates file size (4MB max), row count (10,000 max)
 * Parses Excel/CSV and imports contacts via bulk insert
 * Creates import session record with counts and errors
 *
 * Response: { import_id, status, total_rows, imported, duplicates_merged, errors[] }
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

  try {
    const token = extractToken(req);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type (Excel or CSV)
    const fileName = file.name.toLowerCase();
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    const isCsv = fileName.endsWith('.csv');

    if (!isExcel && !isCsv) {
      return NextResponse.json(
        { error: 'File must be Excel (.xlsx, .xls) or CSV (.csv)' },
        { status: 400 }
      );
    }

    // Read file buffer
    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);

    // Parse file
    let rows: any[] = [];
    if (isExcel) {
      const workbook = XLSX.read(uint8Array, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(worksheet);
    } else {
      // CSV parsing
      const text = new TextDecoder().decode(uint8Array);
      const lines = text.trim().split('\n');
      const header = lines[0].split(',').map((h) => h.trim().toLowerCase());

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map((v) => v.trim());
        const row: any = {};
        header.forEach((h, idx) => {
          row[h] = values[idx] || '';
        });
        rows.push(row);
      }
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: 'File is empty' }, { status: 400 });
    }

    // Validate row count (max 10,000)
    const maxRows = 10000;
    if (rows.length > maxRows) {
      return NextResponse.json(
        { error: `File exceeds maximum ${maxRows} rows. Got ${rows.length}` },
        { status: 400 }
      );
    }

    // Map rows to ImportedContact format
    const contacts = rows.map((row: any) => ({
      name: row.name || row.Name || '',
      phone: row.phone || row.Phone || '',
      email: row.email || row.Email || '',
      company: row.company || row.Company || '',
      custom_fields: {},
    }));

    // Create authenticated client and import
    const client = createAuthenticatedClient(token);
    const result = await db.importContacts(client, contacts);

    return NextResponse.json(result, { status: 202 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to import contacts' },
      { status: 500 }
    );
  }
}
