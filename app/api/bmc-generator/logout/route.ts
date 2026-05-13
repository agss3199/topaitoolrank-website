/**
 * POST /api/bmc-generator/logout
 *
 * Ends user session and clears the bmc_session authentication cookie.
 *
 * Behavior:
 * 1. Validates session exists (returns 400 if already logged out)
 * 2. Deletes bmc_session cookie (Max-Age=0)
 * 3. Returns success response with redirect URL
 *
 * No body required.
 */

import {
  validateAndRefreshSession,
  buildExpiredSessionCookie,
} from '@/app/tools/bmc-generator/lib/middleware-helpers';

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: Request): Promise<Response> {
  const t0 = performance.now();

  // 1. Validate that a session exists
  const sessionResult = validateAndRefreshSession(request);

  if (!sessionResult.valid) {
    const latencyMs = Math.round(performance.now() - t0);
    console.warn(
      JSON.stringify({
        event: 'bmc.logout.no_session',
        error: sessionResult.error,
        latencyMs,
      })
    );
    return new Response(
      JSON.stringify({ error: 'Not logged in' }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache',
        },
      }
    );
  }

  // 2. Build expired cookie to delete bmc_session
  const expiredCookie = buildExpiredSessionCookie();

  const latencyMs = Math.round(performance.now() - t0);
  console.info(
    JSON.stringify({
      event: 'bmc.logout.ok',
      latencyMs,
    })
  );

  // 3. Return success with redirect URL
  return new Response(
    JSON.stringify({
      success: true,
      redirect: '/tools/bmc-generator/login',
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': expiredCookie,
        'Cache-Control': 'no-store, no-cache',
      },
    }
  );
}
