---
type: DISCOVERY
date: 2026-05-09
created_at: 2026-05-09T22:25:00Z
author: co-authored
session_id: current
project: micro-saas-tools
topic: Fixed header creates layout compensation and keyboard accessibility requirements
phase: implement
tags: [layout, accessibility, responsive-design, fixed-positioning]
---

# Discovery: Fixed Header Layout & Accessibility Implications

## What Was Discovered

Implementing the fixed header compensation (Todo 001) revealed that fixed positioning (`position: fixed`) creates cascading layout and accessibility requirements across the entire site:

### Layout Compensation Required

**The Problem**: Fixed header at `top: 18px` with height `72px` visually occupies ~90px of viewport height, but doesn't create a margin/padding space for content below it. Without compensation:
- Anchor links (`/#services`) scroll the target to the top of the viewport, placing it BEHIND the fixed header
- Users can't see the target section — it's obscured by the header
- Visual frustration + poor UX

**The Solution (scroll-padding-top)**: 
```css
html {
  scroll-padding-top: 120px; /* header height + top offset + buffer */
}
```

This tells the browser: "When scrolling to an anchor, add 120px of padding before placing the element at the top." Now anchor links work correctly.

### Keyboard Accessibility Required

**The Problem**: Fixed headers create another issue — keyboard-navigating users using Tab key will focus interactive elements (links, buttons) that may be positioned behind the fixed header. The elements are in the DOM and reachable by Tab, but visually obscured.

**The Solution (skip-to-content link)**:
```tsx
<a href="#main" className="skip-to-content">Skip to main content</a>
<main id="main">{children}</main>
```

With CSS:
```css
.skip-to-content {
  position: absolute;
  left: -9999px; /* Hidden by default, kept in accessibility tree */
}
.skip-to-content:focus {
  position: fixed;
  top: 100px; /* Visible when focused, below header */
  left: 16px;
}
```

Keyboard users press Tab once and jump directly to main content, bypassing the obscured header area.

### Global Impact

Both compensation techniques MUST be applied globally:
- `scroll-padding-top: 120px` in `html` element (affects all anchor links site-wide)
- Skip-to-content link in root layout.tsx (affects all pages)
- Main content wrapped in `<main id="main">` (affects all pages)

This is NOT a one-page fix. It's an architectural change affecting every page layout.

## Why This Matters

1. **Anchor navigation is core UX**: Users and SEO link to specific sections using fragments (`#services`, `#pricing`). Without scroll padding, these links place content behind the header — bad UX and likely increases bounce rate.

2. **Keyboard accessibility is a legal/compliance issue**: WCAG 2.1 Level AA (web accessibility standard) requires that keyboard users can navigate and interact with all content. A fixed header that obscures keyboard-navigable elements violates this.

3. **The pattern is discoverable after launch**: This issue isn't visible until:
   - Users click anchor links and see content obscured
   - Keyboard users encounter hidden elements
   - SEO crawlers follow internal anchor links

## Implementation Decisions Made

1. **Used scroll-padding-top instead of margin/padding on main content** — doesn't require layout changes, works with all page structures
2. **Skip-to-content positioned absolutely (not display: none)** — keeps it in the accessibility tree while hidden from sighted users
3. **120px padding value** — conservative estimate (72px header + 18px top + 30px buffer) ensures comfortable clearance
4. **Applied globally in root layout** — every page inherits the compensation without per-page changes

## Future Implications

1. **Any future fixed UI elements** (modals, floating buttons, sticky sidebars) will need similar compensation
2. **Responsive design must preserve scroll-padding-top** — mobile views need the same compensation
3. **Animation/transitions must account for scroll-behavior** — smooth scroll may behave differently with scroll-padding
4. **Testing protocol must include anchor navigation** — RESPONSIVE-TESTING.md now includes "click anchor links at all viewport sizes"

## For Discussion

1. **Should the 120px padding be adjustable per page?** Some pages might have different header heights (e.g., if header collapses on mobile). Consider allowing per-page overrides.

2. **Should skip-to-content link be styled to match the design system?** Currently uses `var(--color-accent)` but could have more polish (animation, icon, different placement).

3. **Should we add smooth scroll behavior?** Currently anchor links jump instantly. `scroll-behavior: smooth` would animate the scroll, but adds perceived latency (~500ms).

---

**Related**: specs/layout-system-responsive-design.md, RESPONSIVE-TESTING.md, 0025-DECISION-todo-scope-and-ordering.md

**Status**: Implemented and verified ✓
