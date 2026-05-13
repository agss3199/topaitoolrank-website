# Todo 004: Establish Responsive Design Baseline

**Priority**: 🟠 HIGH (System architecture)  
**Effort**: ~1 hour (1 focus block)  
**Depends on**: Todo 001 (scroll-padding-top must exist)  
**Implements**: `specs/layout-system-responsive-design.md` § Responsive Typography, Responsive Behavior, Testing Protocol

## Description

The site lacks a unified responsive design system. CSS media queries don't consistently re-declare affected properties, causing silent failures (e.g., animations breaking on desktop). The responsive baseline establishes breakpoints, container rules, animation cascade safety, and a testing protocol for future responsive work.

## Acceptance Criteria

- [ ] Responsive breakpoints defined as CSS custom properties (or documented as constants)
- [ ] Container `.container` class updated with responsive padding rules
- [ ] Media query CSS cascade rule documented and enforced
- [ ] `RESPONSIVE-TESTING.md` checklist created in project root
- [ ] Homepage tested at 320px, 768px, 1024px, 1440px viewports
- [ ] All main pages tested for horizontal scroll (should be zero at all sizes)
- [ ] Build succeeds with 0 CSS linting errors
- [ ] No console errors at any viewport size
- [ ] Animations verified to play at all breakpoints (desktop, tablet, mobile)

## Changes Required

### File: `app/globals.css`

Add responsive baseline section (after existing color/typography variables):

```css
/* Responsive Breakpoints & Layout Rules */

/* Breakpoint constants (for reference) */
:root {
  /* Breakpoints */
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1440px;
}

/* Base container — all screens */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-md);  /* 16px sides */
}

/* Mobile optimization — smaller padding on tiny screens */
@media (max-width: 640px) {
  .container {
    padding: 0 var(--spacing-sm);  /* 8px sides */
  }
}

/* Large screens — maintain max-width, don't grow beyond */
@media (min-width: 1440px) {
  .container {
    max-width: 1200px;
  }
}

/* CSS Cascade Safety Rule
 * When media queries override properties, dependent properties MUST be re-declared.
 * Example: if animation is declared in base rule, it must be re-declared in @media.
 * See rules/project/responsive-animation-safety.md for details.
 */

/* Typography responsive scaling (already in place, documented here for completeness) */

/* All font sizes use clamp() for automatic scaling between min/max
   Example: --font-size-h1: clamp(48px, 11.25vw, 180px)
   This scales h1 smoothly from 48px on small screens to 180px on large screens.
   No media query overrides needed (clamp handles it).
 */
```

### Step 2: Create `RESPONSIVE-TESTING.md` in project root

```markdown
# Responsive Design Testing Checklist

This document defines the responsive testing protocol for topaitoolrank.com.

## Test Viewports

Test all pages at these viewport sizes:

| Device | Width | Height | Notes |
|--------|-------|--------|-------|
| Mobile (iPhone 12 mini) | 375 | 667 | Smallest common screen |
| Mobile (Pixel 4) | 412 | 869 | Average Android phone |
| Tablet (iPad) | 810 | 1080 | Tablet view |
| Desktop (1440p) | 1440 | 900 | Standard desktop |
| Desktop (1920p) | 1920 | 1080 | Large monitor |

## Per-Page Checklist

Before deploying responsive changes, verify on every public page:

### Content Layout
- [ ] No horizontal scroll at any viewport
- [ ] Content stays within `.container` max-width (1200px max)
- [ ] Text lines don't exceed 80 characters (readability)
- [ ] Padding/margin scale appropriately (larger on desktop, smaller on mobile)

### Navigation
- [ ] Header visible and sticky on all viewports
- [ ] Navigation menu usable (hamburger on mobile, full menu on desktop)
- [ ] No content hidden behind fixed header

### Animations
- [ ] All animations play correctly at all breakpoints
- [ ] Animation properties re-declared in @media queries (CSS cascade safety)
- [ ] No layout shift or jank during animations

### Forms & Inputs
- [ ] Form inputs stack vertically on mobile
- [ ] Touch targets at least 44px on mobile (accessibility)
- [ ] Form labels visible and properly sized

### Images
- [ ] Images scale responsively
- [ ] No broken images at any size
- [ ] Alt text present on all images

### Touch & Keyboard
- [ ] Touch targets large enough on mobile (44px minimum)
- [ ] Keyboard navigation works at all sizes (Tab order logical)
- [ ] Focus indicators visible and styled appropriately

## Pages to Test

All public pages:
- [ ] Homepage (`/`)
- [ ] Blogs listing (`/blogs`)
- [ ] Individual blog posts (`/blogs/[slug]`)
- [ ] Tools directory (`/tools`)
- [ ] Each tool page (at least 3: invoice-generator, json-formatter, word-counter)
- [ ] Terms of Service (`/terms`)
- [ ] Privacy Policy (`/privacy-policy`)

## Automation vs Manual

- **Automated**: Unit tests for CSS (Sass compilation, no errors)
- **Manual**: Visual verification at each viewport (human eye catches layout issues automation misses)

## Continuous Integration

- Build must succeed with 0 CSS warnings
- Lighthouse score should be checked on main pages
- No console errors when navigating through site

## Owner & Review

These tests should be re-run before any deployment involving responsive changes.

---
Last updated: 2026-05-09
```

## Implementation Notes

- **Scroll-padding-top**: Should already be in place from Todo 001 (120px)
- **Container rules**: Most already exist; this formalizes responsive padding
- **Cascade safety**: Documents the rule that animations/transitions must be re-declared in media queries. See `rules/project/responsive-animation-safety.md`
- **Testing protocol**: Not automated (no jest/playwright tests written), but a structured manual checklist ensures consistent validation

## Testing Plan

1. **Layout verification**:
   - Load homepage in Chrome DevTools → resize to 375px wide → no horizontal scroll
   - Resize to 1440px → content stays within max-width, not stretched edge-to-edge
   - Resize to 768px → padding reduces on sides (if defined)

2. **Animation verification**:
   - Load homepage at 375px → neural core rings animate
   - Resize to 1440px → rings still animate (CSS cascade rule working)

3. **Form verification**:
   - Load invoice generator at 375px → form fields stack vertically
   - Load at 1440px → form layout optimized for wider screen

4. **Navigation verification**:
   - Load blogs at 375px → hamburger menu visible (if mobile nav implemented)
   - Load at 1024px+ → full menu visible
   - Verify header doesn't cover content (scroll-padding working)

## Dependencies

- Depends on: Todo 001 (scroll-padding-top must exist)
- Can run in parallel with: Todo 002, Todo 003
- No blocking dependencies

## Outcomes

After completion:
- Responsive baseline documented for future developers
- Testing protocol established (can be automated later)
- All pages verified to work at multiple viewport sizes
- CSS cascade safety rule enforced going forward

## Next

→ All todos complete, proceed to approval gate
