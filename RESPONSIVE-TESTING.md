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
