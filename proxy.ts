import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, isTokenExpired, maskTokenForLog, createAccessToken } from '@/app/lib/jwt';

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/auth/login',
  '/auth/signup',
  '/auth/callback',
  '/blogs',
  '/api/public',
];

// Protected routes that require authentication with tool scope validation
const PROTECTED_ROUTE_PATTERN = /^\/tools\/([^/]+)\//;

/**
 * Extract tool_id from request pathname.
 * Example: /tools/wa-sender/dashboard → wa-sender
 *
 * @param pathname Request path
 * @returns tool_id or null if not a /tools/* route
 */
function extractToolFromRoute(pathname: string): string | null {
  const match = pathname.match(PROTECTED_ROUTE_PATTERN);
  return match ? match[1] : null;
}

/**
 * Check if a route is public and doesn't require authentication.
 *
 * @param pathname Request path
 * @returns true if route is public
 */
function isPublicRoute(pathname: string): boolean {
  // Static assets and Next.js internals
  if (pathname.startsWith('/_next') || pathname.startsWith('/public') || pathname === '/favicon.ico') {
    return true;
  }

  // Explicitly public routes
  for (const route of PUBLIC_ROUTES) {
    if (pathname === route || pathname.startsWith(route + '/')) {
      return true;
    }
  }

  return false;
}

/**
 * Get access token from Authorization header or cookies.
 *
 * @param request Next request
 * @returns access token or null if not found
 */
function getAccessToken(request: NextRequest): string | null {
  // Try Authorization header first (preferred)
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7); // Remove 'Bearer ' prefix
  }

  // Fallback to cookie (not used in current design but documented in spec)
  return request.cookies.get('access_token')?.value || null;
}

/**
 * Get refresh token from cookies.
 *
 * @param request Next request
 * @returns refresh token or null if not found
 */
function getRefreshToken(request: NextRequest): string | null {
  return request.cookies.get('refresh_token')?.value || null;
}

/**
 * Main proxy function (Next.js 16 replaces deprecated middleware).
 * Runs on every request to validate authentication and tool-scoped access.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Log request (masked)
  const accessToken = getAccessToken(request);
  if (accessToken) {
    console.log(`[auth] ${request.method} ${pathname} token=${maskTokenForLog(accessToken, 'access')}`);
  }

  // Public routes don't require auth
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Extract tool_id from route if this is a /tools/* request
  const requiredToolId = extractToolFromRoute(pathname);

  // If not a protected route, let it through
  if (!requiredToolId) {
    return NextResponse.next();
  }

  // Protected route: must have valid token with matching tool_id

  if (!accessToken) {
    console.warn(`[auth] REDIRECT_TO_LOGIN ${pathname} reason=no_token`);
    return redirectToLogin(request, pathname);
  }

  // Verify token signature and expiry
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('[auth] FATAL: JWT_SECRET not configured in environment');
    return redirectToLogin(request, pathname);
  }

  const payload = verifyToken(accessToken, jwtSecret);
  if (!payload) {
    console.warn(`[auth] REDIRECT_TO_LOGIN ${pathname} reason=invalid_token token=${maskTokenForLog(accessToken, 'access')}`);
    return redirectToLogin(request, pathname);
  }

  // Check tool_id match
  if (payload.tool_id !== requiredToolId) {
    console.warn(
      `[auth] REDIRECT_TO_LOGIN ${pathname} reason=tool_mismatch ` +
        `expected=${requiredToolId} got=${payload.tool_id}`
    );
    return redirectToLogin(request, pathname);
  }

  // Check token expiry with 60-second buffer for clock skew
  if (isTokenExpired(payload.exp, 60)) {
    console.info(`[auth] TOKEN_EXPIRED ${pathname} user=${payload.sub} tool=${payload.tool_id}`);

    // Try to refresh using refresh token
    const refreshToken = getRefreshToken(request);
    if (refreshToken) {
      const refreshPayload = verifyToken(refreshToken, jwtSecret);
      if (refreshPayload && refreshPayload.tool_id === requiredToolId && !isTokenExpired(refreshPayload.exp, 0)) {
        // Create new access token
        const newAccessToken = createAccessToken(refreshPayload.sub, refreshPayload.tool_id, jwtSecret);
        console.info(
          `[auth] TOKEN_REFRESHED ${pathname} user=${refreshPayload.sub} token=${maskTokenForLog(newAccessToken, 'access')}`
        );

        // Continue request and attach new token in response header for client to pick up
        const response = NextResponse.next();
        response.headers.set('x-access-token', newAccessToken);
        return response;
      }
    }

    // Refresh failed or no refresh token, redirect to login
    console.warn(`[auth] REDIRECT_TO_LOGIN ${pathname} reason=refresh_failed user=${payload.sub}`);
    return redirectToLogin(request, pathname);
  }

  // Token is valid and tool matches, allow request
  console.debug(`[auth] REQUEST_OK ${pathname} user=${payload.sub} tool=${payload.tool_id}`);
  return NextResponse.next();
}

/**
 * Redirect to login page with return URL.
 *
 * @param request Current request
 * @param returnUrl URL to redirect back to after login
 * @returns Redirect response
 */
function redirectToLogin(request: NextRequest, returnUrl: string): NextResponse {
  const loginUrl = new URL('/auth/login', request.url);
  loginUrl.searchParams.set('returnUrl', returnUrl);
  return NextResponse.redirect(loginUrl, { status: 307 });
}

// Middleware config: runs on these routes
export const config = {
  matcher: [
    // All /tools/* routes require auth
    '/tools/:path*',

    // Auth routes (login, signup, callback) are public but middleware still runs
    '/auth/:path*',

    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
};
