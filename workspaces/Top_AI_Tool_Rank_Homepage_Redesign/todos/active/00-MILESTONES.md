# Homepage Redesign — Implementation Milestones

## Overview

This document organizes 40+ todos into 8 implementation milestones. Each milestone represents a phase of work that can be validated independently.

**Estimated Total:** 5-7 autonomous agent sessions (1 session ≈ 1-2 milestones)

---

## Milestone 1: Design System Foundation
**Estimated:** 1 session | **Specs:** design-system.md

Establish the design tokens and component system.

- [ ] 001: Create CSS variables for color palette (neon lime, grays, etc.)
- [ ] 002: Set up typography scale (font sizes, weights, line heights)
- [ ] 003: Define spacing system (8px base unit)
- [ ] 004: Create Tailwind config overrides (colors, spacing)
- [ ] 005: Build button component styles (primary, secondary, text variants)
- [ ] 006: Build input/form field component styles
- [ ] 007: Build card component styles
- [ ] 008: Create focus indicator styles (2px neon lime outline)
- [ ] 009: Set up shadow/elevation system
- [ ] 010: Verify color contrast ratios (axe DevTools)

---

## Milestone 2: Layout Refactoring
**Estimated:** 1-2 sessions | **Specs:** layout-specs.md

Restructure page layout for asymmetric design and responsive breakpoints.

- [ ] 011: Remove particle canvas element and JS from hero section
- [ ] 012: Refactor hero section to asymmetric 2-column grid (desktop)
- [ ] 013: Offset hero visual by 120px (intentional overflow)
- [ ] 014: Create credibility strip section (4-column grid)
- [ ] 015: Refactor services grid with asymmetric item positioning
- [ ] 016: Refactor tools grid layout
- [ ] 017: Refactor why-us section (4-column reasons grid)
- [ ] 018: Refactor process section (4-step timeline)
- [ ] 019: Refactor contact section (2-column layout)
- [ ] 020: Create mobile-first responsive layout (< 768px)
- [ ] 021: Create tablet layout (768px - 1023px)
- [ ] 022: Verify grid layouts on desktop, tablet, mobile

---

## Milestone 3: Remove Legacy Elements
**Estimated:** 1 session | **Specs:** design-system.md

Delete outdated visual effects and animations.

- [ ] 023: Delete particle canvas animation JS
- [ ] 024: Remove glowing orb CSS (hero-orb-one, hero-orb-two)
- [ ] 025: Remove unnecessary gradient backgrounds
- [ ] 026: Remove deprecated animation utilities
- [ ] 027: Clean up unused CSS classes
- [ ] 028: Verify no console errors after removal

---

## Milestone 4: Interactive Features
**Estimated:** 1-2 sessions | **Specs:** interactions.md

Add hover states, focus indicators, and scroll reveals.

- [ ] 029: Implement button hover states (primary, secondary, text)
- [ ] 030: Implement link hover states (underline, color change)
- [ ] 031: Implement card hover states (shadow lift, scale)
- [ ] 032: Implement focus indicators on all interactive elements
- [ ] 033: Set up Intersection Observer for scroll reveals
- [ ] 034: Add "reveal" animation classes (fade + slide)
- [ ] 035: Apply staggered reveals to service cards (delay-1, delay-2, etc.)
- [ ] 036: Apply reveals to tool cards
- [ ] 037: Apply reveals to process steps
- [ ] 038: Implement form input focus states (lime border, glow)
- [ ] 039: Implement form input error states (red border, error message)
- [ ] 040: Implement hamburger menu open/close animation (X transform)
- [ ] 041: Implement mobile menu dropdown animation
- [ ] 042: Add prefers-reduced-motion media query support
- [ ] 043: Test all interactions on mobile (touch, no hover)

---

## Milestone 5: Performance Optimization
**Estimated:** 1 session | **Specs:** performance-requirements.md

Optimize bundle size, load time, and Core Web Vitals.

- [ ] 044: Minify and compress JavaScript
- [ ] 045: Minify and compress CSS
- [ ] 046: Optimize all SVG assets (remove metadata)
- [ ] 047: Convert images to WebP (if any raster images)
- [ ] 048: Implement code splitting for reveal observer
- [ ] 049: Verify system fonts only (no web font downloads)
- [ ] 050: Run Lighthouse audit (target: Performance ≥90)
- [ ] 051: Verify LCP ≤2.2s (target -600ms improvement)
- [ ] 052: Verify FID <50ms
- [ ] 053: Verify CLS <0.05
- [ ] 054: Test on 4G network (simulate in DevTools)
- [ ] 055: Test on low-end mobile device (Moto G4 or simulator)

---

## Milestone 6: Accessibility Audit & Fixes
**Estimated:** 1 session | **Specs:** accessibility.md

Achieve WCAG 2.1 Level AAA compliance.

- [ ] 056: Run axe DevTools accessibility audit
- [ ] 057: Run Lighthouse accessibility test (target: ≥95)
- [ ] 058: Verify heading hierarchy (H1, H2, H3)
- [ ] 059: Add skip-to-main-content link (optional but recommended)
- [ ] 060: Verify all images have alt text
- [ ] 061: Verify all form inputs have labels
- [ ] 062: Test keyboard navigation (Tab key, tab order)
- [ ] 063: Test focus indicators visibility
- [ ] 064: Test with screen reader (NVDA or VoiceOver)
- [ ] 065: Verify prefers-reduced-motion support
- [ ] 066: Verify color contrast ratios (7:1 minimum for AAA)
- [ ] 067: Test at 200% zoom (no horizontal scroll required)
- [ ] 068: Verify no color-only information (errors have text labels)
- [ ] 069: Fix any failing accessibility issues

---

## Milestone 7: Testing & QA
**Estimated:** 1-2 sessions

Cross-browser, mobile, and regression testing.

- [ ] 070: Test on Chrome desktop (latest)
- [ ] 071: Test on Firefox desktop (latest)
- [ ] 072: Test on Safari desktop (latest)
- [ ] 073: Test on Safari iOS (iPhone 12, iPhone SE)
- [ ] 074: Test on Chrome Android (Pixel 4, Moto G4)
- [ ] 075: Test on Samsung Galaxy (Android 12+)
- [ ] 076: Test responsive layout at breakpoints (320px, 768px, 1024px)
- [ ] 077: Test form submission (name, email, message)
- [ ] 078: Test contact form error handling
- [ ] 079: Test navigation menu (desktop + mobile)
- [ ] 080: Test all CTA buttons (navigate correctly)
- [ ] 081: Test all external links (correct href, open in new tab)
- [ ] 082: Verify hero visual displays correctly (SVG rendering)
- [ ] 083: Create visual regression baseline (screenshots)
- [ ] 084: Manual visual inspection (matches design spec)

---

## Milestone 8: Deployment & Monitoring
**Estimated:** 1 session

Deploy to production and set up monitoring.

- [ ] 085: Set up performance monitoring (Vercel Analytics or Google Analytics)
- [ ] 086: Configure Core Web Vitals tracking
- [ ] 087: Deploy to staging environment
- [ ] 088: Run final Lighthouse audit on staging
- [ ] 089: Smoke test on staging (full user journey)
- [ ] 090: Deploy to production
- [ ] 091: Verify Core Web Vitals on production (actual user data)
- [ ] 092: Set up monitoring alerts (LCP > 2.5s, CLS > 0.1)
- [ ] 093: Create post-launch checklist
- [ ] 094: Monitor user feedback (surveys, analytics)
- [ ] 095: Document any issues found post-launch

---

## Session Timeline (Estimated)

| Session | Milestones | Focus |
|---------|-----------|-------|
| 1 | 1-2 | Design system + Layout foundation |
| 2 | 2-3 | Layout completion + Remove legacy |
| 3 | 4-5 | Interactions + Performance |
| 4 | 6-7 | Accessibility + Testing |
| 5 | 8 | Deployment + Monitoring |

**Total Estimate:** 5 autonomous agent sessions (1 session ≈ 4-6 hours autonomous work)

---

## Go/No-Go Gates

Each milestone must pass its corresponding gate before proceeding to the next.

| Milestone | Gate Criteria |
|-----------|---------------|
| 1 | All design tokens defined, Tailwind config updated |
| 2 | Layout responsive on desktop, tablet, mobile |
| 3 | No console errors, all legacy code removed |
| 4 | All interactions implemented, no broken animations |
| 5 | Lighthouse Performance ≥90, LCP ≤2.2s |
| 6 | axe audit 0 violations, WCAG AAA screen reader tested |
| 7 | All browsers + devices tested, no visual regressions |
| 8 | Deployed, Core Web Vitals monitoring active |
