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

    // Check if session exists
    const { data: existingSession } = await supabaseAdmin
      .from('wa_sender_sessions')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existingSession) {
      // Update existing session
      const { error } = await supabaseAdmin
        .from('wa_sender_sessions')
        .update({
          sheet_data,
          send_mode,
          country_code,
          message_template,
          email_subject,
          email_body,
          current_sheet_name,
          current_index,
          sent_status: sent_status || {},
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) {
        // Log with request context for debugging
        console.error('[wa-sender] save.update_error', {
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
    } else {
      // Create new session
      const { error } = await supabaseAdmin
        .from('wa_sender_sessions')
        .insert({
          user_id: userId,
          sheet_data,
          send_mode,
          country_code,
          message_template,
          email_subject,
          email_body,
          current_sheet_name,
          current_index,
          sent_status: sent_status || {},
        });

      if (error) {
        console.error('[wa-sender] save.insert_error', {
          userId: userId.substring(0, 8),
          errorCode: error.code,
          errorMessage: error.message,
          timestamp: new Date().toISOString(),
        });
        return NextResponse.json(
          { error: 'Failed to create session: ' + (error.message || 'Unknown error') },
          { status: 500 }
        );
      }
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
