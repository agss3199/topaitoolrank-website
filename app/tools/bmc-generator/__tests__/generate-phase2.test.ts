// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as crypto from 'crypto';

/**
 * Phase 2 orchestration tests for POST /api/bmc-generator/generate.
 *
 * Tests cover:
 *   1. Session & Token Validation (3 tests)
 *   2. Concurrent Generation Check (1 test)
 *   3. Agent Execution (5 tests)
 *   4. Success & Partial (3 tests)
 *   5. Timeout Boundary (2 tests)
 *   6. Edge Cases (2 tests)
 *
 * OrchestratorAgent is mocked via _setAgentExecutor to avoid LLM calls.
 * Zod validation uses real schemas.
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
  _testInternals,
} from '../../../api/bmc-generator/generate/route';
import {
  _resetState as resetStartState,
  _testInternals as startInternals,
} from '../../../api/bmc-generator/start/route';
import {
  _resetState as resetAnswersState,
  _testInternals as answersInternals,
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

function makeTamperedToken(sessionId: string): string {
  const token = makeGenToken(sessionId);
  const [b64, sig] = token.split('.');
  const flipped = (sig[0] === 'A' ? 'B' : 'A') + sig.slice(1);
  return `${b64}.${flipped}`;
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

describe('POST /api/bmc-generator/generate — Phase 2', () => {
  beforeEach(() => {
    _resetState();
    resetStartState();
    resetAnswersState();

    // Default: all agents succeed with valid output
    _setAgentExecutor(async (sectionName) => makeValidBMCSection(sectionName));
    _setSseEmitter(() => {});
  });

  // =========================================================================
  // 1. Session & Token Validation
  // =========================================================================

  describe('Session & Token Validation', () => {
    it('returns 401 when session cookie is missing', async () => {
      const sessionId = crypto.randomUUID();
      const token = makeGenToken(sessionId);

      const res = await POST(
        req({ session_id: sessionId, generation_token: token, context: validContext() })
      );

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toContain('Unauthorized');
    });

    it('returns 403 when generation_token was already used by /answers', async () => {
      const sessionId = crypto.randomUUID();
      const token = makeGenToken(sessionId);
      const cookie = makeSessionCookie();
      seedSession(sessionId);

      // Simulate /answers having consumed this token
      answersInternals.markTokenUsed(token);

      const res = await POST(
        req(
          { session_id: sessionId, generation_token: token, context: validContext() },
          { cookie }
        )
      );

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toContain('generation token');
    });

    it('returns 403 when generation_token signature is tampered', async () => {
      const sessionId = crypto.randomUUID();
      const tampered = makeTamperedToken(sessionId);
      const cookie = makeSessionCookie();

      const res = await POST(
        req(
          { session_id: sessionId, generation_token: tampered, context: validContext() },
          { cookie }
        )
      );

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toContain('generation token');
    });
  });

  // =========================================================================
  // 2. Concurrent Generation Check
  // =========================================================================

  describe('Concurrent Generation Check', () => {
    it('returns 409 when another generation is in progress for this session', async () => {
      const sessionId = crypto.randomUUID();
      const cookie = makeSessionCookie();

      // Mark a generation as active for this user
      _testInternals.activeGenerations.set('testuser', {
        startTime: Date.now(),
      });

      const token = makeGenToken(sessionId);
      const res = await POST(
        req(
          { session_id: sessionId, generation_token: token, context: validContext() },
          { cookie }
        )
      );

      expect(res.status).toBe(409);
      const json = await res.json();
      expect(json.error).toContain('already in progress');
    });
  });

  // =========================================================================
  // 3. Agent Execution
  // =========================================================================

  describe('Agent Execution', () => {
    it('executes all 9 agents in parallel via Promise.allSettled', async () => {
      const sessionId = crypto.randomUUID();
      const cookie = makeSessionCookie();
      const token = makeGenToken(sessionId);
      seedSession(sessionId);

      const executedAgents: string[] = [];
      _setAgentExecutor(async (sectionName) => {
        executedAgents.push(sectionName);
        return makeValidBMCSection(sectionName);
      });

      const res = await POST(
        req(
          { session_id: sessionId, generation_token: token, context: validContext() },
          { cookie }
        )
      );

      expect(res.status).toBe(200);
      expect(executedAgents).toHaveLength(9);
      expect(executedAgents).toEqual(expect.arrayContaining([
        'customer_segments',
        'value_propositions',
        'channels',
        'customer_relationships',
        'revenue_streams',
        'key_resources',
        'key_activities',
        'key_partners',
        'cost_structure',
      ]));
    });

    it('enforces 30s timeout per agent', async () => {
      const sessionId = crypto.randomUUID();
      const cookie = makeSessionCookie();
      const token = makeGenToken(sessionId);
      seedSession(sessionId);

      // One agent takes longer than 30s (simulated with a delay > AGENT_TIMEOUT_MS)
      _setAgentExecutor(async (sectionName) => {
        if (sectionName === 'cost_structure') {
          // Simulate timeout by creating a promise that never resolves before abort
          await new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Agent timeout')), 50)
          );
        }
        return makeValidBMCSection(sectionName);
      });

      const res = await POST(
        req(
          { session_id: sessionId, generation_token: token, context: validContext() },
          { cookie }
        )
      );

      const json = await res.json();
      // 8 agents should succeed, 1 failed -> still >=6
      expect(res.status).toBe(200);
      expect(json.success_count).toBe(8);
      expect(json.failed_agents).toHaveLength(1);
      expect(json.failed_agents[0].name).toBe('cost_structure');
    });

    it('emits SSE progress events per agent completion', async () => {
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

      // Each successful agent emits one SSE event
      expect(sseEvents.length).toBeGreaterThanOrEqual(1);
      expect(sseEvents[0]).toHaveProperty('phase', 2);
      expect(sseEvents[0]).toHaveProperty('activeAgent');
      expect(sseEvents[0]).toHaveProperty('progress');
      expect(sseEvents[0]).toHaveProperty('timestamp');
    });

    it('validates agent output with Zod and rejects invalid JSON', async () => {
      const sessionId = crypto.randomUUID();
      const cookie = makeSessionCookie();
      const token = makeGenToken(sessionId);
      seedSession(sessionId);

      let callCount = 0;
      _setAgentExecutor(async (sectionName) => {
        callCount++;
        if (sectionName === 'channels') {
          // Return invalid output that fails Zod validation
          return { invalid: 'data', no_section_name: true };
        }
        return makeValidBMCSection(sectionName);
      });

      const res = await POST(
        req(
          { session_id: sessionId, generation_token: token, context: validContext() },
          { cookie }
        )
      );

      const json = await res.json();
      // 8 agents succeed, 1 fails Zod -> still >=6
      expect(res.status).toBe(200);
      expect(json.success_count).toBe(8);
      expect(json.failed_agents).toHaveLength(1);
      expect(json.failed_agents[0].name).toBe('channels');
      expect(json.failed_agents[0].error).toContain('Zod validation');
    });

    it('tracks failed agents independently without blocking others', async () => {
      const sessionId = crypto.randomUUID();
      const cookie = makeSessionCookie();
      const token = makeGenToken(sessionId);
      seedSession(sessionId);

      // 3 agents fail, 6 succeed (exactly at threshold)
      const failSections = ['channels', 'key_partners', 'cost_structure'];
      _setAgentExecutor(async (sectionName) => {
        if (failSections.includes(sectionName)) {
          throw new Error(`Agent ${sectionName} crashed`);
        }
        return makeValidBMCSection(sectionName);
      });

      const res = await POST(
        req(
          { session_id: sessionId, generation_token: token, context: validContext() },
          { cookie }
        )
      );

      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.success_count).toBe(6);
      expect(json.failed_agents).toHaveLength(3);
      // Verify each failure is tracked with agent name and error
      for (const failed of json.failed_agents) {
        expect(failed).toHaveProperty('name');
        expect(failed).toHaveProperty('error');
        expect(failSections).toContain(failed.name);
      }
    });
  });

  // =========================================================================
  // 4. Success & Partial
  // =========================================================================

  describe('Success & Partial', () => {
    it('returns 200 with all sections when >=6 agents succeed', async () => {
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
      expect(json.sections).toHaveLength(9);
      expect(json.success_count).toBe(9);
      expect(json.error).toBeNull();
      expect(json.wallClockMs).toBeGreaterThan(0);
    });

    it('returns 500 when <6 agents succeed (abort to Tier 3)', async () => {
      const sessionId = crypto.randomUUID();
      const cookie = makeSessionCookie();
      const token = makeGenToken(sessionId);
      seedSession(sessionId);

      // Only 5 agents succeed, 4 fail
      let successCount = 0;
      _setAgentExecutor(async (sectionName) => {
        successCount++;
        if (successCount > 5) {
          throw new Error(`Agent ${sectionName} failed`);
        }
        return makeValidBMCSection(sectionName);
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
      expect(json.success_count).toBe(5);
      expect(json.error).toContain('5/9');
      expect(json.error).toContain('Minimum 6');
    });

    it('marks token as consumed after successful Phase 2', async () => {
      const sessionId = crypto.randomUUID();
      const cookie = makeSessionCookie();
      const token = makeGenToken(sessionId);
      seedSession(sessionId);

      // First call succeeds
      const res1 = await POST(
        req(
          { session_id: sessionId, generation_token: token, context: validContext() },
          { cookie }
        )
      );
      expect(res1.status).toBe(200);

      // Second call with same token should fail (consumed)
      const res2 = await POST(
        req(
          { session_id: sessionId, generation_token: token, context: validContext() },
          { cookie }
        )
      );
      expect(res2.status).toBe(403);
      const json2 = await res2.json();
      expect(json2.error).toContain('generation token');
    });
  });

  // =========================================================================
  // 5. Timeout Boundary
  // =========================================================================

  describe('Timeout Boundary', () => {
    it('skips agents not completed by the timeout mark', async () => {
      const sessionId = crypto.randomUUID();
      const cookie = makeSessionCookie();
      const token = makeGenToken(sessionId);
      seedSession(sessionId);

      // Simulate: 7 agents complete quickly, 2 agents timeout
      const slowSections = ['key_partners', 'cost_structure'];
      _setAgentExecutor(async (sectionName, _ctx, _signal) => {
        if (slowSections.includes(sectionName)) {
          // Will be rejected by the per-agent timeout race
          return new Promise((_resolve, reject) => {
            setTimeout(() => reject(new Error('Agent timeout')), 100);
          });
        }
        return makeValidBMCSection(sectionName);
      });

      const res = await POST(
        req(
          { session_id: sessionId, generation_token: token, context: validContext() },
          { cookie }
        )
      );

      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.success_count).toBe(7);
      expect(json.failed_agents).toHaveLength(2);
    });

    it('aborts remaining agents and returns available results', async () => {
      const sessionId = crypto.randomUUID();
      const cookie = makeSessionCookie();
      const token = makeGenToken(sessionId);
      seedSession(sessionId);

      // 6 succeed, 3 timeout -> still passes threshold
      let callIndex = 0;
      _setAgentExecutor(async (sectionName) => {
        callIndex++;
        if (callIndex > 6) {
          return new Promise((_resolve, reject) => {
            setTimeout(() => reject(new Error('Aborted')), 80);
          });
        }
        return makeValidBMCSection(sectionName);
      });

      const res = await POST(
        req(
          { session_id: sessionId, generation_token: token, context: validContext() },
          { cookie }
        )
      );

      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.success_count).toBe(6);
      expect(json.failed_agents).toHaveLength(3);
      // Sections from completed agents are present
      expect(json.sections).toHaveLength(6);
    });
  });

  // =========================================================================
  // 6. Edge Cases
  // =========================================================================

  describe('Edge Cases', () => {
    it('returns 500 when all 9 agents fail', async () => {
      const sessionId = crypto.randomUUID();
      const cookie = makeSessionCookie();
      const token = makeGenToken(sessionId);
      seedSession(sessionId);

      _setAgentExecutor(async (sectionName) => {
        throw new Error(`Agent ${sectionName} crashed`);
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
      expect(json.success_count).toBe(0);
      expect(json.failed_agents).toHaveLength(9);
      expect(json.error).toContain('0/9');
    });

    it('skips agent with Zod validation error while others continue', async () => {
      const sessionId = crypto.randomUUID();
      const cookie = makeSessionCookie();
      const token = makeGenToken(sessionId);
      seedSession(sessionId);

      _setAgentExecutor(async (sectionName) => {
        if (sectionName === 'revenue_streams') {
          // Return JSON that parses but fails Zod: missing required fields
          return {
            section_name: 'revenue_streams',
            content: { points: [] }, // min(2) violated
            metadata: { agent_name: 'test' },
          };
        }
        return makeValidBMCSection(sectionName);
      });

      const res = await POST(
        req(
          { session_id: sessionId, generation_token: token, context: validContext() },
          { cookie }
        )
      );

      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.success_count).toBe(8);
      expect(json.failed_agents).toHaveLength(1);
      expect(json.failed_agents[0].name).toBe('revenue_streams');
      expect(json.failed_agents[0].error).toContain('Zod validation');
      // Other agents still produced valid sections
      expect(json.sections).toHaveLength(8);
    });
  });

  // =========================================================================
  // 7. Cost Tracking
  // =========================================================================

  describe('Cost Tracking', () => {
    it('includes cost in successful response', async () => {
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
      expect(json.cost).toBeGreaterThan(0);
    });

    it('includes cost in failed response', async () => {
      const sessionId = crypto.randomUUID();
      const cookie = makeSessionCookie();
      const token = makeGenToken(sessionId);
      seedSession(sessionId);

      _setAgentExecutor(async () => { throw new Error('fail'); });

      const res = await POST(
        req(
          { session_id: sessionId, generation_token: token, context: validContext() },
          { cookie }
        )
      );

      const json = await res.json();
      expect(json).toHaveProperty('cost');
      // No agents succeeded -> cost is 0
      expect(json.cost).toBe(0);
    });
  });

  // =========================================================================
  // 8. Request Body Validation
  // =========================================================================

  describe('Request Body Validation', () => {
    it('returns 400 for invalid JSON body', async () => {
      const cookie = makeSessionCookie();
      const r = new Request('http://localhost:3000/api/bmc-generator/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: `bmc_session=${cookie}` },
        body: '{{{not json',
      });
      const res = await POST(r);
      expect(res.status).toBe(400);
    });

    it('returns 400 when generation_token is missing', async () => {
      const sessionId = crypto.randomUUID();
      const cookie = makeSessionCookie();
      const res = await POST(
        req(
          { session_id: sessionId, context: validContext() },
          { cookie }
        )
      );
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('Missing required fields');
    });

    it('returns 413 for oversized payload', async () => {
      const cookie = makeSessionCookie();
      const r = new Request('http://localhost:3000/api/bmc-generator/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `bmc_session=${cookie}`,
          'content-length': '300000',
        },
        body: JSON.stringify({ session_id: 'x', generation_token: 'x', context: {} }),
      });
      const res = await POST(r);
      expect(res.status).toBe(413);
    });
  });

  // =========================================================================
  // 9. Cleanup After Execution
  // =========================================================================

  describe('Cleanup After Execution', () => {
    it('removes activeGenerations entry after success', async () => {
      const sessionId = crypto.randomUUID();
      const cookie = makeSessionCookie();
      const token = makeGenToken(sessionId);
      seedSession(sessionId);

      await POST(
        req(
          { session_id: sessionId, generation_token: token, context: validContext() },
          { cookie }
        )
      );

      expect(_testInternals.activeGenerations.has('testuser')).toBe(false);
    });

    it('removes activeGenerations entry after failure', async () => {
      const sessionId = crypto.randomUUID();
      const cookie = makeSessionCookie();
      const token = makeGenToken(sessionId);
      seedSession(sessionId);

      _setAgentExecutor(async () => { throw new Error('fail'); });

      await POST(
        req(
          { session_id: sessionId, generation_token: token, context: validContext() },
          { cookie }
        )
      );

      expect(_testInternals.activeGenerations.has('testuser')).toBe(false);
    });
  });
});
