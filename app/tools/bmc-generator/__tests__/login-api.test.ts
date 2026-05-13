/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * Integration tests for POST /api/bmc-generator/login
 *
 * These tests exercise the actual route handler with real in-memory
 * rate limiting and account lockout state (no mocks on those).
 * Only process.env is stubbed to provide test credentials.
 */

// We need to set env vars BEFORE importing the route handler
// so that getCredentials() picks them up.
const TEST_USERNAME = 'testuser';
const TEST_PASSWORD = 'testpassword123';

describe('POST /api/bmc-generator/login', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      BMC_GENERATOR_USERNAME: TEST_USERNAME,
      BMC_GENERATOR_PASSWORD: TEST_PASSWORD,
      BMC_SESSION_SECRET: 'test-secret-key-minimum-32-bytes!',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  async function importHandler() {
    // Dynamic import to pick up fresh env vars and fresh module state
    const mod = await import('../../../api/bmc-generator/login/route');
    return mod;
  }

  function makeRequest(body: Record<string, unknown>, ip = '127.0.0.1'): Request {
    const req = new Request('http://localhost:3000/api/bmc-generator/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': ip,
      },
      body: JSON.stringify(body),
    });
    return req;
  }

  it('returns 200 with session cookie on valid credentials', async () => {
    const { POST } = await importHandler();
    const req = makeRequest({ username: TEST_USERNAME, password: TEST_PASSWORD });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.redirect).toBe('/tools/bmc-generator/');
    expect(data.user.username).toBe(TEST_USERNAME);

    // Check Set-Cookie header (use getSetCookie() for reliable access in test envs)
    const setCookieArr = res.headers.getSetCookie?.() ?? [];
    const setCookie = setCookieArr.length > 0
      ? setCookieArr[0]
      : res.headers.get('Set-Cookie') || res.headers.get('set-cookie') || '';
    expect(setCookie).toBeTruthy();
    expect(setCookie).toContain('bmc_session=');
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('SameSite=Lax');
    expect(setCookie).toContain('Path=/');
  });

  it('returns 401 with generic error on invalid username', async () => {
    const { POST } = await importHandler();
    const req = makeRequest({ username: 'wronguser', password: TEST_PASSWORD });
    const res = await POST(req);

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('Invalid username or password');
  });

  it('returns 401 with generic error on invalid password', async () => {
    const { POST } = await importHandler();
    const req = makeRequest({ username: TEST_USERNAME, password: 'wrongpassword' });
    const res = await POST(req);

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('Invalid username or password');
  });

  it('returns same error for wrong username and wrong password (no enumeration)', async () => {
    const { POST } = await importHandler();
    const wrongUserRes = await POST(
      makeRequest({ username: 'wronguser', password: TEST_PASSWORD })
    );
    const wrongPassRes = await POST(
      makeRequest({ username: TEST_USERNAME, password: 'wrongpassword' })
    );

    const wrongUserData = await wrongUserRes.json();
    const wrongPassData = await wrongPassRes.json();

    // Both return the exact same error message (prevents user enumeration)
    expect(wrongUserData.error).toBe(wrongPassData.error);
    expect(wrongUserRes.status).toBe(wrongPassRes.status);
  });

  it('returns 400 when username is missing', async () => {
    const { POST } = await importHandler();
    const req = makeRequest({ password: TEST_PASSWORD });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Missing username or password');
  });

  it('returns 400 when password is missing', async () => {
    const { POST } = await importHandler();
    const req = makeRequest({ username: TEST_USERNAME });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Missing username or password');
  });

  it('returns 400 when body is empty', async () => {
    const { POST } = await importHandler();
    const req = makeRequest({});
    const res = await POST(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Missing username or password');
  });

  it('returns 429 after 5 failed attempts from same IP within 10 minutes', async () => {
    const { POST, _resetState } = await importHandler();
    _resetState(); // Clear any prior state

    const ip = '10.0.0.99';

    // Send 5 failed attempts
    for (let i = 0; i < 5; i++) {
      const res = await POST(
        makeRequest({ username: TEST_USERNAME, password: 'wrongpassword' }, ip)
      );
      expect(res.status).toBe(401);
    }

    // 6th attempt should be rate limited
    const res = await POST(
      makeRequest({ username: TEST_USERNAME, password: 'wrongpassword' }, ip)
    );
    expect(res.status).toBe(429);
    const data = await res.json();
    expect(data.error).toContain('Too many login attempts');
  });

  it('rate limiting does not affect different IPs', async () => {
    const { POST, _resetState } = await importHandler();
    _resetState();

    // Exhaust rate limit for IP 1 using a different username to avoid account lockout
    for (let i = 0; i < 5; i++) {
      await POST(makeRequest({ username: 'otheruser', password: 'wrongpass1' }, '10.0.0.1'));
    }

    // IP 2 should still work (with valid credentials)
    const res = await POST(
      makeRequest({ username: TEST_USERNAME, password: TEST_PASSWORD }, '10.0.0.2')
    );
    expect(res.status).toBe(200);
  });

  it('returns 423 after 5 failed attempts for same username within 24h', async () => {
    const { POST, _resetState } = await importHandler();
    _resetState();

    // Send 5 failed attempts from different IPs (to avoid IP rate limit)
    for (let i = 0; i < 5; i++) {
      const res = await POST(
        makeRequest({ username: TEST_USERNAME, password: 'wrongpassword' }, `10.0.${i}.1`)
      );
      expect(res.status).toBe(401);
    }

    // 6th attempt should show account locked (from yet another IP)
    const res = await POST(
      makeRequest({ username: TEST_USERNAME, password: TEST_PASSWORD }, '10.0.99.1')
    );
    expect(res.status).toBe(423);
    const data = await res.json();
    expect(data.error).toContain('Account temporarily locked');
  });

  it('successful login resets account lockout counter', async () => {
    const { POST, _resetState } = await importHandler();
    _resetState();

    // 4 failed attempts
    for (let i = 0; i < 4; i++) {
      await POST(
        makeRequest({ username: TEST_USERNAME, password: 'wrongpass1' }, `10.0.${i}.1`)
      );
    }

    // Successful login resets counter
    const successRes = await POST(
      makeRequest({ username: TEST_USERNAME, password: TEST_PASSWORD }, '10.0.50.1')
    );
    expect(successRes.status).toBe(200);

    // 4 more failures should NOT trigger lockout (counter was reset)
    for (let i = 0; i < 4; i++) {
      await POST(
        makeRequest({ username: TEST_USERNAME, password: 'wrongpass1' }, `10.1.${i}.1`)
      );
    }

    // Should still allow (not locked)
    const res = await POST(
      makeRequest({ username: TEST_USERNAME, password: TEST_PASSWORD }, '10.1.50.1')
    );
    expect(res.status).toBe(200);
  });

  it('session cookie has correct attributes', async () => {
    const { POST, _resetState } = await importHandler();
    _resetState();

    const res = await POST(
      makeRequest({ username: TEST_USERNAME, password: TEST_PASSWORD })
    );
    const setCookieArr = res.headers.getSetCookie?.() ?? [];
    const setCookie = setCookieArr.length > 0
      ? setCookieArr[0]
      : res.headers.get('Set-Cookie') || res.headers.get('set-cookie') || '';

    // HTTP-only cookie
    expect(setCookie).toContain('HttpOnly');
    // SameSite=Lax
    expect(setCookie).toContain('SameSite=Lax');
    // Max-Age for 24 hours (86400 seconds)
    expect(setCookie).toContain('Max-Age=86400');
    // Path set to /
    expect(setCookie).toContain('Path=/');
    // Cookie name
    expect(setCookie).toContain('bmc_session=');
  });

  it('returns 400 for malformed JSON body', async () => {
    const { POST } = await importHandler();
    const req = new Request('http://localhost:3000/api/bmc-generator/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '127.0.0.1',
      },
      body: 'not json',
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeTruthy();
  });

  it('rate limit check runs before account lockout check', async () => {
    const { POST, _resetState } = await importHandler();
    _resetState();

    const ip = '10.99.0.1';

    // Exhaust both IP rate limit and account lockout from same IP
    for (let i = 0; i < 5; i++) {
      await POST(makeRequest({ username: TEST_USERNAME, password: 'wrongpass1' }, ip));
    }

    // Next request from same IP should get 429 (rate limit), not 423 (lockout)
    const res = await POST(
      makeRequest({ username: TEST_USERNAME, password: 'wrongpass1' }, ip)
    );
    expect(res.status).toBe(429);
  });

  it('does not set cookie on failed login', async () => {
    const { POST } = await importHandler();
    const res = await POST(
      makeRequest({ username: TEST_USERNAME, password: 'wrongpassword' })
    );

    const setCookie = res.headers.get('Set-Cookie');
    // Should not have a bmc_session cookie set
    if (setCookie) {
      expect(setCookie).not.toContain('bmc_session=');
    }
  });
});
