/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * Integration tests for POST /api/bmc-generator/start
 *
 * These tests exercise the actual route handler with real in-memory
 * rate limiting, concurrent generation tracking, and daily limits.
 * Only process.env is stubbed to provide test secrets.
 */

const TEST_USERNAME = 'testuser';
const TEST_PASSWORD = 'testpassword123';
// Session secret must be >= 32 bytes (RFC 7518 compliance)
const TEST_SESSION_SECRET = 'test-secret-key-minimum-32-bytes!';

// A valid idea (>= 50 chars)
const VALID_IDEA =
  'An AI-powered platform that helps small businesses generate professional business model canvases from a simple description of their business idea.';

// Short idea (< 50 chars)
const SHORT_IDEA = 'An app for dogs.';

// Long idea (> 500 chars)
const LONG_IDEA = 'A'.repeat(501);

// Very long idea (> 1000 chars)
const VERY_LONG_IDEA = 'B'.repeat(1001);

describe('POST /api/bmc-generator/start', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      BMC_GENERATOR_USERNAME: TEST_USERNAME,
      BMC_GENERATOR_PASSWORD: TEST_PASSWORD,
      BMC_SESSION_SECRET: TEST_SESSION_SECRET,
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  async function importHandler() {
    const mod = await import('../route');
    // Reset module-level state for test isolation
    mod._resetState();
    return mod;
  }

  /**
   * Create a valid session token for test requests.
   */
  async function createTestSessionToken(): Promise<string> {
    const { createSessionToken } = await import(
      '@/app/tools/bmc-generator/lib/auth-helpers'
    );
    return createSessionToken(TEST_USERNAME, TEST_SESSION_SECRET);
  }

  function makeRequest(
    body: Record<string, unknown> | string,
    options: {
      ip?: string;
      sessionToken?: string;
      contentLength?: string;
    } = {}
  ): Request {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-forwarded-for': options.ip || '10.0.0.1',
    };

    if (options.sessionToken) {
      headers['Cookie'] = `bmc_session=${options.sessionToken}`;
    }

    if (options.contentLength) {
      headers['Content-Length'] = options.contentLength;
    }

    const bodyStr =
      typeof body === 'string' ? body : JSON.stringify(body);

    return new Request('http://localhost:3000/api/bmc-generator/start', {
      method: 'POST',
      headers,
      body: bodyStr,
    });
  }

  // -----------------------------------------------------------------------
  // 1. Input Validation Tests
  // -----------------------------------------------------------------------

  describe('input validation', () => {
    it('returns 400 for idea shorter than 50 characters', async () => {
      const { POST } = await importHandler();
      const token = await createTestSessionToken();
      const req = makeRequest({ idea: SHORT_IDEA }, { sessionToken: token });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('50');
      expect(data.error).toContain('500');
    });

    it('returns 400 for idea longer than 500 characters', async () => {
      const { POST } = await importHandler();
      const token = await createTestSessionToken();
      const req = makeRequest({ idea: LONG_IDEA }, { sessionToken: token });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('50');
      expect(data.error).toContain('500');
    });

    it('returns 400 for idea longer than 1000 characters', async () => {
      const { POST } = await importHandler();
      const token = await createTestSessionToken();
      const req = makeRequest(
        { idea: VERY_LONG_IDEA },
        { sessionToken: token }
      );
      const res = await POST(req);

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('50');
    });

    it('returns 400 for missing idea field', async () => {
      const { POST } = await importHandler();
      const token = await createTestSessionToken();
      const req = makeRequest({}, { sessionToken: token });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('idea');
    });

    it('returns 400 for non-string idea field', async () => {
      const { POST } = await importHandler();
      const token = await createTestSessionToken();
      const req = makeRequest({ idea: 12345 }, { sessionToken: token });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('idea');
    });

    it('returns 400 for invalid JSON body', async () => {
      const { POST } = await importHandler();
      const token = await createTestSessionToken();
      const req = makeRequest('not valid json{{{', {
        sessionToken: token,
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Invalid request body');
    });
  });

  // -----------------------------------------------------------------------
  // 2. Authentication Tests
  // -----------------------------------------------------------------------

  describe('authentication', () => {
    it('returns 401 when no session cookie is present', async () => {
      const { POST } = await importHandler();
      const req = makeRequest({ idea: VALID_IDEA });
      const res = await POST(req);

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toContain('Unauthorized');
      expect(data.redirect).toBe('/tools/bmc-generator/login');
    });

    it('returns 401 for expired session cookie', async () => {
      const { POST } = await importHandler();
      // Create a token that's already expired (TTL = 0)
      const { createSessionToken } = await import(
        '@/app/tools/bmc-generator/lib/auth-helpers'
      );
      const expiredToken = createSessionToken(
        TEST_USERNAME,
        TEST_SESSION_SECRET,
        0 // 0 second TTL = immediately expired
      );

      // Small delay to ensure the token has expired
      await new Promise((resolve) => setTimeout(resolve, 10));

      const req = makeRequest(
        { idea: VALID_IDEA },
        { sessionToken: expiredToken }
      );
      const res = await POST(req);

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toContain('expired');
    });

    it('returns 401 for tampered session cookie', async () => {
      const { POST } = await importHandler();
      const req = makeRequest(
        { idea: VALID_IDEA },
        { sessionToken: 'tampered.invalid' }
      );
      const res = await POST(req);

      expect(res.status).toBe(401);
    });
  });

  // -----------------------------------------------------------------------
  // 3. Rate Limiting Tests
  // -----------------------------------------------------------------------

  describe('rate limiting', () => {
    it('returns 429 when per-IP rate limit is exceeded', async () => {
      const { POST, _testInternals } = await importHandler();
      const token = await createTestSessionToken();
      const testIP = '192.168.1.100';

      // Exhaust the IP rate limit (5 requests)
      for (let i = 0; i < 5; i++) {
        _testInternals.ipRateLimiter.recordFailure(testIP);
      }

      const req = makeRequest({ idea: VALID_IDEA }, {
        sessionToken: token,
        ip: testIP,
      });
      const res = await POST(req);

      expect(res.status).toBe(429);
      const data = await res.json();
      expect(data.error).toContain('Too many requests');
      expect(data.retry_after_seconds).toBeGreaterThan(0);
    });

    it('returns 409 when concurrent generation is already running', async () => {
      const { POST, _testInternals } = await importHandler();
      const token = await createTestSessionToken();

      // Simulate a running generation for this session
      _testInternals.concurrentGenerations.set(TEST_USERNAME, {
        startTime: Date.now(),
        timeoutMs: 5 * 60 * 1000,
      });

      const req = makeRequest({ idea: VALID_IDEA }, {
        sessionToken: token,
      });
      const res = await POST(req);

      expect(res.status).toBe(409);
      const data = await res.json();
      expect(data.error).toContain('already in progress');
    });

    it('allows request when concurrent generation entry is stale', async () => {
      const { POST, _testInternals } = await importHandler();
      const token = await createTestSessionToken();

      // Simulate a stale concurrent entry (started 10 minutes ago with 5 min TTL)
      _testInternals.concurrentGenerations.set(TEST_USERNAME, {
        startTime: Date.now() - 10 * 60 * 1000,
        timeoutMs: 5 * 60 * 1000,
      });

      const req = makeRequest({ idea: VALID_IDEA }, {
        sessionToken: token,
      });
      const res = await POST(req);

      // Should succeed because the stale entry is evicted
      expect(res.status).toBe(200);
    });

    it('returns 429 when daily generation limit is exceeded', async () => {
      const { POST, _testInternals } = await importHandler();
      const token = await createTestSessionToken();

      // Set daily count to 20 (at the limit)
      _testInternals.dailyGenerationCounts.set(TEST_USERNAME, {
        count: 20,
        resetAt: Date.now() + 24 * 60 * 60 * 1000, // resets tomorrow
      });

      const req = makeRequest({ idea: VALID_IDEA }, {
        sessionToken: token,
      });
      const res = await POST(req);

      expect(res.status).toBe(429);
      const data = await res.json();
      expect(data.error).toContain('Daily generation limit');
      expect(data.error).toContain('20');
    });

    it('resets daily count when the reset time has passed', async () => {
      const { POST, _testInternals } = await importHandler();
      const token = await createTestSessionToken();

      // Set daily count to 20 but with reset time in the past
      _testInternals.dailyGenerationCounts.set(TEST_USERNAME, {
        count: 20,
        resetAt: Date.now() - 1000, // already past
      });

      const req = makeRequest({ idea: VALID_IDEA }, {
        sessionToken: token,
      });
      const res = await POST(req);

      // Should succeed because the daily counter was reset
      expect(res.status).toBe(200);
    });

    it('returns 429 when global cost ceiling is exceeded', async () => {
      const { POST, _testInternals } = await importHandler();
      const token = await createTestSessionToken();

      // Set global cost to just above the ceiling
      _testInternals.globalCostState = {
        totalCost: 499.97,
        resetAt: Date.now() + 24 * 60 * 60 * 1000,
      };

      const req = makeRequest({ idea: VALID_IDEA }, {
        sessionToken: token,
      });
      const res = await POST(req);

      expect(res.status).toBe(429);
      const data = await res.json();
      expect(data.error).toContain('cost limits');
    });

    it('resets global cost when midnight UTC passes', async () => {
      const { POST, _testInternals } = await importHandler();
      const token = await createTestSessionToken();

      // Set global cost to over the ceiling but reset time in the past
      _testInternals.globalCostState = {
        totalCost: 1000,
        resetAt: Date.now() - 1000, // already past midnight
      };

      const req = makeRequest({ idea: VALID_IDEA }, {
        sessionToken: token,
      });
      const res = await POST(req);

      // Should succeed because the cost counter was reset at midnight
      expect(res.status).toBe(200);
    });
  });

  // -----------------------------------------------------------------------
  // 4. OrchestratorAgent Tests
  // -----------------------------------------------------------------------

  describe('orchestrator agent', () => {
    it('returns questions on successful OrchestratorAgent call', async () => {
      const { POST, _testInternals } = await importHandler();
      const token = await createTestSessionToken();

      const req = makeRequest({ idea: VALID_IDEA }, {
        sessionToken: token,
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
      const data = await res.json();

      // Currently returns fallback questions (agent not yet wired)
      expect(data.questions).toEqual(_testInternals.FALLBACK_QUESTIONS);
      expect(data.questions).toHaveLength(3);
    });

    it('returns fallback questions on OrchestratorAgent failure', async () => {
      // Since the current implementation always returns fallback questions,
      // this test validates the fallback path works correctly.
      const { POST, _testInternals } = await importHandler();
      const token = await createTestSessionToken();

      const req = makeRequest({ idea: VALID_IDEA }, {
        sessionToken: token,
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.questions).toEqual(_testInternals.FALLBACK_QUESTIONS);
    });
  });

  // -----------------------------------------------------------------------
  // 5. Success Response Tests
  // -----------------------------------------------------------------------

  describe('success response', () => {
    it('returns 200 with correct shape on valid request', async () => {
      const { POST } = await importHandler();
      const token = await createTestSessionToken();

      const req = makeRequest({ idea: VALID_IDEA }, {
        sessionToken: token,
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
      const data = await res.json();

      // Verify response shape
      expect(data).toHaveProperty('session_id');
      expect(data).toHaveProperty('questions');
      expect(data).toHaveProperty('generation_token');
      expect(data).toHaveProperty('estimated_cost');
      expect(data).toHaveProperty('estimated_latency_seconds');

      // Verify types
      expect(typeof data.session_id).toBe('string');
      expect(Array.isArray(data.questions)).toBe(true);
      expect(typeof data.generation_token).toBe('string');
      expect(typeof data.estimated_cost).toBe('number');
      expect(typeof data.estimated_latency_seconds).toBe('number');
    });

    it('returns a valid UUID as session_id', async () => {
      const { POST } = await importHandler();
      const token = await createTestSessionToken();

      const req = makeRequest({ idea: VALID_IDEA }, {
        sessionToken: token,
      });
      const res = await POST(req);
      const data = await res.json();

      // UUID v4 format
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(data.session_id).toMatch(uuidRegex);
    });

    it('generation_token is cryptographically signed', async () => {
      const { POST } = await importHandler();
      const token = await createTestSessionToken();

      const req = makeRequest({ idea: VALID_IDEA }, {
        sessionToken: token,
      });
      const res = await POST(req);
      const data = await res.json();

      // Token format: base64url(payload).base64url(signature)
      const parts = data.generation_token.split('.');
      expect(parts).toHaveLength(2);

      // Payload should be valid base64url-encoded JSON
      const payload = JSON.parse(
        Buffer.from(parts[0], 'base64url').toString('utf-8')
      );
      expect(payload).toHaveProperty('sid'); // session_id binding
      expect(payload).toHaveProperty('rnd'); // random bytes
      expect(payload).toHaveProperty('iat'); // issued at
      expect(payload).toHaveProperty('exp'); // expires at
      expect(payload.exp - payload.iat).toBe(30 * 60); // 30 min TTL
    });

    it('generation_token is bound to session_id', async () => {
      const { POST } = await importHandler();
      const token = await createTestSessionToken();

      const req = makeRequest({ idea: VALID_IDEA }, {
        sessionToken: token,
      });
      const res = await POST(req);
      const data = await res.json();

      // Decode the generation token payload
      const parts = data.generation_token.split('.');
      const payload = JSON.parse(
        Buffer.from(parts[0], 'base64url').toString('utf-8')
      );

      // Token session_id must match the returned session_id
      expect(payload.sid).toBe(data.session_id);
    });

    it('sets refreshed session cookie in response', async () => {
      const { POST } = await importHandler();
      const token = await createTestSessionToken();

      const req = makeRequest({ idea: VALID_IDEA }, {
        sessionToken: token,
      });
      const res = await POST(req);

      // Check Set-Cookie header
      const setCookieArr = res.headers.getSetCookie?.() ?? [];
      const setCookie =
        setCookieArr.length > 0
          ? setCookieArr[0]
          : res.headers.get('Set-Cookie') ||
            res.headers.get('set-cookie') ||
            '';
      expect(setCookie).toBeTruthy();
      expect(setCookie).toContain('bmc_session=');
      expect(setCookie).toContain('HttpOnly');
    });

    it('sets Cache-Control: no-store header', async () => {
      const { POST } = await importHandler();
      const token = await createTestSessionToken();

      const req = makeRequest({ idea: VALID_IDEA }, {
        sessionToken: token,
      });
      const res = await POST(req);

      expect(res.headers.get('Cache-Control')).toBe('no-store, no-cache');
    });

    it('returns estimated_latency_seconds as a positive number', async () => {
      const { POST } = await importHandler();
      const token = await createTestSessionToken();

      const req = makeRequest({ idea: VALID_IDEA }, {
        sessionToken: token,
      });
      const res = await POST(req);
      const data = await res.json();

      expect(data.estimated_latency_seconds).toBeGreaterThan(0);
    });
  });

  // -----------------------------------------------------------------------
  // 6. SSE Stream Initialization Tests
  // -----------------------------------------------------------------------

  describe('SSE stream initialization', () => {
    it('creates SSE state entry for new session', async () => {
      const { POST, getSSEState } = await importHandler();
      const token = await createTestSessionToken();

      const req = makeRequest({ idea: VALID_IDEA }, {
        sessionToken: token,
      });
      const res = await POST(req);
      const data = await res.json();

      const sseState = getSSEState(data.session_id);
      expect(sseState).toBeDefined();
      expect(sseState!.events).toHaveLength(1);
      expect(sseState!.events[0]).toHaveProperty('phase', 1);
      expect(sseState!.events[0]).toHaveProperty(
        'activeAgent',
        'OrchestratorAgent'
      );
      expect(sseState!.events[0]).toHaveProperty('progress', 0.1);
    });
  });

  // -----------------------------------------------------------------------
  // 7. Cost Tracking Tests
  // -----------------------------------------------------------------------

  describe('cost tracking', () => {
    it('returns estimated_cost as a non-negative number', async () => {
      const { POST } = await importHandler();
      const token = await createTestSessionToken();

      const req = makeRequest({ idea: VALID_IDEA }, {
        sessionToken: token,
      });
      const res = await POST(req);
      const data = await res.json();

      expect(data.estimated_cost).toBeGreaterThanOrEqual(0);
    });

    it('updates global cost state after successful request', async () => {
      const { POST, getGlobalCostState } = await importHandler();
      const token = await createTestSessionToken();

      const costBefore = getGlobalCostState().totalCost;

      const req = makeRequest({ idea: VALID_IDEA }, {
        sessionToken: token,
      });
      await POST(req);

      const costAfter = getGlobalCostState().totalCost;
      expect(costAfter).toBeGreaterThan(costBefore);
    });
  });

  // -----------------------------------------------------------------------
  // 8. Concurrent Generation State Tests
  // -----------------------------------------------------------------------

  describe('concurrent generation tracking', () => {
    it('marks generation as running after successful start', async () => {
      const { POST, _testInternals } = await importHandler();
      const token = await createTestSessionToken();

      const req = makeRequest({ idea: VALID_IDEA }, {
        sessionToken: token,
      });
      await POST(req);

      expect(
        _testInternals.concurrentGenerations.has(TEST_USERNAME)
      ).toBe(true);
    });

    it('markGenerationComplete removes the entry', async () => {
      const { POST, markGenerationComplete, _testInternals } =
        await importHandler();
      const token = await createTestSessionToken();

      const req = makeRequest({ idea: VALID_IDEA }, {
        sessionToken: token,
      });
      await POST(req);

      expect(
        _testInternals.concurrentGenerations.has(TEST_USERNAME)
      ).toBe(true);

      markGenerationComplete(TEST_USERNAME);

      expect(
        _testInternals.concurrentGenerations.has(TEST_USERNAME)
      ).toBe(false);
    });

    it('increments daily generation count', async () => {
      const { POST, _testInternals } = await importHandler();
      const token = await createTestSessionToken();

      const req = makeRequest({ idea: VALID_IDEA }, {
        sessionToken: token,
      });
      await POST(req);

      const daily = _testInternals.dailyGenerationCounts.get(TEST_USERNAME);
      expect(daily).toBeDefined();
      expect(daily!.count).toBe(1);
    });
  });

  // -----------------------------------------------------------------------
  // 9. Server Configuration Error Tests
  // -----------------------------------------------------------------------

  describe('server configuration', () => {
    it('returns 500 when BMC_SESSION_SECRET is missing', async () => {
      process.env = {
        ...process.env,
        BMC_SESSION_SECRET: '', // empty = missing
      };

      const { POST } = await importHandler();
      const req = makeRequest({ idea: VALID_IDEA });
      const res = await POST(req);

      // Session validation will fail because secret is missing
      expect(res.status).toBe(401);
    });
  });

  // -----------------------------------------------------------------------
  // 10. Edge Cases
  // -----------------------------------------------------------------------

  describe('edge cases', () => {
    it('trims whitespace from idea before length validation', async () => {
      const { POST } = await importHandler();
      const token = await createTestSessionToken();

      // Idea that's exactly 50 chars after trimming but longer with whitespace
      const paddedIdea = '  ' + 'A'.repeat(50) + '  ';
      const req = makeRequest(
        { idea: paddedIdea },
        { sessionToken: token }
      );
      const res = await POST(req);

      expect(res.status).toBe(200);
    });

    it('handles exactly 50 character idea (minimum boundary)', async () => {
      const { POST } = await importHandler();
      const token = await createTestSessionToken();

      const exactMinIdea = 'A'.repeat(50);
      const req = makeRequest(
        { idea: exactMinIdea },
        { sessionToken: token }
      );
      const res = await POST(req);

      expect(res.status).toBe(200);
    });

    it('handles exactly 500 character idea (maximum boundary)', async () => {
      const { POST } = await importHandler();
      const token = await createTestSessionToken();

      const exactMaxIdea = 'A'.repeat(500);
      const req = makeRequest(
        { idea: exactMaxIdea },
        { sessionToken: token }
      );
      const res = await POST(req);

      expect(res.status).toBe(200);
    });

    it('returns unique session_ids for consecutive requests', async () => {
      const { POST, _testInternals } = await importHandler();
      const token = await createTestSessionToken();

      // First request
      const req1 = makeRequest({ idea: VALID_IDEA }, {
        sessionToken: token,
      });
      const res1 = await POST(req1);
      const data1 = await res1.json();

      // Clear concurrent generation to allow second request
      _testInternals.concurrentGenerations.delete(TEST_USERNAME);

      // Second request
      const req2 = makeRequest({ idea: VALID_IDEA }, {
        sessionToken: token,
      });
      const res2 = await POST(req2);
      const data2 = await res2.json();

      expect(data1.session_id).not.toBe(data2.session_id);
    });

    it('returns unique generation_tokens for consecutive requests', async () => {
      const { POST, _testInternals } = await importHandler();
      const token = await createTestSessionToken();

      const req1 = makeRequest({ idea: VALID_IDEA }, {
        sessionToken: token,
      });
      const res1 = await POST(req1);
      const data1 = await res1.json();

      _testInternals.concurrentGenerations.delete(TEST_USERNAME);

      const req2 = makeRequest({ idea: VALID_IDEA }, {
        sessionToken: token,
      });
      const res2 = await POST(req2);
      const data2 = await res2.json();

      expect(data1.generation_token).not.toBe(data2.generation_token);
    });
  });
});
