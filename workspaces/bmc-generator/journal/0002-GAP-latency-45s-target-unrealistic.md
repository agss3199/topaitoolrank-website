# Gap: <45 Second Latency Target Appears Unrealistic

**Date:** 2026-05-11  
**Phase:** 01-Analysis  
**Severity:** MEDIUM (affects user expectations)

## Finding

The brief specifies <45 second wall-clock latency for complete BMC generation. Analysis suggests this is achievable but optimistic, with realistic target closer to **50-55 seconds**.

## Latency Breakdown

| Phase | Execution | Agents | Est. Latency | Notes |
|-------|-----------|--------|--------------|-------|
| **1** | Sequential | 1 | 3-5s | Question generation (2s) + answer normalization (2-3s) |
| **2** | Parallel | 9 | 25-32s | Limited by slowest agent (30s timeout), not sum |
| **3** | Parallel | 3 | 8-12s | Critique agents process all BMC sections |
| **4** | Sequential | 1 | 4-6s | Synthesis merge & format |
| **Network overhead** | Various | N/A | 2-4s | Request serialization, response parsing, SSE updates |
| **UI rendering** | Client | N/A | 1-2s | Markdown → HTML, table layout |
| **TOTAL** | | | **43-61s** | |

## Bottleneck: Phase 2 Latency

Phase 2 dominates the budget:
- 9 agents in parallel, each with 30s timeout
- **Best case:** All agents respond in 20s (Phase 2 = 20s)
- **Typical case:** Mix of fast (10-15s) and slow (25-30s) agents → Phase 2 = 28-30s
- **Worst case:** 1 agent hits timeout (30s) → Phase 2 = 32-35s

Phase 2 alone is **28-35 seconds** → leaves only 10-17 seconds for Phases 1, 3, 4, and overhead → **impossible to hit 45s target consistently**.

## Why <45s Is Tight

### Real-World Factors Not Accounted In Design

1. **Claude API variable latency** — varies 5-20% day-to-day
2. **Network latency** — cold starts, DNS lookup, TLS handshake = 1-2s per request
3. **Model inference variance** — Haiku is fast but still variable
4. **Concurrent load** — if many users generating BMCs simultaneously, latency increases
5. **Browser rendering** — large markdown table + 9 sections takes time to render

### Mathematical Reality

```
Best case:
  Phase 1: 3s
  Phase 2: 20s (all agents fast)
  Phase 3: 8s
  Phase 4: 4s
  Overhead: 2s
  Total: 37s ✅

Realistic case:
  Phase 1: 4s
  Phase 2: 28s (mix of speeds)
  Phase 3: 10s
  Phase 4: 5s
  Overhead: 3s
  Total: 50s ⚠️

Bad luck case (one slow agent, API lag):
  Phase 1: 5s
  Phase 2: 32s (one agent slow)
  Phase 3: 12s
  Phase 4: 6s
  Overhead: 4s
  Total: 59s ❌
```

## Variance Factors

| Factor | Impact | Mitigation |
|--------|--------|-----------|
| Claude API latency variance | ±10-15% | Accept natural variance |
| Concurrent user load | +5-20% | Scale API quotas, queue if needed |
| Model choice (Haiku vs Sonnet) | ±30% | Haiku already selected (fastest) |
| Prompt length / complexity | ±10% | Keep prompts lean |
| Network/geography | ±2-5% | Use CDN, edge cache |

## Recommendations

### Option 1: Set Realistic Target of 50-55 Seconds ✅ RECOMMENDED
- Aligns with mathematical reality
- Most users will experience 45-55s range
- Still "snappy" (not "slow")
- Avoids over-promising to users

### Option 2: Optimize Phase 2 Latency
Aggressive tactics:
- Reduce timeout from 30s → 20s (risky, truncates slow agents)
- Reduce agent prompts (remove examples, reduce verbosity) → ~2-3s savings
- Use structured outputs (JSON mode) → ~1-2s savings (less token waste)
- Combine: might achieve 47-50s typical case

### Option 3: Accept 45s SLA with Caveats
- Market as "typically 45-50s"
- Document: "Latency varies based on API load, network, model inference speed"
- Acceptable if user okays managing expectations

## Recommendation for Brief

Update brief latency target from:
- **Current:** "complete BMC generation in under 45 seconds"
- **Revised:** "complete BMC generation in 45-60 seconds (typical 50-55s)"

This is still very fast and aligns with user expectations (sub-minute turnaround).

---

## Implementation Checkpoint

- [ ] Confirm latency target with user (45s vs. 50-55s)
- [ ] If 45s required: implement aggressive prompt optimization
- [ ] Implement Phase 2 timeout telemetry (monitor actual agent latencies)
- [ ] Add progress indicator to UI (manage user expectations during wait)
