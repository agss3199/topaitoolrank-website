import { supabaseClient, supabaseAdmin } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import { createAccessToken, createRefreshToken } from '@/app/lib/jwt';

/**
 * POST /api/auth/login
 * Authenticate user with email and password, return JWT tokens.
 *
 * Request body:
 * {
 *   "email": "user@example.com",
 *   "password": "secret",
 *   "tool": "wa-sender"  // optional, defaults to "wa-sender"
 * }
 *
 * Response:
 * - Success (200): {
 *     "ok": true,
 *     "accessToken": "<jwt>",
 *     "refreshToken": "<jwt>",
 *     "userId": "user-id",
 *     "email": "user@example.com",
 *     "expiresIn": 3600
 *   }
 * - Unauthorized (401): { "error": "Invalid credentials" }
 * - Bad request (400): { "error": "..." }
 */
export async function POST(req: NextRequest) {
  try {
    // Validate request size
    const contentLength = req.headers.get('content-length');
    const maxSize = 8 * 1024; // 8KB max for login
    if (contentLength && parseInt(contentLength) > maxSize) {
      return NextResponse.json(
        { error: `Request body exceeds ${maxSize / 1024}KB limit` },
        { status: 413 }
      );
    }

    const { email, password, tool = 'wa-sender' } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    if (!email.match(/^\S+@\S+\.\S+$/)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Validate tool_id format (alphanumeric and hyphens only)
    if (!tool.match(/^[a-zA-Z0-9-]+$/)) {
      return NextResponse.json({ error: 'Invalid tool identifier' }, { status: 400 });
    }

    // Sign in with Supabase
    const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      console.warn(`[auth/login] REJECT: invalid credentials email=${email}`);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Check approval status
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('requires_approval')
      .eq('id', authData.user!.id)
      .single();

    if (userError || !userData) {
      console.warn(`[auth/login] REJECT: user not found user_id=${authData.user!.id}`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (userData.requires_approval) {
      console.warn(`[auth/login] REJECT: account pending approval user_id=${authData.user!.id}`);
      return NextResponse.json(
        { error: 'Account pending admin approval' },
        { status: 403 }
      );
    }

    const userId = authData.user!.id;

    // Get JWT_SECRET from environment
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('[auth/login] FATAL: JWT_SECRET not configured');
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    // Create JWT tokens scoped to the requested tool
    const accessToken = createAccessToken(userId, tool, jwtSecret);
    const refreshToken = createRefreshToken(userId, tool, jwtSecret);

    console.info(
      `[auth/login] OK user=${userId} email=${email} tool=${tool}`
    );

    // Return tokens to client
    const response = NextResponse.json({
      ok: true,
      accessToken,
      refreshToken,
      userId,
      email: authData.user!.email,
      tool,
      expiresIn: 3600, // Access token expires in 1 hour (seconds)
    });

    // Set refresh token in httpOnly cookie (not readable by JavaScript)
    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true, // Critical: JavaScript cannot access this
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'lax', // CSRF protection
      maxAge: 7 * 24 * 3600, // 7 days
      path: '/',
    });

    // Set access token in non-httpOnly cookie for convenience
    // Client typically stores this in localStorage for Authorization header
    response.cookies.set('access_token', accessToken, {
      httpOnly: false, // Client needs to read for Authorization header
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600, // 1 hour
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('[auth/login] ERROR:', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
