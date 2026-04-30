---
date: 2026-04-29
type: TRADE-OFF
title: Spec-First (Detailed) vs Todo-First (Iterative)
---

## Trade-Off Evaluated

### Approach A: Spec-First (Chosen)
- Write detailed, comprehensive specs BEFORE todos
- Specs become the authority; todos reference specs
- Specs document every detail (colors, typography, interaction timing, performance targets)
- Implementation follows spec; deviation requires spec update

**Pros:**
- ✅ Reduces mid-implementation surprises
- ✅ Clear acceptance criteria for each feature
- ✅ Architectural decisions documented upfront
- ✅ Easier to parallelize work (specs are the contract)
- ✅ Specs become reference documentation post-launch

**Cons:**
- ❌ Takes longer upfront (1-2 days to write spec vs 0.5 days for loose plans)
- ❌ Requires rework if spec wrong (though spec includes test criteria to catch this early)
- ❌ Feels heavyweight for small projects

### Approach B: Todo-First (Not Chosen)
- Write minimal plan, jump to todos with feedback loops
- Let implementation discover edge cases
- Iterate based on what you find

**Pros:**
- ✅ Faster to start execution
- ✅ Discovers real constraints earlier
- ✅ More flexible to pivot

**Cons:**
- ❌ Each agent session starts without shared context (each re-derives decisions)
- ❌ Rework when implementation discovers conflicts
- ❌ Hard to parallelize (specs missing, agents make conflicting choices)
- ❌ Accessibility/performance easy to defer ("we'll fix it later")

---

## Decision: Spec-First

**Why this choice for homepage redesign:**

1. **Multiple simultaneous work streams:** Performance, Accessibility, Interactions can run in parallel IF specs are clear. Todo-first would serialize them (conflicts would emerge mid-work).

2. **Design-heavy domain:** Typography, spacing, colors, interactions must be consistent across all pages. Spec-first prevents creep ("just make this heading bigger" causes downstream CLS issues).

3. **Performance is non-negotiable:** Core Web Vitals targets (LCP ≤2.2s) requires planning upfront. Discovering "oh we need to remove particles" after 2 sessions of work is waste.

4. **Accessibility must be built-in:** WCAG AAA compliance can't be retrofit. Specs documenting color contrast, focus indicators, motion preferences prevent late-stage accessibility rework.

5. **Vercel deployment has fixed gates:** Specs document the gates (Lighthouse ≥90, axe 0 violations). Todo-first would hit these gates and have to iterate.

---

## Risk Mitigation

**Risk:** Specs are wrong; we build to spec and miss user intent.  
**Mitigation:** Specs include examples, rationale, and testing criteria. Each spec section has "test this by..." guidance.

**Risk:** Specs are over-detailed; implementation is rigid.  
**Mitigation:** Specs document the "why" clearly, so deviations that preserve the why are allowed (with documented rationale).

**Risk:** Specs take too long; we could be shipping already.  
**Mitigation:** Specs total ~1100 lines (equivalent to 2-3 hours of writing). Savings from parallel work + reduced rework easily offset this.

---

## Future Application

This spec-first + milestone planning approach works well for:
- ✅ Multi-discipline work (design + code + performance + a11y)
- ✅ Parallel agent execution
- ✅ High-stakes features (performance, security, accessibility)
- ✅ Projects with clear success metrics (Core Web Vitals, axe audit)

This approach is overkill for:
- ❌ Simple bug fixes
- ❌ Small internal tools
- ❌ Experimental features (throw-away code)
- ❌ Single-person projects (one agent, no parallelization benefit)

---

## Confirmation

Specs are written, detailed, and testable. Ready to proceed to `/implement` with clear architectural contract. Each milestone has acceptance criteria. Each todo references specs.

Implementation can now run autonomously with confidence that divergence will be caught at gates (Lighthouse, axe, manual QA).
