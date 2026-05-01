---
type: DISCOVERY
date: 2026-05-01
created_at: 2026-05-01T14:45:00Z
author: co-authored
session_id: post-deploy-codify
phase: codify
project: page-modernization
topic: Institutional patterns extracted from successful design system implementation
tags: [design-system, patterns, tokens, components, responsive, accessibility]
---

# DISCOVERY: Design System Patterns That Scaled from MVP to 7 Pages

## Summary

During the page modernization project, we successfully built and applied a design system across 7 pages (26 todos) with zero regressions and 100% red team compliance. Extracting these patterns reveals the key structural decisions that made consistency achievable at scale.

## Key Patterns Discovered

### 1. Token System: Semantic Naming Wins

**Pattern**: All styling through CSS custom properties with semantic (intention-based) naming.

```css
✅ --color-accent (blue for interaction)
✅ --color-success, --color-error, --color-warning (semantic status)
✅ --spacing-md, --spacing-lg (intention: default, breathing room)
✅ --font-size-h1, --font-size-body (semantic role)

❌ --color-blue-500, --color-red-600 (implementation detail)
❌ --margin-16px, --padding-24px (brittle, breaks on redesign)
```

**Why it worked**: When a rebrand changes blue accent to purple, `--color-accent` updates once and flows everywhere. Implementation-named tokens require hunting through code.

**Scale evidence**: 76 CSS variable instances across 7 pages with zero color inconsistencies.

### 2. Component Library: Enforcement Mechanism

**Pattern**: Every page uses library components (Button, Input, FormField, Card, Modal, Badge) with zero custom implementations.

```
Button: 17 instances across pages
Input: 7+ instances in form fields
FormField: 7 instances (label + input + error wrapper)
Card: 5 instances for article cards
Badge: 8 instances for status indicators
Modal: 3 instances for confirmations
```

**Why it worked**: When homepage Button was styled, all 17 instances automatically got the visual update.

**Scale evidence**: Every page followed the same pattern; no "I'll create a custom button that's slightly different" divergence.

### 3. Responsive Design: Mobile-First + 4 Breakpoints

**Pattern**: Mobile-first base styles with explicit media query breakpoints at 768px, 1024px, 1440px.

```css
/* Base: 320px mobile */
.container { width: 100%; display: flex; flex-direction: column; }

@media (min-width: 768px) { /* Tablet */ }
@media (min-width: 1024px) { /* Desktop */ }
@media (min-width: 1440px) { /* Large desktop */ }
```

**Why it worked**: Four distinct breakpoints prevent the "works on mobile, breaks on desktop" failure mode.

**Scale evidence**: Red team verified 320px, 768px, 1024px, 1440px on every page with zero responsive regressions.

### 4. Fluid Typography with clamp()

**Pattern**: Responsive font sizing without media query breakpoints.

```css
--font-size-h1: clamp(1.875rem, 5vw, 3.5rem);  /* scales automatically */
--font-size-body: clamp(0.875rem, 1.5vw, 1rem);
```

**Why it worked**: Typography scales smoothly from mobile to large desktop without hard breakpoint jumps.

**Scale evidence**: All 7 pages have readable typography across all 4 breakpoints with zero font-size queries.

### 5. Accessibility as Structural Requirement, Not Afterthought

**Pattern**: Every component includes accessibility features at build time (not retrofitted).

Button component includes:
```css
&:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
```

Input component includes:
```tsx
aria-invalid={error ? 'true' : 'false'}
aria-describedby={error ? `${id}-error` : undefined}
```

Modal component includes:
```tsx
role="dialog"
aria-modal="true"
aria-labelledby="modal-title"
/* Focus trap (auto-focus first input, trap Tab key) */
/* Escape key to close */
/* Body scroll lock */
```

**Why it worked**: 100% of interactive elements have focus states, labels, and ARIA by default, not by chance.

**Scale evidence**: Red team passed all 7 pages on WCAG AA with zero accessibility gaps (focus states, form labels, heading hierarchy, keyboard navigation).

### 6. Page Modernization Workflow: Build → Wire → Verify

**Pattern**: Three-phase approach separates concerns.

**Phase 1: Build** (layout + styling, no API)
- Safe to review (no data integration risk)
- Faster iteration (can test UI without backend)
- Components use mock data

**Phase 2: Wire** (connect to APIs, remove mocks)
- Separate PR/review from layout changes
- Clear separation of concerns
- Reduces review scope per step

**Phase 3: Verify** (red team audit)
- Comprehensive validation (design compliance, accessibility, responsiveness)
- Gate before production deployment

**Why it worked**: Build phase could be parallelized (Milestone 2, 3, 4 happened in same session). Wire phase only needed backend API verification. Verify phase was single gate.

**Scale evidence**: 26 todos split cleanly into 4 milestones with clear phase boundaries.

### 7. Design System Specs + Component Library = Consistency Enforcement

**Pattern**: Specs document WHAT (colors, spacing, typography rules), Component Library enforces HOW (Button, Input, Card implementations).

When a new developer joins:
1. Read `specs/design-system.md` → learn the system rules
2. Use Button/Input/Card components → implement automatically correctly
3. Red team catches deviations (hardcoded colors, custom components)

**Why it worked**: Specs prevent accidental deviations, components make correct implementation the default.

**Scale evidence**: Zero hardcoded colors in page code, 100% component library usage.

## Architectural Decisions That Enabled Scale

### 1. CSS Custom Properties Over Tailwind Utilities in Pages

```
❌ Pages: <div className="text-blue-500 md:text-blue-600 p-4 md:p-6">
✅ Pages: <div style={{ color: 'var(--color-accent)', padding: 'var(--spacing-md)' }}>
```

**Decision**: Inline styles with CSS variables instead of Tailwind utility classes in page code.

**Rationale**: Makes design tokens visible and auditable. No ambiguity about what color something is.

**Trade-off**: Less DRY (can't reuse classes) vs. more obvious (token usage is visible)

### 2. Component Variants via CSS Classes + Data Attributes

```
Button variants: primary, secondary, danger, ghost
Input types: text, email, password
```

**Decision**: Define variants in component CSS, not in component code branches.

**Rationale**: All variants coexist in CSS; styling rules apply automatically based on className.

**Trade-off**: Variants must be exhaustive at component creation time (can't add variant per-page)

### 3. No Design System Version Negotiation

**Decision**: All pages must use latest design system (no legacy variants).

**Rationale**: Simplifies maintenance; prevents version drift.

**Enforcement**: Red team rejects pages with hardcoded colors or custom components.

## Risk Patterns (What Could Break at Scale)

### Risk 1: Token Naming Drift

If semantic naming convention wasn't enforced:
- One page uses `--color-brand-primary`, another uses `--color-accent`
- Same intent, different token names = maintenance nightmare

**Mitigation**: Spec defines naming convention + red team enforces it.

### Risk 2: Component Variant Explosion

If components allowed arbitrary variants:
- Button has 8 variants (primary, secondary, danger, ghost, outline, text, loading, disabled)
- Only 2-3 are ever used
- Maintenance cost for 5 unused variants

**Mitigation**: Strict variant set at design time (4 variants: primary, secondary, danger, ghost).

### Risk 3: Responsive Breakpoint Inconsistency

If each page chose different breakpoints:
- Page 1: 320px, 768px, 1280px
- Page 2: 320px, 640px, 1024px
- Identical components behave differently at same viewport width

**Mitigation**: Global breakpoint set (320, 768, 1024, 1440) enforced across all pages.

### Risk 4: Accessibility Regression

If accessibility was optional per-page:
- Some buttons have focus outlines, others don't
- Some modals have focus trap, others don't
- Inconsistent keyboard navigation

**Mitigation**: Accessibility baked into component library (all buttons have outline by default).

## Lessons for Future Projects

### 1. Token System Is the Foundation

Before building components, define tokens. Get buy-in on naming convention. Everything builds on this.

### 2. Component Library Is the Enforcement Mechanism

Every styled element becomes a component. Consistency is structural, not aspirational.

### 3. Red Team Must Be Specific

Generic "check for design consistency" misses things. Must grep for:
- `grep -r "#[0-9a-fA-F]{6}" pages/` (hardcoded colors)
- `grep -r "<button\|<input\|<div className=" pages/` (custom components vs. library)
- `grep -r "padding:\|margin:" pages/` (hardcoded spacing vs. tokens)

### 4. Specification + Component Library + Red Team = Complete System

None of these alone are sufficient:
- Spec alone: nobody reads it
- Component library alone: custom implementations sneak in
- Red team alone: catches problems late, doesn't prevent them

All three together create a system where correct implementation is the default.

## For Discussion

1. **Should design token usage be automated?**
   - Current: Manual component use ensures consistency
   - Alternative: Code generator that creates pages from design spec
   - Trade-off: Less manual work vs. less control

2. **Should accessibility be auto-checked in CI/CD?**
   - Current: Red team does manual WCAG audit
   - Alternative: Add axe-core or similar to catch violations early
   - Benefit: Catch more issues earlier

3. **At what page count does this system break?**
   - Current: 7 pages, zero issues
   - Question: 50 pages? 100 pages?
   - Consideration: Maybe need design system dashboard to track usage

---

**Impact**: These patterns should be codified into agents and skills so future UI modernization work inherits this structure. The "design system that works" is a valuable institutional asset.
