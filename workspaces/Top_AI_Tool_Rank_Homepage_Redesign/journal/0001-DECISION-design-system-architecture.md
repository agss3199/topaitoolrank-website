# DECISION: Design System Architecture — CSS Variables Over Pure Utility-First

**Date:** 2026-04-30  
**Phase:** Codification (after Milestone 1)  
**Contributor:** Claude Code (autonomous execution)

## Decision

We chose **CSS variables + Tailwind hybrid** over pure utility-first or pure component library approach.

### The Choice

```css
/* Design System Layer (globals.css) */
:root {
  --color-accent: #d4ff00;
  --color-bg: #0a0a0a;
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  /* ... */
  --h1-size: clamp(48px, 8vw, 180px);
  --h1-weight: 700;
}

/* Usage in Tailwind config */
theme: {
  colors: {
    accent: 'var(--color-accent)',
    bg: 'var(--color-bg)',
  },
  spacing: {
    xs: 'var(--spacing-xs)',
  },
}

/* Component styles use variables */
.hero-title {
  font-size: var(--h1-size);
  font-weight: var(--h1-weight);
  color: var(--color-accent);
}
```

### Why

**Layering hypothesis:** A design system needs three layers to scale:
1. **Token layer** (CSS variables) — defines the design grammar (colors, sizes, spacing)
2. **Component layer** (CSS classes) — defines reusable UI pieces (buttons, cards, forms)
3. **Utility layer** (Tailwind) — defines one-off adjustments and responsive overrides

Pure utility-first (Tailwind alone) skips layer 1, forcing developers to remember color hex codes and spacing px values, which leads to:
- Inconsistent spacing (40px vs 44px)
- Color creep (accent is #d4ff00, #d5ff00, #d4ff01 across the codebase)
- Hard-coded values scattered everywhere, unmaintainable

Pure component library skips layer 3, forcing developers to create wrapper components for every edge case.

**Hybrid approach:** Each layer is independent, scannable, and maintainable.

### What This Unblocked

1. **Responsive Typography:** `--h1-size: clamp(48px, 8vw, 180px)` scales the hero heading from 48px (mobile) to 180px (desktop) without breakpoints.
2. **Consistent Design Language:** All accent colors pull from `--color-accent`, so a brand pivot is a one-variable change.
3. **Unit Testing Design System:** 67 tests validate that color contrast meets WCAG AAA, typography scale is mathematically consistent, spacing is in 8px increments.

### Costs

- **Two sources of truth initially:** Variables in CSS AND values in Tailwind config. This was solved by referencing the variables in the config (not duplicating values).
- **Learning curve:** Developers familiar with "just use `text-amber-500`" need to learn "use `text-accent`, which is defined in CSS variables."

### Precedent

This is the approach Vercel uses in Next.js starter templates and Shadcn/ui component library. Design tokens → theme values → component styles.

### Trade-Off

We could have used Tailwind alone and lived with the color/spacing consistency issues, shipping faster M1 but accumulating technical debt in M2–M3. The hybrid approach added ~2 hours to M1 but eliminated rework in M2–M6.

## What Changed Because Of This

1. **Unit tests for design system** now exist (67 tests in M1), which caught a CSS regression in M3 when legacy removal accidentally removed a spacing utility.
2. **Responsive design values** (like the hero heading size) are now maintainable in one place.
3. **Color consistency** — all accent colors globally use the same variable, preventing color creep.

## Future Implications

- If we add dark mode, we update CSS variables in a `prefers-color-scheme: dark` media query. No component changes needed.
- If the brand changes accent color from #d4ff00 to a different neon shade, one variable change propagates everywhere.
- New developers onboarding can read `globals.css` and understand the entire design grammar in 5 minutes.

## Related Decisions

- **M2 Decision:** Grid layout is asymmetric (2-column unequal widths), justified by visual hierarchy. Grid values are stored as CSS variables (`--grid-col1-width: 65%`, `--grid-col2-width: 35%`) for consistency.
- **M5 Decision:** Hero image removed from index CSS, so responsive image size is now a CSS variable too (`--hero-img-size: clamp(100px, 50vw, 600px)`).

## See Also

- `specs/design-system.md` — the token definitions (values)
- `tests/unit/design-system.test.ts` — the 67 tests that validate the system
- `rules/design-system-variables.md` — the rule we codified from this decision

---

**Status:** ✅ Implemented in M1, verified in M7 integration tests, no rework required.
