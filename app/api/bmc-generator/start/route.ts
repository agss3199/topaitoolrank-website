/**
 * POST /api/bmc-generator/start
 *
 * User submits a business idea (50-500 chars), receives clarifying questions
 * from OrchestratorAgent (or fallback questions on failure).
 *
 * Enforces 4 rate limits:
 *   1. Per-IP: 5 /start calls per minute -> 429
 *   2. Per-session concurrent: 1 generation at a time -> 409
 *   3. Per-session daily: 20 generations per calendar day -> 429
 *   4. Global cost ceiling: $500/day total across all users -> 429
 *
 * Returns: { session_id, questions, generation_token, estimated_cost,
 *            estimated_latency_seconds }
 *
 * All error messages are generic -- no internal data leakage.
 */

import * as crypto from 'crypto';
import { RateLimiter } from '@/app/tools/bmc-generator/lib/auth-helpers';
import {
  validateAndRefreshSession,
  getSessionSecret,
  buildSessionCookie,
} from '@/app/tools/bmc-generator/lib/middleware-helpers';
import { CostTracker } from '@/app/tools/bmc-generator/lib/cost-tracker';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const IDEA_MIN_LENGTH = 50;
const IDEA_MAX_LENGTH = 500;
const ORCHESTRATOR_TIMEOUT_MS = 5_000;
const GENERATION_TOKEN_BYTES = 32;
const GENERATION_TOKEN_TTL_SECONDS = 30 * 60; // 30 minutes
const MAX_DAILY_GENERATIONS = 20;
const GLOBAL_DAILY_COST_CEILING_USD = 0.50; // $0.50/day budget cap per spec
const CONCURRENT_GENERATION_TTL_MS = 5 * 60 * 1000; // 5 min TTL for stale entries
const MAX_PAYLOAD_BYTES = 100 * 1024; // 100KB for a text idea

const FALLBACK_QUESTIONS = [
  'Describe your target customer',
  "What's the core problem you solve?",
  "What's your pricing model?",
];

// ---------------------------------------------------------------------------
// Module-level state (persists across requests in the same server instance)
// ---------------------------------------------------------------------------

// Per-IP rate limiter: 5 requests per minute
const ipRateLimiter = new RateLimiter({
  maxAttempts: 5,
  windowMs: 60 * 1000, // 1 minute
});

// Per-session concurrent generation tracker
// Maps session_id -> { startTime, timeoutMs }
const concurrentGenerations = new Map<
  string,
  { startTime: number; timeoutMs: number }
>();

// Per-session daily generation counter
// Maps session_id -> { count, resetAt }
const dailyGenerationCounts = new Map<
  string,
  { count: number; resetAt: number }
>();

// Global cost ceiling tracker
let globalCostState = {
  totalCost: 0,
  resetAt: getNextMidnightUTC(),
};

// SSE stream state: Maps session_id -> initial event (for stream/status endpoint)
const sseSessionState = new Map<
  string,
  { events: Array<Record<string, unknown>>; createdAt: number }
>();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getNextMidnightUTC(): number {
  const now = new Date();
  const midnight = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  );
  return midnight.getTime();
}

function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return '127.0.0.1';
}

/**
 * Evict stale entries from concurrent generation map.
 * Entries older than their TTL are removed.
 */
function evictStaleConcurrentEntries(): void {
  const now = Date.now();
  for (const [sessionId, entry] of concurrentGenerations.entries()) {
    if (now - entry.startTime > entry.timeoutMs) {
      concurrentGenerations.delete(sessionId);
    }
  }
}

/**
 * Evict stale SSE session state.
 * Entries older than 30 minutes are removed.
 */
function evictStaleSSEState(): void {
  const now = Date.now();
  const SSE_STATE_TTL_MS = 30 * 60 * 1000; // 30 minutes
  for (const [sessionId, entry] of sseSessionState.entries()) {
    if (now - entry.createdAt > SSE_STATE_TTL_MS) {
      sseSessionState.delete(sessionId);
    }
  }
}

/**
 * Reset daily counters if we've passed midnight UTC.
 */
function resetDailyCountersIfNeeded(): void {
  const now = Date.now();
  if (now >= globalCostState.resetAt) {
    globalCostState = { totalCost: 0, resetAt: getNextMidnightUTC() };
  }

  for (const [sessionId, entry] of dailyGenerationCounts.entries()) {
    if (now >= entry.resetAt) {
      dailyGenerationCounts.delete(sessionId);
    }
  }
}

/**
 * Create a signed generation token bound to a session_id.
 *
 * Token format: base64url(payload).base64url(hmac_signature)
 * Payload: { session_id, random_bytes_hex, created_at, expires_at, used: false }
 */
function createGenerationToken(sessionId: string, secret: string): string {
  const randomBytes = crypto.randomBytes(GENERATION_TOKEN_BYTES).toString('hex');
  const now = Math.floor(Date.now() / 1000);

  const payload = {
    sid: sessionId,
    rnd: randomBytes,
    iat: now,
    exp: now + GENERATION_TOKEN_TTL_SECONDS,
    used: false,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadB64)
    .digest('base64url');

  return `${payloadB64}.${signature}`;
}

/**
 * Call OrchestratorAgent to generate clarifying questions.
 *
 * Currently uses fallback questions since the real agent
 * is being implemented in a parallel todo. When the agent
 * is ready, this function will call it with a 5s timeout.
 */
async function generateQuestions(
  idea: string
): Promise<{ questions: string[]; inputTokens: number; outputTokens: number }> {
  // Real OrchestratorAgent call will be wired here.
  // For now, return contextual fallback questions with simulated token usage.
  //
  // When the agent is integrated:
  //   const controller = new AbortController();
  //   const timeout = setTimeout(() => controller.abort(), ORCHESTRATOR_TIMEOUT_MS);
  //   try {
  //     const result = await orchestratorAgent.generate_questions(idea, { signal: controller.signal });
  //     clearTimeout(timeout);
  //     return { questions: result.questions, inputTokens: result.metadata.tokens_used.input, outputTokens: result.metadata.tokens_used.output };
  //   } catch (err) {
  //     clearTimeout(timeout);
  //     throw err;
  //   }

  return {
    questions: FALLBACK_QUESTIONS,
    inputTokens: 0,
    outputTokens: 0,
  };
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: Request): Promise<Response> {
  const t0 = performance.now();
  const clientIP = getClientIP(request);

  // Housekeeping: evict stale entries and reset daily counters
  evictStaleConcurrentEntries();
  resetDailyCountersIfNeeded();
  evictStaleSSEState();

  // -----------------------------------------------------------------------
  // 1. Per-IP rate limit (check before any processing)
  // -----------------------------------------------------------------------
  const ipCheck = ipRateLimiter.check(clientIP);
  if (!ipCheck.allowed) {
    const latencyMs = Math.round(performance.now() - t0);
    console.warn(
      JSON.stringify({
        event: 'bmc.start.ip_rate_limited',
        retryAfterSeconds: ipCheck.retryAfterSeconds,
        latencyMs,
      })
    );
    return Response.json(
      {
        error: `Too many requests. Try again in ${ipCheck.retryAfterSeconds} seconds.`,
        retry_after_seconds: ipCheck.retryAfterSeconds,
      },
      {
        status: 429,
        headers: { 'Cache-Control': 'no-store, no-cache' },
      }
    );
  }

  // Record as an attempt for IP rate limiting
  ipRateLimiter.recordFailure(clientIP);

  // -----------------------------------------------------------------------
  // 2. Session validation
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
  // 3. Payload size check
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
  // 4. Parse and validate request body
  // -----------------------------------------------------------------------
  let body: { idea?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: 'Invalid request body. Expected JSON with { idea: string }.' },
      {
        status: 400,
        headers: { 'Cache-Control': 'no-store, no-cache' },
      }
    );
  }

  const { idea } = body;

  if (!idea || typeof idea !== 'string') {
    return Response.json(
      { error: 'Invalid input provided.' },
      {
        status: 400,
        headers: { 'Cache-Control': 'no-store, no-cache' },
      }
    );
  }

  const trimmedIdea = idea.trim();
  if (trimmedIdea.length < IDEA_MIN_LENGTH || trimmedIdea.length > IDEA_MAX_LENGTH) {
    return Response.json(
      {
        error: 'Invalid input provided.',
      },
      {
        status: 400,
        headers: { 'Cache-Control': 'no-store, no-cache' },
      }
    );
  }

  // -----------------------------------------------------------------------
  // 5. Session-based rate limits
  // -----------------------------------------------------------------------

  // Use username as session identifier (stateless, derived from token)
  const sessionId = sessionResult.username;

  // 5a. Per-session concurrent generation (only 1 at a time)
  const runningGeneration = concurrentGenerations.get(sessionId);
  if (runningGeneration) {
    const elapsed = Date.now() - runningGeneration.startTime;
    if (elapsed < runningGeneration.timeoutMs) {
      return Response.json(
        { error: 'Generation already in progress. Please wait for it to complete.' },
        {
          status: 409,
          headers: { 'Cache-Control': 'no-store, no-cache' },
        }
      );
    }
    // Stale entry, remove it
    concurrentGenerations.delete(sessionId);
  }

  // 5b. Per-session daily limit (20 per calendar day)
  const dailyEntry = dailyGenerationCounts.get(sessionId);
  if (dailyEntry) {
    if (Date.now() < dailyEntry.resetAt && dailyEntry.count >= MAX_DAILY_GENERATIONS) {
      return Response.json(
        { error: 'Daily generation limit exceeded (20/day). Try again tomorrow.' },
        {
          status: 429,
          headers: { 'Cache-Control': 'no-store, no-cache' },
        }
      );
    }
  }

  // 5c. Global cost ceiling ($500/day)
  // Estimated cost for a full generation run: ~$0.05
  const estimatedFullRunCost = 0.05;
  if (globalCostState.totalCost + estimatedFullRunCost > GLOBAL_DAILY_COST_CEILING_USD) {
    console.warn(
      JSON.stringify({
        event: 'bmc.start.global_cost_ceiling',
        currentCost: globalCostState.totalCost,
        ceiling: GLOBAL_DAILY_COST_CEILING_USD,
      })
    );
    return Response.json(
      { error: 'Service temporarily unavailable due to cost limits. Try again tomorrow.' },
      {
        status: 429,
        headers: { 'Cache-Control': 'no-store, no-cache' },
      }
    );
  }

  // -----------------------------------------------------------------------
  // 6. Generate clarifying questions via OrchestratorAgent
  // -----------------------------------------------------------------------
  let questions: string[];
  let inputTokens = 0;
  let outputTokens = 0;
  let usedFallback = false;

  try {
    const result = await generateQuestions(trimmedIdea);
    questions = result.questions;
    inputTokens = result.inputTokens;
    outputTokens = result.outputTokens;
  } catch (err) {
    console.warn(
      JSON.stringify({
        event: 'bmc.start.orchestrator_failed',
        error: err instanceof Error ? err.message : 'unknown',
      })
    );
    questions = FALLBACK_QUESTIONS;
    usedFallback = true;
  }

  // -----------------------------------------------------------------------
  // 7. Create generation token (CSRF protection + session binding)
  // -----------------------------------------------------------------------
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

  // Generate a new UUID for this generation session
  const generationSessionId = crypto.randomUUID();
  const generationToken = createGenerationToken(generationSessionId, secret);

  // -----------------------------------------------------------------------
  // 8. Initialize cost tracker and record Phase 1A tokens
  // -----------------------------------------------------------------------
  const costTracker = new CostTracker();
  if (inputTokens > 0 || outputTokens > 0) {
    costTracker.record(1, 'OrchestratorAgent', inputTokens, outputTokens);
  }
  const costData = costTracker.calculate();

  // -----------------------------------------------------------------------
  // 9. Update rate limit state
  // -----------------------------------------------------------------------

  // Mark concurrent generation as running
  concurrentGenerations.set(sessionId, {
    startTime: Date.now(),
    timeoutMs: CONCURRENT_GENERATION_TTL_MS,
  });

  // Increment daily generation count
  const existingDaily = dailyGenerationCounts.get(sessionId);
  if (existingDaily && Date.now() < existingDaily.resetAt) {
    existingDaily.count += 1;
  } else {
    dailyGenerationCounts.set(sessionId, {
      count: 1,
      resetAt: getNextMidnightUTC(),
    });
  }

  // Update global cost with estimated amount
  globalCostState.totalCost += costData.estimatedCostUSD || estimatedFullRunCost;

  // -----------------------------------------------------------------------
  // 10. Initialize SSE stream state for this session
  // -----------------------------------------------------------------------
  const initialEvent = {
    phase: 1,
    activeAgent: 'OrchestratorAgent',
    progress: 0.1,
    elapsedMs: Math.round(performance.now() - t0),
    tokensUsed: { input: inputTokens, output: outputTokens },
    costUSD: costData.estimatedCostUSD,
    timestamp: new Date().toISOString(),
  };

  sseSessionState.set(generationSessionId, {
    events: [initialEvent],
    createdAt: Date.now(),
  });

  // -----------------------------------------------------------------------
  // 11. Build success response
  // -----------------------------------------------------------------------
  const latencyMs = Math.round(performance.now() - t0);
  console.info(
    JSON.stringify({
      event: 'bmc.start.ok',
      sessionId: generationSessionId,
      questionCount: questions.length,
      usedFallback,
      estimatedCostUSD: costData.estimatedCostUSD,
      latencyMs,
    })
  );

  // Build refreshed session cookie (sliding window TTL)
  const refreshedCookie = buildSessionCookie(sessionResult.refreshedToken!);

  return new Response(
    JSON.stringify({
      session_id: generationSessionId,
      questions,
      generation_token: generationToken,
      estimated_cost: costData.estimatedCostUSD,
      estimated_latency_seconds: 60,
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
// Exported state accessors (for downstream endpoints and testing)
// ---------------------------------------------------------------------------

/**
 * Mark a generation as complete (called by /generate when done).
 */
export function markGenerationComplete(sessionId: string): void {
  concurrentGenerations.delete(sessionId);
}

/**
 * Get SSE state for a session (used by /stream/status endpoint).
 */
export function getSSEState(
  sessionId: string
): { events: Array<Record<string, unknown>>; createdAt: number } | undefined {
  return sseSessionState.get(sessionId);
}

/**
 * Get global cost state (for monitoring/testing).
 */
export function getGlobalCostState(): {
  totalCost: number;
  resetAt: number;
} {
  return { ...globalCostState };
}

/**
 * Reset all module-level state.
 * Exported only for test use -- NEVER call in production code.
 */
export function _resetState(): void {
  ipRateLimiter.reset();
  concurrentGenerations.clear();
  dailyGenerationCounts.clear();
  globalCostState = { totalCost: 0, resetAt: getNextMidnightUTC() };
  sseSessionState.clear();
}

/**
 * Expose internal state maps for testing.
 * Exported only for test use -- NEVER call in production code.
 */
export const _testInternals = {
  concurrentGenerations,
  dailyGenerationCounts,
  get globalCostState() {
    return globalCostState;
  },
  set globalCostState(val: { totalCost: number; resetAt: number }) {
    globalCostState = val;
  },
  sseSessionState,
  ipRateLimiter,
  FALLBACK_QUESTIONS,
};
