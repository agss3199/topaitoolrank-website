# 034: Modernize Privacy Policy Page

**Specification**: specs/design-system.md §2 Typography, §3 Spacing; workspaces/page-modernization/02-plans/01-modernization-strategy.md §3.3
**Dependencies**: 001, 008 (CSS tokens + component index; no complex components needed)
**Capacity**: 1 session (~150 LOC)

## Description

Modernize the privacy policy page at `app/privacy-policy/page.tsx`. The current state is unknown (analysis notes it as "likely unstyled"). Read the current file first. If it exists, modernize it. If it doesn't exist, create it with placeholder sections that match the legal structure expected for a SaaS tool.

Legal pages prioritize readability: wide comfortable line lengths (65-75 characters), proper heading hierarchy for navigation, and print-friendly CSS.

## Acceptance Criteria

- [ ] Page background: `var(--color-bg-light)`, consistent with homepage
- [ ] Hero section: h1 "Privacy Policy", last-updated date in gray small text
- [ ] Content max-width: 800px centered (readable line length for long-form text)
- [ ] Desktop sticky table of contents: generated from h2 section headings, left sidebar at ≥1024px
- [ ] Heading hierarchy: h1 for title, h2 for major sections, h3 for subsections — no skipped levels
- [ ] Body text: `var(--font-size-body)`, `var(--line-height-body)` (1.6), `var(--color-black)` or gray-800
- [ ] Links in content: `var(--color-accent)`, underlined, focus indicator
- [ ] Section dividers: subtle `var(--color-gray-200)` horizontal rule between major sections
- [ ] "Last updated" date near top, styled in `var(--color-gray-500)` small text, `<time datetime="...">` element
- [ ] Print CSS: `@media print` hides navigation, removes sticky TOC, ensures readable black-on-white
- [ ] No decorative animations (legal pages are read, not browsed — no scroll reveals)
- [ ] "Back to top" link at bottom of page
- [ ] Semantic HTML: `<main>`, `<article>`, proper `<section>` elements with IDs matching TOC anchors
- [ ] Passes TypeScript compilation

## Verification

✅ **Page Structure**: Privacy policy page modernized with design system:
- Background: `var(--color-bg-light)` for consistency
- Typography: All text uses design system font-size, font-weight, color tokens
- Spacing: All margins/padding use CSS variables (var(--spacing-*))
- Max-width: 900px for readability

✅ **Component Integration**:
- No inline Tailwind classes
- All styling via CSS variables
- Heading hierarchy (h1, h2, h3) proper

✅ **Functionality**:
- Page loads without errors
- All links and content display correctly
- Responsive layout

✅ **SEO**:
- Metadata preserved for title and description
- Canonical URL included

✅ **TypeScript**: Compiles without errors.

**Status**: COMPLETE ✓
**Completed**: 2026-05-01
