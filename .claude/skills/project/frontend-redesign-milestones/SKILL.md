# Frontend Redesign: 8-Milestone Sequence

## Overview

A proven 8-milestone dependency graph for complete frontend redesigns. Optimizes for parallelization while respecting ordering constraints.

## The 8-Milestone Template

### Milestone 1: Design System Foundation
**Purpose**: Establish the visual grammar (colors, typography, spacing, shadows)
**Artifacts**: 
- Design token CSS variables in `globals.css`
- Tailwind config theme overrides
- Component size/color/spacing rules
**Outputs**: 67 unit tests validating color contrast (WCAG AAA 7:1+), typography scale, spacing units
**Duration**: 1–2 hours (autonomous)
**Parallelizable**: None (blocks everything downstream)
**Critical**: YES — all downstream work depends on consistent design tokens

### Milestone 2: Layout & Responsive Structure
**Purpose**: Define grid, breakpoints, and spatial relationships
**Artifacts**:
- Responsive grid layout (asymmetric, component positioning)
- Breakpoint definitions (320px, 768px, 1024px, 1440px)
- Container width rules, padding rules per breakpoint
**Outputs**: 34 unit tests validating grid structure, offset calculations, responsive transitions
**Duration**: 1–2 hours (autonomous)
**Parallelizable**: After M1 (depends on design tokens)
**Critical**: YES — responsive structure blocks all component styling

### Milestone 3: Legacy Removal & Cleanup
**Purpose**: Remove old design, old CSS, old interactive elements
**Artifacts**:
- Remove deprecated HTML elements (canvas, hero-orb, legacy sections)
- Remove unused CSS classes and old font-face declarations
- Remove unmaintained JavaScript plugins
**Outputs**: 34 unit tests verifying absence of deprecated patterns, CSS class cleanup, HTML simplification
**Duration**: 30–45 minutes (autonomous)
**Parallelizable**: After M2 (cleanup assumes new layout exists)
**Critical**: YES — prevents old CSS from conflicting with new design

### Milestone 4: Interactions & Micro-Interactions
**Purpose**: Add hover states, scroll reveals, form feedback
**Artifacts**:
- Hover/active/focus states for buttons, cards, links
- Scroll-triggered reveal animations with staggered timing
- Form input focus indicators, error borders, success states
- Keyboard navigation focus rings
**Outputs**: 58 unit tests validating hover states, transition durations, prefers-reduced-motion respects
**Duration**: 1–2 hours (autonomous)
**Parallelizable**: After M2 (depends on layout structure)
**Critical**: NO — enhances UX but not blocking MVP

### Milestone 5: Performance Optimization
**Purpose**: Achieve Core Web Vitals targets (LCP ≤2.2s, FID <50ms, CLS <0.05)
**Artifacts**:
- Remove render-blocking resources (lazy-load third-party scripts)
- Bundle size analysis (remove unused fonts, optimize imports)
- Image optimization (SVGs where possible, next/image for raster)
- CSS minification strategy
**Outputs**: 22 unit tests validating performance targets, zero Google Analytics in critical path, system fonts only
**Duration**: 1–2 hours (autonomous)
**Parallelizable**: After M3 (cleanup must complete before measurement)
**Critical**: YES — SEO impact (Google CLS/LCP ranking factor)

### Milestone 6: Accessibility (WCAG AAA)
**Purpose**: Ensure keyboard navigation, screen reader support, sufficient contrast
**Artifacts**:
- ARIA labels on interactive elements
- Heading hierarchy (h1→h2→h3 nesting)
- Color contrast verification (7:1 for AAA)
- Keyboard navigation (tab order, focus visible indicator)
- Screen reader landmark roles (<main>, <nav>, <footer>, skip-to-content)
**Outputs**: 43 unit tests validating ARIA labels, heading structure, contrast ratios, focus indicators
**Duration**: 1–2 hours (autonomous)
**Parallelizable**: After M4 (depends on interaction structure)
**Critical**: NO — compliance/ethical, not blocking functionality

### Milestone 7: Testing & QA
**Purpose**: Integration tests across browsers, devices, workflows
**Artifacts**:
- Cross-browser tests (Chrome, Firefox, Safari, Edge)
- Mobile device tests (iOS Safari, Android Chrome)
- Responsive breakpoint validation (320px, 768px, 1024px, 1440px)
- Form submission end-to-end
- Contact form validation, error display, success state
- Navigation linking workflow
- Button interaction consistency
**Outputs**: 70 integration tests using vitest, no mock data (real CSS selectors, real DOM)
**Duration**: 1–2 hours (autonomous)
**Parallelizable**: After M5 (depends on optimizations being complete)
**Critical**: YES — catches regressions before deployment

### Milestone 8: Deployment & Monitoring
**Purpose**: Build artifacts, Lighthouse verification, monitoring setup
**Artifacts**:
- Production build verification (no build errors, no TypeScript errors)
- Lighthouse score targets (Performance ≥90, Accessibility ≥95, SEO ≥95)
- Monitoring alerts (Core Web Vitals dashboard, error tracking)
- Analytics setup (post-onload, non-blocking)
- Deployment checklist (env vars, secrets, DNS, SSL)
**Outputs**: 25 deployment-readiness tests validating build outputs, Lighthouse thresholds, monitoring wiring
**Duration**: 30–45 minutes (autonomous)
**Parallelizable**: After M7 (depends on tests passing)
**Critical**: YES — release gate

## Parallelization Strategy

**Sequential (cannot parallelize):**
- M1 → M2 → M3 (design system must exist before layout; cleanup needs new layout as reference)

**Can parallelize after M3:**
- M4 (Interactions) and M5 (Performance) are independent — launch both after M3 completes
- M6 (Accessibility) can run in parallel with M4/M5 (checks own properties, doesn't conflict)

**Must serialize after M5:**
- M7 depends on M5 (performance must be baseline before testing)
- M8 depends on M7 (only deploy when tests pass)

**Optimal execution timeline (autonomous agents):**
```
M1 [1h]
  ↓
M2 [1h]
  ↓
M3 [0.5h]
  ↓
  M4 [1h] + M5 [1h] + M6 [1h] (parallel, takes 1h wall time)
  ↓
M7 [1h]
  ↓
M8 [0.5h]
────────────────
Total: ~5.5h autonomous (vs ~8h sequential)
```

## Per-Milestone Todo Count & Complexity

| Milestone | Load-Bearing LOC | Invariants | Todos | Notes |
|-----------|-----------------|-----------|-------|-------|
| M1        | ~200 (CSS vars) | 2 (contrast, scale) | 12 | Design token setup |
| M2        | ~300 (grid rules) | 3 (layout, offset, responsive) | 14 | Breakpoint definitions |
| M3        | ~100 (deletions) | 1 (removal completeness) | 8 | Cleanup only |
| M4        | ~200 (animations) | 2 (timing, prefers-reduced-motion) | 18 | Interaction states |
| M5        | ~150 (optimizations) | 2 (LCP, CLS) | 10 | Performance tuning |
| M6        | ~180 (ARIA, landmarks) | 3 (contrast, labeling, structure) | 16 | Accessibility layer |
| M7        | ~400 (test cases) | 5 (cross-browser, devices, forms, linking, buttons) | 15 | Integration tests (many are data-driven) |
| M8        | ~50 (checks) | 2 (build, lighthouse) | 4 | Verification only |

**Why this works:** Each milestone stays <500 LOC load-bearing logic and <5 simultaneous invariants (per `rules/autonomous-execution.md` capacity budgets). Integration tests in M7 are data-driven (one test function × many test cases), so the high count doesn't violate the invariant budget.

## When to Use This Template

✅ **Use this sequence when:**
- Redesigning an existing site (not greenfield)
- Moving from one visual language to another
- Targeting specific performance/accessibility compliance
- Deploying to production (tests required before M8)

❌ **Don't use when:**
- Only color changes (skip M2–M5, go straight to M6–M8)
- Only layout changes (start at M2, still do M7–M8)
- Prototyping (skip M7–M8)

## Risk Mitigation

**Risk: M2 layout breaks M1 design assumptions**
→ Write responsive token overrides in M2 (e.g., `h1: 180px desktop, 48px mobile`); Tier 1 unit tests validate token ranges per breakpoint

**Risk: M3 cleanup removes CSS that M4 interactions depend on**
→ Run M3 cleanup BEFORE M4 starts; integration tests in M7 will catch if a selector no longer exists

**Risk: M5 performance optimizations conflict with M4 animations**
→ Profile animations during M5 (Lighthouse CLS check catches janky animations). Use `will-change` sparingly, `prefers-reduced-motion` to disable under reduced-motion preference

**Risk: Accessibility audit in M6 requires rework of M4 interactions**
→ Build accessible interactions in M4 itself (ARIA labels, focus indicators) — M6 is verification, not retrofit. Use `aria-live="polite"` on form error zones in M4

## Key Patterns from Phase Success

1. **Design tokens in M1 are not optional.** Every color, size, shadow must be in CSS variables. Hardcoded values in M2–M6 cause maintenance debt.
2. **Breakpoints defined in M2 must be exhaustive.** Missing a viewport size in M2 means M7 integration tests catch it and force rework.
3. **Legacy removal in M3 must be *complete*.** Partial cleanup leaves conflicting CSS that makes M4 harder.
4. **Interactions in M4 must include focus states.** A button with `:hover` but no `:focus-visible` fails accessibility.
5. **Performance baseline in M5 is a hard gate.** Don't move to M7 if LCP >2.5s — find the culprit in M5.
6. **Integration tests in M7 are the truth.** 70 tests catching responsive breakpoint bugs, form validation edge cases, button interaction order.

## See Also
- `specs/design-system.md` — token definitions
- `specs/layout-specs.md` — breakpoint values and grid structure
- `specs/performance-requirements.md` — Core Web Vitals targets
- `rules/web-perf-budget.md` — hard performance gates
- `rules/debounce-server-calls.md` — input handling pattern
