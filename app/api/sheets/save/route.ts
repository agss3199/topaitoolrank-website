import { supabaseAdmin } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

// Input validation constraints
const CONSTRAINTS = {
  MESSAGE_MAX_LENGTH: 4096, // WhatsApp limit
  EMAIL_SUBJECT_MAX_LENGTH: 255,
  EMAIL_BODY_MAX_LENGTH: 65536,
  COUNTRY_CODE_MAX_LENGTH: 5,
};

function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

function validateInputs(
  message_template: unknown,
  email_subject: unknown,
  email_body: unknown,
  country_code: unknown
): { valid: boolean; error?: string } {
  if (typeof message_template === 'string' && message_template.length > CONSTRAINTS.MESSAGE_MAX_LENGTH) {
    return { valid: false, error: `Message exceeds ${CONSTRAINTS.MESSAGE_MAX_LENGTH} characters` };
  }
  if (typeof email_subject === 'string' && email_subject.length > CONSTRAINTS.EMAIL_SUBJECT_MAX_LENGTH) {
    return { valid: false, error: `Email subject exceeds ${CONSTRAINTS.EMAIL_SUBJECT_MAX_LENGTH} characters` };
  }
  if (typeof email_body === 'string' && email_body.length > CONSTRAINTS.EMAIL_BODY_MAX_LENGTH) {
    return { valid: false, error: `Email body exceeds ${CONSTRAINTS.EMAIL_BODY_MAX_LENGTH} characters` };
  }
  if (typeof country_code === 'string' && country_code.length > CONSTRAINTS.COUNTRY_CODE_MAX_LENGTH) {
    return { valid: false, error: `Country code exceeds ${CONSTRAINTS.COUNTRY_CODE_MAX_LENGTH} characters` };
  }
  return { valid: true };
}

export async function POST(req: NextRequest) {
  try {
    // Validate payload size before reading body (spec: payload-size-guard.md)
    const contentLength = req.headers.get('content-length');
    const maxSize = 4 * 1024 * 1024; // 4MB for sheet uploads

    if (contentLength && parseInt(contentLength) > maxSize) {
      return NextResponse.json(
        { error: `Sheet upload exceeds ${maxSize / 1024 / 1024}MB limit. Try splitting into smaller files.` },
        { status: 413 }
      );
    }

    const { userId, sheet_data, send_mode, country_code, message_template, email_subject, email_body, current_sheet_name, current_index, sent_status } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Validate userId is a valid UUID
    if (typeof userId !== 'string' || !isValidUUID(userId)) {
      return NextResponse.json({ error: 'Invalid User ID format' }, { status: 400 });
    }

    // Validate input lengths
    const validation = validateInputs(message_template, email_subject, email_body, country_code);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Verify user is authenticated in Supabase
    const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Build delta payload -- only include fields that were provided (Issue 3: delta updates)
    const updateFields: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (sheet_data !== undefined) updateFields.sheet_data = sheet_data;
    if (send_mode !== undefined) updateFields.send_mode = send_mode;
    if (country_code !== undefined) updateFields.country_code = country_code;
    if (message_template !== undefined) updateFields.message_template = message_template;
    if (email_subject !== undefined) updateFields.email_subject = email_subject;
    if (email_body !== undefined) updateFields.email_body = email_body;
    if (current_sheet_name !== undefined) updateFields.current_sheet_name = current_sheet_name;
    if (current_index !== undefined) updateFields.current_index = current_index;
    if (sent_status !== undefined) updateFields.sent_status = sent_status;

    // Issue 3: Try insert first, on conflict update instead of two queries
    // First, try to insert; if row exists, update it
    const { error: insertError } = await supabaseAdmin
      .from('wa_sender_sessions')
      .insert(
        {
          user_id: userId,
          ...updateFields,
        }
      );

    // If insert failed due to duplicate key, update instead
    let error = insertError;
    if (insertError?.code === '23505') {
      // Unique constraint violation - row exists, update it
      const { error: updateError } = await supabaseAdmin
        .from('wa_sender_sessions')
        .update(updateFields)
        .eq('user_id', userId);
      error = updateError;
    }

    if (error) {
      console.error('[wa-sender] save.upsert_error', {
        userId: userId.substring(0, 8),
        errorCode: error.code,
        errorMessage: error.message,
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json(
        { error: 'Failed to save session: ' + (error.message || 'Unknown error') },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[wa-sender] save.exception', {
      errorType: error instanceof Error ? error.name : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { error: 'Failed to save session: Internal server error' },
      { status: 500 }
    );
  }
}
