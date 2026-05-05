import { NextRequest, NextResponse } from 'next/server';
import { verifyTokenFromRequest, extractToken } from '@/app/lib/api-auth';
import { createAuthenticatedClient } from '@/app/lib/db/client';
import * as db from '@/app/lib/db/wa-sender';

/**
 * GET /api/wa-sender/contacts/[id]
 * Fetch a single contact by ID
 *
 * Response: Contact object or 404 if not found
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = verifyTokenFromRequest(req);
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const token = extractToken(req);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = createAuthenticatedClient(token);
    const contact = await db.getContact(client, id);

    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(contact, { status: 200 });
  } catch (error) {
    console.error('[GET /api/wa-sender/contacts/[id]]', error);
    return NextResponse.json(
      { error: 'Failed to fetch contact' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/wa-sender/contacts/[id]
 * Delete a contact by ID
 *
 * Response: 204 No Content on success, 404 if not found
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = verifyTokenFromRequest(req);
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const token = extractToken(req);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = createAuthenticatedClient(token);

    // Check if contact exists
    const existing = await db.getContact(client, id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    await db.deleteContact(client, id);

    // Return 204 No Content
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[DELETE /api/wa-sender/contacts/[id]]', error);
    return NextResponse.json(
      { error: 'Failed to delete contact' },
      { status: 500 }
    );
  }
}
