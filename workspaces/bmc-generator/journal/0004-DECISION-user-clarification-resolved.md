# Decision: User Clarification Resolves Blocking Constraints

**Date:** 2026-05-11  
**Phase:** 01-Analysis (continued)  
**Type:** Requirements Clarification

## User Input (May 11, 2026)

User clarified constraints:
- "Keep cost up to **$0.05**"
- "Time can be increased as long as **agent bulbs at the bottom is showing some activity**"
- Need "something coming on the screen which shows it is actually working"
- Need "a % sign of how much is done for **each phase** so user knows it is working and waits"

## Impact: Two Blocking Decisions NOW RESOLVED ✅

### Decision 1: Cost Budget — RESOLVED ✅
- **Previous constraint:** <$0.02 (BLOCKING)
- **New constraint:** Up to **$0.05** per generation
- **Implication:** 
  - ✅ **Keep all 9 BMC agents** (no consolidation needed)
  - ✅ **Keep all 3 red team agents** (no cuts)
  - ✅ Full architectural scope preserved
  - Cost estimate $0.033 is **well within $0.05 budget** (66% headroom)

### Decision 2: Latency / UX — RESOLVED ✅
- **Previous constraint:** <45 seconds (BLOCKING)
- **New constraint:** "Time can be increased as long as [visual feedback shows activity]"
- **Implication:**
  - ✅ **No hard latency constraint** (60-90 seconds acceptable)
  - ✅ Focuses on **user experience during wait**, not wall-clock time
  - ✅ Allows full 9-agent parallelization without timeout pressures
  - ⚠️ **Requires robust real-time status UI** (HIGH PRIORITY)

---

## Key Insight: UX-First Approach

User is saying: **"I don't mind if it takes longer, as long as I can SEE that something is happening."**

This shifts the priority from **speed optimization** to **transparency/UX optimization**.

### What This Means for Implementation

**Real-time status display becomes CRITICAL.**

Must implement:

1. **Agent Status Indicators ("Agent Bulbs")**
   - Visual indicator for each active agent
   - Shows which agent is currently executing
   - Updates in real-time as agents complete
   - Design: colored circles/dots at bottom of screen, e.g.:
     ```
     Phase 1 (Orchestrator):  ⚫ (active) → ✅ (done)
     Phase 2 (9 BMC agents):  ⚫⚫⚫⚫⚫⚫⚫⚫⚫ (mix of active/done)
     Phase 3 (3 critique):    ⚫⚫⚫ (waiting) → ⚫⚫✅ (2 done, 1 active)
     Phase 4 (Synthesis):     ⚬ (not started) → ⚫ (active)
     ```

2. **Phase Progress Percentage**
   - Show % complete for each of 4 phases
   - Update every agent completion
   - Design:
     ```
     Phase 1: 100% complete
     Phase 2: 67% complete (6/9 agents done)
     Phase 3: Waiting...
     Phase 4: Waiting...
     ```

3. **Active Agent Name/Description**
   - Show which agent is currently working
   - Show brief description of what it's analyzing
   - Design:
     ```
     Currently analyzing: ValuePropositionsAgent
     (Identifying why customers would buy this...)
     ```

4. **Cost Accumulation Display**
   - Show running total cost in real-time
   - Update as tokens are consumed
   - Design:
     ```
     Current cost: $0.015
     Est. total: $0.032
     ```

5. **Elapsed Time**
   - Show how long generation has been running
   - Helps user understand progress
   - Design:
     ```
     Elapsed: 23 seconds
     ```

---

## Implementation Priority Update

### CRITICAL (blocks user experience)
1. SSE real-time status stream
2. Agent status indicator UI ("bulbs")
3. Phase progress percentage
4. Active agent display + description

### HIGH (improves experience)
5. Cost tracking + display
6. Elapsed time display
7. Animated progress (spinning icons, pulsing indicators)
8. Mobile-responsive status display

### MEDIUM (nice-to-have)
9. Estimated time remaining
10. Agent telemetry (tokens, latency per agent)

---

## No Longer Blocking: Full 9-Agent Architecture

With $0.05 budget, we can proceed with FULL specification:

✅ **Phase 1:** 1 OrchestratorAgent  
✅ **Phase 2:** 9 BMC agents (no consolidation)
✅ **Phase 3:** 3 red team agents (no cuts)  
✅ **Phase 4:** 1 SynthesisAgent

**Total:** 14 agents, all specified, all implemented.

---

## Next Steps

1. ✅ Update cost budget in brief (done)
2. ✅ Document decision in journal (doing)
3. Update `/todos` phase to prioritize real-time status UI
4. Proceed to `/todos` — no more blocking decisions

---

## Verification Checklist

Before implementation launch:
- [ ] SSE status stream fully implemented
- [ ] Agent status "bulbs" display updates in real-time
- [ ] Phase progress % accurate (count completed agents)
- [ ] Active agent name + description visible
- [ ] No UI flicker or freezing during 60-90 second wait
- [ ] Mobile responsive (status visible on small screens)
- [ ] Cost display accurate (within ±5%)
- [ ] All 14 agents executing without timeout
