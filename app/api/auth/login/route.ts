import { supabaseClient, supabaseAdmin } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    // Sign in with Supabase
    const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Check approval status
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('requires_approval')
      .eq('id', authData.user!.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (userData.requires_approval) {
      return NextResponse.json(
        { error: 'Account pending admin approval' },
        { status: 403 }
      );
    }

    // Success
    return NextResponse.json({
      ok: true,
      session: {
        accessToken: authData.session?.access_token,
        refreshToken: authData.session?.refresh_token,
        userId: authData.user!.id,
        email: authData.user!.email,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
