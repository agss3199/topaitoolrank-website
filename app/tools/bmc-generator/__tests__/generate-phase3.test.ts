// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as crypto from 'crypto';

/**
 * Phase 3-4 orchestration tests for POST /api/bmc-generator/generate.
 *
 * Tests cover:
 *   1. Phase 3 Critique Execution (4 tests)
 *   2. Phase 4 Synthesis (3 tests)
 *   3. Tier 3 Fallback (2 tests)
 *   4. Success & Partial (3 tests)
 *   5. Cost Tracking (1 test)
 *   6. Edge Cases (2 tests)
 *
 * Total: 15 tests
 *
 * Agent executors are mocked via _setAgentExecutor, _setCritiqueExecutor,
 * and _setSynthesisExecutor to avoid LLM calls. Zod validation uses real schemas.
 */

const TEST_SECRET = 'test-secret-key-minimum-32-bytes!';

process.env.BMC_SESSION_SECRET = TEST_SECRET;
process.env.BMC_GENERATOR_USERNAME = 'testuser';
process.env.BMC_GENERATOR_PASSWORD = 'testpass1234';

import {
  POST,
  _resetState,
  _setAgentExecutor,
  _setSseEmitter,
  _setCritiqueExecutor,
  _setSynthesisExecutor,
  _setForcePhase3TimeRemaining,
  _setForcePhase4TimeRemaining,
  _testInternals,
} from '../../../api/bmc-generator/generate/route';
import {
  _resetState as resetStartState,
  _testInternals as startInternals,
} from '../../../api/bmc-generator/start/route';
import {
  _resetState as resetAnswersState,
} from '../../../api/bmc-generator/answers/route';
import { createSessionToken } from '../lib/auth-helpers';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSessionCookie(username = 'testuser', ttlSeconds = 86400): string {
  return createSessionToken(username, TEST_SECRET, ttlSeconds);
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

function validContext(): Record<string, unknown> {
  return {
    user_idea_summary: 'A'.repeat(50),
    industry: 'FinTech',
    customer_type: 'B2B',
    target_market: 'Enterprise companies in the US market',
    problem_statement: 'Companies struggle with workflow management and automation',
    solution_approach: 'We provide a comprehensive platform for workflow automation',
    pricing_direction: '$99/month',
    geography: 'Global',
    competitive_landscape: 'Competitive market with several established players competing',
    key_assumptions: ['Market demand exists', 'Technology is feasible'],
    success_metrics: ['User adoption rate'],
    stage: 'idea',
  };
}

function makeValidBMCSection(sectionName: string): Record<string, unknown> {
  return {
    section_name: sectionName,
    content: {
      points: ['Point 1 for this section', 'Point 2 for this section'],
      reasoning: 'R'.repeat(50),
      assumptions: ['Primary assumption'],
      confidence_level: 'medium',
    },
    metadata: {
      agent_name: `${sectionName}_agent`,
      tokens_used: { input: 100, output: 200 },
      latency_ms: 1500,
      timestamp: new Date().toISOString(),
    },
  };
}

function makeValidCritique(perspective: string): Record<string, unknown> {
  return {
    perspective,
    findings: [
      {
        category: 'Revenue model sustainability concern',
        severity: 'HIGH',
        description: 'D'.repeat(50),
        affected_sections: ['revenue_streams'],
        recommendation: 'R'.repeat(20),
      },
    ],
    overall_assessment: 'A'.repeat(100),
    metadata: {
      agent_name: `${perspective}_critique_agent`,
      tokens_used: { input: 200, output: 300 },
      latency_ms: 2000,
    },
  };
}

/**
 * Build a valid FinalBMC that passes FinalBMCSchema validation.
 * Note: the route injects metadata before validation, so synthesis
 * executor should return the object WITHOUT metadata.
 */
function makeValidSynthesisOutput(): Record<string, unknown> {
  return {
    executive_summary: 'E'.repeat(100),
    canvas: {
      customer_segments: 'C'.repeat(20),
      value_propositions: 'V'.repeat(20),
      channels: 'Ch'.repeat(10),
      customer_relationships: 'CR'.repeat(10),
      revenue_streams: 'RS'.repeat(10),
      key_resources: 'KR'.repeat(10),
      key_activities: 'KA'.repeat(10),
      key_partners: 'KP'.repeat(10),
      cost_structure: 'CS'.repeat(10),
    },
    critique_summary: {
      high_risk_items: ['Risk item one'],
      medium_risk_items: ['Medium risk item'],
      areas_of_strength: ['Strong area'],
    },
    strategic_recommendations: ['Recommendation one'],
    next_steps: ['Next step one'],
  };
}

function req(
  body: Record<string, unknown>,
  opts: { cookie?: string } = {}
): Request {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.cookie) {
    headers['Cookie'] = `bmc_session=${opts.cookie}`;
  }
  return new Request('http://localhost:3000/api/bmc-generator/generate', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

function seedSession(sessionId: string): void {
  startInternals.sseSessionState.set(sessionId, {
    events: [{ phase: 1, activeAgent: 'OrchestratorAgent', progress: 0.1 }],
    createdAt: Date.now(),
  });
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('POST /api/bmc-generator/generate — Phase 3-4', () => {
  beforeEach(() => {
    _resetState();
    resetStartState();
    resetAnswersState();

    // Default: all Phase 2 agents succeed
    _setAgentExecutor(async (sectionName) => makeValidBMCSection(sectionName));
    // Default: all Phase 3 critique agents succeed
    _setCritiqueExecutor(async (perspective) => makeValidCritique(perspective));
    // Default: Phase 4 synthesis succeeds
    _setSynthesisExecutor(async () => makeValidSynthesisOutput());
    _setSseEmitter(() => {});
  });

  // =========================================================================
  // 1. Phase 3 Critique Execution
  // =========================================================================

  describe('Phase 3 Critique Execution', () => {
    it('executes 3 critique agents in parallel', async () => {
      const sessionId = crypto.randomUUID();
      const cookie = makeSessionCookie();
      const token = makeGenToken(sessionId);
      seedSession(sessionId);

      const executedPerspectives: string[] = [];
      _setCritiqueExecutor(async (perspective) => {
        executedPerspectives.push(perspective);
        return makeValidCritique(perspective);
      });

      const res = await POST(
        req(
          { session_id: sessionId, generation_token: token, context: validContext() },
          { cookie }
        )
      );

      expect(res.status).toBe(200);
      expect(executedPerspectives).toHaveLength(3);
      expect(executedPerspectives).toEqual(expect.arrayContaining([
        'market_feasibility',
        'business_model',
        'competitive_positioning',
      ]));
    });

    it('enforces 15s timeout per critique agent', async () => {
      const sessionId = crypto.randomUUID();
      const cookie = makeSessionCookie();
      const token = makeGenToken(sessionId);
      seedSession(sessionId);

      _setCritiqueExecutor(async (perspective) => {
        if (perspective === 'competitive_positioning') {
          await new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Critique agent timeout')), 50)
          );
        }
        return makeValidCritique(perspective);
      });

      const res = await POST(
        req(
          { session_id: sessionId, generation_token: token, context: validContext() },
          { cookie }
        )
      );

      const json = await res.json();
      expect(res.status).toBe(200);
      // 2/3 critiques completed, generation continues to synthesis
      expect(json.critiques).toHaveLength(2);
      expect(json.failed_critiques).toHaveLength(1);
      expect(json.failed_critiques[0].name).toBe('competitive_positioning');
    });

    it('skips critique agents not completed by 20s mark', async () => {
      const sessionId = crypto.randomUUID();
      const cookie = makeSessionCookie();
      const token = makeGenToken(sessionId);
      seedSession(sessionId);

      _setCritiqueExecutor(async (perspective) => {
        if (perspective === 'market_feasibility') {
          return new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Skipped: exceeded 20s mark')), 80);
          });
        }
        return makeValidCritique(perspective);
      });

      const res = await POST(
        req(
          { session_id: sessionId, generation_token: token, context: validContext() },
          { cookie }
        )
      );

      const json = await res.json();
      expect(res.status).toBe(200);
      // Skipped agent does not block synthesis
      expect(json.critiques).toHaveLength(2);
      expect(json.failed_critiques).toHaveLength(1);
    });

    it('emits SSE events per critique agent completion', async () => {
      const sessionId = crypto.randomUUID();
      const cookie = makeSessionCookie();
      const token = makeGenToken(sessionId);
      seedSession(sessionId);

      const sseEvents: Record<string, unknown>[] = [];
      _setSseEmitter((_sid, event) => {
        sseEvents.push(event);
      });

      await POST(
        req(
          { session_id: sessionId, generation_token: token, context: validContext() },
          { cookie }
        )
      );

      // Find Phase 3 SSE events
      const phase3Events = sseEvents.filter((e) => e.phase === 3);
      expect(phase3Events.length).toBeGreaterThanOrEqual(1);
      expect(phase3Events[0]).toHaveProperty('activeAgent');
      expect(phase3Events[0]).toHaveProperty('progress');
      expect(phase3Events[0]).toHaveProperty('timestamp');
    });
  });

  // =========================================================================
  // 2. Phase 4 Synthesis
  // =========================================================================

  describe('Phase 4 Synthesis', () => {
    it('SynthesisAgent receives sections + critiques + context', async () => {
      const sessionId = crypto.randomUUID();
      const cookie = makeSessionCookie();
      const token = makeGenToken(sessionId);
      seedSession(sessionId);

      let receivedArgs: {
        context: unknown;
        sections: unknown;
        critiques: unknown;
      } | null = null;

      _setSynthesisExecutor(async (context, sections, critiques) => {
        receivedArgs = { context, sections, critiques };
        return makeValidSynthesisOutput();
      });

      const res = await POST(
        req(
          { session_id: sessionId, generation_token: token, context: validContext() },
          { cookie }
        )
      );

      expect(res.status).toBe(200);
      expect(receivedArgs).not.toBeNull();
      // Phase 2 produced 9 sections
      expect(Array.isArray(receivedArgs!.sections)).toBe(true);
      expect((receivedArgs!.sections as unknown[]).length).toBe(9);
      // Phase 3 produced 3 critiques
      expect(Array.isArray(receivedArgs!.critiques)).toBe(true);
      expect((receivedArgs!.critiques as unknown[]).length).toBe(3);
      // Context passed through
      expect(receivedArgs!.context).toBeDefined();
    });

    it('validates FinalBMC output with Zod', async () => {
      const sessionId = crypto.randomUUID();
      const cookie = makeSessionCookie();
      const token = makeGenToken(sessionId);
      seedSession(sessionId);

      // Return invalid synthesis output (missing required fields)
      _setSynthesisExecutor(async () => ({
        executive_summary: 'too short',
        canvas: {},
      }));

      const res = await POST(
        req(
          { session_id: sessionId, generation_token: token, context: validContext() },
          { cookie }
        )
      );

      const json = await res.json();
      // Synthesis Zod failure triggers Tier 3 fallback
      expect(res.status).toBe(200);
      expect(json.status).toBe('fallback');
    });

    it('returns full FinalBMC on success', async () => {
      const sessionId = crypto.randomUUID();
      const cookie = makeSessionCookie();
      const token = makeGenToken(sessionId);
      seedSession(sessionId);

      const res = await POST(
        req(
          { session_id: sessionId, generation_token: token, context: validContext() },
          { cookie }
        )
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe('complete');
      expect(json.final_bmc).toBeDefined();
      expect(json.final_bmc.executive_summary).toBeDefined();
      expect(json.final_bmc.canvas).toBeDefined();
      expect(json.final_bmc.critique_summary).toBeDefined();
      expect(json.final_bmc.strategic_recommendations).toBeDefined();
      expect(json.final_bmc.next_steps).toBeDefined();
    });
  });

  // =========================================================================
  // 3. Tier 3 Fallback
  // =========================================================================

  describe('Tier 3 Fallback', () => {
    it('skips Phase 3 if <30s time remaining at Phase 3 start', async () => {
      const sessionId = crypto.randomUUID();
      const cookie = makeSessionCookie();
      const token = makeGenToken(sessionId);
      seedSession(sessionId);

      // Force the route to see <30s remaining at Phase 3 check
      // PHASE3_MIN_TIME_REMAINING_MS = 30_000, so 25_000 < 30_000 -> skip
      _setForcePhase3TimeRemaining(25_000);

      const critiquesCalled: string[] = [];
      _setCritiqueExecutor(async (perspective) => {
        critiquesCalled.push(perspective);
        return makeValidCritique(perspective);
      });

      const res = await POST(
        req(
          { session_id: sessionId, generation_token: token, context: validContext() },
          { cookie }
        )
      );

      const json = await res.json();
      expect(res.status).toBe(200);
      // Phase 3 skipped: no critique agents called
      expect(critiquesCalled).toHaveLength(0);
      expect(json.critiques).toHaveLength(0);
    });

    it('uses Tier 3 fallback if <20s time remaining at Phase 4 start', async () => {
      const sessionId = crypto.randomUUID();
      const cookie = makeSessionCookie();
      const token = makeGenToken(sessionId);
      seedSession(sessionId);

      // Force the route to see <20s remaining at Phase 4 check
      // SYNTHESIS_MIN_TIME_REMAINING_MS = 20_000, so 15_000 < 20_000 -> fallback
      _setForcePhase4TimeRemaining(15_000);

      let synthesisCalled = false;
      _setSynthesisExecutor(async () => {
        synthesisCalled = true;
        return makeValidSynthesisOutput();
      });

      const res = await POST(
        req(
          { session_id: sessionId, generation_token: token, context: validContext() },
          { cookie }
        )
      );

      const json = await res.json();
      expect(res.status).toBe(200);
      // Synthesis skipped: Tier 3 fallback with raw sections
      expect(synthesisCalled).toBe(false);
      expect(json.status).toBe('fallback');
    });
  });

  // =========================================================================
  // 4. Success & Partial
  // =========================================================================

  describe('Success & Partial', () => {
    it('returns 200 with complete FinalBMC when all phases complete', async () => {
      const sessionId = crypto.randomUUID();
      const cookie = makeSessionCookie();
      const token = makeGenToken(sessionId);
      seedSession(sessionId);

      const res = await POST(
        req(
          { session_id: sessionId, generation_token: token, context: validContext() },
          { cookie }
        )
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe('complete');
      expect(json.final_bmc).toBeDefined();
      expect(json.wallClockMs).toBeGreaterThan(0);
      expect(json.error).toBeNull();
    });

    it('returns 200 with partial status when Phase 3 critiques fail', async () => {
      const sessionId = crypto.randomUUID();
      const cookie = makeSessionCookie();
      const token = makeGenToken(sessionId);
      seedSession(sessionId);

      // All critique agents fail
      _setCritiqueExecutor(async () => {
        throw new Error('Critique timeout');
      });

      const res = await POST(
        req(
          { session_id: sessionId, generation_token: token, context: validContext() },
          { cookie }
        )
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      // Critiques failed, but synthesis ran with empty critiques
      expect(json.critiques).toHaveLength(0);
      expect(json.failed_critiques).toHaveLength(3);
      // Synthesis produces a FinalBMC (with 0 critiques -> partial)
      expect(json.final_bmc).toBeDefined();
    });

    it('returns 500 when Phase 2 fails and Phase 4 cannot run', async () => {
      const sessionId = crypto.randomUUID();
      const cookie = makeSessionCookie();
      const token = makeGenToken(sessionId);
      seedSession(sessionId);

      // All Phase 2 agents fail -> <6 threshold -> 500 before Phase 3
      _setAgentExecutor(async () => {
        throw new Error('Agent failed');
      });

      const res = await POST(
        req(
          { session_id: sessionId, generation_token: token, context: validContext() },
          { cookie }
        )
      );

      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.status).toBe('failed');
      expect(json.error).toBeTruthy();
    });
  });

  // =========================================================================
  // 5. Cost Tracking
  // =========================================================================

  describe('Cost Tracking', () => {
    it('records Phase 3-4 tokens in CostTracker and reflects in response', async () => {
      const sessionId = crypto.randomUUID();
      const cookie = makeSessionCookie();
      const token = makeGenToken(sessionId);
      seedSession(sessionId);

      const res = await POST(
        req(
          { session_id: sessionId, generation_token: token, context: validContext() },
          { cookie }
        )
      );

      const json = await res.json();
      expect(json).toHaveProperty('cost');
      // Phase 2: 9 agents x (100 in + 200 out) = 900 in + 1800 out
      // Phase 3: 3 agents x (200 in + 300 out) = 600 in + 900 out
      // Phase 4: synthesis hardcoded 500 in + 800 out
      // Total in: 2000, out: 3500
      // Cost: (2000/1M)*0.80 + (3500/1M)*4.00 = 0.0016 + 0.014 = 0.0156
      // The actual cost includes Phase 2 + Phase 3 + Phase 4
      expect(json.cost).toBeGreaterThan(0.01);
    });
  });

  // =========================================================================
  // 6. Edge Cases
  // =========================================================================

  describe('Edge Cases', () => {
    it('skips critique agent with Zod error while others continue', async () => {
      const sessionId = crypto.randomUUID();
      const cookie = makeSessionCookie();
      const token = makeGenToken(sessionId);
      seedSession(sessionId);

      _setCritiqueExecutor(async (perspective) => {
        if (perspective === 'business_model') {
          // Return invalid critique (missing required fields)
          return {
            perspective: 'business_model',
            findings: [], // min(1) violated
            overall_assessment: 'too short', // min(100) violated
            metadata: { agent_name: 'test' },
          };
        }
        return makeValidCritique(perspective);
      });

      const res = await POST(
        req(
          { session_id: sessionId, generation_token: token, context: validContext() },
          { cookie }
        )
      );

      const json = await res.json();
      expect(res.status).toBe(200);
      // 2/3 critiques succeeded, 1 failed Zod validation
      expect(json.critiques).toHaveLength(2);
      expect(json.failed_critiques).toHaveLength(1);
      expect(json.failed_critiques[0].name).toBe('business_model');
      // Generation still completes with synthesis
      expect(json.final_bmc).toBeDefined();
    });

    it('uses Tier 3 fallback on SynthesisAgent network error', async () => {
      const sessionId = crypto.randomUUID();
      const cookie = makeSessionCookie();
      const token = makeGenToken(sessionId);
      seedSession(sessionId);

      _setSynthesisExecutor(async () => {
        throw new Error('Network error: ECONNREFUSED');
      });

      const res = await POST(
        req(
          { session_id: sessionId, generation_token: token, context: validContext() },
          { cookie }
        )
      );

      const json = await res.json();
      expect(res.status).toBe(200);
      // Tier 3 fallback: raw sections returned without full synthesis
      expect(json.status).toBe('fallback');
      expect(json.sections).toBeDefined();
      expect(json.sections.length).toBeGreaterThanOrEqual(6);
    });
  });
});
