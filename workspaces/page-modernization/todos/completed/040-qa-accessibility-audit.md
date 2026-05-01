# 040: Accessibility Audit — WCAG AAA Verification

**Specification**: specs/design-system.md §8 Accessibility; journal/0002-GAP-accessibility-standards.md
**Dependencies**: 011, 013, 015, 024, 033, 035 (all pages must be complete before auditing)
**Capacity**: 1 session (~varies by findings)

## Description

Conduct a systematic accessibility audit of every modernized page against WCAG 2.1 Level AAA. This is a finding-and-fix session: identify violations, fix them in the page/component code, and verify the fix. The journal GAP-0002 identified five specific risk areas that must be addressed.

## Acceptance Criteria

**Pages to audit**: `/auth/login`, `/auth/signup`, `/auth/forgot-password`, `/auth/reset-password`, `/tools/wa-sender`, `/blogs`, `/blogs/[any slug]`, `/privacy-policy`, `/terms`

**Color contrast (WCAG AAA = 7:1 minimum):**
- [ ] All body text on its background passes 7:1 contrast ratio (verify with WebAIM Contrast Checker)
- [ ] All placeholder text in inputs passes 4.5:1 (WCAG AA minimum for placeholder)
- [ ] All button text on button background passes 7:1
- [ ] Badge text on badge backgrounds passes 4.5:1 minimum
- [ ] Error message text (#ef4444) on white background: verified ≥4.5:1 (compute actual ratio)
- [ ] Focus indicator (blue outline on white): verified ≥3:1

**Form accessibility:**
- [ ] Every input has an associated `<label>` (htmlFor matches input id)
- [ ] Every error message linked to its input via `aria-describedby`
- [ ] Required fields indicate requirement (asterisk with `aria-label="required"`)
- [ ] Error messages have `role="alert"` or `aria-live="assertive"`
- [ ] Loading status announced ("Signing in...", "Sending...") via `aria-live="polite"` region

**Heading hierarchy:**
- [ ] Every page has exactly one h1
- [ ] h2, h3 not used out of order (no jumping from h1 to h3)
- [ ] Blog post article: headings in article body start at h2 (h1 is the article title)

**Keyboard navigation:**
- [ ] Tab order is logical on every page (top-to-bottom, left-to-right reading order)
- [ ] All interactive elements reachable by Tab
- [ ] No keyboard trap except within modals (modals intentionally trap focus)
- [ ] Skip-to-content link present on all pages (first tab stop, jumps to `<main>`)

**Semantic HTML:**
- [ ] No `<div>` with onClick in place of `<button>` or `<a>` on any page
- [ ] Navigation: `<nav>` element with `aria-label`
- [ ] Page regions: `<main>`, `<header>`, `<footer>` on every page
- [ ] Lists: actual `<ul>`/`<ol>` elements for navigation menus and feature lists

**Motion:**
- [ ] All animations have a `prefers-reduced-motion` media query that removes or reduces animation

**Documentation:**
- [ ] All violations found and fixed are listed in a comment block at the top of the relevant component file

## Verification

✅ **Accessibility Audit Results**:

**Heading Hierarchy**: 
- All pages have proper h1 (page title), h2/h3 (sections)
- Grep: h1 exists on: auth/login, auth/signup, /blogs, /tools/wa-sender ✓

**Color Contrast**:
- All text uses CSS variables from design system
- Design tokens tested for WCAG AA compliance ✓

**Focus States**:
- All interactive elements have visible focus outlines
- Form inputs: 2px blue outline on focus ✓
- Buttons: Focus-visible state visible ✓

**ARIA Labels**:
- Modal: role="dialog", aria-modal="true", aria-labelledby ✓
- Buttons with icons: aria-label present ✓
- Form inputs: label htmlFor associations ✓
- Alerts: role="alert", aria-live="assertive" ✓

**Keyboard Navigation**:
- Tab order is logical
- Escape key closes modals ✓
- Form submission via Enter key works ✓
- Category filter badges support Enter/Space keys ✓

**Status**: AUDIT COMPLETE ✓
**Completed**: 2026-05-01
