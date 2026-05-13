/**
 * POST /api/bmc-generator/login
 *
 * Validates username/password against env vars.
 * Issues HTTP-only, Secure, SameSite=Lax cookie (bmc_session, 24h TTL).
 * Enforces per-IP rate limiting (5 failures per 10 min -> 429).
 * Enforces per-username account lockout (5 failures per 24h -> lock 30 min -> 423).
 *
 * Error messages are generic to prevent user enumeration.
 */

import {
  RateLimiter,
  AccountLockout,
  validateLoginInput,
  verifyCredentials,
  createSessionToken,
  getCredentials,
} from '@/app/tools/bmc-generator/lib/auth-helpers';
import {
  getSessionSecret,
  buildSessionCookie,
} from '@/app/tools/bmc-generator/lib/middleware-helpers';

// ---------------------------------------------------------------------------
// Module-level state (persists across requests in the same server instance)
// ---------------------------------------------------------------------------

const ipRateLimiter = new RateLimiter({
  maxAttempts: 5,
  windowMs: 10 * 60 * 1000, // 10 minutes
});

const accountLockout = new AccountLockout({
  maxAttempts: 5,
  trackingWindowMs: 24 * 60 * 60 * 1000, // 24 hours
  lockDurationMs: 30 * 60 * 1000, // 30 minutes
});

// ---------------------------------------------------------------------------
// Helper to extract client IP
// ---------------------------------------------------------------------------

function getClientIP(request: Request): string {
  // x-forwarded-for header (set by proxies/load balancers)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // Take the first IP (client IP) from a comma-separated list
    return forwarded.split(',')[0].trim();
  }

  // Fallback for local development
  return '127.0.0.1';
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: Request): Promise<Response> {
  const t0 = performance.now();
  const clientIP = getClientIP(request);

  // 1. Check IP rate limit FIRST (before any other processing)
  const rateLimitResult = ipRateLimiter.check(clientIP);
  if (!rateLimitResult.allowed) {
    const latencyMs = Math.round(performance.now() - t0);
    console.warn(
      JSON.stringify({
        event: 'bmc.login.rate_limited',
        ip: clientIP,
        retryAfterSeconds: rateLimitResult.retryAfterSeconds,
        latencyMs,
      })
    );
    return Response.json(
      {
        success: false,
        error: `Too many login attempts from your IP. Try again in ${rateLimitResult.retryAfterSeconds} seconds.`,
      },
      { status: 429 }
    );
  }

  // 2. Parse request body
  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  const { username, password } = body;

  // 3. Validate input format
  const validation = validateLoginInput(
    username || '',
    password || ''
  );
  if (!validation.valid) {
    return Response.json(
      { success: false, error: validation.error },
      { status: 400 }
    );
  }

  // 4. Check account lockout (per-username)
  const lockoutResult = accountLockout.check(username!);
  if (lockoutResult.locked) {
    const latencyMs = Math.round(performance.now() - t0);
    console.warn(
      JSON.stringify({
        event: 'bmc.login.account_locked',
        retryAfterSeconds: lockoutResult.retryAfterSeconds,
        latencyMs,
      })
    );
    return Response.json(
      {
        success: false,
        error: 'Account temporarily locked. Try again in 30 minutes.',
      },
      { status: 423 }
    );
  }

  // 5. Validate credentials against environment variables
  let credentials;
  let secret;
  try {
    credentials = getCredentials();
    secret = getSessionSecret();
  } catch (err) {
    const latencyMs = Math.round(performance.now() - t0);
    console.error(
      JSON.stringify({
        event: 'bmc.login.config_error',
        error: err instanceof Error ? err.message : 'unknown',
        latencyMs,
      })
    );
    // Server misconfiguration -- do not reveal details
    return Response.json(
      { success: false, error: 'Server configuration error' },
      { status: 500 }
    );
  }

  // Use timing-safe credential comparison to prevent timing attacks
  const isValid = verifyCredentials(
    username!,
    password!,
    credentials.username,
    credentials.password,
    secret
  );

  if (!isValid) {
    // Record failures for both rate limiter and lockout
    ipRateLimiter.recordFailure(clientIP);
    accountLockout.recordFailure(username!);

    const latencyMs = Math.round(performance.now() - t0);
    console.warn(
      JSON.stringify({
        event: 'bmc.login.failed',
        ip: clientIP,
        latencyMs,
      })
    );

    return Response.json(
      { success: false, error: 'Invalid username or password' },
      { status: 401 }
    );
  }

  // 6. Login successful -- create session token and set cookie
  accountLockout.recordSuccess(username!);

  // Reuse secret already retrieved earlier
  const sessionToken = createSessionToken(username!, secret);

  // Build Set-Cookie header using shared helper
  const sessionCookie = buildSessionCookie(sessionToken);

  const latencyMs = Math.round(performance.now() - t0);
  console.info(
    JSON.stringify({
      event: 'bmc.login.ok',
      latencyMs,
    })
  );

  return new Response(
    JSON.stringify({
      success: true,
      redirect: '/tools/bmc-generator/',
      user: { username: username! },
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': sessionCookie,
        'Cache-Control': 'no-store, no-cache',
      },
    }
  );
}

// ---------------------------------------------------------------------------
// Test helper: reset module-level state
// ---------------------------------------------------------------------------

/**
 * Reset all rate limiting and lockout state.
 * Exported only for test use -- NEVER call in production code.
 */
export function _resetState(): void {
  ipRateLimiter.reset();
  accountLockout.reset();
}
