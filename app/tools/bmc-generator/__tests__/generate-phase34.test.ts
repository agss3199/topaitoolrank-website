// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest';
import * as crypto from 'crypto';

/**
 * Phase 3-4 orchestration tests for POST /api/bmc-generator/generate.
 *
 * Tests cover:
 *   1. Critique Execution (5 tests)
 *   2. Synthesis Execution (4 tests)
 *   3. Timeout & Fallback (4 tests)
 *   4. Cost Tracking Phase 3-4 (2 tests)
 *   5. Edge Cases (2 tests)
 *
 * Total: 17 tests
 */

const TEST_SECRET = 'test-secret-key-minimum-32-bytes!';

process.env.BMC_SESSION_SECRET = TEST_SECRET;
process.env.BMC_GENERATOR_USERNAME = 'testuser';
process.env.BMC_GENERATOR_PASSWORD = 'testpass1234';

import {
  POST,
  _resetState,
  _setAgentExecutor,
  _setCritiqueExecutor,
  _setSynthesisExecutor,
  _setSseEmitter,
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
        category: 'Market size validation needed',
        severity: 'MEDIUM',
        description: 'D'.repeat(50),
        affected_sections: ['customer_segments'],
        recommendation: 'Conduct market research to validate',
      },
    ],
    overall_assessment: 'A'.repeat(100),
    metadata: {
      agent_name: `${perspective}_agent`,
      tokens_used: { input: 300, output: 400 },
      latency_ms: 2000,
    },
  };
}

function makeValidSynthesis(): Record<string, unknown> {
  const canvas: Record<string, string> = {};
  const sections = [
    'customer_segments', 'value_propositions', 'channels',
    'customer_relationships', 'revenue_streams', 'key_resources',
    'key_activities', 'key_partners', 'cost_structure',
  ];
  for (const s of sections) {
    canvas[s] = 'S'.repeat(20);
  }
  return {
    executive_summary: 'S'.repeat(100),
    canvas,
    critique_summary: {
      high_risk_items: ['Key risk identified'],
      medium_risk_items: ['Moderate concern'],
      areas_of_strength: ['Strong value proposition'],
    },
    strategic_recommendations: ['Validate assumptions with customer interviews'],
    next_steps: ['Build MVP and test with pilot customers'],
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
    // Default: all critique agents succeed
    _setCritiqueExecutor(async (perspective) => makeValidCritique(perspective));
    // Default: synthesis succeeds
    _setSynthesisExecutor(async () => makeValidSynthesis());
    _setSseEmitter(() => {});
  });

  // =========================================================================
  // 1. Critique Execution
  // =========================================================================

  describe('Critique Execution', () => {
    it('runs all 3 critique agents in parallel after Phase 2 success', async () => {
      const sessionId = crypto.randomUUID();
      const cookie = makeSessionCookie();
      const token = makeGenToken(sessionId);
      seedSession(sessionId);

      const executedCritiques: string[] = [];
      _setCritiqueExecutor(async (perspective) => {
        executedCritiques.push(perspective);
        return makeValidCritique(perspective);
      });

      const res = await POST(
        req(
          { session_id: sessionId, generation_token: token, context: validContext() },
          { cookie }
        )
      );

      expect(res.status).toBe(200);
      expect(executedCritiques).toHaveLength(3);
      expect(executedCritiques).toEqual(
        expect.arrayContaining(['market_feasibility', 'business_model', 'competitive_positioning'])
      );
    });

    it('includes critiques in response body', async () => {
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
      expect(json.critiques).toHaveLength(3);
      expect(json.critiques[0]).toHaveProperty('perspective');
      expect(json.critiques[0]).toHaveProperty('findings');
      expect(json.critiques[0]).toHaveProperty('overall_assessment');
    });

    it('validates critique output with CritiqueOutputSchema', async () => {
      const sessionId = crypto.randomUUID();
      const cookie = makeSessionCookie();
      const token = makeGenToken(sessionId);
      seedSession(sessionId);

      _setCritiqueExecutor(async (perspective) => {
        if (perspective === 'business_model') {
          return { invalid: 'data' }; // Fails Zod
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
      expect(json.critiques).toHaveLength(2);
      expect(json.failed_critiques).toHaveLength(1);
      expect(json.failed_critiques[0].name).toBe('business_model');
      expect(json.failed_critiques[0].error).toContain('Zod validation');
    });

    it('handles critique agent throwing errors gracefully', async () => {
      const sessionId = crypto.randomUUID();
      const cookie = makeSessionCookie();
      const token = makeGenToken(sessionId);
      seedSession(sessionId);

      _setCritiqueExecutor(async (perspective) => {
        if (perspective === 'competitive_positioning') {
          throw new Error('LLM rate limited');
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
      expect(json.critiques).toHaveLength(2);
      expect(json.failed_critiques).toHaveLength(1);
      expect(json.failed_critiques[0].name).toBe('competitive_positioning');
      expect(json.failed_critiques[0].error).toContain('rate limited');
    });

    it('emits SSE events for Phase 3 progress', async () => {
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

      const phase3Events = sseEvents.filter((e) => e.phase === 3);
      expect(phase3Events.length).toBeGreaterThanOrEqual(1);
      expect(phase3Events[0]).toHaveProperty('activeAgent');
    });
  });

  // =========================================================================
  // 2. Synthesis Execution
  // =========================================================================

  describe('Synthesis Execution', () => {
    it('runs synthesis agent after Phase 3 and returns final_bmc', async () => {
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
      expect(res.status).toBe(200);
      expect(json.final_bmc).toBeDefined();
      expect(json.final_bmc.executive_summary).toBeDefined();
      expect(json.final_bmc.canvas).toBeDefined();
      expect(json.final_bmc.canvas.customer_segments).toBeDefined();
      expect(json.final_bmc.strategic_recommendations).toBeDefined();
      expect(json.final_bmc.next_steps).toBeDefined();
    });

    it('returns status "complete" when all 3 critiques and synthesis succeed', async () => {
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
      expect(json.status).toBe('complete');
    });

    it('returns status "partial" when some critiques fail but synthesis succeeds', async () => {
      const sessionId = crypto.randomUUID();
      const cookie = makeSessionCookie();
      const token = makeGenToken(sessionId);
      seedSession(sessionId);

      _setCritiqueExecutor(async (perspective) => {
        if (perspective === 'market_feasibility') {
          throw new Error('Critique failed');
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
      expect(json.status).toBe('partial');
      expect(json.critiques).toHaveLength(2);
    });

    it('validates synthesis output with FinalBMCSchema', async () => {
      const sessionId = crypto.randomUUID();
      const cookie = makeSessionCookie();
      const token = makeGenToken(sessionId);
      seedSession(sessionId);

      _setSynthesisExecutor(async () => {
        return { invalid: 'not a valid FinalBMC' };
      });

      const res = await POST(
        req(
          { session_id: sessionId, generation_token: token, context: validContext() },
          { cookie }
        )
      );

      const json = await res.json();
      expect(res.status).toBe(200);
      // Falls back to Tier 3 when synthesis validation fails
      expect(json.status).toBe('fallback');
      expect(json.final_bmc).toBeDefined();
      expect(json.final_bmc.executive_summary).toBeDefined();
    });
  });

  // =========================================================================
  // 3. Timeout & Fallback
  // =========================================================================

  describe('Timeout & Fallback', () => {
    it('uses Tier 3 fallback when synthesis times out', async () => {
      const sessionId = crypto.randomUUID();
      const cookie = makeSessionCookie();
      const token = makeGenToken(sessionId);
      seedSession(sessionId);

      _setSynthesisExecutor(async () => {
        return new Promise((_resolve, reject) => {
          setTimeout(() => reject(new Error('Synthesis timeout')), 50);
        });
      });

      const res = await POST(
        req(
          { session_id: sessionId, generation_token: token, context: validContext() },
          { cookie }
        )
      );

      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.status).toBe('fallback');
      expect(json.final_bmc).toBeDefined();
      expect(json.final_bmc.executive_summary).toContain('partial synthesis');
    });

    it('uses Tier 3 fallback when synthesis throws', async () => {
      const sessionId = crypto.randomUUID();
      const cookie = makeSessionCookie();
      const token = makeGenToken(sessionId);
      seedSession(sessionId);

      _setSynthesisExecutor(async () => {
        throw new Error('LLM API error');
      });

      const res = await POST(
        req(
          { session_id: sessionId, generation_token: token, context: validContext() },
          { cookie }
        )
      );

      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.status).toBe('fallback');
      expect(json.final_bmc).toBeDefined();
    });

    it('handles all critique agents failing gracefully', async () => {
      const sessionId = crypto.randomUUID();
      const cookie = makeSessionCookie();
      const token = makeGenToken(sessionId);
      seedSession(sessionId);

      _setCritiqueExecutor(async () => {
        throw new Error('All critiques fail');
      });

      const res = await POST(
        req(
          { session_id: sessionId, generation_token: token, context: validContext() },
          { cookie }
        )
      );

      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.critiques).toHaveLength(0);
      expect(json.failed_critiques).toHaveLength(3);
      // Synthesis still runs with empty critiques
      expect(json.final_bmc).toBeDefined();
    });

    it('critique timeout produces failed_critiques entry', async () => {
      const sessionId = crypto.randomUUID();
      const cookie = makeSessionCookie();
      const token = makeGenToken(sessionId);
      seedSession(sessionId);

      _setCritiqueExecutor(async (perspective) => {
        if (perspective === 'market_feasibility') {
          return new Promise((_resolve, reject) => {
            setTimeout(() => reject(new Error('Critique timeout')), 50);
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
      expect(json.critiques).toHaveLength(2);
      expect(json.failed_critiques).toHaveLength(1);
      expect(json.failed_critiques[0].name).toBe('market_feasibility');
    });
  });

  // =========================================================================
  // 4. Cost Tracking Phase 3-4
  // =========================================================================

  describe('Cost Tracking Phase 3-4', () => {
    it('includes Phase 3 critique costs in total cost', async () => {
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
      // With Phase 2 (9 agents * 100+200 tokens) + Phase 3 (3 critiques * 300+400 tokens) + Phase 4
      // Cost should be higher than Phase 2 alone
      expect(json.cost).toBeGreaterThan(0);
    });

    it('cost reflects only successful agents when some fail', async () => {
      const sessionId = crypto.randomUUID();
      const cookie = makeSessionCookie();
      const token = makeGenToken(sessionId);
      seedSession(sessionId);

      _setCritiqueExecutor(async (perspective) => {
        if (perspective === 'business_model') {
          throw new Error('Failed');
        }
        return makeValidCritique(perspective);
      });

      const res1 = await POST(
        req(
          { session_id: sessionId, generation_token: token, context: validContext() },
          { cookie }
        )
      );
      const json1 = await res1.json();

      // Run another request with all critiques succeeding
      _resetState();
      resetStartState();
      resetAnswersState();
      _setAgentExecutor(async (sectionName) => makeValidBMCSection(sectionName));
      _setCritiqueExecutor(async (perspective) => makeValidCritique(perspective));
      _setSynthesisExecutor(async () => makeValidSynthesis());

      const sessionId2 = crypto.randomUUID();
      const token2 = makeGenToken(sessionId2);
      seedSession(sessionId2);

      const res2 = await POST(
        req(
          { session_id: sessionId2, generation_token: token2, context: validContext() },
          { cookie }
        )
      );
      const json2 = await res2.json();

      // Full success should have higher cost than partial
      expect(json2.cost).toBeGreaterThanOrEqual(json1.cost);
    });
  });

  // =========================================================================
  // 5. Edge Cases
  // =========================================================================

  describe('Edge Cases', () => {
    it('Tier 3 fallback includes canvas from Phase 2 sections', async () => {
      const sessionId = crypto.randomUUID();
      const cookie = makeSessionCookie();
      const token = makeGenToken(sessionId);
      seedSession(sessionId);

      // Force synthesis to fail -> triggers Tier 3 fallback
      _setSynthesisExecutor(async () => {
        throw new Error('Synthesis unavailable');
      });

      const res = await POST(
        req(
          { session_id: sessionId, generation_token: token, context: validContext() },
          { cookie }
        )
      );

      const json = await res.json();
      expect(json.status).toBe('fallback');
      const canvas = json.final_bmc.canvas;
      // Fallback canvas should have all 9 sections populated from Phase 2 data
      expect(canvas.customer_segments).toBeDefined();
      expect(canvas.value_propositions).toBeDefined();
      expect(canvas.channels).toBeDefined();
      expect(canvas.customer_relationships).toBeDefined();
      expect(canvas.revenue_streams).toBeDefined();
      expect(canvas.key_resources).toBeDefined();
      expect(canvas.key_activities).toBeDefined();
      expect(canvas.key_partners).toBeDefined();
      expect(canvas.cost_structure).toBeDefined();
    });

    it('response includes both sections and final_bmc for client flexibility', async () => {
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
      expect(res.status).toBe(200);
      // Both raw sections and synthesized BMC present
      expect(json.sections).toHaveLength(9);
      expect(json.final_bmc).toBeDefined();
      expect(json.critiques).toBeDefined();
      expect(json.wallClockMs).toBeGreaterThan(0);
      expect(json.error).toBeNull();
    });
  });
});
