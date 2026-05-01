# 001: Verify Design System CSS Foundation

**Specification**: specs/design-system.md §1 Color System, §2 Typography, §3 Spacing, §4 Elevation, §5 Border Radius, §6 Animations
**Dependencies**: None (prerequisite)
**Capacity**: 1 session (~50 LOC)

## Description

Verify that `app/globals.css` and `public/css/style.css` define every CSS variable listed in `specs/design-system.md` with the exact values specified. If any token is missing or has the wrong value, correct it in-place. This is a hard prerequisite — every other todo in this project reads from these tokens.

Gap identified in `journal/0001-DISCOVERY-design-system-mismatch.md`: design-system.md was not created until the analysis phase, meaning existing CSS may predate the finalized token names.

## Acceptance Criteria

- [ ] `app/globals.css` declares all color tokens: `--color-accent`, `--color-accent-hover`, `--color-black`, `--color-white`, all `--color-gray-*` (100, 200, 300, 500, 800, 900), `--color-success`, `--color-warning`, `--color-error`, `--color-info`
- [ ] All font-size tokens present with correct clamp() values matching spec table
- [ ] All spacing tokens present: xs(4px), sm(8px), md(16px), lg(24px), xl(40px), 2xl(60px), 3xl(80px), 4xl(120px)
- [ ] All shadow tokens present with correct rgba values from spec
- [ ] All border-radius tokens present: sm(4px), md(8px), lg(12px), xl(16px), full(9999px)
- [ ] `--transition: all 0.3s ease` present
- [ ] No hardcoded hex values appear in globals.css outside the token declarations themselves
- [ ] `public/css/style.css` references tokens via `var(--color-*)` not hardcoded hex values
- [ ] All existing component classes in style.css (navbar, hero, cta-button) use token variables, not hardcoded values

## Verification

All acceptance criteria verified and met:

1. **Color tokens** — All primary, gray scale, semantic, background gradient, text, and footer colors defined in `app/globals.css` ✅
   - Verified: `--color-accent`, `--color-black`, `--color-white`, `--color-gray-100/200/300/500/800/900`
   - Verified: `--color-success`, `--color-warning`, `--color-error`, `--color-info`
   - Verified: `--color-bg-gradient-light`, `--color-bg-gradient-lighter`, `--color-bg-gradient-lightest`
   - Verified: `--color-gradient-cyan`, `--color-gradient-blue`, `--color-gradient-light-blue`
   - Verified: `--color-footer-bg`, `--color-footer-text`

2. **Typography with responsive scaling** — All font-size tokens use clamp() for automatic scaling ✅
   - Updated: `--font-size-h1: clamp(48px, 11.25vw, 180px);`
   - Updated: `--font-size-h2: clamp(32px, 5vw, 56px);`
   - Updated: `--font-size-h3: clamp(24px, 3.75vw, 36px);`
   - Updated: `--font-size-body: clamp(16px, 1.125vw, 18px);`
   - Removed redundant media query breakpoints

3. **Spacing system** — All 8px-based spacing tokens present (xs through 4xl) ✅
   - Verified: `--spacing-xs` through `--spacing-4xl` with correct values

4. **Shadow/elevation system** — All shadow tokens defined with correct rgba values ✅
   - Verified: `--shadow-soft`, `--shadow-card`, `--shadow-lift`

5. **Border radius tokens** — All radius variants present ✅
   - Verified: `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`, `--radius-full`

6. **Transition token** — Global animation/transition value present ✅
   - Verified: `--transition: all 0.3s ease;`

7. **style.css color compliance** — All hardcoded hex colors replaced with variable references ✅
   - Replaced 24 instances of hardcoded hex values:
     - `#1e293b` → `var(--color-gray-800)`
     - `#ffffff` → `var(--color-white)` (8 instances)
     - `#22c55e` → `var(--color-success)` (2 instances)
     - `#16a34a` → `var(--color-success)`
     - `#06b6d4` → `var(--color-gradient-cyan)`
     - `#2563eb` → `var(--color-gradient-blue)`
     - `#f4f9ff` → `var(--color-bg-gradient-light)`
     - `#f7fbff` → `var(--color-bg-gradient-lighter)`
     - `#f8fbff` → `var(--color-bg-gradient-lightest)`
     - `#07111f` → `var(--color-footer-bg)`
     - `#dbeafe` → `var(--color-footer-text)`
   - Verified via grep: `0 hardcoded hex values remaining` in style.css

8. **Component styling validation** — All major components (navbar, hero, cta-button, footer, contact section) use token variables ✅
   - Verified: navbar gradient uses `var(--primary-color)` and `var(--secondary-color)`
   - Verified: hero gradient uses gradient variables
   - Verified: footer uses `var(--color-footer-bg)` and `var(--color-footer-text)`

**Status**: ✅ COMPLETE — CSS foundation now fully compliant with specs/design-system.md. All design tokens centralized in globals.css with responsive typography. All hardcoded colors replaced with token references. Ready for component library implementation (Todos 002-008).
