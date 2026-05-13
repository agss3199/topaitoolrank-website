// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as crypto from 'crypto';

/**
 * Tier 2 (Integration) tests for POST /api/bmc-generator/answers.
 *
 * Tests call the actual POST handler with real Request objects,
 * real HMAC token generation, and real Zod validation.
 * No mocking of the handler itself — only the OrchestratorAgent
 * is mocked where noted (it is an external LLM dependency).
 *
 * Test suites:
 *   1. Session Validation (401)
 *   2. generation_token Validation (403)
 *   3. Answers Validation (400)
 *   4. OrchestratorAgent Integration (timeout, error)
 *   5. Zod BusinessContext Validation (500)
 *   6. Success Path (200)
 *   7. Session Not Found (404)
 */

const TEST_SECRET = 'test-secret-key-minimum-32-bytes!';

// Set env BEFORE any module import that reads process.env at load time.
// process.env assignment is synchronous and takes effect immediately,
// whereas vi.stubEnv may not apply before static imports resolve.
process.env.BMC_SESSION_SECRET = TEST_SECRET;
process.env.BMC_GENERATOR_USERNAME = 'testuser';
process.env.BMC_GENERATOR_PASSWORD = 'testpass1234';

// Import after env is set
import {
  POST,
  _resetState,
  _testInternals,
  isTokenUsed,
} from '../../../api/bmc-generator/answers/route';
import {
  _resetState as resetStartState,
  _testInternals as startInternals,
} from '../../../api/bmc-generator/start/route';
import { createSessionToken } from '../lib/auth-helpers';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeSessionCookie(
  username = 'testuser',
  ttlSeconds = 86400
): string {
  return createSessionToken(username, TEST_SECRET, ttlSeconds);
}

function makeExpiredSessionCookie(username = 'testuser'): string {
  const now = Math.floor(Date.now() / 1000);
  const payload = { username, iat: now - 200, exp: now - 1 };
  const b64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', TEST_SECRET).update(b64).digest('base64url');
  return `${b64}.${sig}`;
}

function makeGenToken(
  sessionId: string,
  overrides: { exp?: number; sid?: string } = {}
): string {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sid: overrides.sid ?? sessionId,
    rnd: crypto.randomBytes(32).toString('hex'),
    iat: now,
    exp: overrides.exp ?? now + 1800,
    used: false,
  };
  const b64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', TEST_SECRET).update(b64).digest('base64url');
  return `${b64}.${sig}`;
}

function makeTamperedToken(sessionId: string): string {
  const token = makeGenToken(sessionId);
  const [b64, sig] = token.split('.');
  // Flip first character of signature
  const flipped = (sig[0] === 'A' ? 'B' : 'A') + sig.slice(1);
  return `${b64}.${flipped}`;
}

function seedSession(sessionId: string): void {
  startInternals.sseSessionState.set(sessionId, {
    events: [{ phase: 1, activeAgent: 'OrchestratorAgent', progress: 0.1 }],
    createdAt: Date.now(),
  });
}

function goodAnswers(): Record<string, string> {
  return {
    '0': 'Enterprise SaaS companies in the US market segment',
    '1': 'Businesses struggle with workflow automation and management',
    '2': 'Subscription model starting at $99 per month per seat',
  };
}

function req(
  body: Record<string, unknown>,
  opts: { cookie?: string } = {}
): Request {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (opts.cookie) {
    headers['Cookie'] = `bmc_session=${opts.cookie}`;
  }
  return new Request('http://localhost:3000/api/bmc-generator/answers', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

/**
 * Build a valid mock BusinessContext that passes Zod validation.
 */
function validMockContext() {
  return {
    user_idea_summary: 'A'.repeat(50),
    industry: 'FinTech',
    customer_type: 'B2B' as const,
    target_market: 'Enterprise companies in the US market',
    problem_statement: 'Businesses struggle with payments',
    solution_approach: 'Provide a streamlined API for payments',
    pricing_direction: '$99/month subscription',
    geography: 'USA',
    competitive_landscape: 'Several legacy players exist in this space',
    key_assumptions: ['Market demand exists'],
    success_metrics: ['User adoption rate'],
    stage: 'idea' as const,
  };
}

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  _resetState();
  resetStartState();
  process.env.BMC_SESSION_SECRET = TEST_SECRET;
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ===========================================================================
// 1. Session Validation
// ===========================================================================

describe('Session Validation', () => {
  it('returns 401 when no bmc_session cookie is present', async () => {
    const sid = 'sess-auth-01';
    seedSession(sid);
    const r = await POST(
      req({ session_id: sid, generation_token: makeGenToken(sid), answers: goodAnswers() })
    );
    expect(r.status).toBe(401);
    const d = await r.json();
    expect(d.error).toContain('log in');
    expect(d.redirect).toBe('/tools/bmc-generator/login');
  });

  it('returns 401 when bmc_session cookie is expired (>24h)', async () => {
    const sid = 'sess-auth-02';
    seedSession(sid);
    const r = await POST(
      req(
        { session_id: sid, generation_token: makeGenToken(sid), answers: goodAnswers() },
        { cookie: makeExpiredSessionCookie() }
      )
    );
    expect(r.status).toBe(401);
    const d = await r.json();
    expect(d.error).toContain('expired');
  });
});

// ===========================================================================
// 2. generation_token Validation
// ===========================================================================

describe('generation_token Validation', () => {
  it('returns 403 when generation_token is missing from body', async () => {
    const sid = 'sess-tok-01';
    seedSession(sid);
    const r = await POST(
      req(
        { session_id: sid, answers: goodAnswers() },
        { cookie: makeSessionCookie() }
      )
    );
    expect(r.status).toBe(403);
    const d = await r.json();
    expect(d.error).toContain('generation token');
  });

  it('returns 403 when HMAC signature is tampered', async () => {
    const sid = 'sess-tok-02';
    seedSession(sid);
    const r = await POST(
      req(
        { session_id: sid, generation_token: makeTamperedToken(sid), answers: goodAnswers() },
        { cookie: makeSessionCookie() }
      )
    );
    expect(r.status).toBe(403);
  });

  it('returns 403 when token is bound to a different session (cross-session)', async () => {
    const sidA = 'sess-tok-03a';
    const sidB = 'sess-tok-03b';
    seedSession(sidA);
    seedSession(sidB);
    // Token is bound to sidA; used against sidB
    const token = makeGenToken(sidA);
    const r = await POST(
      req(
        { session_id: sidB, generation_token: token, answers: goodAnswers() },
        { cookie: makeSessionCookie() }
      )
    );
    expect(r.status).toBe(403);
  });

  it('returns 403 when token has already been used (replay)', async () => {
    const sid = 'sess-tok-04';
    seedSession(sid);
    const token = makeGenToken(sid);
    const cookie = makeSessionCookie();

    // Mock normalizeAnswers to return valid context (so first call succeeds)
    const spy = vi.spyOn(_testInternals, 'normalizeAnswers').mockResolvedValue({
      context: validMockContext(),
      inputTokens: 100,
      outputTokens: 50,
    });

    // First call succeeds
    const r1 = await POST(
      req(
        { session_id: sid, generation_token: token, answers: goodAnswers() },
        { cookie }
      )
    );
    expect(r1.status).toBe(200);

    // Second call with same token must fail
    seedSession(sid); // re-seed since session lookup might be needed
    const r2 = await POST(
      req(
        { session_id: sid, generation_token: token, answers: goodAnswers() },
        { cookie }
      )
    );
    expect(r2.status).toBe(403);
    const d2 = await r2.json();
    expect(d2.error).toContain('generation token');

    spy.mockRestore();
  });
});

// ===========================================================================
// 3. Answers Validation
// ===========================================================================

describe('Answers Validation', () => {
  it('returns 400 when a required answer is empty', async () => {
    const sid = 'sess-ans-01';
    seedSession(sid);
    const r = await POST(
      req(
        {
          session_id: sid,
          generation_token: makeGenToken(sid),
          answers: { '0': '', '1': 'A valid answer with at least ten chars' },
        },
        { cookie: makeSessionCookie() }
      )
    );
    expect(r.status).toBe(400);
  });

  it('returns 400 when a required answer is below 10 chars', async () => {
    const sid = 'sess-ans-02';
    seedSession(sid);
    const r = await POST(
      req(
        {
          session_id: sid,
          generation_token: makeGenToken(sid),
          answers: { '0': 'Too short', '1': 'Valid answer with enough characters' },
        },
        { cookie: makeSessionCookie() }
      )
    );
    expect(r.status).toBe(400);
    const d = await r.json();
    expect(d.error).toMatch(/10/);
  });

  it('returns 400 when any answer exceeds 500 chars', async () => {
    const sid = 'sess-ans-03';
    seedSession(sid);
    const r = await POST(
      req(
        {
          session_id: sid,
          generation_token: makeGenToken(sid),
          answers: { '0': 'X'.repeat(501), '1': 'Valid answer here with enough length' },
        },
        { cookie: makeSessionCookie() }
      )
    );
    expect(r.status).toBe(400);
    const d = await r.json();
    expect(d.error).toMatch(/500/);
  });

  it('accepts empty value for optional answer (key starts with optional_)', async () => {
    const sid = 'sess-ans-04';
    seedSession(sid);

    const spy = vi.spyOn(_testInternals, 'normalizeAnswers').mockResolvedValue({
      context: validMockContext(),
      inputTokens: 0,
      outputTokens: 0,
    });

    const r = await POST(
      req(
        {
          session_id: sid,
          generation_token: makeGenToken(sid),
          answers: { '0': 'A required answer with enough characters', 'optional_note': '' },
        },
        { cookie: makeSessionCookie() }
      )
    );
    // Should not fail validation on the optional empty field
    expect(r.status).not.toBe(400);
    spy.mockRestore();
  });

  it('accepts valid optional answer (10-500 chars)', async () => {
    const sid = 'sess-ans-05';
    seedSession(sid);

    const spy = vi.spyOn(_testInternals, 'normalizeAnswers').mockResolvedValue({
      context: validMockContext(),
      inputTokens: 0,
      outputTokens: 0,
    });

    const r = await POST(
      req(
        {
          session_id: sid,
          generation_token: makeGenToken(sid),
          answers: {
            '0': 'A valid required answer with enough characters',
            'optional_extra': 'This is a valid optional answer with more than ten chars',
          },
        },
        { cookie: makeSessionCookie() }
      )
    );
    expect(r.status).not.toBe(400);
    spy.mockRestore();
  });
});

// ===========================================================================
// 4. OrchestratorAgent Integration
// ===========================================================================

describe('OrchestratorAgent Integration', () => {
  it('calls normalizeAnswers with the user-provided answers', async () => {
    const sid = 'sess-agent-01';
    seedSession(sid);

    const spy = vi.spyOn(_testInternals, 'normalizeAnswers').mockResolvedValue({
      context: validMockContext(),
      inputTokens: 300,
      outputTokens: 200,
    });

    await POST(
      req(
        { session_id: sid, generation_token: makeGenToken(sid), answers: goodAnswers() },
        { cookie: makeSessionCookie() }
      )
    );

    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  it('handles agent timeout (returns fallback or 500 without crash)', async () => {
    const sid = 'sess-agent-02';
    seedSession(sid);

    const spy = vi.spyOn(_testInternals, 'normalizeAnswers').mockImplementation(
      () => new Promise((_, reject) =>
        setTimeout(() => reject(new Error('OrchestratorAgent timeout')), 5)
      )
    );

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const r = await POST(
      req(
        { session_id: sid, generation_token: makeGenToken(sid), answers: goodAnswers() },
        { cookie: makeSessionCookie() }
      )
    );

    // Should not crash — returns either fallback context (200) or graceful 500
    expect([200, 500]).toContain(r.status);
    spy.mockRestore();
    warnSpy.mockRestore();
  });

  it('returns 500 on non-timeout agent error (e.g., JSON parse failure)', async () => {
    const sid = 'sess-agent-03';
    seedSession(sid);

    const spy = vi.spyOn(_testInternals, 'normalizeAnswers').mockRejectedValue(
      new Error('Unexpected JSON parse error from agent')
    );
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const r = await POST(
      req(
        { session_id: sid, generation_token: makeGenToken(sid), answers: goodAnswers() },
        { cookie: makeSessionCookie() }
      )
    );
    const d = await r.json();

    expect(r.status).toBe(500);
    expect(d.error).toContain('try again');

    spy.mockRestore();
    errSpy.mockRestore();
  });
});

// ===========================================================================
// 5. Zod BusinessContext Validation
// ===========================================================================

describe('Zod BusinessContext Validation', () => {
  it('returns 500 when agent output is missing required field (industry)', async () => {
    const sid = 'sess-zod-01';
    seedSession(sid);

    const spy = vi.spyOn(_testInternals, 'normalizeAnswers').mockResolvedValue({
      context: {
        user_idea_summary: 'A'.repeat(50),
        // industry: MISSING
        customer_type: 'B2B',
        target_market: 'Enterprise companies in market',
        problem_statement: 'A problem that needs solving here',
        solution_approach: 'A solution to the problem stated',
        pricing_direction: null,
        geography: 'USA',
        competitive_landscape: 'Several competitors exist here already',
        key_assumptions: ['Assumption one'],
        success_metrics: ['Metric one'],
        stage: 'idea',
      },
      inputTokens: 100,
      outputTokens: 200,
    });
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const r = await POST(
      req(
        { session_id: sid, generation_token: makeGenToken(sid), answers: goodAnswers() },
        { cookie: makeSessionCookie() }
      )
    );
    expect(r.status).toBe(500);

    spy.mockRestore();
    errSpy.mockRestore();
  });

  it('returns 500 when agent output has wrong field types (array vs string)', async () => {
    const sid = 'sess-zod-02';
    seedSession(sid);

    const spy = vi.spyOn(_testInternals, 'normalizeAnswers').mockResolvedValue({
      context: {
        ...validMockContext(),
        key_assumptions: 'Not an array - wrong type', // should be array
      },
      inputTokens: 100,
      outputTokens: 200,
    });
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const r = await POST(
      req(
        { session_id: sid, generation_token: makeGenToken(sid), answers: goodAnswers() },
        { cookie: makeSessionCookie() }
      )
    );
    expect(r.status).toBe(500);

    spy.mockRestore();
    errSpy.mockRestore();
  });

  it('returns generic error message — no Zod schema details leaked', async () => {
    const sid = 'sess-zod-03';
    seedSession(sid);

    const spy = vi.spyOn(_testInternals, 'normalizeAnswers').mockResolvedValue({
      context: { totally: 'invalid' },
      inputTokens: 100,
      outputTokens: 200,
    });
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const r = await POST(
      req(
        { session_id: sid, generation_token: makeGenToken(sid), answers: goodAnswers() },
        { cookie: makeSessionCookie() }
      )
    );
    const d = await r.json();

    expect(r.status).toBe(500);
    expect(d.error).not.toContain('ZodError');
    expect(d.error).not.toContain('user_idea_summary');
    expect(d.error).not.toContain('schema');
    expect(d.error).toContain('try again');

    spy.mockRestore();
    errSpy.mockRestore();
  });
});

// ===========================================================================
// 6. Success Path
// ===========================================================================

describe('Success Path', () => {
  it('returns 200 with valid BusinessContext, session_id, and next_action', async () => {
    const sid = 'sess-ok-01';
    seedSession(sid);

    const spy = vi.spyOn(_testInternals, 'normalizeAnswers').mockResolvedValue({
      context: validMockContext(),
      inputTokens: 500,
      outputTokens: 300,
    });
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    const r = await POST(
      req(
        { session_id: sid, generation_token: makeGenToken(sid), answers: goodAnswers() },
        { cookie: makeSessionCookie() }
      )
    );
    const d = await r.json();

    expect(r.status).toBe(200);
    expect(d.session_id).toBe(sid);
    expect(d.context).toBeDefined();
    expect(d.context.industry).toBe('FinTech');
    expect(d.context.customer_type).toBe('B2B');
    expect(d.context.stage).toBe('idea');
    expect(d.next_action).toBe('start_generation');

    spy.mockRestore();
    infoSpy.mockRestore();
  });

  it('marks generation_token as used after success', async () => {
    const sid = 'sess-ok-02';
    seedSession(sid);
    const token = makeGenToken(sid);

    const spy = vi.spyOn(_testInternals, 'normalizeAnswers').mockResolvedValue({
      context: validMockContext(),
      inputTokens: 200,
      outputTokens: 100,
    });
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    await POST(
      req(
        { session_id: sid, generation_token: token, answers: goodAnswers() },
        { cookie: makeSessionCookie() }
      )
    );

    expect(isTokenUsed(token)).toBe(true);

    spy.mockRestore();
    infoSpy.mockRestore();
  });

  it('logs bmc.answers.ok event on success (observability contract)', async () => {
    const sid = 'sess-ok-03';
    seedSession(sid);

    const spy = vi.spyOn(_testInternals, 'normalizeAnswers').mockResolvedValue({
      context: validMockContext(),
      inputTokens: 400,
      outputTokens: 250,
    });
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    const r = await POST(
      req(
        { session_id: sid, generation_token: makeGenToken(sid), answers: goodAnswers() },
        { cookie: makeSessionCookie() }
      )
    );
    expect(r.status).toBe(200);

    // Verify observability log
    expect(infoSpy).toHaveBeenCalledWith(
      expect.stringContaining('bmc.answers.ok')
    );

    spy.mockRestore();
    infoSpy.mockRestore();
  });
});

// ===========================================================================
// 7. Session Not Found
// ===========================================================================

describe('Session Not Found', () => {
  it('returns 404 when session_id is unknown', async () => {
    // Do NOT call seedSession — session does not exist
    const r = await POST(
      req(
        {
          session_id: 'nonexistent-session-id',
          generation_token: makeGenToken('nonexistent-session-id'),
          answers: goodAnswers(),
        },
        { cookie: makeSessionCookie() }
      )
    );
    const d = await r.json();

    expect(r.status).toBe(404);
    expect(d.error).toContain('Session not found');
  });
});
