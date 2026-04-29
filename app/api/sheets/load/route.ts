import { supabaseAdmin } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // Get userId from URL params (client sends it)
    const userId = req.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    if (typeof userId !== 'string' || userId.length < 10) {
      return NextResponse.json({ error: 'Invalid User ID' }, { status: 400 });
    }

    // Verify user is authenticated in Supabase
    const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: session, error } = await supabaseAdmin
      .from('wa_sender_sessions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = not found, which is ok
      console.error('Load session error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      session: session || null,
    });
  } catch (error) {
    console.error('Load session error:', error);
    return NextResponse.json({ error: 'Failed to load session' }, { status: 500 });
  }
}
