---
date: 2026-04-29
type: DECISION
title: Todo Scope & Milestone Planning — 97 Todos, 5-7 Sessions
---

## Decision

**Scope:** 97 comprehensive todos organized into 8 milestones.  
**Estimate:** 5-7 autonomous agent sessions (no human-days framing).  
**Organization:** Milestone-based with clear go/no-go gates between each.

## Rationale

The redesign is ambitious but achievable in autonomous execution because:

1. **Clear architecture:** Design System foundation → Layout structure → Interactions → Performance → Accessibility → Testing → Deployment
2. **Independent feedback loops:** Each milestone has testable acceptance criteria
3. **Manageable shard size:** Each milestone ≤15 todos, ≤500 LOC load-bearing logic
4. **Parallel work:** Milestones 5-6 can run in parallel (Performance & Accessibility independent)

## Milestone Breakdown

- **M1-M2** (Design System + Layout): 22 todos, foundational, 2-3 sessions
- **M3-M4** (Cleanup + Interactions): 23 todos, feature work, 2 sessions
- **M5-M6** (Performance + Accessibility): 26 todos, parallel work, 2 sessions
- **M7-M8** (Testing + Deployment): 26 todos, validation + release, 2 sessions

## Why 5-7 Sessions (Not 3-4)

Users often assume larger projects compress into fewer sessions. In autonomous execution:

- Session 1 designs; session 2 discovers gaps and refines → can't overlap
- Performance testing reveals issues requiring re-work
- Accessibility audit often finds edge cases (especially screen reader)
- Testing catches layout/interaction regressions (not caught earlier)
- Deployment has its own validation loop (staging → prod)

**Total:** 97 todos across 8 milestones requires ~5-7 execution sessions because each builds on the last.

## Critical Path

1. **M1 (Design System):** BLOCKING everything else. Must complete first.
2. **M2 (Layout):** BLOCKING M4 (Interactions). Must match spec before adding behavior.
3. **M3 (Remove Legacy):** Unblocks M4 (cleanup must complete before new features).
4. **M4-M6 in parallel:** Interactions, Performance, Accessibility can run simultaneously.
5. **M7-M8 sequential:** Testing then deployment (can't deploy untested code).

## Success Criteria

Each milestone has a gate:
- ✅ M1: Design tokens in CSS, Tailwind config updated
- ✅ M2: Responsive layouts verified on 3 breakpoints
- ✅ M3: No console errors, legacy code removed
- ✅ M4: All interactions implemented, no broken animations
- ✅ M5: Lighthouse Performance ≥90, LCP ≤2.2s
- ✅ M6: axe audit 0 violations, screen reader tested
- ✅ M7: All browsers/devices tested, visual regression baseline
- ✅ M8: Deployed, Core Web Vitals monitoring active

Only proceed to next milestone if gate passes.

## Specs Created

This planning phase created 5 comprehensive spec files:
- `design-system.md` — 250+ lines (colors, typography, spacing, components)
- `layout-specs.md` — 200+ lines (hero, sections, responsive, grids)
- `interactions.md` — 180+ lines (hover, scroll, forms, mobile, a11y motion)
- `performance-requirements.md` — 200+ lines (CWV targets, optimization, monitoring)
- `accessibility.md` — 250+ lines (WCAG AAA compliance, testing)

Total: ~1100 lines of spec documentation (domain authority).

Milestones 3-8 will have detailed todos written during `/implement` phase.
