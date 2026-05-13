/**
 * POST /api/bmc-generator/generate
 *
 * Phase 2 orchestration: runs 9 parallel BMC agents, validates outputs
 * with Zod, emits SSE progress events, enforces timeout boundaries.
 *
 * Authentication:
 *   - REQUIRED: Valid bmc_session cookie
 *   - REQUIRED: Fresh generation_token (not already consumed by /answers)
 *
 * Concurrency:
 *   - 1 concurrent generation per session (409 if another running)
 *
 * Timeout boundaries:
 *   - Per-agent: 30s
 *   - Skip remaining at 40s mark
 *   - Abort all at 45s mark
 *
 * Success threshold:
 *   - >=6 agents succeed -> 200 with all sections
 *   - <6 agents succeed -> 500 (abort to Tier 3)
 */

import * as crypto from 'crypto';
import {
  validateAndRefreshSession,
  getSessionSecret,
  buildSessionCookie,
} from '@/app/tools/bmc-generator/lib/middleware-helpers';
import { BMCSectionSchema } from '@/app/tools/bmc-generator/lib/validators';
import { CostTracker } from '@/app/tools/bmc-generator/lib/cost-tracker';
import {
  extractPromptContext,
  AGENT_PROMPT_REGISTRY,
  CRITIQUE_PROMPT_REGISTRY,
  synthesisPrompt,
} from '@/app/tools/bmc-generator/lib/agent-prompts';
import { CritiqueOutputSchema, FinalBMCSchema } from '@/app/tools/bmc-generator/lib/validators';
import {
  getSSEState,
  markGenerationComplete,
} from '@/app/api/bmc-generator/start/route';
import {
  isTokenUsed,
} from '@/app/api/bmc-generator/answers/route';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AGENT_TIMEOUT_MS = 30_000;
const SKIP_REMAINING_AT_MS = 40_000;
const ABORT_ALL_AT_MS = 45_000;
const MIN_AGENTS_FOR_SUCCESS = 6;
const MAX_PAYLOAD_BYTES = 200 * 1024; // 200KB for context + token

// Phase 3-4 constants
const CRITIQUE_TIMEOUT_MS = 15_000;
const CRITIQUE_SKIP_AT_MS = 20_000;
const SYNTHESIS_TIMEOUT_MS = 15_000;
const PHASE3_MIN_TIME_REMAINING_MS = 30_000; // Skip Phase 3 if <30s remaining
const SYNTHESIS_MIN_TIME_REMAINING_MS = 20_000; // Use fallback if <20s remaining
const TOTAL_WALL_CLOCK_LIMIT_MS = 90_000; // 90s total budget

const BMC_SECTION_NAMES = [
  'customer_segments',
  'value_propositions',
  'channels',
  'customer_relationships',
  'revenue_streams',
  'key_resources',
  'key_activities',
  'key_partners',
  'cost_structure',
] as const;

// ---------------------------------------------------------------------------
// Module-level state
// ---------------------------------------------------------------------------

/**
 * Tracks active generation sessions to enforce 1-concurrent limit.
 * Maps session_id -> { startTime }
 */
const activeGenerations = new Map<string, { startTime: number }>();

/**
 * Consumed generation tokens (Phase 2 marks as consumed after success).
 * Maps token_hash -> timestamp_consumed.
 */
const consumedTokens = new Map<string, number>();

/**
 * SSE progress emitter (injectable for testing).
 * Default: no-op. Tests and production wire their own.
 */
let sseEmitter: (sessionId: string, event: Record<string, unknown>) => void =
  () => {};

// ---------------------------------------------------------------------------
// Token verification (replicates answers/route.ts logic for Phase 2)
// ---------------------------------------------------------------------------

interface TokenVerifyResult {
  valid: boolean;
  sessionId?: string;
  error?: string;
}

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

  // Verify HMAC-SHA256 signature
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

  // Parse payload
  let payload: { sid: string; rnd: string; iat: number; exp: number; used: boolean };
  try {
    const decoded = Buffer.from(payloadB64, 'base64url').toString('utf-8');
    payload = JSON.parse(decoded);
  } catch {
    return { valid: false, error: 'Malformed token payload' };
  }

  // Check expiration
  const now = Math.floor(Date.now() / 1000);
  if (now >= payload.exp) {
    return { valid: false, error: 'Token expired' };
  }

  // Check session binding
  if (payload.sid !== expectedSessionId) {
    return { valid: false, error: 'Token bound to different session' };
  }

  return { valid: true, sessionId: payload.sid };
}

function isTokenConsumed(token: string): boolean {
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  return consumedTokens.has(hash);
}

function markTokenConsumed(token: string): void {
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  consumedTokens.set(hash, Date.now());
}

// ---------------------------------------------------------------------------
// Agent execution (mockable for testing)
// ---------------------------------------------------------------------------

export type AgentExecutor = (
  sectionName: string,
  context: Record<string, unknown>,
  signal: AbortSignal
) => Promise<Record<string, unknown>>;

export type CritiqueExecutor = (
  perspective: string,
  context: Record<string, unknown>,
  sections: Record<string, unknown>[],
  signal: AbortSignal
) => Promise<Record<string, unknown>>;

export type SynthesisExecutor = (
  context: Record<string, unknown>,
  sections: Record<string, unknown>[],
  critiques: Record<string, unknown>[],
  signal: AbortSignal
) => Promise<Record<string, unknown>>;

/**
 * Default agent executor placeholder.
 * In production this calls the real OrchestratorAgent with the prompt
 * from AGENT_PROMPT_REGISTRY. Tests inject their own via _setAgentExecutor.
 */
let agentExecutor: AgentExecutor = async (
  sectionName: string,
  context: Record<string, unknown>,
  _signal: AbortSignal
): Promise<Record<string, unknown>> => {
  // Generate the prompt (validates prompt registry wiring)
  const promptFn = AGENT_PROMPT_REGISTRY[sectionName];
  if (promptFn) {
    const promptCtx = extractPromptContext(context);
    // In production, this prompt would be sent to the LLM.
    // For now, the prompt is generated but only used for validation.
    promptFn(promptCtx);
  }

  // Placeholder: return a valid BMCSection-shaped object
  return {
    section_name: sectionName,
    content: {
      points: ['Point 1 for this section', 'Point 2 for this section'],
      reasoning: 'A'.repeat(50),
      assumptions: ['Primary assumption for this section'],
      confidence_level: 'medium',
    },
    metadata: {
      agent_name: `${sectionName}_agent`,
      tokens_used: { input: 100, output: 200 },
      latency_ms: 1500,
      timestamp: new Date().toISOString(),
    },
  };
};

/**
 * Default critique executor placeholder.
 */
let critiqueExecutor: CritiqueExecutor = async (
  perspective: string,
  context: Record<string, unknown>,
  sections: Record<string, unknown>[],
  _signal: AbortSignal
): Promise<Record<string, unknown>> => {
  const promptFn = CRITIQUE_PROMPT_REGISTRY[perspective];
  if (promptFn) {
    const promptCtx = extractPromptContext(context);
    promptFn(promptCtx, sections);
  }

  return {
    perspective,
    findings: [
      {
        category: 'Market size validation needed',
        severity: 'MEDIUM',
        description: 'A'.repeat(50),
        affected_sections: ['customer_segments'],
        recommendation: 'Conduct market research to validate TAM assumptions',
      },
    ],
    overall_assessment: 'A'.repeat(100),
    metadata: {
      agent_name: `${perspective}_agent`,
      tokens_used: { input: 300, output: 400 },
      latency_ms: 2000,
    },
  };
};

/**
 * Default synthesis executor placeholder.
 */
let synthesisExecutor: SynthesisExecutor = async (
  context: Record<string, unknown>,
  sections: Record<string, unknown>[],
  critiques: Record<string, unknown>[],
  _signal: AbortSignal
): Promise<Record<string, unknown>> => {
  const promptCtx = extractPromptContext(context);
  synthesisPrompt(promptCtx, sections, critiques);

  const canvasFields: Record<string, string> = {};
  for (const name of BMC_SECTION_NAMES) {
    canvasFields[name] = 'B'.repeat(20);
  }

  return {
    executive_summary: 'B'.repeat(100),
    canvas: canvasFields,
    critique_summary: {
      high_risk_items: ['Key risk identified'],
      medium_risk_items: ['Moderate concern noted'],
      areas_of_strength: ['Strong value proposition'],
    },
    strategic_recommendations: ['Validate core assumptions with customer interviews'],
    next_steps: ['Build MVP and test with 10 pilot customers'],
  };
};

/**
 * Build a Tier 3 fallback FinalBMC when synthesis cannot run.
 */
function buildTier3Fallback(
  sections: Record<string, unknown>[],
  critiques: Record<string, unknown>[],
  costTracker: CostTracker,
  wallClockMs: number
): Record<string, unknown> {
  const canvasFields: Record<string, string> = {};
  for (const sec of sections) {
    const s = sec as { section_name?: string; content?: { points?: string[] } };
    if (s.section_name) {
      canvasFields[s.section_name] = (s.content?.points ?? []).slice(0, 2).join('. ') || 'See detailed section.';
    }
  }
  // Fill any missing canvas fields
  for (const name of BMC_SECTION_NAMES) {
    if (!canvasFields[name]) {
      canvasFields[name] = 'Data unavailable due to time constraints.';
    }
  }

  const highRisks: string[] = [];
  const medRisks: string[] = [];
  for (const c of critiques) {
    const cr = c as { findings?: { severity?: string; category?: string }[] };
    for (const f of cr.findings ?? []) {
      if (f.severity === 'HIGH') highRisks.push(f.category ?? 'Unknown risk');
      if (f.severity === 'MEDIUM') medRisks.push(f.category ?? 'Unknown risk');
    }
  }

  const costData = costTracker.calculate();
  return {
    executive_summary: 'This business model canvas was generated with partial synthesis due to time constraints. Review each section individually for detailed analysis. ' + 'A'.repeat(30),
    canvas: canvasFields,
    critique_summary: {
      high_risk_items: highRisks.slice(0, 5),
      medium_risk_items: medRisks.slice(0, 5),
      areas_of_strength: ['Analysis completed for core BMC sections'],
    },
    strategic_recommendations: ['Review individual BMC sections for detailed recommendations'],
    next_steps: ['Validate key assumptions with market research'],
    metadata: {
      total_cost: costData.estimatedCostUSD,
      total_tokens: costData.totalInputTokens + costData.totalOutputTokens,
      wall_clock_latency_ms: wallClockMs,
      agents_executed: sections.length + critiques.length,
      agents_failed: 0,
    },
  };
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: Request): Promise<Response> {
  const t0 = performance.now();

  // 1. Session validation
  const sessionResult = validateAndRefreshSession(request);
  if (!sessionResult.valid || !sessionResult.username) {
    return Response.json(
      { error: 'Unauthorized. Please log in.', redirect: '/tools/bmc-generator/login' },
      { status: 401, headers: { 'Cache-Control': 'no-store, no-cache' } }
    );
  }

  // 2. Payload size check
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_BYTES) {
    return Response.json(
      { error: 'Request body too large.' },
      { status: 413, headers: { 'Cache-Control': 'no-store, no-cache' } }
    );
  }

  // 3. Parse request body
  let body: { session_id?: string; generation_token?: string; context?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: 'Invalid request body.' },
      { status: 400, headers: { 'Cache-Control': 'no-store, no-cache' } }
    );
  }

  const { session_id, generation_token, context } = body;

  if (!session_id || !generation_token || !context) {
    return Response.json(
      { error: 'Missing required fields: session_id, generation_token, context.' },
      { status: 400, headers: { 'Cache-Control': 'no-store, no-cache' } }
    );
  }

  // 4. Token validation
  let secret: string;
  try {
    secret = getSessionSecret();
  } catch {
    return Response.json(
      { error: 'Server configuration error.' },
      { status: 500, headers: { 'Cache-Control': 'no-store, no-cache' } }
    );
  }

  // Check if token was already used by /answers (not fresh)
  if (isTokenUsed(generation_token)) {
    return Response.json(
      { error: 'Invalid or expired generation token' },
      { status: 403, headers: { 'Cache-Control': 'no-store, no-cache' } }
    );
  }

  // Check if token was consumed by a previous /generate call
  if (isTokenConsumed(generation_token)) {
    return Response.json(
      { error: 'Invalid or expired generation token' },
      { status: 403, headers: { 'Cache-Control': 'no-store, no-cache' } }
    );
  }

  // Verify token signature, expiration, session binding
  const tokenResult = verifyGenerationToken(generation_token, session_id, secret);
  if (!tokenResult.valid) {
    return Response.json(
      { error: 'Invalid or expired generation token' },
      { status: 403, headers: { 'Cache-Control': 'no-store, no-cache' } }
    );
  }

  // 5. Concurrent generation check
  const sessionKey = sessionResult.username;
  const activeGen = activeGenerations.get(sessionKey);
  if (activeGen) {
    const elapsed = Date.now() - activeGen.startTime;
    if (elapsed < ABORT_ALL_AT_MS * 3) {
      // Still within reasonable TTL
      return Response.json(
        { error: 'Generation already in progress. Wait for previous to complete.' },
        { status: 409, headers: { 'Cache-Control': 'no-store, no-cache' } }
      );
    }
    activeGenerations.delete(sessionKey);
  }

  // Mark generation as active
  activeGenerations.set(sessionKey, { startTime: Date.now() });

  // 6. Execute 9 agents in parallel with timeout boundaries
  const agentStartTime = performance.now();
  const sections: Record<string, unknown>[] = [];
  const failedAgents: { name: string; error: string }[] = [];
  const costTracker = new CostTracker();

  // Create a global abort controller for the 45s hard abort
  const globalAbort = new AbortController();
  const globalAbortTimer = setTimeout(() => globalAbort.abort(), ABORT_ALL_AT_MS);

  try {
    const agentPromises = BMC_SECTION_NAMES.map(async (sectionName) => {
      const controller = new AbortController();

      // Cascade: if globalAbort fires, abort this agent too
      const onGlobalAbort = () => controller.abort();
      globalAbort.signal.addEventListener('abort', onGlobalAbort);

      const agentTimeout = setTimeout(() => controller.abort(), AGENT_TIMEOUT_MS);

      try {
        const result = await Promise.race([
          agentExecutor(sectionName, context, controller.signal),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Agent timeout')), AGENT_TIMEOUT_MS)
          ),
        ]);

        clearTimeout(agentTimeout);
        globalAbort.signal.removeEventListener('abort', onGlobalAbort);

        // Check 40s skip boundary
        const elapsedSinceStart = performance.now() - agentStartTime;
        if (elapsedSinceStart > SKIP_REMAINING_AT_MS) {
          failedAgents.push({ name: sectionName, error: 'Skipped: exceeded 40s mark' });
          return null;
        }

        // Validate agent output with Zod
        const parsed = BMCSectionSchema.safeParse(result);
        if (!parsed.success) {
          failedAgents.push({
            name: sectionName,
            error: `Zod validation failed: ${parsed.error.message}`,
          });
          return null;
        }

        // Record cost for this agent
        const meta = parsed.data.metadata;
        costTracker.record(2, sectionName, meta.tokens_used.input, meta.tokens_used.output);

        // Emit SSE progress event
        const completedCount = sections.length + 1;
        sseEmitter(session_id, {
          phase: 2,
          activeAgent: sectionName,
          progress: completedCount / BMC_SECTION_NAMES.length,
          elapsedMs: Math.round(performance.now() - t0),
          timestamp: new Date().toISOString(),
        });

        return parsed.data;
      } catch (err) {
        clearTimeout(agentTimeout);
        globalAbort.signal.removeEventListener('abort', onGlobalAbort);
        failedAgents.push({
          name: sectionName,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
        return null;
      }
    });

    // Use Promise.allSettled for independent failure tracking
    const results = await Promise.allSettled(agentPromises);

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value !== null) {
        sections.push(result.value as Record<string, unknown>);
      }
    }
  } finally {
    clearTimeout(globalAbortTimer);
    // Clean up active generation
    activeGenerations.delete(sessionKey);
    markGenerationComplete(session_id);
  }

  // 7. Evaluate success threshold
  const successCount = sections.length;
  const wallClockMs = Math.round(performance.now() - t0);
  const costData = costTracker.calculate();

  if (successCount >= MIN_AGENTS_FOR_SUCCESS) {
    // Mark token as consumed after successful Phase 2
    markTokenConsumed(generation_token);

    // -----------------------------------------------------------------------
    // Phase 3: Critique agents (parallel, best-effort)
    // -----------------------------------------------------------------------
    const critiqueNames = ['market_feasibility', 'business_model', 'competitive_positioning'] as const;
    const critiques: Record<string, unknown>[] = [];
    const failedCritiques: { name: string; error: string }[] = [];

    const timeRemainingForPhase3 = _forcePhase3TimeRemaining ?? (TOTAL_WALL_CLOCK_LIMIT_MS - (performance.now() - t0));

    if (timeRemainingForPhase3 >= PHASE3_MIN_TIME_REMAINING_MS) {
      const critiqueStartTime = performance.now();

      const critiquePromises = critiqueNames.map(async (perspective) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), CRITIQUE_TIMEOUT_MS);

        try {
          const result = await Promise.race([
            critiqueExecutor(perspective, context, sections, controller.signal),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Critique timeout')), CRITIQUE_TIMEOUT_MS)
            ),
          ]);

          clearTimeout(timeout);

          // Check 20s skip boundary
          const critiqueElapsed = performance.now() - critiqueStartTime;
          if (critiqueElapsed > CRITIQUE_SKIP_AT_MS) {
            failedCritiques.push({ name: perspective, error: 'Skipped: exceeded 20s mark' });
            return null;
          }

          // Validate with Zod
          const parsed = CritiqueOutputSchema.safeParse(result);
          if (!parsed.success) {
            failedCritiques.push({
              name: perspective,
              error: `Zod validation failed: ${parsed.error.message}`,
            });
            return null;
          }

          // Record cost
          const meta = parsed.data.metadata;
          costTracker.record(3, perspective, meta.tokens_used.input, meta.tokens_used.output);

          sseEmitter(session_id, {
            phase: 3,
            activeAgent: perspective,
            progress: (critiques.length + 1) / critiqueNames.length,
            elapsedMs: Math.round(performance.now() - t0),
            timestamp: new Date().toISOString(),
          });

          return parsed.data;
        } catch (err) {
          clearTimeout(timeout);
          failedCritiques.push({
            name: perspective,
            error: err instanceof Error ? err.message : 'Unknown error',
          });
          return null;
        }
      });

      const critiqueResults = await Promise.allSettled(critiquePromises);
      for (const result of critiqueResults) {
        if (result.status === 'fulfilled' && result.value !== null) {
          critiques.push(result.value as Record<string, unknown>);
        }
      }

      console.info(
        JSON.stringify({
          event: 'bmc.generate.phase3.ok',
          sessionId: session_id,
          critiqueCount: critiques.length,
          failedCritiques: failedCritiques.length,
        })
      );
    } else {
      console.info(
        JSON.stringify({
          event: 'bmc.generate.phase3.skipped',
          sessionId: session_id,
          reason: 'insufficient_time',
          timeRemainingMs: Math.round(timeRemainingForPhase3),
        })
      );
    }

    // -----------------------------------------------------------------------
    // Phase 4: Synthesis
    // -----------------------------------------------------------------------
    let finalBmc: Record<string, unknown> | null = null;
    let synthesisStatus: 'complete' | 'partial' | 'fallback' = 'fallback';

    const timeRemainingForPhase4 = _forcePhase4TimeRemaining ?? (TOTAL_WALL_CLOCK_LIMIT_MS - (performance.now() - t0));

    if (timeRemainingForPhase4 >= SYNTHESIS_MIN_TIME_REMAINING_MS) {
      const synthController = new AbortController();
      const synthTimeout = setTimeout(() => synthController.abort(), SYNTHESIS_TIMEOUT_MS);

      try {
        const synthResult = await Promise.race([
          synthesisExecutor(context, sections, critiques, synthController.signal),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Synthesis timeout')), SYNTHESIS_TIMEOUT_MS)
          ),
        ]);

        clearTimeout(synthTimeout);

        // Inject metadata before validation
        const synthWithMeta = {
          ...synthResult,
          metadata: {
            total_cost: costTracker.calculate().estimatedCostUSD,
            total_tokens: costTracker.calculate().totalInputTokens + costTracker.calculate().totalOutputTokens,
            wall_clock_latency_ms: Math.round(performance.now() - t0),
            agents_executed: successCount + critiques.length + 1,
            agents_failed: failedAgents.length + failedCritiques.length,
          },
        };

        const parsed = FinalBMCSchema.safeParse(synthWithMeta);
        if (parsed.success) {
          finalBmc = parsed.data;
          synthesisStatus = critiques.length === 3 ? 'complete' : 'partial';

          costTracker.record(4, 'synthesis', 500, 800);

          sseEmitter(session_id, {
            phase: 4,
            activeAgent: 'synthesis',
            progress: 1,
            elapsedMs: Math.round(performance.now() - t0),
            timestamp: new Date().toISOString(),
          });
        } else {
          console.info(
            JSON.stringify({
              event: 'bmc.generate.phase4.validation_failed',
              sessionId: session_id,
              error: parsed.error.message,
            })
          );
        }
      } catch (err) {
        clearTimeout(synthTimeout);
        console.info(
          JSON.stringify({
            event: 'bmc.generate.phase4.error',
            sessionId: session_id,
            error: err instanceof Error ? err.message : 'Unknown error',
          })
        );
      }
    }

    // Use Tier 3 fallback if synthesis failed or was skipped
    if (!finalBmc) {
      const fallbackWallClock = Math.round(performance.now() - t0);
      finalBmc = buildTier3Fallback(sections, critiques, costTracker, fallbackWallClock);
      synthesisStatus = 'fallback';
    }

    const finalWallClockMs = Math.round(performance.now() - t0);
    const finalCostData = costTracker.calculate();

    const refreshedCookie = buildSessionCookie(sessionResult.refreshedToken!);

    console.info(
      JSON.stringify({
        event: 'bmc.generate.complete',
        sessionId: session_id,
        status: synthesisStatus,
        phase2SuccessCount: successCount,
        critiqueCount: critiques.length,
        wallClockMs: finalWallClockMs,
        costUSD: finalCostData.estimatedCostUSD,
      })
    );

    return new Response(
      JSON.stringify({
        session_id,
        status: synthesisStatus,
        final_bmc: finalBmc,
        sections,
        critiques,
        failed_agents: failedAgents,
        failed_critiques: failedCritiques,
        success_count: successCount,
        total_agents: BMC_SECTION_NAMES.length,
        wallClockMs: finalWallClockMs,
        cost: finalCostData.estimatedCostUSD,
        error: null,
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

  // <6 agents succeeded: return 500
  console.error(
    JSON.stringify({
      event: 'bmc.generate.phase2.failed',
      sessionId: session_id,
      successCount,
      failedAgents,
      wallClockMs,
    })
  );

  return Response.json(
    {
      session_id,
      status: 'failed',
      sections,
      failed_agents: failedAgents,
      success_count: successCount,
      total_agents: BMC_SECTION_NAMES.length,
      wallClockMs,
      cost: costData.estimatedCostUSD,
      error: `Only ${successCount}/${BMC_SECTION_NAMES.length} agents completed. Minimum ${MIN_AGENTS_FOR_SUCCESS} required.`,
    },
    { status: 500, headers: { 'Cache-Control': 'no-store, no-cache' } }
  );
}

// ---------------------------------------------------------------------------
// Test-only exports
// ---------------------------------------------------------------------------

export function _resetState(): void {
  activeGenerations.clear();
  consumedTokens.clear();
  _forcePhase3TimeRemaining = null;
  _forcePhase4TimeRemaining = null;
}

export function _setAgentExecutor(executor: AgentExecutor): void {
  agentExecutor = executor;
}

export function _setCritiqueExecutor(executor: CritiqueExecutor): void {
  critiqueExecutor = executor;
}

export function _setSynthesisExecutor(executor: SynthesisExecutor): void {
  synthesisExecutor = executor;
}

export function _setSseEmitter(
  emitter: (sessionId: string, event: Record<string, unknown>) => void
): void {
  sseEmitter = emitter;
}

/**
 * Test-only: override time remaining for Phase 3/4 threshold checks.
 * When set to a number, the route uses this value instead of computing
 * from performance.now(). Reset to null to restore normal behavior.
 */
let _forcePhase3TimeRemaining: number | null = null;
let _forcePhase4TimeRemaining: number | null = null;

export function _setForcePhase3TimeRemaining(ms: number | null): void {
  _forcePhase3TimeRemaining = ms;
}

export function _setForcePhase4TimeRemaining(ms: number | null): void {
  _forcePhase4TimeRemaining = ms;
}

export const _testInternals = {
  activeGenerations,
  consumedTokens,
  BMC_SECTION_NAMES,
  AGENT_TIMEOUT_MS,
  SKIP_REMAINING_AT_MS,
  ABORT_ALL_AT_MS,
  MIN_AGENTS_FOR_SUCCESS,
  CRITIQUE_TIMEOUT_MS,
  CRITIQUE_SKIP_AT_MS,
  SYNTHESIS_TIMEOUT_MS,
  PHASE3_MIN_TIME_REMAINING_MS,
  SYNTHESIS_MIN_TIME_REMAINING_MS,
  TOTAL_WALL_CLOCK_LIMIT_MS,
};
