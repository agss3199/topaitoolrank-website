# BMC Generator — Cost & Performance

Operational constraints, cost model, and performance targets.

## Cost Model

### Pricing Parameters (May 2026, Claude Haiku 3.5)

```
Input tokens:  $0.80 per 1,000,000 tokens
Output tokens: $4.00 per 1,000,000 tokens
```

**Calculation Formula:**
```
cost = (input_tokens / 1_000_000) * 0.80 + (output_tokens / 1_000_000) * 4.00
```

### Per-Phase Token Budget

| Phase | Agent(s) | Typical Input | Typical Output | Phase Cost |
|-------|----------|---------------|----------------|-----------|
| 1 | OrchestratorAgent (2 calls) | 1,500 | 500 | ~$0.005 |
| 2 | 9 BMC agents (parallel) | 25,000 | 35,000 | ~$0.013 |
| 3 | 3 Critique agents (parallel) | 12,000 | 9,000 | ~$0.009 |
| 4 | SynthesisAgent | 5,000 | 1,000 | ~$0.006 |
| **Total** | **15 agents** | **~44,000** | **~45,500** | **~$0.033** |

### Cost Estimate vs Actual

**At `/start` (Phase 1A Complete):**
- Estimated cost: $0.02-0.05 (conservative range)
- Actual cost so far: $0.005 (Phase 1 only)

**During Generation (Phase 2-4):**
- Real-time cost tracking via CostTracker
- Updated every agent completion, emitted to frontend via SSE
- User sees actual_cost_so_far + estimated_remaining

**At `/generate` Complete:**
- Actual cost calculated from all 4 phases
- Displayed in final output metadata

### Cost Overrun Handling

**Current analysis:** Estimated ~$0.033 > brief target of $0.02 ✅ **User approved $0.05 budget on 2026-05-11.**

**If cost exceeds $0.05:**
1. Reduce agent count (combine 9 BMC agents → 7-8)
2. Truncate user input more aggressively (current 150-200 words → 100 words)
3. Use structured outputs (JSON mode) to reduce token waste
4. Accept the cost and revise brief budget

**Recommendation:** Ship with current $0.033 estimate and $0.05 budget. Monitor real usage. Optimize if >70% of users hit $0.05+ per generation.

---

## Performance Targets

### Latency Goals

**User Brief (Clarified May 11):**
- No hard speed target, but 60-90 seconds acceptable if visual feedback shows activity
- "Never freeze or go blank during generation" — real-time status updates CRITICAL
- Transparency > speed

**Phase Breakdown:**

| Phase | Execution | Latency | Timeout | Notes |
|-------|-----------|---------|---------|-------|
| 1 (Questions) | Sequential | 3-5s | 10s | User wait after idea submission |
| 1 (Answers) | Sequential | 3-5s | 10s | User submits answers |
| 2 (BMC Agents) | Parallel (9) | ~30s | 30s per agent | Slowest agent determines total |
| 3 (Critique) | Parallel (3) | ~15s | 15s per agent | Non-blocking if fails |
| 4 (Synthesis) | Sequential | 5-8s | 10s | Merge + format |
| **Total Wall-Clock** | Mixed | **45-65s** | — | Parallel phases overlap |

**Actual Wall-Clock Timeline:**
```
Phase 1A: 3-5s (questions generated)
User responds: N/A
Phase 1B: 3-5s (answers normalized)
Phase 2: 30s (longest agent determines)
Phase 3: 15s (concurrent with Phase 2 end, not sequential)
Phase 4: 5-8s
---
Total: 45-65s user-perceived time
```

### Performance Optimization Checkpoints

**Checkpoint 1: Phase 2 Agent Distribution**
- Measure: Time to complete slowest Phase 2 agent
- Target: <30s
- If exceeded: Increase timeout to 35s or reduce agent count

**Checkpoint 2: Token Efficiency**
- Measure: Tokens per agent (avg input, avg output)
- Target: Input <3000 per agent, Output <5000 per agent
- If exceeded: Compress prompts, truncate context

**Checkpoint 3: Synthesis Time**
- Measure: Phase 4 execution time
- Target: <8s
- If exceeded: Reduce merge complexity (fewer critiques, simpler formatting)

**Checkpoint 4: Real-Time Update Latency**
- Measure: Time between agent completion and UI update
- Target: <500ms (debounce window)
- If exceeded: Optimize SSE event serialization

### Performance Monitoring

**Log Metrics:**
```typescript
{
  session_id: "uuid",
  wall_clock_ms: 52000,
  phase_timings: {
    1_questions: 3200,
    1_answers: 3800,
    2_bmc: 31000,
    3_critique: 9500,
    4_synthesis: 6200
  },
  phase_2_slowest_agent: {
    agent: "RevenueStreamsAgent",
    latency_ms: 31000
  },
  token_usage: {
    total_input: 44200,
    total_output: 45800,
    cost_usd: 0.0333
  },
  cost_budget_percentage: 66.6, // actual / $0.05 budget
}
```

**Metrics to Track:**
- P50, P95, P99 latencies per phase
- Cost distribution (% in Phase 1 vs 2 vs 3 vs 4)
- Agent failure rate (% of agents that timeout vs complete)
- Synthesis quality (user satisfaction, BMC completeness)

---

## Token Budget Per Agent

### Phase 1 Agents

**OrchestratorAgent (generate_questions):**
- Input: 300-500 tokens (user idea + system prompt)
- Output: 200-300 tokens (3-5 questions)

**OrchestratorAgent (normalize_answers):**
- Input: 800-1200 tokens (questions + answers + system prompt)
- Output: 300-500 tokens (structured BusinessContext)

### Phase 2 Agents (9 agents, parallel)

Each receives: BusinessContext (300 tokens) + section-specific prompt (100 tokens) + system prompt (200 tokens) = ~600 tokens input per agent.

| Agent | Input | Output | Total |
|-------|-------|--------|-------|
| CustomerSegmentsAgent | 2,500 | 2,000 | 4,500 |
| ValuePropositionsAgent | 2,800 | 3,500 | 6,300 |
| ChannelsAgent | 2,500 | 2,000 | 4,500 |
| CustomerRelationshipsAgent | 2,800 | 3,000 | 5,800 |
| RevenueStreamsAgent | 3,000 | 4,000 | 7,000 |
| KeyResourcesAgent | 2,500 | 2,500 | 5,000 |
| KeyActivitiesAgent | 2,600 | 3,000 | 5,600 |
| KeyPartnersAgent | 2,500 | 2,000 | 4,500 |
| CostStructureAgent | 3,200 | 4,000 | 7,200 |
| **Phase 2 Total** | **~24,900** | **~26,000** | **~50,900** |

**Note:** Output tokens can be high due to detailed reasoning field in BMCSection output schema.

### Phase 3 Agents (3 agents, parallel)

Each receives: All 9 BMCSections (~12,000 tokens combined) + system prompt + critique instructions.

| Agent | Input | Output | Total |
|-------|-------|--------|-------|
| MarketFeasibilityAgent | 4,000 | 3,000 | 7,000 |
| BusinessModelAgent | 4,000 | 3,000 | 7,000 |
| CompetitivePositioningAgent | 4,000 | 3,000 | 7,000 |
| **Phase 3 Total** | **~12,000** | **~9,000** | **~21,000** |

### Phase 4 Agent

**SynthesisAgent:**
- Input: All 9 sections (12,000) + all 3 critiques (9,000) + user context (500) + system prompt = ~22,000 tokens
- Output: Executive summary (200) + canvas (2,000) + critique summary (500) + recommendations (300) + next steps (200) = ~3,200 tokens

| Phase 4 | Input | Output | Total |
|---------|-------|--------|-------|
| SynthesisAgent | 22,000 | 3,200 | 25,200 |

---

## Cost Reduction Strategies (If Needed)

### Strategy 1: Reduce Agent Count (9 → 7)
- Combine KeyActivities + KeyResources (both operational planning)
- Combine KeyPartners + Channels (both external relationships)
- Result: Save ~2 agents × $0.002-0.003 = ~$0.005 per generation
- Trade-off: Slightly less detailed analysis

### Strategy 2: Truncate User Input More Aggressively
- Current: Normalize to 150-200 word summary
- Reduced: Normalize to 100 words
- Result: Reduce Phase 2 input from 24.9k → 20k tokens = ~$0.002 savings
- Trade-off: Less context for agents, potentially lower quality

### Strategy 3: Use JSON Mode (Structured Outputs)
- Claude's JSON mode reduces token waste in parsing
- Estimated savings: 10-15% of output tokens
- Result: Save ~5k output tokens = ~$0.001 per generation
- Trade-off: Requires Sonnet+ (Haiku doesn't support JSON mode yet)

### Strategy 4: Reduce Critique Agents (3 → 2)
- Remove CompetitivePositioningAgent (least critical)
- Result: Save ~$0.003 per generation
- Trade-off: Less competitive analysis

**Recommendation:** Ship with current config. Monitor real usage. If >80% of users exceed $0.05, implement Strategy 2 (truncate to 100 words).

---

## Response Time SLAs

### Client-Facing Guarantees

- `/start` endpoint: <1s response time (sync)
- `/answers` endpoint: <2s response time (sync)
- `/generate` endpoint: Stream begins within 2s, full generation <90s

### Internal SLAs

- OrchestratorAgent response: <10s
- BMC Agent average response: <35s
- Critique Agent average response: <15s
- SynthesisAgent response: <10s

**If SLA violated:** Log warning, continue (non-blocking).

---

## Budget Alerts

**Frontend Display:**
- Cost so far < $0.04: Green ("Well within budget")
- Cost so far $0.04-0.048: Yellow ("Approaching budget")
- Cost so far > $0.048: Red ("Budget nearly exceeded")

**Fallback if true cost exceeds $0.05:**
- Still complete generation (don't interrupt user)
- Show warning after completion: "Generation cost $0.053 exceeded budget by $0.003"
- No charge to user (absorb overage for now)
- Log incident for review

---

## Timeout Strategy (Three-Tier Fallback)

**Commitment:** User will ALWAYS see output. Timeout will NEVER result in a blank canvas or wasted money.

### Tier 1: Normal Completion (<90s)
- All 4 phases complete within time budget
- User sees full canvas + critique + recommendations
- User charged actual cost (tokens used)

### Tier 2: Soft Timeout (90-100s)
- If Phase 2 or Phase 3 exceeds time budget:
  - Skip remaining agents in current phase
  - Move to next phase with completed sections
- Example: Phase 2 running 40s, only 7/9 agents done → skip agent 8 & 9, start Phase 3
- User sees partial canvas (completed sections only, others marked [SKIPPED])
- User charged actual cost only

### Tier 3: Hard Timeout (>120s)
- Abort immediately, return whatever is available:
  - If Phase 2+ complete: return partial BMC (completed sections, mark skipped)
  - If Phase 2 incomplete: return raw agent outputs formatted as markdown
  - If Phase 1 only: show "generation failed, try again"
- User charged actual cost only (never full $0.25 budget)

**Per-Phase Timeouts:**
- Phase 1 (Questions + Answers): Hard 15s
- Phase 2 (BMC Agents): Soft 45s (skip agents at 40s if needed, hard 45s if still running)
- Phase 3 (Critique): Soft 25s (skip at 20s if needed, hard 25s)
- Phase 4 (Synthesis): Hard 15s (if fails, use Tier 3 fallback)

---

## Cost Charging on Partial Success

When generation times out or completes partially:

```
actualCost = (inputTokens / 1,000,000) * 0.80 + (outputTokens / 1,000,000) * 4.00
user.charge(actualCost)  // NOT the $0.25 budget
```

**Example:**
- User generation times out at 100s
- Actual tokens used: 32,000 input + 22,000 output
- Actual cost: (32/1,000,000 × 0.80) + (22/1,000,000 × 4.00) = $0.114
- User charged: $0.114 (not $0.25)

---

## Latency Alert Thresholds

- Phase 2 takes >40s: Show message "Analysis taking longer than usual, still running..." + estimated time remaining
- Total time exceeds 90s: Switch to Tier 2 behavior (skip remaining agents)
- Total time exceeds 120s: Switch to Tier 3 behavior (hard abort, return partial output)

---

## Caching & Reuse (Out of Scope, Phase 6+)

**Out of scope for MVP:** Caching previous results to reduce re-computation cost.

**Future consideration:** Store completed BMCs in database, allow user to regenerate same idea for free (cache hit). Would reduce cost for "user revises idea" scenario.

---

## Summary Table

| Metric | Target | Actual (Estimate) | Status |
|--------|--------|-------------------|--------|
| Cost per generation | <$0.05 (approved) | $0.033 | ✅ Within budget |
| Total wall-clock time | <90s with feedback | ~50-60s | ✅ Exceeds goal |
| Phase 2 latency | <30s | ~30s (at limit) | ⚠️ Monitor |
| Real-time updates | <500ms debounce | <500ms (planned) | ✅ Design included |
| Token efficiency | <3k input/agent | 2.8k avg | ✅ Good |
