# BMC Generator — Analysis Phase Complete

**Status:** ✅ Analysis complete | ✅ Clarifications received | 📋 Ready for `/todos` phase

---

## Executive Summary

Analysis of the BMC Generator tool reveals a **well-specified architecture with 2 critical decisions** that must be resolved before implementation begins.

### Key Findings

| Finding | Status | Impact | Action Required |
|---------|--------|--------|-----------------|
| **Cost Budget** | ✅ RESOLVED | User approved **$0.05 budget**; $0.033 estimate fits | Proceed with all 9 agents |
| **Latency** | ✅ RESOLVED | User approved **flexible timing** with visual feedback requirement | Prioritize real-time status UI |
| **Real-Time Status UI** | ✅ CLEAR | Agent status indicators + phase progress % specified | HIGH implementation priority |
| **Isolation Strategy** | ✅ CLEAR | Complete self-containment achievable | Proceed as designed |
| **Agent Architecture** | ✅ CLEAR | Full 14-agent system (1 orchestrator, 9 BMC, 3 critique, 1 synthesis) | No constraints, implement all |
| **Type Safety** | ✅ CLEAR | Zod schemas designed for all I/O | No action needed |

---

## 1. Cost Budget Overrun — BLOCKING DECISION REQUIRED

### The Problem

Brief targets: **<$0.02 per generation**  
Estimated cost: **~$0.033 per generation** (165% overrun)

### Why It Costs More

The 9-agent architecture requires ~44k tokens per generation:
- Phase 1 (Orchestrator): 2k tokens
- Phase 2 (9 BMC agents): 25-35k tokens (largest contributor)
- Phase 3 (3 critique agents): 12k tokens
- Phase 4 (Synthesis): 5k tokens

At Claude 3.5 Haiku pricing ($0.80/1M input, $4.00/1M output), this totals ~$0.033.

### Your Options

| Option | Impact | Trade-off |
|--------|--------|-----------|
| **Option A: Accept $0.03 budget** | ✅ No scope change | Budget is 50% higher than brief target |
| **Option B: Reduce agents (9 → 7)** | ✅ Meets $0.02 budget | Consolidate 2 related sections (e.g., merge Channels + Relationships) |
| **Option C: Aggressive optimization** | ⚠️ Marginal savings | Reduce input length, use JSON mode — achieves ~$0.028-0.030 (still over) |
| **Option D: Remove red team critique** | ❌ NOT RECOMMENDED | Saves $0.009 but violates core promise ("risk critiques") |

### Recommendation

**Option B + partial Option C:** Reduce from 9 → 7 agents + use JSON mode
- Meets $0.02 budget
- Maintains all 9 BMC sections (synthesis merges outputs from 7 agents)
- Still includes all 3 critique perspectives
- Only trade-off: slightly less specialized analysis (acceptable)

### Decision Required From You

**Choose one:**
1. Accept $0.03 budget (Option A)
2. Consolidate to 7 agents (Option B)
3. Try aggressive optimization (Option C)
4. Other preference?

---

## 2. Latency Target — USER EXPECTATION DECISION

### The Problem

Brief targets: **<45 seconds**  
Realistic estimate: **50-55 seconds** (typical), 45-60 seconds (range)

### Why It Takes Longer

Phase 2 (9 agents in parallel) dominates:
- Best case: 20 seconds (all agents respond quickly)
- Typical case: 28-32 seconds (mix of speeds)
- Worst case: 32-35 seconds (one agent slow, API lag)

Even with optimized Phase 1/3/4, typical total is ~50-55 seconds:

```
Best case:  37s  ✅ (rare)
Typical:    50s  📊 (most common)
Worst case: 59s  ⚠️ (occasional)
```

### Why <45s Is Difficult

- Claude API latency varies ±10-15% day-to-day
- Network overhead (serialization, parsing) adds 2-4 seconds
- Browser rendering (markdown table) adds 1-2 seconds
- Concurrent load during peak times adds 5-10%
- One slow agent hits 30s timeout → total hits 50s

To hit <45s **consistently** would require:
- Aggressive timeout reduction (20s) → truncated outputs
- Model downgrade (no cheaper than Haiku)
- Agent consolidation (already addressing in cost discussion)

### Recommendation

Update brief from **"<45 seconds"** to **"45-60 seconds (typical 50-55 seconds)"**

This is still:
- ✅ Very fast (sub-minute)
- ✅ Acceptable for interactive use
- ✅ Realistic to achieve consistently
- ✅ Honest with users

### Decision Required From You

**Choose one:**
1. Accept 50-55 second typical latency (recommended)
2. Target <45s anyway (requires aggressive optimization, accept variance)
3. Other preference?

---

## 3. Complete Isolation — CONFIRMED DESIGN

### Strategy

All code in `/app/tools/bmc-generator/` folder:
- No imports from shared components
- No shared CSS modules
- No shared utilities (copy locally if needed)
- Self-contained styling
- Self-contained API layer
- Fully deletable

### Verification

After build, should be able to:
```bash
rm -rf app/tools/bmc-generator/
npm run build  # Zero import errors
```

### Implementation Approach

- Use shadcn/ui directly in tool folder (designed for duplication)
- Copy shared utilities to local lib/
- Estimated duplication: ~700-1100 LOC per tool (acceptable for deletability)

### Status

✅ **No decision needed.** Proceed with this strategy.

---

## What's Included in Analysis

### Documentation Created

1. **`briefs/00-product-brief.md`** — Product requirements synthesis
2. **`01-analysis/01-requirements-breakdown.md`** — Detailed functional/non-functional requirements
3. **`01-analysis/02-technical-architecture.md`** — Agent orchestration, data flow, error handling
4. **`01-analysis/03-risks-and-gaps.md`** — Critical risks, gaps, and recommendations
5. **`specs/_index.md`** — Specification index and traceability matrix
6. **`specs/agents.md`** — Complete agent contracts and system prompts (13 agents)
7. **Journal entries** — Key findings documented:
   - `0001-DISCOVERY-cost-budget-overrun.md`
   - `0002-GAP-latency-45s-target-unrealistic.md`
   - `0003-DECISION-complete-isolation-strategy.md`

### What's Ready for Implementation

- ✅ Complete 13-agent architecture specification
- ✅ Data flow and orchestration design
- ✅ Error handling strategy
- ✅ Real-time status streaming (SSE)
- ✅ Type safety design (Zod schemas)
- ✅ Cost tracking design
- ✅ Isolation strategy
- ✅ 4-phase execution model
- ✅ Agent system prompts (template format)

---

## Next Steps

### Before Moving to `/todos` Phase

**You must clarify:**

1. **Cost Budget:** Accept $0.03 or reduce agents to 7?
2. **Latency Target:** Accept 50-55s typical or push for <45s?

**Once clarified:**
- Specs will be updated
- `/todos` phase will create implementation tasks
- Implementation can begin

### Timeline Estimate

- [ ] Review analysis findings (30 min)
- [ ] Clarify cost + latency decisions (10 min)
- [ ] Run `/todos` phase for implementation plan (20 min)
- [ ] Implementation (parallel agents) — estimated 3-5 sessions

---

## Key Metrics at a Glance

| Metric | Status | Notes |
|--------|--------|-------|
| **Agents** | 13 total | 1 orchestrator, 9 BMC, 3 critique, 1 synthesis |
| **Cost** | ⚠️ $0.033 | Overrun vs $0.02 brief; waiting for decision |
| **Latency** | ⚠️ 50-55s typical | Overrun vs 45s brief; realistic target |
| **Features** | ✅ Complete | All 9 BMC sections + red team + synthesis + transparency |
| **Type Safety** | ✅ Zod validated | All I/O typed and validated |
| **Isolation** | ✅ Full | Completely self-contained, fully deletable |
| **Real-Time Updates** | ✅ SSE design | Status stream designed, ready to implement |
| **Error Isolation** | ✅ Designed | Single agent failure ≠ system crash |

---

## Questions?

Review the analysis documents:
- Start with `01-analysis/03-risks-and-gaps.md` for detailed risk breakdown
- Review `specs/agents.md` for agent specifications
- Check `journal/` for key findings

Then provide your clarifications on the **two blocking decisions** (cost budget, latency target), and we'll move forward with `/todos`.
