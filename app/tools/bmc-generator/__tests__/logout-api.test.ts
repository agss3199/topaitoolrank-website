/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createSessionToken } from '../lib/auth-helpers';

/**
 * Integration tests for POST /api/bmc-generator/logout
 *
 * Tests the logout endpoint's behavior:
 * - Validates session exists before logout
 * - Deletes bmc_session cookie on success
 * - Returns 400 if already logged out
 * - Returns 200 with redirect on success
 */

const TEST_SECRET = 'test-secret-key-minimum-32-bytes!';
const TEST_USERNAME = 'testuser';

describe('POST /api/bmc-generator/logout', () => {
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

  async function importHandler() {
    return await import('../../../api/bmc-generator/logout/route');
  }

  function makeRequest(cookieValue?: string): Request {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (cookieValue !== undefined) {
      headers['Cookie'] = `bmc_session=${cookieValue}`;
    }
    return new Request('http://localhost:3000/api/bmc-generator/logout', {
      method: 'POST',
      headers,
    });
  }

  it('returns 200 with redirect and expired cookie on valid session', async () => {
    const { POST } = await importHandler();
    const token = createSessionToken(TEST_USERNAME, TEST_SECRET);
    const req = makeRequest(token);
    const res = await POST(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.redirect).toBe('/tools/bmc-generator/login');

    // Verify Set-Cookie deletes the session (Max-Age=0)
    const setCookieArr = res.headers.getSetCookie?.() ?? [];
    const setCookie = setCookieArr.length > 0
      ? setCookieArr[0]
      : res.headers.get('Set-Cookie') || res.headers.get('set-cookie') || '';
    expect(setCookie).toContain('bmc_session=');
    expect(setCookie).toContain('Max-Age=0');
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('Path=/');
  });

  it('returns 400 when no session cookie is present (already logged out)', async () => {
    const { POST } = await importHandler();
    const req = makeRequest();
    const res = await POST(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Not logged in');
  });

  it('returns 400 when session token is expired', async () => {
    const { POST } = await importHandler();
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    const expiredToken = createSessionToken(TEST_USERNAME, TEST_SECRET, 1);

    // Advance past expiry
    vi.spyOn(Date, 'now').mockReturnValue(now + 2000);

    const req = makeRequest(expiredToken);
    const res = await POST(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Not logged in');
  });

  it('returns 400 when session token has invalid signature', async () => {
    const { POST } = await importHandler();
    const badToken = createSessionToken(
      TEST_USERNAME,
      'different-secret-32-bytes-long!!'
    );
    const req = makeRequest(badToken);
    const res = await POST(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Not logged in');
  });

  it('only accepts POST method (route exports only POST)', async () => {
    const mod = await importHandler();
    // Verify that POST is exported
    expect(typeof mod.POST).toBe('function');
    // GET should not be exported
    expect((mod as Record<string, unknown>).GET).toBeUndefined();
  });

  it('includes Cache-Control no-store header', async () => {
    const { POST } = await importHandler();
    const token = createSessionToken(TEST_USERNAME, TEST_SECRET);
    const req = makeRequest(token);
    const res = await POST(req);

    expect(res.headers.get('Cache-Control')).toBe('no-store, no-cache');
  });

  it('works with multiple cookies in the header', async () => {
    const { POST } = await importHandler();
    const token = createSessionToken(TEST_USERNAME, TEST_SECRET);
    const req = new Request('http://localhost:3000/api/bmc-generator/logout', {
      method: 'POST',
      headers: {
        Cookie: `other=abc; bmc_session=${token}; another=xyz`,
      },
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });
});
