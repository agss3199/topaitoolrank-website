/**
 * BMC Generator Session Validation Middleware
 *
 * Provides session validation and refresh (sliding window TTL)
 * for all protected BMC Generator endpoints.
 *
 * Uses stateless HMAC-signed tokens stored in HTTP-only cookies.
 * No server-side session store needed -- works on Vercel.
 */

import {
  verifySessionToken,
  createSessionToken,
} from './auth-helpers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SessionValidationResult {
  valid: boolean;
  username?: string;
  refreshedToken?: string;
  error?: string;
}

/**
 * Context passed to protected route handlers after session validation.
 */
export interface SessionContext {
  username: string;
}

/**
 * Handler function type for protected endpoints.
 * Receives the original request and a session context with the authenticated username.
 */
export type ProtectedHandler = (
  request: Request,
  context: SessionContext
) => Response | Promise<Response>;

// ---------------------------------------------------------------------------
// Session Secret (shared helper)
// ---------------------------------------------------------------------------

/**
 * Load the session signing secret from environment variables.
 *
 * Raises a clear error if the secret is missing or too short.
 * NEVER returns a default -- always fails loudly.
 */
export function getSessionSecret(): string {
  const secret = process.env.BMC_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'BMC_SESSION_SECRET must be set and at least 32 characters long'
    );
  }
  return secret;
}

// ---------------------------------------------------------------------------
// Cookie Parsing
// ---------------------------------------------------------------------------

/**
 * Extract the value of bmc_session from a Cookie header string.
 *
 * Handles multiple cookies separated by "; ".
 * Returns undefined if the cookie is not found.
 */
function parseBmcSessionCookie(cookieHeader: string): string | undefined {
  const cookies = cookieHeader.split(';');
  for (const cookie of cookies) {
    const trimmed = cookie.trim();
    if (trimmed.startsWith('bmc_session=')) {
      const value = trimmed.slice('bmc_session='.length);
      return value || undefined; // treat empty string as absent
    }
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Session Validation + Refresh (Sliding Window)
// ---------------------------------------------------------------------------

/**
 * Validate the session token from the request's bmc_session cookie.
 *
 * On success, returns a refreshed token with a new 24h TTL (sliding window).
 * On failure, returns an error message describing the issue.
 *
 * TTL is reset on EVERY successful request (GET or POST).
 * TTL is NOT reset on: failed auth attempts, invalid CSRF, expired sessions.
 *
 * @param request - The incoming HTTP request
 * @returns SessionValidationResult with validity, username, and refreshed token
 */
export function validateAndRefreshSession(
  request: Request
): SessionValidationResult {
  // 1. Extract bmc_session cookie
  const cookieHeader = request.headers.get('Cookie') || '';
  const token = parseBmcSessionCookie(cookieHeader);

  if (!token) {
    return {
      valid: false,
      error: 'No session cookie found',
    };
  }

  // 2. Verify token signature and expiration
  let secret: string;
  try {
    secret = getSessionSecret();
  } catch {
    return {
      valid: false,
      error: 'Server configuration error',
    };
  }

  const verifyResult = verifySessionToken(token, secret);
  if (!verifyResult.valid || !verifyResult.username) {
    return {
      valid: false,
      error: 'Invalid or expired session',
    };
  }

  // 3. Create refreshed token with new 24h TTL (sliding window)
  const SESSION_TTL_SECONDS = 86400; // 24 hours
  const refreshedToken = createSessionToken(
    verifyResult.username,
    secret,
    SESSION_TTL_SECONDS
  );

  return {
    valid: true,
    username: verifyResult.username,
    refreshedToken,
  };
}

// ---------------------------------------------------------------------------
// Cookie Builders
// ---------------------------------------------------------------------------

/**
 * Build a Set-Cookie header value for a valid session.
 *
 * Cookie attributes:
 * - HttpOnly: prevents JavaScript access (XSS protection)
 * - SameSite=Lax: prevents CSRF
 * - Secure: HTTPS-only (production only)
 * - Max-Age=86400: 24 hours
 * - Path=/: available across all routes
 */
export function buildSessionCookie(token: string): string {
  const isProduction = process.env.NODE_ENV === 'production';
  const parts = [
    `bmc_session=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=86400',
  ];
  if (isProduction) {
    parts.push('Secure');
  }
  return parts.join('; ');
}

/**
 * Build a Set-Cookie header value that deletes the bmc_session cookie.
 *
 * Sets Max-Age=0 which instructs the browser to immediately delete the cookie.
 */
export function buildExpiredSessionCookie(): string {
  const isProduction = process.env.NODE_ENV === 'production';
  const parts = [
    'bmc_session=',
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
  ];
  if (isProduction) {
    parts.push('Secure');
  }
  return parts.join('; ');
}

// ---------------------------------------------------------------------------
// Middleware Wrapper
// ---------------------------------------------------------------------------

/**
 * Wrap a route handler with session validation middleware.
 *
 * Validates the bmc_session cookie on every request:
 * - If valid: calls the handler with the session context, sets refreshed cookie
 * - If invalid/expired: returns 401 with redirect to login
 *
 * Implements sliding window TTL: every successful request resets the session
 * expiry to now() + 24h.
 *
 * @param handler - The protected route handler
 * @returns A wrapped handler that validates the session first
 */
export function withSessionValidation(
  handler: ProtectedHandler
): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    const sessionResult = validateAndRefreshSession(request);

    if (!sessionResult.valid || !sessionResult.username) {
      // Determine error message based on the failure type
      const errorMessage = sessionResult.error === 'No session cookie found'
        ? 'Unauthorized. Please log in.'
        : 'Session expired. Please log in again.';

      return new Response(
        JSON.stringify({
          error: errorMessage,
          redirect: '/tools/bmc-generator/login',
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache',
          },
        }
      );
    }

    // Call the actual handler with session context
    const handlerResponse = await handler(request, {
      username: sessionResult.username,
    });

    // Build refreshed session cookie (sliding window TTL reset)
    const refreshedCookie = buildSessionCookie(sessionResult.refreshedToken!);

    // Clone the response and add the refreshed cookie header
    // We need to merge headers from the handler response with the cookie
    const responseBody = await handlerResponse.text();
    const mergedHeaders = new Headers(handlerResponse.headers);
    mergedHeaders.set('Set-Cookie', refreshedCookie);
    if (!mergedHeaders.has('Cache-Control')) {
      mergedHeaders.set('Cache-Control', 'no-store, no-cache');
    }

    return new Response(responseBody, {
      status: handlerResponse.status,
      statusText: handlerResponse.statusText,
      headers: mergedHeaders,
    });
  };
}
