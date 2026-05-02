import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, createAccessToken, isTokenExpired } from '@/app/lib/jwt';

/**
 * POST /api/auth/refresh
 * Generate a new access token from a valid refresh token.
 * The refresh token can be provided via:
 * - Authorization header: "Bearer <refresh-token>"
 * - Cookie: refresh_token=<value>
 * - Request body: { "refreshToken": "<value>" }
 *
 * Response:
 * - Success (200): { "accessToken": "<new-jwt>" }
 * - Unauthorized (401): { "error": "..." }
 */
export async function POST(req: NextRequest) {
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('[auth/refresh] FATAL: JWT_SECRET not configured');
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    // Check request payload size before reading
    const contentLength = req.headers.get('content-length');
    const maxSize = 8 * 1024; // 8KB max for auth endpoints
    if (contentLength && parseInt(contentLength) > maxSize) {
      return NextResponse.json(
        { error: `Request body exceeds ${maxSize / 1024}KB limit` },
        { status: 413 }
      );
    }

    // Extract refresh token from multiple sources
    let refreshToken = null;

    // Try request body first
    try {
      const body = await req.json();
      refreshToken = body.refreshToken || body.refresh_token;
    } catch {
      // Body is not JSON, try other sources
    }

    // Try Authorization header
    if (!refreshToken) {
      const authHeader = req.headers.get('Authorization');
      if (authHeader?.startsWith('Bearer ')) {
        refreshToken = authHeader.substring(7);
      }
    }

    // Try cookie
    if (!refreshToken) {
      refreshToken = req.cookies.get('refresh_token')?.value;
    }

    if (!refreshToken) {
      console.warn('[auth/refresh] REJECT: no refresh token provided');
      return NextResponse.json({ error: 'Refresh token required' }, { status: 401 });
    }

    // Verify refresh token
    const payload = verifyToken(refreshToken, jwtSecret);
    if (!payload) {
      console.warn('[auth/refresh] REJECT: invalid refresh token signature');
      return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 });
    }

    // Check if refresh token is expired
    if (isTokenExpired(payload.exp, 0)) {
      console.warn(`[auth/refresh] REJECT: refresh token expired user=${payload.sub}`);
      return NextResponse.json({ error: 'Refresh token expired' }, { status: 401 });
    }

    // Generate new access token (same user and tool as refresh token)
    const newAccessToken = createAccessToken(payload.sub, payload.tool_id, jwtSecret);

    console.info(
      `[auth/refresh] OK user=${payload.sub} tool=${payload.tool_id}`
    );

    // Return new access token
    const response = NextResponse.json({
      accessToken: newAccessToken,
      expiresIn: 3600, // 1 hour in seconds
    });

    // Also set the new token in a secure httpOnly cookie for convenience
    response.cookies.set('access_token', newAccessToken, {
      httpOnly: false, // Client needs to read it for Authorization header
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600, // 1 hour
    });

    return response;
  } catch (error) {
    console.error('[auth/refresh] ERROR:', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: 'Token refresh failed' }, { status: 500 });
  }
}
