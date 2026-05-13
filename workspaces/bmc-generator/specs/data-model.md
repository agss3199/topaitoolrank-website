# BMC Generator — Data Model & Validation

All internal data structures use Zod for strict TypeScript validation. This spec defines the authoritative schemas for every phase transition.

## Core Domain Types

### BusinessContext (Phase 1 → Phase 2)

Output of OrchestratorAgent's `normalize_answers` operation. Contains all normalized context needed by Phase 2 agents.

```typescript
const BusinessContextSchema = z.object({
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

export type BusinessContext = z.infer<typeof BusinessContextSchema>;
```

**Validation Rules:**
- `user_idea_summary`: 50–500 chars (trimmed, deduplicated whitespace)
- `industry`: Non-empty, case-normalized (e.g., "FinTech" not "fintech")
- `customer_type`: Enum-locked to prevent agent confusion
- Arrays bounded (min 1, max 10/5) to prevent hallucination bloat

**Source:** OrchestratorAgent's `normalize_answers()` output
**Consumer:** All 9 Phase 2 agents receive this via `execute(context)`

---

### BMCSection (Phase 2 Output)

Each of the 9 Phase 2 agents produces one `BMCSection` for its assigned domain.

```typescript
const BMCSectionSchema = z.object({
  section_name: z.enum([
    'customer_segments',
    'value_propositions',
    'channels',
    'customer_relationships',
    'revenue_streams',
    'key_resources',
    'key_activities',
    'key_partners',
    'cost_structure',
  ]),
  content: z.object({
    points: z.array(z.string()).min(2).max(8),
    reasoning: z.string().min(50).max(1000),
    assumptions: z.array(z.string()).min(1).max(5),
    confidence_level: z.enum(['high', 'medium', 'low']),
  }),
  metadata: z.object({
    agent_name: z.string(),
    tokens_used: z.object({
      input: z.number().int().positive(),
      output: z.number().int().positive(),
    }),
    latency_ms: z.number().int().positive(),
    timestamp: z.string().datetime(),
  }),
});

export type BMCSection = z.infer<typeof BMCSectionSchema>;
```

**Validation Rules:**
- `section_name` enum-locked (prevents misnamed sections)
- `points` array bounded (2–8 points per section, prevents hallucination overflow)
- `reasoning` required and bounded (50–1000 chars, must justify the points)
- `confidence_level` enum-locked (high/medium/low, no free text)
- `metadata` required (cost tracking, latency profiling)

**Source:** Individual Phase 2 agents (CustomerSegmentsAgent, ValuePropositionsAgent, etc.)
**Consumer:** Phase 3 critique agents + Phase 4 SynthesisAgent

---

### CritiqueOutput (Phase 3 Output)

Each of the 3 Phase 3 critique agents produces one `CritiqueOutput` analyzing the full 9-section BMC.

```typescript
const CritiqueOutputSchema = z.object({
  perspective: z.enum([
    'market_feasibility',
    'business_model',
    'competitive_positioning',
  ]),
  findings: z.array(z.object({
    category: z.string().min(5).max(100),
    severity: z.enum(['HIGH', 'MEDIUM', 'LOW']),
    description: z.string().min(50).max(500),
    affected_sections: z.array(z.enum([
      'customer_segments', 'value_propositions', 'channels',
      'customer_relationships', 'revenue_streams', 'key_resources',
      'key_activities', 'key_partners', 'cost_structure',
    ])).min(1).max(5),
    recommendation: z.string().min(20).max(300),
  })).min(1).max(10),
  overall_assessment: z.string().min(100).max(500),
  metadata: z.object({
    agent_name: z.string(),
    tokens_used: z.object({
      input: z.number().int().positive(),
      output: z.number().int().positive(),
    }),
    latency_ms: z.number().int().positive(),
  }),
});

export type CritiqueOutput = z.infer<typeof CritiqueOutputSchema>;
```

**Validation Rules:**
- `perspective` enum-locked (three critique angles)
- `findings` array bounded (1–10 findings max)
- `affected_sections` references validated against BMCSection section names
- `severity` enum-locked (HIGH/MEDIUM/LOW)
- All text fields have min/max bounds to prevent hallucination

**Source:** MarketFeasibilityAgent, BusinessModelAgent, CompetitivePositioningAgent
**Consumer:** Phase 4 SynthesisAgent (merges critiques into final output)

---

### FinalBMC (Phase 4 Output)

Synthesized Business Model Canvas — the final deliverable to the user.

```typescript
const FinalBMCSchema = z.object({
  executive_summary: z.string().min(100).max(500),
  canvas: z.object({
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
  critique_summary: z.object({
    high_risk_items: z.array(z.string()).max(5),
    medium_risk_items: z.array(z.string()).max(5),
    areas_of_strength: z.array(z.string()).max(5),
  }),
  strategic_recommendations: z.array(z.string()).min(1).max(5),
  next_steps: z.array(z.string()).min(1).max(5),
  metadata: z.object({
    total_cost: z.number().positive(),
    total_tokens: z.number().int().positive(),
    wall_clock_latency_ms: z.number().int().positive(),
    agents_executed: z.number().int().min(11).max(14),
    agents_failed: z.number().int().min(0),
  }),
});

export type FinalBMC = z.infer<typeof FinalBMCSchema>;
```

**Validation Rules:**
- All canvas fields required and bounded (20–300 chars each, markdown format)
- `critique_summary` arrays capped at 5 items each
- `strategic_recommendations` & `next_steps` arrays bounded (1–5 each)
- `metadata.agents_executed` expected 11–14 (OrchestratorAgent + 9 BMC + 3 critique + Synthesis)
- `metadata.agents_failed` ≥ 0 (none is good, some is acceptable)

**Source:** SynthesisAgent (merges BMCSection[], CritiqueOutput[], BusinessContext)
**Consumer:** Frontend rendering (markdown table display)

---

### AgentStatus (Real-Time Updates)

Status event emitted from server to client via SSE stream. Describes current agent executing.

```typescript
const AgentStatusSchema = z.object({
  phase: z.number().int().min(1).max(4),
  activeAgent: z.string(),
  progress: z.number().min(0).max(1), // 0.0 = 0%, 1.0 = 100%
  elapsedMs: z.number().int().min(0),
  tokensUsed: z.object({
    input: z.number().int().min(0),
    output: z.number().int().min(0),
  }),
  costUSD: z.number().min(0),
  timestamp: z.string().datetime(),
  error: z.string().optional(),
});

export type AgentStatus = z.infer<typeof AgentStatusSchema>;
```

**Emission Frequency:**
- On agent state change (start/complete/fail)
- Heartbeat every 2 seconds (keep connection alive)
- Debounced at 500ms (rapid updates coalesced)

**Consumer:** Frontend SSE listener updates UI progress bar, active agent display, cost tracking

---

### CostTracker (Operational)

Internal tracker for accumulating tokens and calculating cost-to-date.

```typescript
const CostTrackerSchema = z.object({
  phases: z.record(
    z.number().int(),
    z.object({
      agents: z.record(
        z.string(),
        z.object({
          inputTokens: z.number().int(),
          outputTokens: z.number().int(),
        })
      ),
    })
  ),
});

export class CostTracker {
  private data: Record<number, Record<string, { inputTokens: number; outputTokens: number }>>;

  record(phase: number, agentName: string, inputTokens: number, outputTokens: number): void {
    if (!this.data[phase]) this.data[phase] = {};
    this.data[phase][agentName] = { inputTokens, outputTokens };
  }

  calculate(): {
    totalInputTokens: number;
    totalOutputTokens: number;
    estimatedCostUSD: number;
  } {
    let totalIn = 0, totalOut = 0;
    for (const phase in this.data) {
      for (const agent in this.data[phase]) {
        totalIn += this.data[phase][agent].inputTokens;
        totalOut += this.data[phase][agent].outputTokens;
      }
    }
    const INPUT_COST_PER_1M = 0.80;
    const OUTPUT_COST_PER_1M = 4.00;
    const estimatedCost = (totalIn / 1_000_000) * INPUT_COST_PER_1M +
                          (totalOut / 1_000_000) * OUTPUT_COST_PER_1M;
    return { totalInputTokens: totalIn, totalOutputTokens: totalOut, estimatedCostUSD: estimatedCost };
  }
}
```

**Usage:** Server instantiates once per session, calls `record()` after each agent completes, emits cost via `calculate()` to frontend

---

## Validation Entry Points

### Phase 1 Completion
```typescript
// OrchestratorAgent output must parse as BusinessContext
const context = BusinessContextSchema.parse(agentOutput);
// Throws ZodError if validation fails
```

### Phase 2 Completion
```typescript
// Each of 9 agents' output must parse as BMCSection
const sections = await Promise.allSettled(
  agents.map(async (agent) => {
    const output = await agent.execute(context);
    return BMCSectionSchema.parse(output); // throws on invalid
  })
);
```

### Phase 3 Completion
```typescript
// Each of 3 critique agents' output must parse as CritiqueOutput
const critiques = await Promise.allSettled(
  critiqueAgents.map(async (agent) => {
    const output = await agent.critique(sections);
    return CritiqueOutputSchema.parse(output);
  })
);
```

### Phase 4 Completion
```typescript
// SynthesisAgent output must parse as FinalBMC
const finalBmc = FinalBMCSchema.parse(synthesisOutput);
// Frontend displays finalBmc.canvas as markdown table
```

---

## Failure Behavior

**Strict validation mode:** Invalid data rejects loudly with ZodError.
**Fallback mode:** If validation fails, agent is marked "failed" in phase status, marked section as incomplete, phase continues.

**Never silently coerce or default bad data.**
