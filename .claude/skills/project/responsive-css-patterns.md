# Responsive CSS Patterns for Micro-SaaS Tools

**Skill Category**: Frontend Design & Responsive Layout  
**Applies to**: `app/**/*.css`, `app/tools/**/*.module.css`, all tool pages  
**Key Files**: `app/globals.css` (breakpoint variables, cascade safety rule), `RESPONSIVE-TESTING.md` (testing protocol)

## Overview

This skill captures three interrelated responsive design patterns discovered and validated during the layout & feature todos implementation:

1. **Fixed Header Compensation** — scroll-padding-top for anchor links, skip-to-content for keyboard accessibility
2. **CSS Cascade Safety Rule** — explicit re-declaration of animation properties in media queries
3. **Responsive Breakpoint System** — CSS variables for consistent breakpoints across all pages

---

## Pattern 1: Fixed Header Layout Compensation

### The Problem

Fixed positioning (`position: fixed`) creates two accessibility failures:

1. **Anchor links broken**: When a user navigates to `/#services`, the browser scrolls the target to viewport top, placing it BEHIND the fixed header. Users see content obscured.
2. **Keyboard navigation broken**: Tab key focuses interactive elements that may be behind the fixed header, making them unreachable to keyboard-only users.

### The Solution

**For anchor links**: Add `scroll-padding-top` to the `<html>` element.

```css
html {
  scroll-padding-top: 120px; /* header (72px) + top offset (18px) + buffer (30px) */
}
```

**For keyboard users**: Add a skip-to-content link as the first interactive element in the body, styled to be hidden by default and visible on keyboard focus.

```tsx
// app/layout.tsx — first element in body
<a href="#main" className="skip-to-content">Skip to main content</a>

// Wrap page children in <main id="main">
<main id="main">{children}</main>
```

```css
/* app/globals.css */
.skip-to-content {
  position: absolute;
  left: -9999px;
  top: auto;
  width: 1px;
  height: 1px;
  overflow: hidden;
}

.skip-to-content:focus {
  position: fixed;
  top: 100px; /* below header */
  left: 16px;
  width: auto;
  height: auto;
  padding: 8px 12px;
  background: var(--color-accent);
  color: white;
  text-decoration: none;
  border-radius: 4px;
  z-index: 999;
}
```

### Why This Works

- `scroll-padding-top` is a CSS standard (Scroll Snap Module) — the browser adds padding when scrolling to anchors
- Skip-to-content link is in the DOM for screen readers and keyboard navigation, hidden from sighted users by default
- The pattern is **global** — applies to every page without per-page changes

### Validation Checklist

- [ ] `scroll-padding-top: 120px` set on `html` element
- [ ] Skip-to-content link is the first element in `<body>`
- [ ] Link targets `#main` and main content is wrapped in `<main id="main">`
- [ ] Skip link hidden by default (`left: -9999px`)
- [ ] Skip link visible on `:focus` with readable styling
- [ ] Test: Click internal anchor links at all viewport sizes — content should not be obscured
- [ ] Test: Tab key from top of page — skip link should become visible

---

## Pattern 2: CSS Cascade Safety Rule

### The Problem

When media queries override base CSS rules (changing dimensions, layout, spacing), animations may be implicitly removed if the animation properties aren't re-declared. The animation still exists in the CSS, but the cascade stops applying it because the media query doesn't mention it.

```css
/* Base styles */
.hero-ring {
  width: 200px;
  animation: rotate 8s linear infinite;
}

/* Mobile media query — dimension changes but animation lost */
@media (max-width: 640px) {
  .hero-ring {
    width: 120px;
    /* animation property omitted — but it's still in the base rule!
       Browser stops applying animation because media query overrides the selector */
  }
}
```

Result: Animation plays on desktop, silently stops on mobile. No error, no warning — invisible failure.

### The Solution

**Rule**: Any media query that overrides dimensions (width, height, padding, margin, display) MUST explicitly re-declare all animation properties.

```css
/* DO: Dimension change + animation re-declaration */
.hero-ring {
  width: 200px;
  animation: rotate 8s linear infinite;
}

@media (max-width: 640px) {
  .hero-ring {
    width: 120px;
    animation: rotate 8s linear infinite; /* RE-DECLARED */
  }
}

/* DO: Use CSS variables for single source of truth */
:root {
  --animation-rotate: rotate 8s linear infinite;
}

.hero-ring {
  width: 200px;
  animation: var(--animation-rotate);
}

@media (max-width: 640px) {
  .hero-ring {
    width: 120px;
    animation: var(--animation-rotate); /* same variable, no drift */
  }
}
```

### Why This Works

- CSS cascade applies the closest rule that matches; media query overrides base rule
- Browser doesn't merge properties across cascade boundaries — if media query sets `width` but not `animation`, the `animation` from base rule is lost
- Re-declaring animation in media query ensures the animation continues despite dimension changes

### Validation Checklist

- [ ] Every `@media` query that changes dimensions includes animation re-declaration
- [ ] Use CSS variables for animations (single source of truth)
- [ ] Test: Inspect element in DevTools at multiple breakpoints — animation property visible at each breakpoint
- [ ] Test: View page at all viewport sizes — animations should play smoothly at every size
- [ ] Document the rule: comment in CSS file explaining why animation is re-declared

---

## Pattern 3: Responsive Breakpoint System

### Standard Breakpoints

Define breakpoints as CSS variables for consistent usage across all pages.

```css
:root {
  /* Breakpoints */
  --breakpoint-sm: 640px;   /* small phones */
  --breakpoint-md: 768px;   /* tablets */
  --breakpoint-lg: 1024px;  /* small laptops */
  --breakpoint-xl: 1440px;  /* large screens */

  /* Spacing scale */
  --spacing-sm: 12px;
  --spacing-md: 16px;
  --spacing-lg: 24px;

  /* Colors, fonts, etc. */
}

/* Apply to all pages */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-md);
}

/* Responsive padding — narrower on mobile */
@media (max-width: var(--breakpoint-sm)) {
  .container {
    padding: 0 var(--spacing-sm);
  }
}

/* Responsive layout — single column on mobile, multi-column on desktop */
.tool-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-lg);
}

@media (max-width: var(--breakpoint-lg)) {
  .tool-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: var(--breakpoint-md)) {
  .tool-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: var(--breakpoint-sm)) {
  .tool-grid {
    grid-template-columns: 1fr;
  }
}
```

### Why CSS Variables

- **Single source of truth** — change breakpoint once, updates everywhere
- **Consistent naming** — all pages use `--breakpoint-sm`, no `tablet`, `mobile`, `desktop` inconsistency
- **No magic numbers** — future maintainers know exactly what 768px means
- **Future-proof** — easy to add new breakpoints (e.g., `--breakpoint-2xl: 1920px`)

### Validation Checklist

- [ ] All breakpoints defined as CSS variables in root
- [ ] All pages use variable names (never hardcoded pixel values)
- [ ] Container max-width consistent across all media queries
- [ ] Responsive padding matches spacing scale variables
- [ ] Test at standard viewport sizes: 375px, 412px, 768px, 1024px, 1440px, 1920px
- [ ] Use RESPONSIVE-TESTING.md checklist for per-page validation

---

## Testing Protocol

See `RESPONSIVE-TESTING.md` in project root for the comprehensive checklist:

- **Test Viewports**: 375px (iPhone SE), 412px (Android phone), 768px (iPad), 1024px (laptop), 1440px (large screen), 1920px (ultra-wide)
- **Per-Page Checklist**: Content Layout, Navigation, Animations, Forms, Images, Performance
- **Automation**: Manual browser testing (Playwright E2E can be added later for critical pages)

---

## Decision Rationale

### Why Explicit Re-Declaration Instead of CSS Variables?

Initial implementation used CSS variables for animations. We later discovered that re-declaring the property (even with a variable reference) is more explicit and easier to verify in code review.

**Trade-off**: CSS variables are slightly more maintainable (change animation once), but explicit re-declaration is more obvious in the code (reviewers can see animation intent at every breakpoint).

**Decision**: Use CSS variables as shown above — provides both maintainability AND explicitness.

### Why scroll-padding-top Instead of Margin/Padding on Main?

- **Margin/padding on `<main>`** would break page layouts that already use flexbox or grid (content wouldn't align)
- **scroll-padding-top on `<html>`** is CSS-standard (works across all pages without layout changes)

**Decision**: scroll-padding-top is the only non-breaking solution.

### Why Skip-to-Content Link Instead of JavaScript Redirect?

- **JavaScript redirect**: Creates a flash/jump that's disorienting to keyboard users
- **Skip link**: Standard pattern (WCAG recommends it), works without JavaScript, appears on keyboard focus only

**Decision**: Skip-to-content link per WCAG 2.1 Level AA standards.

---

## Code Examples

See spec file `specs/layout-system-responsive-design.md` for full API contracts and detailed flow diagrams.

---

## Related Skills

- **design-system-builder** — overall design system governance
- **responsive-layout-expert** — CSS debugging and responsive fixes
- **page-modernizer** — applying responsive patterns to existing pages

---

## Changes Made (Phase 02 Implementation)

- **File**: `app/globals.css` — Added breakpoint CSS variables, container responsive rules, scroll-padding-top, skip-to-content styling, CSS cascade safety rule documentation
- **File**: `app/layout.tsx` — Added skip-to-content link + `<main id="main">` wrapper
- **File**: `app/blogs/layout.tsx` — Added Header + Footer (uses responsive header from design system)
- **File**: `RESPONSIVE-TESTING.md` — Created 79-line testing protocol with viewport table and per-page checklists
- **Files**: `app/tools/*/page.tsx` — Applied responsive container + cascade safety rule to all tool pages

---

## Next Steps

- [ ] Review all existing pages against RESPONSIVE-TESTING.md checklist
- [ ] Add Playwright E2E tests for critical responsive breakpoints (advanced, future work)
- [ ] Document page-specific breakpoint overrides if any exist
- [ ] Audit CSS for other animation patterns that may need cascade safety fixes

---

**Last Updated**: 2026-05-10  
**Origin**: Phase 02 layout & feature todos (001, 002, 003, 004)  
**Validation**: Red team audit `.spec-coverage-v2.md` — 40+ assertions verified
