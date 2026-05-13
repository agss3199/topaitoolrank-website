import { z } from 'zod';

// ===========================================================================
// BMC Section Names — shared enum used by BMCSection and CritiqueOutput
// ===========================================================================
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

// ===========================================================================
// BusinessContextSchema (Phase 1 -> Phase 2)
// Output of OrchestratorAgent's normalize_answers operation.
// ===========================================================================
export const BusinessContextSchema = z.strictObject({
  user_idea_summary: z.string().min(50).max(500),
  industry: z.string().min(3),
  customer_type: z.enum(['B2B', 'B2C', 'B2B2C']),
  target_market: z.string().min(10),
  problem_statement: z.string().min(20),
  solution_approach: z.string().min(20),
  pricing_direction: z.string().nullable(),
  geography: z.string().min(3),
  competitive_landscape: z.string().min(20),
  key_assumptions: z.array(z.string()).min(1).max(10),
  success_metrics: z.array(z.string()).min(1).max(5),
  stage: z.enum(['idea', 'prototype', 'revenue', 'growth']),
});

// ===========================================================================
// BMCSectionSchema (Phase 2 Output)
// Each of the 9 Phase 2 agents produces one BMCSection.
// ===========================================================================
export const BMCSectionSchema = z.strictObject({
  section_name: z.enum(BMC_SECTION_NAMES),
  content: z.strictObject({
    points: z.array(z.string()).min(2).max(8),
    reasoning: z.string().min(50).max(1000),
    assumptions: z.array(z.string()).min(1).max(5),
    confidence_level: z.enum(['high', 'medium', 'low']),
  }),
  metadata: z.strictObject({
    agent_name: z.string(),
    tokens_used: z.strictObject({
      input: z.number().int().positive(),
      output: z.number().int().positive(),
    }),
    latency_ms: z.number().int().positive(),
    timestamp: z.string().datetime(),
  }),
});

// ===========================================================================
// CritiqueOutputSchema (Phase 3 Output)
// Each of the 3 Phase 3 critique agents produces one CritiqueOutput.
// ===========================================================================
export const CritiqueOutputSchema = z.strictObject({
  perspective: z.enum([
    'market_feasibility',
    'business_model',
    'competitive_positioning',
  ]),
  findings: z.array(z.strictObject({
    category: z.string().min(5).max(100),
    severity: z.enum(['HIGH', 'MEDIUM', 'LOW']),
    description: z.string().min(50).max(500),
    affected_sections: z.array(z.enum(BMC_SECTION_NAMES)).min(1).max(5),
    recommendation: z.string().min(20).max(300),
  })).min(1).max(10),
  overall_assessment: z.string().min(100).max(500),
  metadata: z.strictObject({
    agent_name: z.string(),
    tokens_used: z.strictObject({
      input: z.number().int().positive(),
      output: z.number().int().positive(),
    }),
    latency_ms: z.number().int().positive(),
  }),
});

// ===========================================================================
// FinalBMCSchema (Phase 4 Output)
// Synthesized Business Model Canvas — the final deliverable.
// ===========================================================================
export const FinalBMCSchema = z.strictObject({
  executive_summary: z.string().min(100).max(500),
  canvas: z.strictObject({
    customer_segments: z.string().min(20).max(300),
    value_propositions: z.string().min(20).max(300),
    channels: z.string().min(20).max(300),
    customer_relationships: z.string().min(20).max(300),
    revenue_streams: z.string().min(20).max(300),
    key_resources: z.string().min(20).max(300),
    key_activities: z.string().min(20).max(300),
    key_partners: z.string().min(20).max(300),
    cost_structure: z.string().min(20).max(300),
  }),
  critique_summary: z.strictObject({
    high_risk_items: z.array(z.string()).max(5),
    medium_risk_items: z.array(z.string()).max(5),
    areas_of_strength: z.array(z.string()).max(5),
  }),
  strategic_recommendations: z.array(z.string()).min(1).max(5),
  next_steps: z.array(z.string()).min(1).max(5),
  metadata: z.strictObject({
    total_cost: z.number().positive(),
    total_tokens: z.number().int().positive(),
    wall_clock_latency_ms: z.number().int().positive(),
    agents_executed: z.number().int().min(11).max(14),
    agents_failed: z.number().int().min(0),
  }),
});

// ===========================================================================
// AgentStatusSchema (Real-Time SSE Updates)
// Status event emitted from server to client via SSE stream.
// ===========================================================================
export const AgentStatusSchema = z.strictObject({
  phase: z.number().int().min(1).max(4),
  activeAgent: z.string(),
  progress: z.number().min(0).max(1),
  elapsedMs: z.number().int().min(0),
  tokensUsed: z.strictObject({
    input: z.number().int().min(0),
    output: z.number().int().min(0),
  }),
  costUSD: z.number().min(0),
  timestamp: z.string().datetime(),
  error: z.string().optional(),
});

// ===========================================================================
// CostTrackerSchema (Operational)
// Internal tracker for accumulating tokens and calculating cost-to-date.
// ===========================================================================
export const CostTrackerSchema = z.strictObject({
  phases: z.record(
    z.string(),
    z.strictObject({
      agents: z.record(
        z.string(),
        z.strictObject({
          inputTokens: z.number().int(),
          outputTokens: z.number().int(),
        })
      ),
    })
  ),
});
