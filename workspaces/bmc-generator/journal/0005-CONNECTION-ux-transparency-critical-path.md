# Connection: UX Transparency as Critical Path Item

**Date:** 2026-05-11  
**Phase:** 01-Analysis (completed)  
**Type:** Implementation Priority Insight

## Insight

User's clarification reveals that **perceived latency is more critical than actual latency**.

### Original Assumption

Brief emphasized speed: "<45 seconds target"

We interpreted this as a **performance optimization problem** → build fast agents, optimize timeouts, reduce token waste.

### User's Actual Need

User said: "Time can be increased as long as **I can SEE** that something is happening"

This reveals the **real problem isn't speed, it's transparency**.

A 90-second wait where **the user can see every agent working** is better UX than a 50-second wait with a **blank loading screen**.

---

## Why This Matters for Implementation

### Phase 2 Distribution (Parallel Agents)

**Original concern:** 9 agents in parallel might take 28-35 seconds → seemed slow.

**With real-time status UI:** 9 agents in parallel taking 28-35 seconds is **GOOD** because:
- User sees 6/9 agents completing at the 20s mark
- User sees progress (67% complete, etc.)
- Each agent completion is a small "win" the user sees
- Waiting feels active, not passive

### Real-Time Status Stream as MVP

Real-time status UI is not a "nice-to-have polish" — it's **core to the product experience**.

Without it: blank screen for 60s → terrible UX, user thinks it's broken  
With it: agent status + progress % visible → acceptable wait, user engaged

---

## Implementation Strategy Implication

### Critical Path

1. **Phase 1: SSE status stream backend**
   - Endpoint: `/api/bmc-generator/stream/status`
   - Emits updates as each agent completes
   - Non-negotiable for Phase 2

2. **Phase 2: Real-time status UI component**
   - Shows agent indicators ("bulbs")
   - Shows phase progress %
   - Consumes SSE stream
   - Non-negotiable for launch

3. **Phase 3: All 14 agents**
   - Can be built in parallel once status stream is ready
   - Status stream keeps user engaged during agent execution

### Sequencing Note

Cannot delay status UI to Phase 6 (polish). Must be in Phase 2-3 (foundation).

---

## Design Implication

Status display is not auxiliary — it's **part of the BMC output**, as important as the final canvas itself.

User will judge BMC Generator by:
1. **Quality of final BMC** (agent reasoning)
2. **Confidence in the wait** (status UI transparency)

Both must be excellent. Either one broken = product failure.

---

## Confidence Gained

This insight validates the earlier analysis:
- User is NOT asking us to make it faster (impossible without compromise)
- User IS asking us to make it transparent (absolutely doable)
- Real-time status UI directly solves user's stated need

✅ Spec (`real-time-status-ui.md`) is perfectly aligned with user's need.
