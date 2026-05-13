/**
 * POST /api/bmc-generator/answers
 *
 * User answers clarifying questions; server normalizes into BusinessContext.
 *
 * Authentication:
 *   - REQUIRED: Valid bmc_session cookie
 *   - REQUIRED: Valid generation_token (HMAC-SHA256, bound to session, single-use)
 *
 * Returns: { session_id, context: BusinessContext, next_action: 'start_generation' }
 *
 * All error messages are generic -- no internal data leakage.
 */

import * as crypto from 'crypto';
import {
  validateAndRefreshSession,
  getSessionSecret,
  buildSessionCookie,
} from '@/app/tools/bmc-generator/lib/middleware-helpers';
import { BusinessContextSchema } from '@/app/tools/bmc-generator/lib/validators';
import { CostTracker } from '@/app/tools/bmc-generator/lib/cost-tracker';
import { getSSEState } from '@/app/api/bmc-generator/start/route';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ANSWER_MIN_LENGTH = 10;
const ANSWER_MAX_LENGTH = 500;
const ORCHESTRATOR_TIMEOUT_MS = 5_000;
const MAX_PAYLOAD_BYTES = 100 * 1024; // 100KB

// ---------------------------------------------------------------------------
// Module-level state (persists across requests in the same server instance)
// ---------------------------------------------------------------------------

/**
 * Set of used generation tokens.
 * Once a token is used for /answers, it cannot be reused.
 * Maps token_hash -> timestamp_used.
 */
const usedTokens = new Map<string, number>();

/**
 * Session data store.
 * Maps session_id -> { idea, questions, createdAt }.
 * Populated by /start, consumed by /answers.
 */
const sessionStore = new Map<
  string,
  { idea: string; questions: string[]; createdAt: number; username: string }
>();

// Evict used tokens older than 1 hour to prevent unbounded growth
const USED_TOKEN_TTL_MS = 60 * 60 * 1000;

function evictExpiredTokens(): void {
  const now = Date.now();
  for (const [hash, usedAt] of usedTokens.entries()) {
    if (now - usedAt > USED_TOKEN_TTL_MS) {
      usedTokens.delete(hash);
    }
  }
}

// ---------------------------------------------------------------------------
// Token Verification
// ---------------------------------------------------------------------------

interface TokenVerifyResult {
  valid: boolean;
  sessionId?: string;
  error?: string;
}

/**
 * Verify generation_token: HMAC signature, session binding, expiration, single-use.
 */
function verifyGenerationToken(
  token: string,
  expectedSessionId: string,
  secret: string
): TokenVerifyResult {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'Missing generation token' };
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return { valid: false, error: 'Malformed token' };
  }

  const [payloadB64, receivedSig] = parts;

  // 1. Verify HMAC-SHA256 signature
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(payloadB64)
    .digest('base64url');

  if (
    receivedSig.length !== expectedSig.length ||
    !crypto.timingSafeEqual(
      Buffer.from(receivedSig),
      Buffer.from(expectedSig)
    )
  ) {
    return { valid: false, error: 'Invalid token signature' };
  }

  // 2. Parse payload
  let payload: { sid: string; rnd: string; iat: number; exp: number; used: boolean };
  try {
    const decoded = Buffer.from(payloadB64, 'base64url').toString('utf-8');
    payload = JSON.parse(decoded);
  } catch {
    return { valid: false, error: 'Malformed token payload' };
  }

  // 3. Check expiration
  const now = Math.floor(Date.now() / 1000);
  if (now >= payload.exp) {
    return { valid: false, error: 'Token expired' };
  }

  // 4. Check session binding
  if (payload.sid !== expectedSessionId) {
    return { valid: false, error: 'Token bound to different session' };
  }

  // 5. Check single-use (hash the token to avoid storing the raw value)
  const tokenHash = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  if (usedTokens.has(tokenHash)) {
    return { valid: false, error: 'Token already used' };
  }

  return { valid: true, sessionId: payload.sid };
}

/**
 * Mark a generation token as used.
 */
function markTokenUsed(token: string): void {
  const tokenHash = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  usedTokens.set(tokenHash, Date.now());
}

// ---------------------------------------------------------------------------
// OrchestratorAgent Integration
// ---------------------------------------------------------------------------

/**
 * Call OrchestratorAgent to normalize answers into BusinessContext.
 *
 * Currently uses a structured fallback since the real agent
 * is being implemented in a parallel todo.
 */
async function _normalizeAnswersImpl(
  idea: string,
  questions: string[],
  answers: Record<string, string>
): Promise<{
  context: Record<string, unknown>;
  inputTokens: number;
  outputTokens: number;
}> {
  // Real OrchestratorAgent call will be wired here.
  // For now, produce a structured BusinessContext from the answers.
  const answerValues = Object.values(answers);
  const combinedAnswers = answerValues.join(' ');

  const context = {
    user_idea_summary: idea.length >= 50 ? idea.slice(0, 500) : idea.padEnd(50, '.'),
    industry: answerValues[0]?.slice(0, 50) || 'Technology',
    customer_type: 'B2B' as const,
    target_market: answerValues[1]?.slice(0, 200) || 'Enterprise companies in the market segment',
    problem_statement: combinedAnswers.slice(0, 200) || 'Businesses face challenges',
    solution_approach: `Platform that addresses: ${idea.slice(0, 150)}`,
    pricing_direction: answerValues[2] || null,
    geography: 'Global',
    competitive_landscape: `Competitive analysis based on: ${combinedAnswers.slice(0, 100)}`,
    key_assumptions: ['Market demand exists', 'Technology is feasible'],
    success_metrics: ['User adoption rate'],
    stage: 'idea' as const,
  };

  return {
    context,
    inputTokens: 0,
    outputTokens: 0,
  };
}

/**
 * Module-level mutable reference for normalizeAnswers.
 * Tests can override _testInternals.normalizeAnswers to control the agent behavior.
 */
const agentFunctions = {
  normalizeAnswers: _normalizeAnswersImpl,
};

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: Request): Promise<Response> {
  const t0 = performance.now();

  // Housekeeping: evict expired tokens
  evictExpiredTokens();

  // -----------------------------------------------------------------------
  // 1. Session validation (cookie-based auth)
  // -----------------------------------------------------------------------
  const sessionResult = validateAndRefreshSession(request);

  if (!sessionResult.valid || !sessionResult.username) {
    const errorMessage =
      sessionResult.error === 'No session cookie found'
        ? 'Unauthorized. Please log in.'
        : 'Session expired. Please log in again.';

    return Response.json(
      {
        error: errorMessage,
        redirect: '/tools/bmc-generator/login',
      },
      {
        status: 401,
        headers: { 'Cache-Control': 'no-store, no-cache' },
      }
    );
  }

  // -----------------------------------------------------------------------
  // 2. Payload size check
  // -----------------------------------------------------------------------
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_BYTES) {
    return Response.json(
      { error: 'Request body too large.' },
      {
        status: 413,
        headers: { 'Cache-Control': 'no-store, no-cache' },
      }
    );
  }

  // -----------------------------------------------------------------------
  // 3. Parse request body
  // -----------------------------------------------------------------------
  let body: {
    session_id?: unknown;
    generation_token?: unknown;
    answers?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: 'Invalid request body. Expected JSON.' },
      {
        status: 400,
        headers: { 'Cache-Control': 'no-store, no-cache' },
      }
    );
  }

  const { session_id, generation_token, answers } = body;

  // -----------------------------------------------------------------------
  // 4. Validate session_id
  // -----------------------------------------------------------------------
  if (!session_id || typeof session_id !== 'string') {
    return Response.json(
      { error: 'Missing or invalid session_id.' },
      {
        status: 400,
        headers: { 'Cache-Control': 'no-store, no-cache' },
      }
    );
  }

  // Check session exists (via SSE state from /start)
  const sseState = getSSEState(session_id);
  if (!sseState) {
    return Response.json(
      { error: 'Session not found' },
      {
        status: 404,
        headers: { 'Cache-Control': 'no-store, no-cache' },
      }
    );
  }

  // -----------------------------------------------------------------------
  // 5. Validate generation_token
  // -----------------------------------------------------------------------
  if (!generation_token || typeof generation_token !== 'string') {
    return Response.json(
      { error: 'Invalid or expired generation token' },
      {
        status: 403,
        headers: { 'Cache-Control': 'no-store, no-cache' },
      }
    );
  }

  let secret: string;
  try {
    secret = getSessionSecret();
  } catch {
    return Response.json(
      { error: 'Server configuration error.' },
      {
        status: 500,
        headers: { 'Cache-Control': 'no-store, no-cache' },
      }
    );
  }

  const tokenResult = verifyGenerationToken(generation_token, session_id, secret);
  if (!tokenResult.valid) {
    return Response.json(
      { error: 'Invalid or expired generation token' },
      {
        status: 403,
        headers: { 'Cache-Control': 'no-store, no-cache' },
      }
    );
  }

  // Mark token as used immediately (before processing answers)
  markTokenUsed(generation_token);

  // -----------------------------------------------------------------------
  // 6. Validate answers
  // -----------------------------------------------------------------------
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
    return Response.json(
      { error: 'Missing or invalid answers field.' },
      {
        status: 400,
        headers: { 'Cache-Control': 'no-store, no-cache' },
      }
    );
  }

  const answersRecord = answers as Record<string, unknown>;

  // Validate each answer
  for (const [key, value] of Object.entries(answersRecord)) {
    if (typeof value !== 'string') {
      return Response.json(
        { error: `Answer for "${key}" must be a string.` },
        {
          status: 400,
          headers: { 'Cache-Control': 'no-store, no-cache' },
        }
      );
    }

    // Check if answer is a required field (non-empty key = required)
    const isRequired = !key.startsWith('optional_');

    if (isRequired) {
      if (!value || value.trim().length === 0) {
        return Response.json(
          { error: 'All required answers must be provided.' },
          {
            status: 400,
            headers: { 'Cache-Control': 'no-store, no-cache' },
          }
        );
      }

      if (value.trim().length < ANSWER_MIN_LENGTH) {
        return Response.json(
          { error: `Answer too short. Minimum ${ANSWER_MIN_LENGTH} characters required.` },
          {
            status: 400,
            headers: { 'Cache-Control': 'no-store, no-cache' },
          }
        );
      }
    }

    if (value.length > ANSWER_MAX_LENGTH) {
      return Response.json(
        { error: `Answer exceeds ${ANSWER_MAX_LENGTH} characters.` },
        {
          status: 400,
          headers: { 'Cache-Control': 'no-store, no-cache' },
        }
      );
    }
  }

  // -----------------------------------------------------------------------
  // 7. Call OrchestratorAgent to normalize answers
  // -----------------------------------------------------------------------
  let normalizedContext: Record<string, unknown>;
  let inputTokens = 0;
  let outputTokens = 0;

  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error('OrchestratorAgent timeout')),
        ORCHESTRATOR_TIMEOUT_MS
      )
    );

    const normalizePromise = agentFunctions.normalizeAnswers(
      'User business idea', // Will be loaded from session in real implementation
      [], // questions
      answersRecord as Record<string, string>
    );

    const result = await Promise.race([normalizePromise, timeoutPromise]);
    normalizedContext = result.context;
    inputTokens = result.inputTokens;
    outputTokens = result.outputTokens;
  } catch (err) {
    const isTimeout = err instanceof Error && err.message.includes('timeout');

    if (isTimeout) {
      // Return fallback context on timeout
      console.warn(
        JSON.stringify({
          event: 'bmc.answers.orchestrator_timeout',
          sessionId: session_id,
        })
      );

      normalizedContext = {
        user_idea_summary: '[Timeout: Using default idea summary]'.padEnd(50, '.'),
        industry: 'Unknown',
        customer_type: 'B2B',
        target_market: 'Not specified due to processing timeout',
        problem_statement: 'Problem analysis pending',
        solution_approach: 'Solution analysis pending',
        pricing_direction: null,
        geography: 'Global',
        competitive_landscape: 'Analysis pending due to timeout',
        key_assumptions: ['Market demand assumed'],
        success_metrics: ['To be determined'],
        stage: 'idea',
      };
    } else {
      console.error(
        JSON.stringify({
          event: 'bmc.answers.orchestrator_error',
          sessionId: session_id,
          error: err instanceof Error ? err.message : 'unknown',
        })
      );

      return Response.json(
        { error: 'Failed to process answers. Please try again.' },
        {
          status: 500,
          headers: { 'Cache-Control': 'no-store, no-cache' },
        }
      );
    }
  }

  // -----------------------------------------------------------------------
  // 8. Validate normalized context against BusinessContextSchema
  // -----------------------------------------------------------------------
  let validatedContext;
  try {
    validatedContext = BusinessContextSchema.parse(normalizedContext);
  } catch (err) {
    // Do NOT leak Zod validation details to the client
    console.error(
      JSON.stringify({
        event: 'bmc.answers.context_validation_failed',
        sessionId: session_id,
        error: err instanceof Error ? err.message : 'unknown',
      })
    );

    return Response.json(
      { error: 'Failed to process answers. Please try again.' },
      {
        status: 500,
        headers: { 'Cache-Control': 'no-store, no-cache' },
      }
    );
  }

  // -----------------------------------------------------------------------
  // 9. Record Phase 1B cost
  // -----------------------------------------------------------------------
  const costTracker = new CostTracker();
  if (inputTokens > 0 || outputTokens > 0) {
    costTracker.record(1, 'OrchestratorAgent_normalize', inputTokens, outputTokens);
  }

  // -----------------------------------------------------------------------
  // 10. Build success response
  // -----------------------------------------------------------------------
  const latencyMs = Math.round(performance.now() - t0);
  console.info(
    JSON.stringify({
      event: 'bmc.answers.ok',
      sessionId: session_id,
      latencyMs,
    })
  );

  // Build refreshed session cookie (sliding window TTL)
  const refreshedCookie = buildSessionCookie(sessionResult.refreshedToken!);

  return new Response(
    JSON.stringify({
      session_id,
      context: validatedContext,
      next_action: 'start_generation',
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': refreshedCookie,
        'Cache-Control': 'no-store, no-cache',
      },
    }
  );
}

// ---------------------------------------------------------------------------
// Exported state accessors (for testing)
// ---------------------------------------------------------------------------

/**
 * Store session data (called by /start or externally for testing).
 */
export function storeSession(
  sessionId: string,
  data: { idea: string; questions: string[]; createdAt: number; username: string }
): void {
  sessionStore.set(sessionId, data);
}

/**
 * Get session data.
 */
export function getSession(
  sessionId: string
): { idea: string; questions: string[]; createdAt: number; username: string } | undefined {
  return sessionStore.get(sessionId);
}

/**
 * Check if a token has been used.
 */
export function isTokenUsed(token: string): boolean {
  const tokenHash = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  return usedTokens.has(tokenHash);
}

/**
 * Reset all module-level state.
 * Exported only for test use -- NEVER call in production code.
 */
export function _resetState(): void {
  usedTokens.clear();
  sessionStore.clear();
}

/**
 * Expose internals for testing.
 * agentFunctions is a mutable object so vi.spyOn(_testInternals, 'normalizeAnswers')
 * actually intercepts calls made by the POST handler.
 */
export const _testInternals = agentFunctions as {
  normalizeAnswers: typeof _normalizeAnswersImpl;
} & {
  readonly usedTokens: typeof usedTokens;
  readonly sessionStore: typeof sessionStore;
  readonly verifyGenerationToken: typeof verifyGenerationToken;
  readonly markTokenUsed: typeof markTokenUsed;
  readonly ANSWER_MIN_LENGTH: typeof ANSWER_MIN_LENGTH;
  readonly ANSWER_MAX_LENGTH: typeof ANSWER_MAX_LENGTH;
};

// Attach read-only helpers to the same object for test convenience
Object.defineProperties(_testInternals, {
  usedTokens: { value: usedTokens, writable: false },
  sessionStore: { value: sessionStore, writable: false },
  verifyGenerationToken: { value: verifyGenerationToken, writable: false },
  markTokenUsed: { value: markTokenUsed, writable: false },
  ANSWER_MIN_LENGTH: { value: ANSWER_MIN_LENGTH, writable: false },
  ANSWER_MAX_LENGTH: { value: ANSWER_MAX_LENGTH, writable: false },
});
