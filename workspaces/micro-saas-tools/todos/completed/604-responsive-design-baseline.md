# TODO-604: Define Responsive Design Baseline in globals.css

**Status**: ACTIVE  
**Severity**: HIGH  
**Effort**: 1 implementation cycle (~60 min)  
**Implements**: specs/layout-system-responsive-design.md § Container System, § Responsive Breakpoints, § Responsive Padding Scale  
**Depends on**: TODO-601 (scroll-padding-top is part of this baseline; implement 601 first to avoid duplicating the css rule)  
**Blocks**: nothing (but all future layout work should reference these breakpoints)

---

## Description

The site has no defined responsive baseline in `globals.css`. Breakpoints are ad-hoc inside individual component CSS files, there is no canonical `.container` class, and no documented testing protocol for responsive validation. This means:

- Anchor navigation is broken (fixed by TODO-601, but this todo makes the fix part of a documented system)
- Future responsive CSS changes risk the "silent animation breakage" pattern documented in `rules/project/responsive-animation-safety.md` (changing dimensions in a media query without re-declaring animations)
- Layout widths are inconsistent across pages

This todo establishes the global baseline: breakpoint comments, container rules, and responsive padding. It does not touch individual component CSS — only `app/globals.css`. Individual pages adopt the `.container` class in their own refactor cycle.

---

## Acceptance Criteria

- [ ] `app/globals.css` has a clearly marked "Responsive Baseline" section with breakpoint constants as CSS comments
- [ ] `app/globals.css` defines a `.container` class: `max-width: 1200px; margin: 0 auto; padding: 0 1.5rem` (desktop), `padding: 0 1rem` at 768px, `padding: 0 0.75rem` at 480px
- [ ] `app/globals.css` defines the four canonical breakpoints as CSS custom properties or comments: 320px (mobile-sm), 768px (tablet), 1024px (desktop), 1440px (wide)
- [ ] `app/globals.css` includes a responsive padding scale section with custom properties: `--space-xs`, `--space-sm`, `--space-md`, `--space-lg`, `--space-xl`
- [ ] The `scroll-padding-top` from TODO-601 is documented as part of this baseline (not a separate orphan rule)
- [ ] No existing styles are broken: homepage loads correctly at 320px, 768px, 1024px, 1440px
- [ ] A `RESPONSIVE-TESTING.md` checklist is added to `workspaces/micro-saas-tools/` documenting how to validate responsive changes (breakpoints to test, animation property check, what to look for)

---

## Subtasks

- [ ] Read `app/globals.css` in full to understand current structure before adding (Est: 5 min) — Verification: understand what CSS variables and reset rules already exist to avoid conflicts
- [ ] Add "Responsive Baseline" comment block and breakpoint documentation (Est: 5 min) — Verification: grep for "Responsive Baseline" returns the section header
- [ ] Define CSS custom properties for spacing scale (Est: 10 min) — Verification: `--space-md` is defined in `:root`; browser DevTools shows it resolving to expected value
- [ ] Define `.container` class with responsive padding via media queries (Est: 15 min) — Verification: a test element with `class="container"` at 320px viewport has 0.75rem left padding; at 1024px has 1.5rem
- [ ] Confirm scroll-padding-top from TODO-601 is grouped in this section (Est: 5 min) — Verification: both rules appear adjacent in globals.css under "Responsive Baseline"
- [ ] Manual responsive check: resize browser window through 320px, 768px, 1024px, 1440px on homepage — no layout breaks, no elements overflowing viewport (Est: 10 min)
- [ ] Write `workspaces/micro-saas-tools/RESPONSIVE-TESTING.md` checklist (Est: 10 min) — Verification: file exists and lists breakpoints to test and the animation property re-declaration rule

---

## Files to Change

| File | Change |
|------|--------|
| `app/globals.css` | Add Responsive Baseline section with breakpoints, container class, spacing scale, scroll-padding-top |
| `workspaces/micro-saas-tools/RESPONSIVE-TESTING.md` | New file — responsive testing protocol |

---

## Implementation Notes

### Baseline CSS to Add

```css
/* =============================================================================
   RESPONSIVE BASELINE
   Breakpoints: 320px (mobile-sm), 768px (tablet), 1024px (desktop), 1440px (wide)
   ============================================================================= */

/* Fixed header compensation — must match header effective height (72px + 18px top + buffer) */
html {
  scroll-padding-top: 120px;
}

/* Spacing scale */
:root {
  --space-xs: 0.25rem;   /*  4px */
  --space-sm: 0.5rem;    /*  8px */
  --space-md: 1rem;      /* 16px */
  --space-lg: 1.5rem;    /* 24px */
  --space-xl: 2rem;      /* 32px */
  --space-2xl: 3rem;     /* 48px */
}

/* Container — max-width 1200px, centered, responsive horizontal padding */
.container {
  width: 100%;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  padding-left: 1.5rem;
  padding-right: 1.5rem;
}

@media (max-width: 768px) {
  .container {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}

@media (max-width: 480px) {
  .container {
    padding-left: 0.75rem;
    padding-right: 0.75rem;
  }
}
```

If `scroll-padding-top` was already added by TODO-601, do not add it again. Instead, move it into the Responsive Baseline section with a comment explaining its purpose.

### Responsive Testing Protocol Content

The `RESPONSIVE-TESTING.md` checklist must include:

1. The four canonical viewport widths to test (320, 768, 1024, 1440)
2. The animation property re-declaration rule: any media query that changes dimensions (width, height, padding, margin) on an animated element MUST also re-declare `animation-name`, `animation-duration`, and `animation-timing-function`
3. What "no overflow" means: `document.documentElement.scrollWidth === window.innerWidth` (horizontal scroll should not appear)
4. How to test anchor navigation: click each nav link and confirm section top is visible below the header (not hidden behind it)

---

## Relationship to Existing Rules

The `rules/project/responsive-animation-safety.md` rule documents the exact failure mode this baseline prevents: media query overrides that change dimensions without re-declaring animation properties cause silent animation breakage on specific viewport sizes. This baseline makes the breakpoints canonical so future CSS changes know exactly where to add media query overrides.

---

## Definition of Done

- [ ] All acceptance criteria verified
- [ ] No existing page layouts broken at any of the four canonical breakpoints
- [ ] `.container` class documented and available for adoption by future todos
- [ ] `RESPONSIVE-TESTING.md` checklist written and complete
- [ ] Commit message: `feat(layout): add responsive baseline, container class, and spacing scale to globals.css`
