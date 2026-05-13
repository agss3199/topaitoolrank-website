import { describe, it, expect } from 'vitest';
import { ZodError } from 'zod';
import {
  BusinessContextSchema,
  BMCSectionSchema,
  CritiqueOutputSchema,
  FinalBMCSchema,
  AgentStatusSchema,
  CostTrackerSchema,
} from '../lib/validators';

// ---------------------------------------------------------------------------
// Helper: builds a valid BusinessContext object
// ---------------------------------------------------------------------------
function validBusinessContext() {
  return {
    user_idea_summary: 'A'.repeat(50), // min 50
    industry: 'FinTech',
    customer_type: 'B2B' as const,
    target_market: 'Enterprise companies in the US market',
    problem_statement: 'Businesses struggle with payments',
    solution_approach: 'Provide a streamlined API for payments',
    pricing_direction: null,
    geography: 'USA',
    competitive_landscape: 'Several legacy players exist in this space',
    key_assumptions: ['Assumption one'],
    success_metrics: ['Metric one'],
    stage: 'idea' as const,
  };
}

// ---------------------------------------------------------------------------
// Helper: builds a valid BMCSection object
// ---------------------------------------------------------------------------
function validBMCSection() {
  return {
    section_name: 'customer_segments' as const,
    content: {
      points: ['Point one', 'Point two'],
      reasoning: 'R'.repeat(50), // min 50
      assumptions: ['Assumption one'],
      confidence_level: 'high' as const,
    },
    metadata: {
      agent_name: 'CustomerSegmentsAgent',
      tokens_used: { input: 100, output: 200 },
      latency_ms: 500,
      timestamp: '2026-05-12T10:00:00Z',
    },
  };
}

// ---------------------------------------------------------------------------
// Helper: builds a valid CritiqueOutput object
// ---------------------------------------------------------------------------
function validCritiqueOutput() {
  return {
    perspective: 'market_feasibility' as const,
    findings: [
      {
        category: 'Market Size',
        severity: 'HIGH' as const,
        description: 'D'.repeat(50), // min 50
        affected_sections: ['customer_segments' as const],
        recommendation: 'Recommend narrowing target',
      },
    ],
    overall_assessment: 'A'.repeat(100), // min 100
    metadata: {
      agent_name: 'MarketFeasibilityAgent',
      tokens_used: { input: 500, output: 300 },
      latency_ms: 1200,
    },
  };
}

// ---------------------------------------------------------------------------
// Helper: builds a valid FinalBMC object
// ---------------------------------------------------------------------------
function validFinalBMC() {
  return {
    executive_summary: 'E'.repeat(100), // min 100
    canvas: {
      customer_segments: 'C'.repeat(20),
      value_propositions: 'V'.repeat(20),
      channels: 'C'.repeat(20),
      customer_relationships: 'R'.repeat(20),
      revenue_streams: 'R'.repeat(20),
      key_resources: 'K'.repeat(20),
      key_activities: 'K'.repeat(20),
      key_partners: 'K'.repeat(20),
      cost_structure: 'C'.repeat(20),
    },
    critique_summary: {
      high_risk_items: ['Risk item one'],
      medium_risk_items: ['Medium risk item'],
      areas_of_strength: ['Strength one'],
    },
    strategic_recommendations: ['Recommendation one'],
    next_steps: ['Step one'],
    metadata: {
      total_cost: 0.05,
      total_tokens: 10000,
      wall_clock_latency_ms: 5000,
      agents_executed: 13,
      agents_failed: 0,
    },
  };
}

// ---------------------------------------------------------------------------
// Helper: builds a valid AgentStatus object
// ---------------------------------------------------------------------------
function validAgentStatus() {
  return {
    phase: 1,
    activeAgent: 'OrchestratorAgent',
    progress: 0.5,
    elapsedMs: 2000,
    tokensUsed: { input: 100, output: 50 },
    costUSD: 0.001,
    timestamp: '2026-05-12T10:00:00Z',
  };
}

// ---------------------------------------------------------------------------
// Helper: builds a valid CostTracker object
// ---------------------------------------------------------------------------
function validCostTracker() {
  return {
    phases: {
      1: {
        agents: {
          OrchestratorAgent: { inputTokens: 500, outputTokens: 200 },
        },
      },
    },
  };
}

// ===========================================================================
// BusinessContextSchema
// ===========================================================================
describe('BusinessContextSchema', () => {
  it('accepts a fully valid business context', () => {
    const result = BusinessContextSchema.parse(validBusinessContext());
    expect(result.industry).toBe('FinTech');
    expect(result.customer_type).toBe('B2B');
    expect(result.stage).toBe('idea');
  });

  it('accepts pricing_direction as null', () => {
    const data = validBusinessContext();
    data.pricing_direction = null;
    const result = BusinessContextSchema.parse(data);
    expect(result.pricing_direction).toBeNull();
  });

  it('accepts pricing_direction as a string', () => {
    const data = { ...validBusinessContext(), pricing_direction: 'Freemium model' };
    const result = BusinessContextSchema.parse(data);
    expect(result.pricing_direction).toBe('Freemium model');
  });

  // --- user_idea_summary bounds ---
  it('rejects user_idea_summary shorter than 50 chars', () => {
    const data = { ...validBusinessContext(), user_idea_summary: 'A'.repeat(49) };
    expect(() => BusinessContextSchema.parse(data)).toThrow(ZodError);
  });

  it('rejects user_idea_summary longer than 500 chars', () => {
    const data = { ...validBusinessContext(), user_idea_summary: 'A'.repeat(501) };
    expect(() => BusinessContextSchema.parse(data)).toThrow(ZodError);
  });

  it('accepts user_idea_summary at exactly 50 chars', () => {
    const data = { ...validBusinessContext(), user_idea_summary: 'A'.repeat(50) };
    expect(() => BusinessContextSchema.parse(data)).not.toThrow();
  });

  it('accepts user_idea_summary at exactly 500 chars', () => {
    const data = { ...validBusinessContext(), user_idea_summary: 'A'.repeat(500) };
    expect(() => BusinessContextSchema.parse(data)).not.toThrow();
  });

  // --- industry bounds ---
  it('rejects industry shorter than 3 chars', () => {
    const data = { ...validBusinessContext(), industry: 'AI' };
    expect(() => BusinessContextSchema.parse(data)).toThrow(ZodError);
  });

  // --- customer_type enum ---
  it('accepts all valid customer_type enum values', () => {
    for (const ct of ['B2B', 'B2C', 'B2B2C'] as const) {
      const data = { ...validBusinessContext(), customer_type: ct };
      expect(() => BusinessContextSchema.parse(data)).not.toThrow();
    }
  });

  it('rejects invalid customer_type enum value', () => {
    const data = { ...validBusinessContext(), customer_type: 'B2G' };
    expect(() => BusinessContextSchema.parse(data)).toThrow(ZodError);
  });

  // --- target_market bounds ---
  it('rejects target_market shorter than 10 chars', () => {
    const data = { ...validBusinessContext(), target_market: 'Short' };
    expect(() => BusinessContextSchema.parse(data)).toThrow(ZodError);
  });

  // --- problem_statement bounds ---
  it('rejects problem_statement shorter than 20 chars', () => {
    const data = { ...validBusinessContext(), problem_statement: 'Too short' };
    expect(() => BusinessContextSchema.parse(data)).toThrow(ZodError);
  });

  // --- solution_approach bounds ---
  it('rejects solution_approach shorter than 20 chars', () => {
    const data = { ...validBusinessContext(), solution_approach: 'Too short' };
    expect(() => BusinessContextSchema.parse(data)).toThrow(ZodError);
  });

  // --- geography bounds ---
  it('rejects geography shorter than 3 chars', () => {
    const data = { ...validBusinessContext(), geography: 'US' };
    expect(() => BusinessContextSchema.parse(data)).toThrow(ZodError);
  });

  // --- competitive_landscape bounds ---
  it('rejects competitive_landscape shorter than 20 chars', () => {
    const data = { ...validBusinessContext(), competitive_landscape: 'Short' };
    expect(() => BusinessContextSchema.parse(data)).toThrow(ZodError);
  });

  // --- key_assumptions array bounds ---
  it('rejects key_assumptions with empty array', () => {
    const data = { ...validBusinessContext(), key_assumptions: [] };
    expect(() => BusinessContextSchema.parse(data)).toThrow(ZodError);
  });

  it('rejects key_assumptions with more than 10 items', () => {
    const data = {
      ...validBusinessContext(),
      key_assumptions: Array.from({ length: 11 }, (_, i) => `Assumption ${i}`),
    };
    expect(() => BusinessContextSchema.parse(data)).toThrow(ZodError);
  });

  it('accepts key_assumptions with exactly 10 items', () => {
    const data = {
      ...validBusinessContext(),
      key_assumptions: Array.from({ length: 10 }, (_, i) => `Assumption ${i}`),
    };
    expect(() => BusinessContextSchema.parse(data)).not.toThrow();
  });

  // --- success_metrics array bounds ---
  it('rejects success_metrics with empty array', () => {
    const data = { ...validBusinessContext(), success_metrics: [] };
    expect(() => BusinessContextSchema.parse(data)).toThrow(ZodError);
  });

  it('rejects success_metrics with more than 5 items', () => {
    const data = {
      ...validBusinessContext(),
      success_metrics: Array.from({ length: 6 }, (_, i) => `Metric ${i}`),
    };
    expect(() => BusinessContextSchema.parse(data)).toThrow(ZodError);
  });

  // --- stage enum ---
  it('accepts all valid stage enum values', () => {
    for (const s of ['idea', 'prototype', 'revenue', 'growth'] as const) {
      const data = { ...validBusinessContext(), stage: s };
      expect(() => BusinessContextSchema.parse(data)).not.toThrow();
    }
  });

  it('rejects invalid stage enum value', () => {
    const data = { ...validBusinessContext(), stage: 'launch' };
    expect(() => BusinessContextSchema.parse(data)).toThrow(ZodError);
  });

  // --- missing required fields ---
  it('rejects when required field is missing', () => {
    const data = validBusinessContext();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (data as any).industry;
    expect(() => BusinessContextSchema.parse(data)).toThrow(ZodError);
  });

  // --- strict mode: rejects unknown keys ---
  it('rejects unknown keys (strict mode)', () => {
    const data = { ...validBusinessContext(), extra_field: 'should fail' };
    expect(() => BusinessContextSchema.parse(data)).toThrow(ZodError);
  });
});

// ===========================================================================
// BMCSectionSchema
// ===========================================================================
describe('BMCSectionSchema', () => {
  it('accepts a fully valid BMC section', () => {
    const result = BMCSectionSchema.parse(validBMCSection());
    expect(result.section_name).toBe('customer_segments');
    expect(result.content.confidence_level).toBe('high');
  });

  // --- section_name enum ---
  it('accepts all 9 valid section names', () => {
    const sections = [
      'customer_segments', 'value_propositions', 'channels',
      'customer_relationships', 'revenue_streams', 'key_resources',
      'key_activities', 'key_partners', 'cost_structure',
    ] as const;
    for (const name of sections) {
      const data = { ...validBMCSection(), section_name: name };
      expect(() => BMCSectionSchema.parse(data)).not.toThrow();
    }
  });

  it('rejects invalid section_name', () => {
    const data = { ...validBMCSection(), section_name: 'invalid_section' };
    expect(() => BMCSectionSchema.parse(data)).toThrow(ZodError);
  });

  // --- content.points bounds ---
  it('rejects points with fewer than 2 items', () => {
    const data = validBMCSection();
    data.content.points = ['Only one'];
    expect(() => BMCSectionSchema.parse(data)).toThrow(ZodError);
  });

  it('rejects points with more than 8 items', () => {
    const data = validBMCSection();
    data.content.points = Array.from({ length: 9 }, (_, i) => `Point ${i}`);
    expect(() => BMCSectionSchema.parse(data)).toThrow(ZodError);
  });

  it('accepts points with exactly 2 items', () => {
    const data = validBMCSection();
    data.content.points = ['Point 1', 'Point 2'];
    expect(() => BMCSectionSchema.parse(data)).not.toThrow();
  });

  it('accepts points with exactly 8 items', () => {
    const data = validBMCSection();
    data.content.points = Array.from({ length: 8 }, (_, i) => `Point ${i}`);
    expect(() => BMCSectionSchema.parse(data)).not.toThrow();
  });

  // --- content.reasoning bounds ---
  it('rejects reasoning shorter than 50 chars', () => {
    const data = validBMCSection();
    data.content.reasoning = 'R'.repeat(49);
    expect(() => BMCSectionSchema.parse(data)).toThrow(ZodError);
  });

  it('rejects reasoning longer than 1000 chars', () => {
    const data = validBMCSection();
    data.content.reasoning = 'R'.repeat(1001);
    expect(() => BMCSectionSchema.parse(data)).toThrow(ZodError);
  });

  // --- content.assumptions bounds ---
  it('rejects assumptions with empty array', () => {
    const data = validBMCSection();
    data.content.assumptions = [];
    expect(() => BMCSectionSchema.parse(data)).toThrow(ZodError);
  });

  it('rejects assumptions with more than 5 items', () => {
    const data = validBMCSection();
    data.content.assumptions = Array.from({ length: 6 }, (_, i) => `A ${i}`);
    expect(() => BMCSectionSchema.parse(data)).toThrow(ZodError);
  });

  // --- content.confidence_level enum ---
  it('accepts all valid confidence levels', () => {
    for (const cl of ['high', 'medium', 'low'] as const) {
      const data = validBMCSection();
      data.content.confidence_level = cl;
      expect(() => BMCSectionSchema.parse(data)).not.toThrow();
    }
  });

  it('rejects invalid confidence_level', () => {
    const data = validBMCSection();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (data.content as any).confidence_level = 'very_high';
    expect(() => BMCSectionSchema.parse(data)).toThrow(ZodError);
  });

  // --- metadata ---
  it('rejects tokens_used.input as non-positive', () => {
    const data = validBMCSection();
    data.metadata.tokens_used.input = 0;
    expect(() => BMCSectionSchema.parse(data)).toThrow(ZodError);
  });

  it('rejects tokens_used.output as negative', () => {
    const data = validBMCSection();
    data.metadata.tokens_used.output = -1;
    expect(() => BMCSectionSchema.parse(data)).toThrow(ZodError);
  });

  it('rejects latency_ms as non-positive', () => {
    const data = validBMCSection();
    data.metadata.latency_ms = 0;
    expect(() => BMCSectionSchema.parse(data)).toThrow(ZodError);
  });

  it('rejects invalid timestamp format', () => {
    const data = validBMCSection();
    data.metadata.timestamp = 'not-a-date';
    expect(() => BMCSectionSchema.parse(data)).toThrow(ZodError);
  });

  it('accepts valid ISO datetime timestamp', () => {
    const data = validBMCSection();
    data.metadata.timestamp = '2026-05-12T10:30:00.000Z';
    expect(() => BMCSectionSchema.parse(data)).not.toThrow();
  });

  // --- missing required fields ---
  it('rejects when metadata is missing', () => {
    const data = validBMCSection();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (data as any).metadata;
    expect(() => BMCSectionSchema.parse(data)).toThrow(ZodError);
  });

  // --- strict mode ---
  it('rejects unknown keys at top level (strict mode)', () => {
    const data = { ...validBMCSection(), extra: 'bad' };
    expect(() => BMCSectionSchema.parse(data)).toThrow(ZodError);
  });
});

// ===========================================================================
// CritiqueOutputSchema
// ===========================================================================
describe('CritiqueOutputSchema', () => {
  it('accepts a fully valid critique output', () => {
    const result = CritiqueOutputSchema.parse(validCritiqueOutput());
    expect(result.perspective).toBe('market_feasibility');
    expect(result.findings.length).toBe(1);
  });

  // --- perspective enum ---
  it('accepts all valid perspective values', () => {
    for (const p of ['market_feasibility', 'business_model', 'competitive_positioning'] as const) {
      const data = { ...validCritiqueOutput(), perspective: p };
      expect(() => CritiqueOutputSchema.parse(data)).not.toThrow();
    }
  });

  it('rejects invalid perspective', () => {
    const data = { ...validCritiqueOutput(), perspective: 'technical_review' };
    expect(() => CritiqueOutputSchema.parse(data)).toThrow(ZodError);
  });

  // --- findings bounds ---
  it('rejects findings with empty array', () => {
    const data = { ...validCritiqueOutput(), findings: [] };
    expect(() => CritiqueOutputSchema.parse(data)).toThrow(ZodError);
  });

  it('rejects findings with more than 10 items', () => {
    const finding = validCritiqueOutput().findings[0];
    const data = {
      ...validCritiqueOutput(),
      findings: Array.from({ length: 11 }, () => ({ ...finding })),
    };
    expect(() => CritiqueOutputSchema.parse(data)).toThrow(ZodError);
  });

  // --- finding field bounds ---
  it('rejects finding.category shorter than 5 chars', () => {
    const data = validCritiqueOutput();
    data.findings[0].category = 'AB';
    expect(() => CritiqueOutputSchema.parse(data)).toThrow(ZodError);
  });

  it('rejects finding.category longer than 100 chars', () => {
    const data = validCritiqueOutput();
    data.findings[0].category = 'C'.repeat(101);
    expect(() => CritiqueOutputSchema.parse(data)).toThrow(ZodError);
  });

  it('rejects finding.description shorter than 50 chars', () => {
    const data = validCritiqueOutput();
    data.findings[0].description = 'Too short';
    expect(() => CritiqueOutputSchema.parse(data)).toThrow(ZodError);
  });

  it('rejects finding.description longer than 500 chars', () => {
    const data = validCritiqueOutput();
    data.findings[0].description = 'D'.repeat(501);
    expect(() => CritiqueOutputSchema.parse(data)).toThrow(ZodError);
  });

  it('rejects finding.recommendation shorter than 20 chars', () => {
    const data = validCritiqueOutput();
    data.findings[0].recommendation = 'Short';
    expect(() => CritiqueOutputSchema.parse(data)).toThrow(ZodError);
  });

  it('rejects finding.recommendation longer than 300 chars', () => {
    const data = validCritiqueOutput();
    data.findings[0].recommendation = 'R'.repeat(301);
    expect(() => CritiqueOutputSchema.parse(data)).toThrow(ZodError);
  });

  // --- finding.severity enum ---
  it('accepts all valid severity values', () => {
    for (const s of ['HIGH', 'MEDIUM', 'LOW'] as const) {
      const data = validCritiqueOutput();
      data.findings[0].severity = s;
      expect(() => CritiqueOutputSchema.parse(data)).not.toThrow();
    }
  });

  it('rejects invalid severity (lowercase)', () => {
    const data = validCritiqueOutput();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (data.findings[0] as any).severity = 'high';
    expect(() => CritiqueOutputSchema.parse(data)).toThrow(ZodError);
  });

  // --- finding.affected_sections enum + bounds ---
  it('rejects affected_sections with empty array', () => {
    const data = validCritiqueOutput();
    data.findings[0].affected_sections = [];
    expect(() => CritiqueOutputSchema.parse(data)).toThrow(ZodError);
  });

  it('rejects affected_sections with more than 5 items', () => {
    const data = validCritiqueOutput();
    data.findings[0].affected_sections = [
      'customer_segments', 'value_propositions', 'channels',
      'customer_relationships', 'revenue_streams', 'key_resources',
    ] as any;
    expect(() => CritiqueOutputSchema.parse(data)).toThrow(ZodError);
  });

  it('rejects invalid section name in affected_sections', () => {
    const data = validCritiqueOutput();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (data.findings[0] as any).affected_sections = ['invalid_section'];
    expect(() => CritiqueOutputSchema.parse(data)).toThrow(ZodError);
  });

  // --- overall_assessment bounds ---
  it('rejects overall_assessment shorter than 100 chars', () => {
    const data = { ...validCritiqueOutput(), overall_assessment: 'A'.repeat(99) };
    expect(() => CritiqueOutputSchema.parse(data)).toThrow(ZodError);
  });

  it('rejects overall_assessment longer than 500 chars', () => {
    const data = { ...validCritiqueOutput(), overall_assessment: 'A'.repeat(501) };
    expect(() => CritiqueOutputSchema.parse(data)).toThrow(ZodError);
  });

  // --- metadata ---
  it('rejects metadata with non-positive input tokens', () => {
    const data = validCritiqueOutput();
    data.metadata.tokens_used.input = 0;
    expect(() => CritiqueOutputSchema.parse(data)).toThrow(ZodError);
  });

  it('rejects metadata with non-positive latency_ms', () => {
    const data = validCritiqueOutput();
    data.metadata.latency_ms = 0;
    expect(() => CritiqueOutputSchema.parse(data)).toThrow(ZodError);
  });

  // --- strict mode ---
  it('rejects unknown keys at top level (strict mode)', () => {
    const data = { ...validCritiqueOutput(), extra: 'bad' };
    expect(() => CritiqueOutputSchema.parse(data)).toThrow(ZodError);
  });
});

// ===========================================================================
// FinalBMCSchema
// ===========================================================================
describe('FinalBMCSchema', () => {
  it('accepts a fully valid final BMC', () => {
    const result = FinalBMCSchema.parse(validFinalBMC());
    expect(result.metadata.agents_executed).toBe(13);
    expect(result.strategic_recommendations.length).toBe(1);
  });

  // --- executive_summary bounds ---
  it('rejects executive_summary shorter than 100 chars', () => {
    const data = { ...validFinalBMC(), executive_summary: 'E'.repeat(99) };
    expect(() => FinalBMCSchema.parse(data)).toThrow(ZodError);
  });

  it('rejects executive_summary longer than 500 chars', () => {
    const data = { ...validFinalBMC(), executive_summary: 'E'.repeat(501) };
    expect(() => FinalBMCSchema.parse(data)).toThrow(ZodError);
  });

  // --- canvas field bounds ---
  it('rejects canvas field shorter than 20 chars', () => {
    const data = validFinalBMC();
    data.canvas.customer_segments = 'C'.repeat(19);
    expect(() => FinalBMCSchema.parse(data)).toThrow(ZodError);
  });

  it('rejects canvas field longer than 300 chars', () => {
    const data = validFinalBMC();
    data.canvas.value_propositions = 'V'.repeat(301);
    expect(() => FinalBMCSchema.parse(data)).toThrow(ZodError);
  });

  it('validates all 9 canvas fields are present', () => {
    const data = validFinalBMC();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (data.canvas as any).channels;
    expect(() => FinalBMCSchema.parse(data)).toThrow(ZodError);
  });

  // --- critique_summary array bounds ---
  it('rejects high_risk_items with more than 5 items', () => {
    const data = validFinalBMC();
    data.critique_summary.high_risk_items = Array.from({ length: 6 }, (_, i) => `Risk ${i}`);
    expect(() => FinalBMCSchema.parse(data)).toThrow(ZodError);
  });

  it('rejects medium_risk_items with more than 5 items', () => {
    const data = validFinalBMC();
    data.critique_summary.medium_risk_items = Array.from({ length: 6 }, (_, i) => `Risk ${i}`);
    expect(() => FinalBMCSchema.parse(data)).toThrow(ZodError);
  });

  it('rejects areas_of_strength with more than 5 items', () => {
    const data = validFinalBMC();
    data.critique_summary.areas_of_strength = Array.from({ length: 6 }, (_, i) => `Str ${i}`);
    expect(() => FinalBMCSchema.parse(data)).toThrow(ZodError);
  });

  it('allows empty critique_summary arrays', () => {
    const data = validFinalBMC();
    data.critique_summary.high_risk_items = [];
    data.critique_summary.medium_risk_items = [];
    data.critique_summary.areas_of_strength = [];
    expect(() => FinalBMCSchema.parse(data)).not.toThrow();
  });

  // --- strategic_recommendations bounds ---
  it('rejects strategic_recommendations with empty array', () => {
    const data = { ...validFinalBMC(), strategic_recommendations: [] };
    expect(() => FinalBMCSchema.parse(data)).toThrow(ZodError);
  });

  it('rejects strategic_recommendations with more than 5 items', () => {
    const data = {
      ...validFinalBMC(),
      strategic_recommendations: Array.from({ length: 6 }, (_, i) => `Rec ${i}`),
    };
    expect(() => FinalBMCSchema.parse(data)).toThrow(ZodError);
  });

  // --- next_steps bounds ---
  it('rejects next_steps with empty array', () => {
    const data = { ...validFinalBMC(), next_steps: [] };
    expect(() => FinalBMCSchema.parse(data)).toThrow(ZodError);
  });

  it('rejects next_steps with more than 5 items', () => {
    const data = {
      ...validFinalBMC(),
      next_steps: Array.from({ length: 6 }, (_, i) => `Step ${i}`),
    };
    expect(() => FinalBMCSchema.parse(data)).toThrow(ZodError);
  });

  // --- metadata bounds ---
  it('rejects total_cost as non-positive', () => {
    const data = validFinalBMC();
    data.metadata.total_cost = 0;
    expect(() => FinalBMCSchema.parse(data)).toThrow(ZodError);
  });

  it('rejects total_tokens as non-positive', () => {
    const data = validFinalBMC();
    data.metadata.total_tokens = 0;
    expect(() => FinalBMCSchema.parse(data)).toThrow(ZodError);
  });

  it('rejects wall_clock_latency_ms as non-positive', () => {
    const data = validFinalBMC();
    data.metadata.wall_clock_latency_ms = 0;
    expect(() => FinalBMCSchema.parse(data)).toThrow(ZodError);
  });

  it('rejects agents_executed below 11', () => {
    const data = validFinalBMC();
    data.metadata.agents_executed = 10;
    expect(() => FinalBMCSchema.parse(data)).toThrow(ZodError);
  });

  it('rejects agents_executed above 14', () => {
    const data = validFinalBMC();
    data.metadata.agents_executed = 15;
    expect(() => FinalBMCSchema.parse(data)).toThrow(ZodError);
  });

  it('accepts agents_executed at boundary values (11 and 14)', () => {
    for (const n of [11, 14]) {
      const data = validFinalBMC();
      data.metadata.agents_executed = n;
      expect(() => FinalBMCSchema.parse(data)).not.toThrow();
    }
  });

  it('rejects agents_failed as negative', () => {
    const data = validFinalBMC();
    data.metadata.agents_failed = -1;
    expect(() => FinalBMCSchema.parse(data)).toThrow(ZodError);
  });

  it('accepts agents_failed as zero', () => {
    const data = validFinalBMC();
    data.metadata.agents_failed = 0;
    expect(() => FinalBMCSchema.parse(data)).not.toThrow();
  });

  // --- strict mode ---
  it('rejects unknown keys at top level (strict mode)', () => {
    const data = { ...validFinalBMC(), extra: 'bad' };
    expect(() => FinalBMCSchema.parse(data)).toThrow(ZodError);
  });
});

// ===========================================================================
// AgentStatusSchema
// ===========================================================================
describe('AgentStatusSchema', () => {
  it('accepts a fully valid agent status', () => {
    const result = AgentStatusSchema.parse(validAgentStatus());
    expect(result.phase).toBe(1);
    expect(result.activeAgent).toBe('OrchestratorAgent');
  });

  // --- phase bounds ---
  it('rejects phase below 1', () => {
    const data = { ...validAgentStatus(), phase: 0 };
    expect(() => AgentStatusSchema.parse(data)).toThrow(ZodError);
  });

  it('rejects phase above 4', () => {
    const data = { ...validAgentStatus(), phase: 5 };
    expect(() => AgentStatusSchema.parse(data)).toThrow(ZodError);
  });

  it('accepts phase at boundary values (1 and 4)', () => {
    for (const p of [1, 4]) {
      const data = { ...validAgentStatus(), phase: p };
      expect(() => AgentStatusSchema.parse(data)).not.toThrow();
    }
  });

  // --- progress bounds ---
  it('rejects progress below 0', () => {
    const data = { ...validAgentStatus(), progress: -0.1 };
    expect(() => AgentStatusSchema.parse(data)).toThrow(ZodError);
  });

  it('rejects progress above 1', () => {
    const data = { ...validAgentStatus(), progress: 1.1 };
    expect(() => AgentStatusSchema.parse(data)).toThrow(ZodError);
  });

  it('accepts progress at boundary values (0 and 1)', () => {
    for (const p of [0, 1]) {
      const data = { ...validAgentStatus(), progress: p };
      expect(() => AgentStatusSchema.parse(data)).not.toThrow();
    }
  });

  // --- elapsedMs bounds ---
  it('rejects elapsedMs as negative', () => {
    const data = { ...validAgentStatus(), elapsedMs: -1 };
    expect(() => AgentStatusSchema.parse(data)).toThrow(ZodError);
  });

  it('accepts elapsedMs as zero', () => {
    const data = { ...validAgentStatus(), elapsedMs: 0 };
    expect(() => AgentStatusSchema.parse(data)).not.toThrow();
  });

  // --- tokensUsed bounds ---
  it('rejects tokensUsed.input as negative', () => {
    const data = validAgentStatus();
    data.tokensUsed.input = -1;
    expect(() => AgentStatusSchema.parse(data)).toThrow(ZodError);
  });

  it('accepts tokensUsed.input as zero', () => {
    const data = validAgentStatus();
    data.tokensUsed.input = 0;
    expect(() => AgentStatusSchema.parse(data)).not.toThrow();
  });

  // --- costUSD bounds ---
  it('rejects costUSD as negative', () => {
    const data = { ...validAgentStatus(), costUSD: -0.01 };
    expect(() => AgentStatusSchema.parse(data)).toThrow(ZodError);
  });

  it('accepts costUSD as zero', () => {
    const data = { ...validAgentStatus(), costUSD: 0 };
    expect(() => AgentStatusSchema.parse(data)).not.toThrow();
  });

  // --- timestamp ---
  it('rejects invalid timestamp', () => {
    const data = { ...validAgentStatus(), timestamp: 'not-a-date' };
    expect(() => AgentStatusSchema.parse(data)).toThrow(ZodError);
  });

  // --- error (optional) ---
  it('accepts without error field', () => {
    const data = validAgentStatus();
    expect(() => AgentStatusSchema.parse(data)).not.toThrow();
  });

  it('accepts with error field as string', () => {
    const data = { ...validAgentStatus(), error: 'Agent timeout' };
    const result = AgentStatusSchema.parse(data);
    expect(result.error).toBe('Agent timeout');
  });

  // --- strict mode ---
  it('rejects unknown keys (strict mode)', () => {
    const data = { ...validAgentStatus(), extra: 'bad' };
    expect(() => AgentStatusSchema.parse(data)).toThrow(ZodError);
  });
});

// ===========================================================================
// CostTrackerSchema
// ===========================================================================
describe('CostTrackerSchema', () => {
  it('accepts a fully valid cost tracker', () => {
    const result = CostTrackerSchema.parse(validCostTracker());
    expect(result.phases[1].agents['OrchestratorAgent'].inputTokens).toBe(500);
  });

  it('accepts multiple phases and agents', () => {
    const data = {
      phases: {
        1: {
          agents: {
            OrchestratorAgent: { inputTokens: 500, outputTokens: 200 },
          },
        },
        2: {
          agents: {
            CustomerSegmentsAgent: { inputTokens: 300, outputTokens: 150 },
            ValuePropositionsAgent: { inputTokens: 400, outputTokens: 250 },
          },
        },
      },
    };
    const result = CostTrackerSchema.parse(data);
    expect(Object.keys(result.phases)).toHaveLength(2);
    expect(Object.keys(result.phases[2].agents)).toHaveLength(2);
  });

  it('accepts empty phases record', () => {
    const data = { phases: {} };
    expect(() => CostTrackerSchema.parse(data)).not.toThrow();
  });

  it('accepts phase with empty agents record', () => {
    const data = { phases: { 1: { agents: {} } } };
    expect(() => CostTrackerSchema.parse(data)).not.toThrow();
  });

  it('rejects agent entry missing inputTokens', () => {
    const data = {
      phases: {
        1: {
          agents: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            TestAgent: { outputTokens: 200 } as any,
          },
        },
      },
    };
    expect(() => CostTrackerSchema.parse(data)).toThrow(ZodError);
  });

  it('rejects agent entry missing outputTokens', () => {
    const data = {
      phases: {
        1: {
          agents: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            TestAgent: { inputTokens: 200 } as any,
          },
        },
      },
    };
    expect(() => CostTrackerSchema.parse(data)).toThrow(ZodError);
  });

  it('rejects non-integer token values', () => {
    const data = {
      phases: {
        1: {
          agents: {
            TestAgent: { inputTokens: 100.5, outputTokens: 200 },
          },
        },
      },
    };
    expect(() => CostTrackerSchema.parse(data)).toThrow(ZodError);
  });

  // --- strict mode ---
  it('rejects unknown keys at top level (strict mode)', () => {
    const data = { ...validCostTracker(), extra: 'bad' };
    expect(() => CostTrackerSchema.parse(data)).toThrow(ZodError);
  });
});

// ===========================================================================
// Type inference verification (compile-time check)
// ===========================================================================
describe('TypeScript type inference', () => {
  it('inferred types match expected structure', async () => {
    // This test verifies that the types module exports correctly
    // and that the inferred types are usable
    const { default: types } = await import('../lib/types');
    // The types module should re-export all types from validators
    // We verify this by checking the module can be imported without errors
    expect(types).toBeUndefined(); // module only exports types, no runtime value
  });
});
