/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createSessionToken,
  verifySessionToken,
} from '../lib/auth-helpers';

// ---------------------------------------------------------------------------
// Test constants
// ---------------------------------------------------------------------------

const TEST_SECRET = 'test-secret-key-minimum-32-bytes!';
const TEST_USERNAME = 'testuser';

// ---------------------------------------------------------------------------
// Helper to dynamically import middleware-helpers (fresh module each test)
// ---------------------------------------------------------------------------

async function importMiddlewareHelpers() {
  return await import('../lib/middleware-helpers');
}

// ---------------------------------------------------------------------------
// getSessionSecret (shared helper)
// ---------------------------------------------------------------------------
describe('getSessionSecret', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns secret when BMC_SESSION_SECRET is set and >= 32 chars', async () => {
    process.env.BMC_SESSION_SECRET = TEST_SECRET;
    const { getSessionSecret } = await importMiddlewareHelpers();
    expect(getSessionSecret()).toBe(TEST_SECRET);
  });

  it('throws when BMC_SESSION_SECRET is missing', async () => {
    delete process.env.BMC_SESSION_SECRET;
    const { getSessionSecret } = await importMiddlewareHelpers();
    expect(() => getSessionSecret()).toThrow(
      'BMC_SESSION_SECRET must be set and at least 32 characters long'
    );
  });

  it('throws when BMC_SESSION_SECRET is empty string', async () => {
    process.env.BMC_SESSION_SECRET = '';
    const { getSessionSecret } = await importMiddlewareHelpers();
    expect(() => getSessionSecret()).toThrow(
      'BMC_SESSION_SECRET must be set and at least 32 characters long'
    );
  });

  it('throws when BMC_SESSION_SECRET is shorter than 32 characters', async () => {
    process.env.BMC_SESSION_SECRET = 'too-short';
    const { getSessionSecret } = await importMiddlewareHelpers();
    expect(() => getSessionSecret()).toThrow(
      'BMC_SESSION_SECRET must be set and at least 32 characters long'
    );
  });
});

// ---------------------------------------------------------------------------
// validateAndRefreshSession
// ---------------------------------------------------------------------------
describe('validateAndRefreshSession', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      BMC_SESSION_SECRET: TEST_SECRET,
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  function makeRequestWithCookie(cookieValue?: string): Request {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (cookieValue !== undefined) {
      headers['Cookie'] = `bmc_session=${cookieValue}`;
    }
    return new Request('http://localhost:3000/api/bmc-generator/start', {
      method: 'POST',
      headers,
    });
  }

  function makeRequestWithoutCookie(): Request {
    return new Request('http://localhost:3000/api/bmc-generator/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
  }

  it('returns invalid when no bmc_session cookie is present', async () => {
    const { validateAndRefreshSession } = await importMiddlewareHelpers();
    const req = makeRequestWithoutCookie();
    const result = validateAndRefreshSession(req);

    expect(result.valid).toBe(false);
    expect(result.username).toBeUndefined();
    expect(result.refreshedToken).toBeUndefined();
    expect(result.error).toBe('No session cookie found');
  });

  it('returns invalid when bmc_session cookie is empty', async () => {
    const { validateAndRefreshSession } = await importMiddlewareHelpers();
    const req = makeRequestWithCookie('');
    const result = validateAndRefreshSession(req);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('No session cookie found');
  });

  it('returns invalid when token has invalid signature', async () => {
    const { validateAndRefreshSession } = await importMiddlewareHelpers();
    // Create token with a different secret
    const badToken = createSessionToken(
      TEST_USERNAME,
      'different-secret-32-bytes-long!!'
    );
    const req = makeRequestWithCookie(badToken);
    const result = validateAndRefreshSession(req);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid or expired session');
  });

  it('returns invalid when token is expired (>24h old)', async () => {
    const { validateAndRefreshSession } = await importMiddlewareHelpers();
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    // Create token with 1 second TTL
    const token = createSessionToken(TEST_USERNAME, TEST_SECRET, 1);

    // Advance time past expiry
    vi.spyOn(Date, 'now').mockReturnValue(now + 2000);

    const req = makeRequestWithCookie(token);
    const result = validateAndRefreshSession(req);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid or expired session');
  });

  it('returns valid with username and refreshed token for valid session', async () => {
    const { validateAndRefreshSession } = await importMiddlewareHelpers();
    const token = createSessionToken(TEST_USERNAME, TEST_SECRET);
    const req = makeRequestWithCookie(token);
    const result = validateAndRefreshSession(req);

    expect(result.valid).toBe(true);
    expect(result.username).toBe(TEST_USERNAME);
    expect(result.refreshedToken).toBeDefined();
    expect(result.refreshedToken).not.toBe(''); // new token generated
    expect(result.error).toBeUndefined();
  });

  it('refreshed token has new expiry (sliding window)', async () => {
    const { validateAndRefreshSession } = await importMiddlewareHelpers();
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    // Create original token (24h TTL)
    const originalToken = createSessionToken(TEST_USERNAME, TEST_SECRET);

    // Advance time by 12 hours
    vi.spyOn(Date, 'now').mockReturnValue(now + 12 * 60 * 60 * 1000);

    const req = makeRequestWithCookie(originalToken);
    const result = validateAndRefreshSession(req);

    expect(result.valid).toBe(true);
    expect(result.refreshedToken).toBeDefined();

    // Verify the refreshed token is valid and has extended expiry
    const verifyResult = verifySessionToken(result.refreshedToken!, TEST_SECRET);
    expect(verifyResult.valid).toBe(true);
    expect(verifyResult.username).toBe(TEST_USERNAME);

    // Advance time to 23h after the REFRESH (35h after original creation)
    // Original would have expired at 24h. Refreshed should still be valid.
    vi.spyOn(Date, 'now').mockReturnValue(
      now + 12 * 60 * 60 * 1000 + 23 * 60 * 60 * 1000
    );
    const lateVerify = verifySessionToken(result.refreshedToken!, TEST_SECRET);
    expect(lateVerify.valid).toBe(true);
  });

  it('returns invalid for tampered token', async () => {
    const { validateAndRefreshSession } = await importMiddlewareHelpers();
    const token = createSessionToken(TEST_USERNAME, TEST_SECRET);
    const tampered = token + 'tamper';
    const req = makeRequestWithCookie(tampered);
    const result = validateAndRefreshSession(req);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid or expired session');
  });

  it('returns invalid for malformed token (no dot separator)', async () => {
    const { validateAndRefreshSession } = await importMiddlewareHelpers();
    const req = makeRequestWithCookie('no-dot-separator');
    const result = validateAndRefreshSession(req);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid or expired session');
  });

  it('parses bmc_session from cookie header with multiple cookies', async () => {
    const { validateAndRefreshSession } = await importMiddlewareHelpers();
    const token = createSessionToken(TEST_USERNAME, TEST_SECRET);
    const req = new Request('http://localhost:3000/api/bmc-generator/start', {
      method: 'POST',
      headers: {
        Cookie: `other_cookie=abc; bmc_session=${token}; another=xyz`,
      },
    });
    const result = validateAndRefreshSession(req);

    expect(result.valid).toBe(true);
    expect(result.username).toBe(TEST_USERNAME);
  });
});

// ---------------------------------------------------------------------------
// withSessionValidation (middleware wrapper)
// ---------------------------------------------------------------------------
describe('withSessionValidation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      BMC_SESSION_SECRET: TEST_SECRET,
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('returns 401 when no session cookie is present', async () => {
    const { withSessionValidation } = await importMiddlewareHelpers();
    const handler = vi.fn(() =>
      Response.json({ data: 'protected' }, { status: 200 })
    );
    const wrapped = withSessionValidation(handler);

    const req = new Request('http://localhost:3000/api/bmc-generator/start', {
      method: 'POST',
    });
    const res = await wrapped(req);

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBeTruthy();
    expect(data.redirect).toBe('/tools/bmc-generator/login');
    expect(handler).not.toHaveBeenCalled();
  });

  it('returns 401 when session token is expired', async () => {
    const { withSessionValidation } = await importMiddlewareHelpers();
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    const token = createSessionToken(TEST_USERNAME, TEST_SECRET, 1);

    // Advance past expiry
    vi.spyOn(Date, 'now').mockReturnValue(now + 2000);

    const handler = vi.fn(() =>
      Response.json({ data: 'protected' }, { status: 200 })
    );
    const wrapped = withSessionValidation(handler);

    const req = new Request('http://localhost:3000/api/bmc-generator/start', {
      method: 'POST',
      headers: { Cookie: `bmc_session=${token}` },
    });
    const res = await wrapped(req);

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toContain('Session expired');
    expect(handler).not.toHaveBeenCalled();
  });

  it('calls handler and sets refreshed cookie on valid session', async () => {
    const { withSessionValidation } = await importMiddlewareHelpers();
    const token = createSessionToken(TEST_USERNAME, TEST_SECRET);

    const handler = vi.fn((_req: Request, _context: { username: string }) =>
      Response.json({ data: 'protected' }, { status: 200 })
    );
    const wrapped = withSessionValidation(handler);

    const req = new Request('http://localhost:3000/api/bmc-generator/start', {
      method: 'POST',
      headers: { Cookie: `bmc_session=${token}` },
    });
    const res = await wrapped(req);

    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalledOnce();

    // Verify handler received username in context
    const callArgs = handler.mock.calls[0];
    expect(callArgs[1].username).toBe(TEST_USERNAME);

    // Verify refreshed cookie is set
    const setCookieArr = res.headers.getSetCookie?.() ?? [];
    const setCookie = setCookieArr.length > 0
      ? setCookieArr[0]
      : res.headers.get('Set-Cookie') || res.headers.get('set-cookie') || '';
    expect(setCookie).toContain('bmc_session=');
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('SameSite=Lax');
    expect(setCookie).toContain('Max-Age=86400');
    expect(setCookie).toContain('Path=/');
  });

  it('returns 401 with redirect for invalid token signature', async () => {
    const { withSessionValidation } = await importMiddlewareHelpers();
    const badToken = createSessionToken(
      TEST_USERNAME,
      'different-secret-32-bytes-long!!'
    );

    const handler = vi.fn(() =>
      Response.json({ data: 'protected' }, { status: 200 })
    );
    const wrapped = withSessionValidation(handler);

    const req = new Request('http://localhost:3000/api/bmc-generator/start', {
      method: 'POST',
      headers: { Cookie: `bmc_session=${badToken}` },
    });
    const res = await wrapped(req);

    expect(res.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  it('does NOT reset TTL on failed auth (returns 401 without cookie)', async () => {
    const { withSessionValidation } = await importMiddlewareHelpers();

    const handler = vi.fn(() =>
      Response.json({ data: 'protected' }, { status: 200 })
    );
    const wrapped = withSessionValidation(handler);

    const req = new Request('http://localhost:3000/api/bmc-generator/start', {
      method: 'POST',
      headers: { Cookie: 'bmc_session=invalid-token' },
    });
    const res = await wrapped(req);

    expect(res.status).toBe(401);
    // No Set-Cookie on failed auth
    const setCookie = res.headers.get('Set-Cookie');
    expect(setCookie).toBeNull();
  });

  it('preserves handler response status and body', async () => {
    const { withSessionValidation } = await importMiddlewareHelpers();
    const token = createSessionToken(TEST_USERNAME, TEST_SECRET);

    const handler = vi.fn(() =>
      Response.json(
        { session_id: 'abc123', questions: ['q1', 'q2'] },
        { status: 200 }
      )
    );
    const wrapped = withSessionValidation(handler);

    const req = new Request('http://localhost:3000/api/bmc-generator/start', {
      method: 'POST',
      headers: { Cookie: `bmc_session=${token}` },
    });
    const res = await wrapped(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.session_id).toBe('abc123');
    expect(data.questions).toEqual(['q1', 'q2']);
  });
});

// ---------------------------------------------------------------------------
// buildSessionCookie helper
// ---------------------------------------------------------------------------
describe('buildSessionCookie', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      BMC_SESSION_SECRET: TEST_SECRET,
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('builds cookie string with all required attributes', async () => {
    const { buildSessionCookie } = await importMiddlewareHelpers();
    const token = createSessionToken(TEST_USERNAME, TEST_SECRET);
    const cookie = buildSessionCookie(token);

    expect(cookie).toContain(`bmc_session=${token}`);
    expect(cookie).toContain('Path=/');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain('Max-Age=86400');
  });

  it('includes Secure flag in production', async () => {
    process.env.NODE_ENV = 'production';
    const { buildSessionCookie } = await importMiddlewareHelpers();
    const token = createSessionToken(TEST_USERNAME, TEST_SECRET);
    const cookie = buildSessionCookie(token);

    expect(cookie).toContain('Secure');
  });

  it('omits Secure flag in development', async () => {
    process.env.NODE_ENV = 'development';
    const { buildSessionCookie } = await importMiddlewareHelpers();
    const token = createSessionToken(TEST_USERNAME, TEST_SECRET);
    const cookie = buildSessionCookie(token);

    expect(cookie).not.toContain('Secure');
  });
});

// ---------------------------------------------------------------------------
// buildExpiredSessionCookie (for logout)
// ---------------------------------------------------------------------------
describe('buildExpiredSessionCookie', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('builds cookie with Max-Age=0 to delete the cookie', async () => {
    const { buildExpiredSessionCookie } = await importMiddlewareHelpers();
    const cookie = buildExpiredSessionCookie();

    expect(cookie).toContain('bmc_session=');
    expect(cookie).toContain('Max-Age=0');
    expect(cookie).toContain('Path=/');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
  });
});
