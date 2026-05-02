import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, maskTokenForLog } from '@/app/lib/jwt';

/**
 * POST /api/auth/logout
 * Invalidate the user's session by clearing tokens.
 *
 * In a production system with token blacklisting:
 * - The refresh token would be added to a Redis blacklist with TTL = 7 days
 * - The access token would be added with TTL = 1 hour
 * - Any refresh attempts check the blacklist first
 *
 * For now, we just clear the tokens client-side.
 *
 * Request:
 * - Authorization header: Bearer <access-token> (optional, for audit)
 *
 * Response:
 * - Success (200): { "ok": true }
 * - Unauthorized (401): { "error": "..." }
 */
export async function POST(req: NextRequest) {
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('[auth/logout] FATAL: JWT_SECRET not configured');
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    // Extract access token from Authorization header (for audit/logging)
    let accessToken = null;
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      accessToken = authHeader.substring(7);
    }

    // Verify token is valid (for audit, not strictly required to logout)
    if (accessToken) {
      const payload = verifyToken(accessToken, jwtSecret);
      if (payload) {
        console.info(
          `[auth/logout] OK user=${payload.sub} tool=${payload.tool_id} ` +
          `token=${maskTokenForLog(accessToken, 'access')}`
        );

        // In production: add refresh_token to Redis blacklist here
        // await redis.setex(
        //   `blacklist:refresh:${payload.sub}:${payload.tool_id}`,
        //   7 * 24 * 3600,  // 7 days
        //   '1'
        // );
      } else {
        console.warn('[auth/logout] WARN: invalid token provided for logout');
      }
    } else {
      console.warn('[auth/logout] WARN: no token provided for logout');
    }

    // Clear all auth-related cookies and return success
    const response = NextResponse.json({ ok: true });

    // Clear access token cookie
    response.cookies.set('access_token', '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Immediate expiry
    });

    // Clear refresh token cookie
    response.cookies.set('refresh_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Immediate expiry
    });

    return response;
  } catch (error) {
    console.error('[auth/logout] ERROR:', error instanceof Error ? error.message : String(error));
    // Logout should always succeed (clearing cookies is best-effort)
    const response = NextResponse.json({ ok: true });
    response.cookies.set('access_token', '', { maxAge: 0 });
    response.cookies.set('refresh_token', '', { maxAge: 0 });
    return response;
  }
}
