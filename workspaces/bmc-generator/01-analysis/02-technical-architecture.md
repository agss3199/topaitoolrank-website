# BMC Generator — Technical Architecture Analysis

## Agent Orchestration Patterns

### Phase 1: Sequential Context Gathering

```
User Input → OrchestratorAgent (question generation)
           → Question Display + User Answer
           → Answer Processing
           → Context Normalization
           → Phase 2 Kickoff
```

**Orchestration Pattern:** Server action chains
- User idea arrives via form submission
- Server calls Claude to generate 3-5 clarifying questions (streaming for UX)
- Questions displayed in UI
- User answers submitted
- Server calls Claude to normalize answers into context object
- Transition to Phase 2

**Cost:** ~2-3 API calls, ~1000-2000 tokens total
**Latency:** 3-5 seconds wall-clock

### Phase 2: Parallel BMC Generation

```
Context Object → [9 Parallel Agents] → [9 BMC Sections]
                 ├─ CustomerSegmentsAgent
                 ├─ ValuePropositionsAgent
                 ├─ ChannelsAgent
                 ├─ CustomerRelationshipsAgent
                 ├─ RevenueStreamsAgent
                 ├─ KeyResourcesAgent
                 ├─ KeyActivitiesAgent
                 ├─ KeyPartnersAgent
                 └─ CostStructureAgent
```

**Orchestration Pattern:** Promise.all() with timeout

```typescript
const results = await Promise.allSettled(
  agents.map(agent => agent.execute(context))
);
// Each agent gets independent timeout (30s)
// Failures isolated, non-blocking
```

**Key Decision:** Use `Promise.allSettled()` not `Promise.all()`
- Reason: One agent timeout ≠ kill entire phase
- If 8/9 agents succeed, proceed (show section as "pending" or "incomplete")
- If <6 agents succeed, error state

**Cost:** 9 API calls in parallel, ~2000-3000 tokens per agent = ~25-35k tokens total
**Latency:** ~30 seconds (limited by slowest agent, not sum)
**Cost per generation:** ~$0.003 (input) + $0.01 (output) = ~$0.013 for Phase 2

### Phase 3: Parallel Critique

```
[9 BMC Sections] → [3 Critique Agents] → [3 Critique Reports]
                   ├─ MarketFeasibilityAgent
                   ├─ BusinessModelAgent
                   └─ CompetitivePositioningAgent
```

**Orchestration Pattern:** Promise.allSettled() with optional skip

```typescript
const critiques = await Promise.allSettled(
  critiqueAgents.map(agent => agent.critique(bmcSections))
);
// If critique fails, synthesis proceeds without that perspective
// UI shows "critique unavailable for this perspective" but doesn't block
```

**Cost:** 3 API calls in parallel, ~3000-4000 tokens per agent = ~12k tokens total
**Latency:** ~10 seconds
**Cost per generation:** ~$0.004 (input) + ~$0.005 (output) = ~$0.009 for Phase 3

### Phase 4: Sequential Synthesis

```
[9 BMC Sections] + [3 Critiques] → SynthesisAgent
                                 → Final BMC (Markdown)
                                 → Executive Summary
                                 → Recommendations
```

**Orchestration Pattern:** Single agent with merged input

```typescript
const finalBmc = await synthesiAgent.synthesize({
  sections: bmcSections,
  critiques: critiqueOutputs,
  userContext: context
});
```

**Cost:** 1 API call, ~5000 tokens input + ~1000 tokens output = ~$0.006
**Latency:** ~5 seconds
**Cost per generation:** ~$0.006 for Phase 4

### Total Cost Per Generation

| Phase | API Calls | Tokens (In/Out) | Cost |
|-------|-----------|-----------------|------|
| 1 | 2-3 | 1.5k / 0.5k | ~$0.005 |
| 2 | 9 | 25k / 35k | ~$0.013 |
| 3 | 3 | 12k / 9k | ~$0.009 |
| 4 | 1 | 5k / 1k | ~$0.006 |
| **Total** | **15-16** | **~44k / ~45.5k** | **~$0.033** |

⚠️ **FINDING:** Current estimate **$0.033 > $0.02 budget** ❌

**Cost Reduction Strategies:**
1. Use Sonnet instead of Opus (drop ~50%)? No, brief says use Haiku (already cheapest)
2. Reduce agent count from 9 → 6? No, brief specifies 9 sections
3. Reduce critique agents from 3 → 2? Possible, but reduces quality
4. Truncate user input more aggressively (summarize to 150 words)?
5. Use structured outputs (JSON mode) to reduce token waste?
6. Cache common business model patterns (violates single-use requirement)?
7. **Best:** Combine related agents (e.g., merge Channels + CustomerRelationships) → 7 agents instead of 9

**Recommendation:** Revisit brief to confirm 9 agents are necessary, or accept ~$0.03-0.035 per generation budget.

---

## Data Flow Through Phases

### Context Object Schema (Phase 1 → Phase 2)

```json
{
  "user_idea_summary": "string (150-200 words)",
  "industry": "string",
  "customer_type": "B2B | B2C | B2B2C",
  "target_market": "string",
  "problem_statement": "string",
  "solution_approach": "string",
  "pricing_direction": "string | null",
  "geography": "string",
  "competitive_landscape": "string",
  "key_assumptions": ["string"],
  "success_metrics": ["string"],
  "stage": "idea | prototype | revenue | growth"
}
```

**Validation:** Zod schema with strict typing

### BMC Section Output Schema (Phase 2)

Each of 9 agents produces:

```json
{
  "section_name": "customer_segments | value_propositions | channels | ...",
  "content": {
    "points": ["string"],
    "reasoning": "string",
    "assumptions": ["string"],
    "confidence_level": "high | medium | low"
  },
  "metadata": {
    "agent_name": "CustomerSegmentsAgent",
    "tokens_used": { "input": 500, "output": 300 },
    "latency_ms": 2500,
    "timestamp": "ISO8601"
  }
}
```

### Critique Output Schema (Phase 3)

Each of 3 agents produces:

```json
{
  "perspective": "market_feasibility | business_model | competitive_positioning",
  "findings": [
    {
      "category": "string (risk category)",
      "severity": "HIGH | MEDIUM | LOW",
      "description": "string",
      "affected_sections": ["string"],
      "recommendation": "string"
    }
  ],
  "overall_assessment": "string",
  "metadata": {
    "agent_name": "MarketFeasibilityAgent",
    "tokens_used": { "input": 800, "output": 400 },
    "latency_ms": 8000
  }
}
```

### Final BMC Output Schema (Phase 4)

```json
{
  "executive_summary": "string (3-4 sentences)",
  "canvas": {
    "customer_segments": "string",
    "value_propositions": "string",
    "channels": "string",
    "customer_relationships": "string",
    "revenue_streams": "string",
    "key_resources": "string",
    "key_activities": "string",
    "key_partners": "string",
    "cost_structure": "string"
  },
  "critique_summary": {
    "high_risk_items": ["string"],
    "medium_risk_items": ["string"],
    "areas_of_strength": ["string"]
  },
  "strategic_recommendations": ["string"],
  "next_steps": ["string"],
  "metadata": {
    "total_cost": 0.033,
    "total_tokens": 89500,
    "wall_clock_latency_ms": 52000,
    "agents_executed": 13,
    "agents_failed": 0
  }
}
```

---

## Real-Time Status Updates

### Agent Status Stream (UI Subscription)

Frontend subscribes to server-sent events (SSE) stream:

```typescript
const es = new EventSource('/api/bmc-generator/stream/status');
es.onmessage = (e) => {
  const update = JSON.parse(e.data);
  // update shape: { phase, activeAgent, progress, elapsed, tokens, cost }
  setUIState(update);
};
```

Server emits updates:

```typescript
// At each agent state change
response.write(`data: ${JSON.stringify({
  phase: 2,
  activeAgent: "ValuePropositionsAgent",
  progress: 3/9,
  elapsedMs: 8000,
  tokensUsed: 12500,
  costUSD: 0.0105
})}\n\n`);
```

**Key Decision:** SSE not WebSocket (simpler, one-way stream fits use case)

---

## Error Handling Strategy

### Error Boundaries

```
Phase 1 Errors:
├─ OrchestratorAgent timeout → Show manual context form (fallback UI)
├─ Question generation fails → Skip questions, collect basic info
└─ Answer parsing fails → Reject and re-ask

Phase 2 Errors:
├─ 0-2 agents fail → Continue, mark section as "incomplete"
├─ 3-4 agents fail → Continue but flag warning
├─ 5+ agents fail → Abort, show error + session log download
└─ Individual agent timeout → Use partial output or skip section

Phase 3 Errors:
├─ Single critique agent fails → Omit perspective, proceed
├─ All 3 critique agents fail → Proceed without critique section
└─ Non-blocking for Phase 4 (user still gets BMC)

Phase 4 Errors:
├─ Synthesis fails → Render Phase 2 output as fallback BMC
├─ Formatting fails → Output raw JSON for technical user
└─ Final render fails → Display "generation complete but display error"
```

### Error Isolation for Real-Time Updates

Never let error propagation kill status stream:

```typescript
try {
  const agentResult = await customerSegmentsAgent.execute(context);
  broadcastUpdate({ section: "customer_segments", status: "complete", ... });
} catch (err) {
  logger.error("CustomerSegmentsAgent failed", { error: err, phase: 2 });
  broadcastUpdate({ section: "customer_segments", status: "failed", error: "Analysis unavailable" });
  // Continue execution, don't rethrow
}
```

---

## Real-Time Cost Tracking

### Token Accounting

```typescript
interface CostTracker {
  phases: {
    [phaseNum]: {
      agents: {
        [agentName]: { inputTokens: number; outputTokens: number };
      };
    };
  };
  calculate(): {
    totalInputTokens: number;
    totalOutputTokens: number;
    estimatedCostUSD: number;
  };
}

// Haiku pricing (May 2026):
const INPUT_COST_PER_1M = 0.80;  // $0.80 per 1M input tokens
const OUTPUT_COST_PER_1M = 4.00; // $4.00 per 1M output tokens

cost = (inputTokens / 1_000_000) * INPUT_COST_PER_1M +
       (outputTokens / 1_000_000) * OUTPUT_COST_PER_1M;
```

---

## Architectural Risks

### Risk 1: Cost Overrun (Phase 2)
**Probability:** High | **Impact:** Budget blow (target $0.02, estimate $0.033)
**Mitigation:** Reduce agent count or accept higher budget

### Risk 2: Phase 2 Latency > 30 seconds
**Probability:** Medium | **Impact:** User sees slow, incomplete BMC
**Mitigation:** Aggressive timeout (20s per agent), use partial outputs

### Risk 3: Agent Output Format Drift
**Probability:** High | **Impact:** Synthesis receives unexpected JSON schema
**Mitigation:** Strict Zod validation, reject malformed output, use fallback

### Risk 4: One Failing Agent Blocks Entire Phase 2
**Probability:** Low | **Impact:** User sees "generation failed" instead of 8/9 sections
**Mitigation:** Use `Promise.allSettled()`, proceed if 6+ agents succeed

### Risk 5: Real-Time Update Stream Breaks Under Load
**Probability:** Low | **Impact:** User blind to progress (poor UX)
**Mitigation:** Debounce updates (every 500ms), cache latest state client-side

### Risk 6: Synthesis Agent Hallucinates or Contradicts Phase 2 Outputs
**Probability:** Medium | **Impact:** Final BMC inconsistent with intermediate sections
**Mitigation:** Synthesis prompt includes explicit instruction to incorporate all sections, validate before rendering

---

## Performance Optimization Paths

1. **Model Downgrade:** Haiku 3.5 already selected (fastest, cheapest)
2. **Prompt Compression:** Use JSON schemas to reduce token waste
3. **Agent Parallelization:** Already 100% parallel in Phase 2 & 3
4. **Caching:** Not applicable (single-use, no repeated queries)
5. **Concurrent Phases:** Phase 1 → 2 → 3 → 4 are sequential by design (not parallelizable)

---

## Summary Table

| Aspect | Status | Notes |
|--------|--------|-------|
| Agent Count | ✅ 13 | OrchestratorAgent, 9 BMC agents, 3 critique agents, SynthesisAgent |
| Latency Target | ⚠️ At Risk | Phase 2 alone ~30s, total 45s tight but possible |
| Cost Target | ❌ Overrun | Estimated $0.033 > $0.02 budget; need scope adjustment |
| Error Isolation | ✅ Good | Promise.allSettled() prevents cascade failures |
| Real-Time Updates | ✅ Design Complete | SSE stream, debounced updates |
| Type Safety | ✅ Plan Complete | Zod schemas for all I/O |
| Isolation (No Shared Components) | ✅ Achievable | Self-contained folder, no external imports |
