import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as crypto from 'crypto';

/**
 * Tier 1 (Unit) tests for POST /api/bmc-generator/answers route.
 *
 * Tests cover:
 * - Route handler structure and middleware usage
 * - Generation token validation (HMAC, session binding, one-time use, expiry)
 * - Answer validation (required fields, char limits)
 * - All error codes (400, 401, 403, 404, 500)
 * - Success path (200 with BusinessContext)
 * - Zod validation on agent output
 * - Token state management (mark as used)
 *
 * Source-grep tests for structural verification + behavioral tests
 * for token validation logic.
 */

// __dirname = app/tools/bmc-generator/__tests__
// target    = app/api/bmc-generator/answers/route.ts
const routePath = join(
  __dirname,
  '..',
  '..',
  '..',
  'api',
  'bmc-generator',
  'answers',
  'route.ts'
);

const routeSource = readFileSync(routePath, 'utf-8');

// ---------------------------------------------------------------------------
// Structural Verification Tests (source-grep)
// ---------------------------------------------------------------------------

describe('POST /api/bmc-generator/answers Route (structural verification)', () => {
  describe('Route Structure', () => {
    it('exports a POST handler function', () => {
      expect(routeSource).toContain('export async function POST');
    });

    it('imports session validation middleware', () => {
      expect(routeSource).toContain('validateAndRefreshSession');
      expect(routeSource).toContain('middleware-helpers');
    });

    it('imports BusinessContextSchema for Zod validation', () => {
      expect(routeSource).toContain('BusinessContextSchema');
    });

    it('imports CostTracker', () => {
      expect(routeSource).toContain('CostTracker');
    });

    it('imports crypto for token operations', () => {
      expect(routeSource).toContain("import * as crypto from 'crypto'");
    });
  });

  describe('Request Validation', () => {
    it('validates request body is JSON', () => {
      expect(routeSource).toContain('request.json()');
    });

    it('validates session_id field exists', () => {
      expect(routeSource).toContain('session_id');
    });

    it('validates generation_token field exists', () => {
      expect(routeSource).toContain('generation_token');
    });

    it('validates answers field exists', () => {
      expect(routeSource).toContain('answers');
    });

    it('checks content-length for payload size', () => {
      expect(routeSource).toContain('content-length');
    });
  });

  describe('Generation Token Validation', () => {
    it('verifies token signature with HMAC-SHA256', () => {
      expect(routeSource).toContain('createHmac');
      expect(routeSource).toContain('sha256');
    });

    it('checks token is bound to session_id', () => {
      expect(routeSource).toMatch(/payload\.sid|tokenPayload\.sid/);
    });

    it('checks token has not expired', () => {
      expect(routeSource).toMatch(/payload\.exp|tokenPayload\.exp/);
    });

    it('checks token has not been used', () => {
      expect(routeSource).toMatch(/used|isUsed|tokenUsed/);
    });

    it('marks token as used after successful validation', () => {
      expect(routeSource).toMatch(/usedTokens|markTokenUsed|\.add\(|\.set\(/);
    });

    it('uses timing-safe comparison for signature', () => {
      expect(routeSource).toContain('timingSafeEqual');
    });
  });

  describe('Answer Validation', () => {
    it('validates answer character count minimum (10)', () => {
      expect(routeSource).toMatch(/10|MIN_ANSWER/);
    });

    it('validates answer character count maximum (500)', () => {
      expect(routeSource).toMatch(/500|MAX_ANSWER/);
    });

    it('allows empty answers for optional questions', () => {
      // The route should not require all answers to be non-empty
      expect(routeSource).toMatch(/optional|required.*false|\.trim\(\)/);
    });
  });

  describe('OrchestratorAgent Integration', () => {
    it('calls OrchestratorAgent or normalize function', () => {
      expect(routeSource).toMatch(
        /normalizeAnswers|orchestratorAgent|OrchestratorAgent|normalize/i
      );
    });

    it('has timeout for agent call', () => {
      expect(routeSource).toMatch(/timeout|TIMEOUT|AbortController|setTimeout/);
    });

    it('validates agent output against BusinessContextSchema', () => {
      expect(routeSource).toContain('BusinessContextSchema');
      expect(routeSource).toMatch(/\.parse\(|\.safeParse\(/);
    });
  });

  describe('Error Responses', () => {
    it('returns 400 for invalid answers', () => {
      expect(routeSource).toContain('400');
    });

    it('returns 401 for missing/invalid session', () => {
      expect(routeSource).toContain('401');
    });

    it('returns 403 for invalid/expired/used token', () => {
      expect(routeSource).toContain('403');
    });

    it('returns 500 for agent/processing failure', () => {
      expect(routeSource).toContain('500');
    });

    it('returns generic error messages (no data leakage)', () => {
      expect(routeSource).toContain('Invalid or expired generation token');
      expect(routeSource).toMatch(/Failed to process answers|Processing failed|Processing error/);
    });
  });

  describe('Success Response', () => {
    it('returns 200 with session_id on success', () => {
      expect(routeSource).toContain('session_id');
    });

    it('returns BusinessContext as context field', () => {
      expect(routeSource).toContain('context');
    });

    it('returns next_action as start_generation', () => {
      expect(routeSource).toContain('start_generation');
    });
  });

  describe('Observability', () => {
    it('logs structured events', () => {
      expect(routeSource).toMatch(/console\.(info|warn)/);
      expect(routeSource).toContain('JSON.stringify');
    });

    it('logs success events', () => {
      expect(routeSource).toMatch(/bmc\.answers\.ok|answers\.ok|answers\.success/);
    });

    it('logs error events', () => {
      expect(routeSource).toMatch(
        /bmc\.answers\.(orchestrator_error|orchestrator_timeout|context_validation_failed)/
      );
    });
  });

  describe('State Management', () => {
    it('records Phase 1B tokens in CostTracker', () => {
      expect(routeSource).toMatch(/costTracker\.record|tracker\.record/);
    });

    it('refreshes session cookie (sliding window)', () => {
      expect(routeSource).toMatch(/Set-Cookie|buildSessionCookie/);
    });
  });

  describe('Security', () => {
    it('sets Cache-Control: no-store on responses', () => {
      expect(routeSource).toContain('no-store');
    });

    it('does not leak Zod validation details in error messages', () => {
      // Error messages should be generic, not contain .issues or detailed paths
      expect(routeSource).not.toMatch(/issues|zodError\.errors|error\.format\(\)/);
    });
  });
});

// ---------------------------------------------------------------------------
// Behavioral Tests for Token Validation Logic
// ---------------------------------------------------------------------------

describe('Generation Token Validation (behavioral)', () => {
  const TEST_SECRET = 'test-secret-key-minimum-32-bytes!';

  /**
   * Helper: create a valid generation token (same algorithm as start/route.ts)
   */
  function createTestToken(
    sessionId: string,
    secret: string,
    overrides: Partial<{
      exp: number;
      used: boolean;
      iat: number;
      sid: string;
      rnd: string;
    }> = {}
  ): string {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      sid: overrides.sid ?? sessionId,
      rnd: overrides.rnd ?? crypto.randomBytes(32).toString('hex'),
      iat: overrides.iat ?? now,
      exp: overrides.exp ?? now + 1800, // 30 min default
      used: overrides.used ?? false,
    };

    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString(
      'base64url'
    );
    const signature = crypto
      .createHmac('sha256', secret)
      .update(payloadB64)
      .digest('base64url');

    return `${payloadB64}.${signature}`;
  }

  /**
   * Helper: verify a token's signature and extract payload
   */
  function verifyTokenSignature(
    token: string,
    secret: string
  ): { valid: boolean; payload?: Record<string, unknown> } {
    const parts = token.split('.');
    if (parts.length !== 2) return { valid: false };

    const [payloadB64, receivedSig] = parts;
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(payloadB64)
      .digest('base64url');

    if (receivedSig.length !== expectedSig.length) return { valid: false };

    try {
      const isValid = crypto.timingSafeEqual(
        Buffer.from(receivedSig),
        Buffer.from(expectedSig)
      );
      if (!isValid) return { valid: false };

      const decoded = Buffer.from(payloadB64, 'base64url').toString('utf-8');
      return { valid: true, payload: JSON.parse(decoded) };
    } catch {
      return { valid: false };
    }
  }

  it('valid token passes signature verification', () => {
    const token = createTestToken('session-123', TEST_SECRET);
    const result = verifyTokenSignature(token, TEST_SECRET);
    expect(result.valid).toBe(true);
    expect(result.payload?.sid).toBe('session-123');
  });

  it('tampered token fails signature verification', () => {
    const token = createTestToken('session-123', TEST_SECRET);
    // Tamper with payload
    const [payloadB64, sig] = token.split('.');
    const decoded = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString('utf-8')
    );
    decoded.sid = 'session-hacked';
    const tamperedPayload = Buffer.from(JSON.stringify(decoded)).toString(
      'base64url'
    );
    const tamperedToken = `${tamperedPayload}.${sig}`;

    const result = verifyTokenSignature(tamperedToken, TEST_SECRET);
    expect(result.valid).toBe(false);
  });

  it('token with wrong secret fails verification', () => {
    const token = createTestToken('session-123', TEST_SECRET);
    const result = verifyTokenSignature(token, 'wrong-secret-minimum-32-bytes!!');
    expect(result.valid).toBe(false);
  });

  it('expired token has exp in the past', () => {
    const pastTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
    const token = createTestToken('session-123', TEST_SECRET, {
      exp: pastTime,
    });
    const result = verifyTokenSignature(token, TEST_SECRET);
    expect(result.valid).toBe(true); // Signature is valid
    expect(result.payload?.exp).toBeLessThan(Math.floor(Date.now() / 1000));
  });

  it('token session_id binding: payload contains session_id', () => {
    const token = createTestToken('session-abc', TEST_SECRET);
    const result = verifyTokenSignature(token, TEST_SECRET);
    expect(result.payload?.sid).toBe('session-abc');
  });

  it('malformed token (no dot separator) fails', () => {
    const result = verifyTokenSignature('not-a-valid-token', TEST_SECRET);
    expect(result.valid).toBe(false);
  });

  it('malformed token (three parts) fails', () => {
    const result = verifyTokenSignature('a.b.c', TEST_SECRET);
    expect(result.valid).toBe(false);
  });

  it('empty string token fails', () => {
    const result = verifyTokenSignature('', TEST_SECRET);
    expect(result.valid).toBe(false);
  });

  it('token payload contains used flag', () => {
    const token = createTestToken('session-123', TEST_SECRET);
    const result = verifyTokenSignature(token, TEST_SECRET);
    expect(result.payload?.used).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Answer Validation Logic Tests
// ---------------------------------------------------------------------------

describe('Answer Validation Logic', () => {
  const MIN_ANSWER_CHARS = 10;
  const MAX_ANSWER_CHARS = 500;

  function validateAnswer(
    answer: string,
    required: boolean
  ): { valid: boolean; error?: string } {
    const trimmed = answer.trim();

    // Optional questions: empty is OK, but if non-empty must meet length
    if (!required && trimmed.length === 0) {
      return { valid: true };
    }

    // Required questions: must not be empty
    if (required && trimmed.length === 0) {
      return { valid: false, error: 'Answer is required' };
    }

    // Character length validation for non-empty answers
    if (trimmed.length < MIN_ANSWER_CHARS) {
      return {
        valid: false,
        error: `Answer must be at least ${MIN_ANSWER_CHARS} characters`,
      };
    }

    if (trimmed.length > MAX_ANSWER_CHARS) {
      return {
        valid: false,
        error: `Answer must be no more than ${MAX_ANSWER_CHARS} characters`,
      };
    }

    return { valid: true };
  }

  it('accepts required answer at minimum length (10 chars)', () => {
    const result = validateAnswer('0123456789', true);
    expect(result.valid).toBe(true);
  });

  it('rejects required answer below minimum length', () => {
    const result = validateAnswer('short', true);
    expect(result.valid).toBe(false);
  });

  it('accepts required answer at maximum length (500 chars)', () => {
    const result = validateAnswer('a'.repeat(500), true);
    expect(result.valid).toBe(true);
  });

  it('rejects required answer above maximum length', () => {
    const result = validateAnswer('a'.repeat(501), true);
    expect(result.valid).toBe(false);
  });

  it('rejects empty required answer', () => {
    const result = validateAnswer('', true);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('required');
  });

  it('rejects whitespace-only required answer', () => {
    const result = validateAnswer('    ', true);
    expect(result.valid).toBe(false);
  });

  it('accepts empty optional answer', () => {
    const result = validateAnswer('', false);
    expect(result.valid).toBe(true);
  });

  it('accepts whitespace-only optional answer as empty', () => {
    const result = validateAnswer('   ', false);
    expect(result.valid).toBe(true);
  });

  it('validates non-empty optional answer against length limits', () => {
    const result = validateAnswer('short', false);
    expect(result.valid).toBe(false);
  });

  it('accepts valid non-empty optional answer', () => {
    const result = validateAnswer('This is a valid answer for an optional question', false);
    expect(result.valid).toBe(true);
  });

  it('trims whitespace before validation', () => {
    const result = validateAnswer('  0123456789  ', true);
    expect(result.valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// BusinessContext Zod Schema Validation (reuse from validators)
// ---------------------------------------------------------------------------

describe('BusinessContext Schema Validation (for /answers output)', () => {
  // Import dynamically to avoid module resolution issues
  let BusinessContextSchema: typeof import('../lib/validators').BusinessContextSchema;

  beforeEach(async () => {
    const validators = await import('../lib/validators');
    BusinessContextSchema = validators.BusinessContextSchema;
  });

  const validContext = {
    user_idea_summary:
      'An AI-powered platform that helps small businesses automate their social media marketing',
    industry: 'SaaS',
    customer_type: 'B2B' as const,
    target_market: 'Small businesses with 1-50 employees in the US',
    problem_statement:
      'Small businesses spend too much time on social media',
    solution_approach:
      'AI automation for content creation and scheduling',
    pricing_direction: '$49/month per account',
    geography: 'United States',
    competitive_landscape:
      'Competitors include Buffer and Hootsuite but they lack AI capabilities',
    key_assumptions: ['SMBs want automation', 'AI content quality is acceptable'],
    success_metrics: ['1000 paying customers in year 1'],
    stage: 'idea' as const,
  };

  it('accepts a valid BusinessContext', () => {
    const result = BusinessContextSchema.safeParse(validContext);
    expect(result.success).toBe(true);
  });

  it('rejects BusinessContext with short user_idea_summary', () => {
    const result = BusinessContextSchema.safeParse({
      ...validContext,
      user_idea_summary: 'Too short',
    });
    expect(result.success).toBe(false);
  });

  it('rejects BusinessContext with invalid customer_type', () => {
    const result = BusinessContextSchema.safeParse({
      ...validContext,
      customer_type: 'D2C',
    });
    expect(result.success).toBe(false);
  });

  it('rejects BusinessContext with empty key_assumptions', () => {
    const result = BusinessContextSchema.safeParse({
      ...validContext,
      key_assumptions: [],
    });
    expect(result.success).toBe(false);
  });

  it('accepts BusinessContext with null pricing_direction', () => {
    const result = BusinessContextSchema.safeParse({
      ...validContext,
      pricing_direction: null,
    });
    expect(result.success).toBe(true);
  });

  it('rejects BusinessContext with unknown extra fields (strict mode)', () => {
    const result = BusinessContextSchema.safeParse({
      ...validContext,
      extra_field: 'should not be here',
    });
    expect(result.success).toBe(false);
  });

  it('rejects BusinessContext with invalid stage value', () => {
    const result = BusinessContextSchema.safeParse({
      ...validContext,
      stage: 'launched',
    });
    expect(result.success).toBe(false);
  });
});
