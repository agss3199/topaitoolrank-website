# Timeout + Partial Output + Cost Guarantee (2026-05-12)

**Severity:** CRITICAL  
**User Request:** "Make sure it generates in 90 seconds or increase time. I do not want it to fail without any output to show and make my money go to waste."

---

## The Risk

Current spec has **three unresolved gaps** at the critical moment (generation timeout):

1. **Hard 90s timeout with no fallback** — If generation takes 95s and we're enforcing a 90s hard cutoff, what happens?
   - Current spec says "return partial results if available" but doesn't guarantee partial results
   - User's fear: timeout → blank canvas + $0.25 charged = wasted money + wasted time

2. **Cost charging on partial failure** — If generation uses $0.18 of tokens and then times out, does user get charged $0.25?
   - Current spec mentions $0.05 budget alerts but not "what gets charged on timeout"
   - User wants: pay for what was used, not the full budget

3. **Synthesis agent timeout leaves no output** — If Phase 2-3 complete but Phase 4 (synthesis) times out, we have 9 raw sections + 3 critiques but no final canvas
   - Current spec says "fallback BMC (raw Phase 2 output formatted as markdown)" but this is vague
   - User wants: **always show something** rather than a blank screen

---

## Solution: Three-Tier Fallback Strategy

### Tier 1: Normal Completion (<90s)
- All 4 phases complete
- Charge actual cost (tokens used)
- Show full canvas + critique + recommendations

### Tier 2: Soft Timeout at 100s (10s grace)
- If Phase 2 or Phase 3 takes longer than expected, extend window to 100s
- Skip remaining agents if we're running out of time
- Example: Phase 2 at 40s, 7/9 agents done → skip agent 8 & 9, move to Phase 3
- Fall back to synthesis with whatever sections completed
- Charge actual cost only

### Tier 3: Hard Timeout at 120s (Full Abort)
- If still running at 120s, abort immediately
- Return whatever output is available:
  - If Phase 2+ complete: return partial BMC (completed sections only, mark missing as "skipped")
  - If Phase 2 incomplete: return raw agent outputs (formatted as markdown, not a canvas)
  - If Phase 1 only: return error + try again button
- Charge actual cost only (don't charge full $0.25 budget)

---

## Implementation Details

### 1. Total Timeout Tracking
```typescript
const totalTimeoutMs = 120_000; // 120 seconds hard limit
const startTime = Date.now();

// In orchestration loop:
while (phases_remaining) {
  elapsed = Date.now() - startTime;
  timeRemaining = totalTimeoutMs - elapsed;
  
  if (timeRemaining < 5_000) {
    // 5s or less: abort current phase, move to fallback
    skipPhase();
    break;
  }
  
  if (timeRemaining < 15_000 && phaseCount > currentPhase) {
    // Less than 15s left and more phases to go: skip remaining agents in this phase
    skipRemainingAgents();
  }
}
```

### 2. Per-Phase Smart Timeouts
- Phase 1: Hard 15s (if fails, abort)
- Phase 2: Soft 45s (if >40s elapsed, skip agents, move to Phase 3)
- Phase 3: Soft 25s (if >20s elapsed, move to Phase 4)
- Phase 4: Hard 15s (if fails, use Tier 3 fallback)

### 3. Cost Charging on Partial Success
```typescript
// Track actual tokens used, not budgeted tokens
const actualCost = (inputTokens / 1_000_000) * 0.80 + (outputTokens / 1_000_000) * 4.00;

// Charge only what was used (not the $0.25 budget)
user.charge(actualCost);

// Log for monitoring
log({
  sessionId,
  totalWallClockMs,
  actualCost,
  budgetRemaining: 0.25 - actualCost,
  completionState: "tier_2" // or tier_1, tier_3
});
```

### 4. Guaranteed Output Structure (Tier 3 Fallback)
```typescript
interface FallbackBMC {
  completion: "full" | "partial" | "agents_only";
  sections: {
    [key: string]: {
      content: string;
      source: "agent" | "fallback";
      completed: boolean;
    };
  };
  critiques: CritiqueOutput[];
  message: string; // "Generation completed in 87s" or "Generation timed out at 120s, showing partial results"
  cost: number;
}

// Tier 3 example:
{
  completion: "partial",
  sections: {
    customer_segments: { content: "...", source: "agent", completed: true },
    value_propositions: { content: "...", source: "agent", completed: true },
    channels: { content: "[SKIPPED - timeout]", source: "fallback", completed: false },
    // ... etc
  },
  critiques: [...], // whatever completed
  message: "Generation timed out at 120s. Showing 6/9 completed sections.",
  cost: 0.18 // actual, not $0.25
}
```

---

## Spec Changes Required

### cost-performance.md
- Add section: "Timeout Strategy (Tier 1-3)"
- Update line 236 from `<90s` to `<100s with grace` or `<120s hard limit`
- Add "Cost Charging on Partial Success" subsection

### api-orchestration.md
- Update `/generate` orchestration to include timeout loop + skip logic
- Update error handling to return Tier 3 fallback structure (not just 500)
- Add "Partial Output Guarantee" section

### ui-ux-flow.md
- Update Phase 4 canvas display to handle `completion: "partial"`
- Add visual indicator for skipped/fallback sections
- Example: gray background or striped pattern for skipped sections

---

## Frontend Commitment to User

**Display Message Examples:**

✅ **Normal (Tier 1):** "Generation complete in 67 seconds. Cost: $0.18"

⚠️ **Soft Timeout (Tier 2):** "Generation completed in 98 seconds (one agent skipped). Cost: $0.16"

❌ **Hard Timeout (Tier 3):** "Generation ran out of time at 120s. Showing 6/9 completed sections. Cost: $0.12. [Try Again]"

**User guarantee:** You will ALWAYS see output (not a blank canvas). You will pay ONLY for tokens actually used.

---

## Acceptance Criteria

- [ ] Total timeout tracking implemented in orchestration
- [ ] Per-phase smart timeouts (skip agents if running out of time)
- [ ] Cost tracking charged on actual tokens, not budget
- [ ] Tier 3 fallback returns structured partial output (not 500 error)
- [ ] Frontend displays fallback sections with visual indicator (gray background)
- [ ] Frontend shows cost charged (not budgeted)
- [ ] Manual test: force Phase 2 to slow mode, verify Tier 2 behavior
- [ ] Manual test: force all phases to slow mode, verify Tier 3 behavior

---

## Related

- `specs/cost-performance.md` § "Latency Alert Thresholds" (needs update)
- `specs/api-orchestration.md` § "Orchestration (Server-Side Workflow)" (needs update)
- `specs/ui-ux-flow.md` § "Phase 4: BMC Display" (needs update for partial sections)
