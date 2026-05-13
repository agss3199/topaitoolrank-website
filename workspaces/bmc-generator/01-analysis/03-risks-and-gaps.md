# BMC Generator — Risks and Gaps Analysis

## Critical Risks

### Risk 1: Cost Overrun ❌ BLOCKING
**Severity:** HIGH
**Status:** UNRESOLVED

**Finding:** Current token estimate ~44-45k tokens per generation = $0.033 USD
**Budget:** Brief specifies <$0.02 per generation
**Gap:** Overrun by $0.013 (~165% of budget)

**Root Cause:**
- 9 BMC agents each processing ~2000-3000 tokens = 25-35k tokens
- 3 critique agents processing all 9 sections = ~12k tokens
- Synthesis agent = ~5k tokens
- Overhead and retries = ~1k tokens

**Options:**
1. Reduce agent count (consolidate related sections, e.g., merge Channels + Relationships = 7 agents instead of 9)
2. Truncate user input more aggressively (currently 150-200 words; could reduce to 100 words)
3. Use structured outputs (JSON mode) to reduce token waste (estimated 10-15% savings = ~$0.028, still over)
4. Accept higher budget (~$0.03 per generation, ~50% overrun)
5. Accept lower model quality (use even cheaper model than Haiku? No cheaper option exists)

**Recommendation:** 
- Confirm with user: is $0.02 hard constraint or target?
- If hard constraint, MUST reduce from 9 to 6-7 agents
- If target, propose revised budget $0.03-0.035 and implement accordingly

**MUST RESOLVE before implementation begins** — impacts agent selection

---

### Risk 2: Phase 2 Latency Overrun
**Severity:** HIGH
**Status:** UNRESOLVED

**Finding:** 9 agents in parallel with 30s timeout each = theoretical 30-32s just for Phase 2
**Target:** <45s total for all 4 phases
**Gap:** Phase 2 alone consumes 67% of total budget

**Breakdown:**
- Phase 1: 3-5 seconds (sequential)
- Phase 2: 25-32 seconds (parallel, limited by slowest agent)
- Phase 3: 8-12 seconds (parallel)
- Phase 4: 4-6 seconds (sequential)
- Network overhead: 2-4 seconds
- **Total: 42-59 seconds** ⚠️

**Worst Case:** If any agent takes 32s, total hits 45-50s → misses target

**Mitigation Strategies:**
1. Reduce timeout from 30s → 20s (aggressive, risk of truncated outputs)
2. Reduce agent count → faster Phase 2 (same as cost mitigation)
3. Use Haiku 3.5 vs Sonnet (already using Haiku, fastest available)
4. Optimize prompts (remove examples, reduce context) → estimated 2-3s savings
5. Pre-compute context (cache common answers) → not applicable (single-use)
6. Accept 50-55s latency as realistic target instead of 45s

**Recommendation:** 
- Set realistic target of 50-55s instead of 45s
- Implement aggressive prompt optimization (remove examples, reduce verbosity)
- Monitor Phase 2 latency in production, adjust timeouts based on real data

---

### Risk 3: Agent Output Format Drift
**Severity:** MEDIUM
**Status:** PARTIALLY MITIGATED

**Finding:** If agents don't return expected JSON schema, downstream phases break
**Example:** Customer segments agent returns markdown instead of JSON → synthesis agent chokes

**Mitigation:**
- Zod validation on every agent output
- Fallback to empty/minimal section if validation fails
- Synthesis agent can handle missing sections (uses only what it gets)

**Residual Risk:** Validation failures silently produce empty sections → user sees incomplete BMC

**Recommendation:** 
- Implement validation as strict as possible (fail fast, not silent)
- Render error state: "Customer Segments unavailable (analysis failed)" vs empty section
- Log validation errors for debugging

---

### Risk 4: Real-Time Update Stream Breaks or Stutters
**Severity:** MEDIUM
**Status:** DESIGN COMPLETE

**Finding:** If status updates don't flow, user sees no progress → poor UX

**Mitigation:**
- Use SSE (Server-Sent Events) not WebSockets (simpler, one-way fits use case)
- Debounce updates every 500ms (avoid overwhelming browser)
- Cache latest status client-side, fall back if stream drops
- Timeout stream after 60s (force reconnect)

**Recommendation:** 
- Implement robust SSE with reconnection logic
- Test with artificial delays (simulate slow Claude responses)
- Add fallback: if stream silent for 5s, show "generation in progress..." spinner

---

### Risk 5: Synthesis Agent Hallucinates Contradictions
**Severity:** MEDIUM
**Status:** MITIGATED VIA PROMPT DESIGN

**Finding:** Synthesis receives 9 potentially contradictory outputs → may hallucinate explanations
**Example:** Customer segments say "B2B only", but Revenue agent says "freemium B2C model"

**Mitigation:**
- Synthesis prompt explicitly instructs to flag contradictions
- Synthesis prioritizes lower-cost or conservative estimates when conflict exists
- Output includes "contradictions_found" array

**Recommendation:** 
- Include explicit instruction in synthesis prompt: "If sections contradict, flag as 'REQUIRES CLARIFICATION' and use conservative estimate"
- Test synthesis agent with deliberately contradictory inputs

---

### Risk 6: One Agent Failure Cascades
**Severity:** MEDIUM-LOW
**Status:** MITIGATED

**Finding:** If CustomerSegmentsAgent fails → ValuePropositionsAgent receives no context → bad output

**Mitigation:**
- Phase 2 agents receive original context from Phase 1, NOT outputs of other Phase 2 agents
- Each agent works independently
- Synthesis merges outputs (doesn't feed outputs as inputs)

**Status:** Architecture already prevents this

---

### Risk 7: User Input Too Vague
**Severity:** LOW-MEDIUM
**Status:** MITIGATED VIA ORCHESTRATOR

**Finding:** If user input is too vague (e.g., "make a saas"), BMC output is generic/unhelpful

**Mitigation:**
- OrchestratorAgent asks clarifying questions to flesh out idea
- Rejects inputs <50 words
- If questions don't yield useful context, falls back to minimal BMC with "insufficient context" warning

**Recommendation:** 
- Set minimum idea word count: 50 words
- Set expectation: "Better ideas = better BMCs"

---

### Risk 8: No Error Telemetry
**Severity:** LOW
**Status:** DESIGN COMPLETE

**Finding:** If agent fails, user has no way to report what went wrong

**Mitigation:**
- Log all agent calls, outputs, errors to sessionStorage
- Debug mode (?debug=true URL param) shows raw JSON payloads
- Error screen offers "Report this" button → copies entire session log to clipboard

**Recommendation:** 
- Implement logging from day 1 (don't defer)
- Test error reporting UI before launch

---

## Gaps in Specification

### Gap 1: Agent Prompt Examples
**Status:** UNADDRESSED

Agents need few-shot examples in system prompts (e.g., "Here's an example of a good customer segments output...")

**Mitigation:** Create library of realistic examples from business idea samples

**Owner:** Implementation phase (when real examples exist)

---

### Gap 2: Clarifying Questions Format
**Status:** PARTIALLY ADDRESSED

OrchestratorAgent spec says "ask 3-5 questions" but doesn't specify:
- Question type (open-ended vs multiple choice)
- Answer format (free text only, or provide options?)
- Display format (modal, sidebar, sequential?)

**Recommendation:** 
- Use open-ended text input (more flexible)
- Display questions sequentially (not all at once) → better UX
- Optional quick answers for power users (e.g., "B2B SaaS" button)

---

### Gap 3: Phase 1 Fallback Path
**Status:** SPECIFIED BUT UNCLEAR

If OrchestratorAgent fails → "fallback to minimal context form"

Need to specify: what IS the minimal context form? What fields required?

**Recommendation:** 
Create minimal form:
- Industry (required)
- Customer type: B2B/B2C (required)
- Problem: what problem do you solve? (required)
- Solution: how? (required)
- Everything else optional

---

### Gap 4: Critique Severity Definitions
**Status:** SPECIFIED BUT NEEDS CALIBRATION

Critique agents output HIGH/MEDIUM/LOW severity, but no clear thresholds.

**Gap:** What makes something HIGH vs MEDIUM?
- HIGH = breaks business model entirely (should user abandon idea?)
- MEDIUM = significant obstacle but solvable
- LOW = interesting observation, doesn't block viability

**Recommendation:** 
Define in critique agent system prompts with clear examples

---

### Gap 5: BMC Markdown Rendering
**Status:** UNSPECIFIED

Synthesis produces JSON, but UI needs to render as markdown table + text.

**Gap:** Exact format of markdown output not defined.

**Recommendation:** 
Define standard 9x1 BMC markdown table format (sketch in UI spec)

---

### Gap 6: Mobile Responsiveness
**Status:** UNSPECIFIED

BMC is a 9-section table. On mobile, this doesn't fit.

**Gap:** How is BMC displayed on mobile?

**Recommendation:** 
- Stack sections vertically on mobile
- Or: section tabs with swipe navigation
- Or: full-width scrolling table

Define before implementation

---

### Gap 7: Export / Share
**Status:** EXPLICITLY OUT OF SCOPE

Brief says "markdown table only", no PowerPoint/PDF/Figma export.

**Gap:** Can user copy the BMC? Share a link?

**Recommendation:** 
- Allow copy-to-clipboard (markdown)
- No share links (ephemeral, not persisted)
- No export beyond markdown

---

## Dependency Assumptions

### Assumption 1: Claude 3.5 Haiku Availability
**Risk:** If Haiku retires or pricing changes, cost budget fails

**Mitigation:** Use latest available cheapest model at deployment time

---

### Assumption 2: API Latency <5s
**Risk:** If Claude API average latency >5s, can't hit 45-50s target

**Mitigation:** Accept 50-55s as realistic latency if API is slow

---

### Assumption 3: User Idea Input is English
**Risk:** Non-English ideas → poor analysis

**Mitigation:** Explicitly state "English only" in UI

---

## Success Criteria

| Criterion | Target | Current Status |
|-----------|--------|-----------------|
| **Cost per generation** | <$0.02 | ❌ ~$0.033 (overrun) |
| **Latency** | <45s | ⚠️ ~50-55s realistic |
| **All 9 BMC sections populated** | 100% | ✅ Design supports |
| **Error isolation (1 agent fail ≠ break system)** | Yes | ✅ Design supports |
| **Real-time status visible** | Yes | ✅ SSE design complete |
| **Type-safe (TypeScript strict)** | Yes | ✅ Zod schemas designed |
| **No shared components** | 100% isolation | ⚠️ Need to verify during implementation |
| **Cost accuracy (within 10%)** | ±10% | ⚠️ Need to validate with real calls |

---

## Recommendations Before Implementation

1. **CRITICAL: Resolve cost budget** 
   - Decide: hard constraint ($0.02) or target ($0.02-0.03)?
   - If hard constraint, reduce agent count from 9 → 6-7
   
2. **Accept realistic latency target of 50-55s** instead of 45s

3. **Define Phase 1 minimal fallback form** (what fields required if orchestrator fails?)

4. **Calibrate critique severity thresholds** (what's HIGH vs MEDIUM?)

5. **Define mobile BMC rendering strategy** (stack vertical, tabs, or scroll?)

6. **Create example BMC outputs** for few-shot prompts (needed before launch)

7. **Set up cost tracking validation** (confirm pricing formulas match actual API usage)
