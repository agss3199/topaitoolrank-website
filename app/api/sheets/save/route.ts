import { supabaseAdmin } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { userId, sheet_data, send_mode, country_code, message_template, email_subject, email_body, current_sheet_name, current_index, sent_status } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Validate userId is a valid UUID (basic check)
    if (typeof userId !== 'string' || userId.length < 10) {
      return NextResponse.json({ error: 'Invalid User ID' }, { status: 400 });
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
        console.error('Update session error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
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
        console.error('Insert session error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Save session error:', error);
    return NextResponse.json({ error: 'Failed to save session' }, { status: 500 });
  }
}
