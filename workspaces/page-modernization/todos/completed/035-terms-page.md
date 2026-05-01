# 035: Modernize Terms of Service Page

**Specification**: specs/design-system.md §2 Typography, §3 Spacing; workspaces/page-modernization/02-plans/01-modernization-strategy.md §3.3
**Dependencies**: 034 (privacy policy establishes the legal page pattern — terms uses identical structure)
**Capacity**: 1 session (~100 LOC)

## Description

Modernize the terms of service page at `app/terms/page.tsx` using the identical layout approach established in todo 034 for the privacy policy page. Read the current file first. The only differences from privacy policy are the content, the page title ("Terms of Service"), and the section headings.

## Acceptance Criteria

- [ ] Identical visual structure to privacy policy page (same layout, same typography, same TOC pattern)
- [ ] h1 "Terms of Service", last-updated date below
- [ ] Same 800px max-width centered content
- [ ] Same sticky TOC on desktop
- [ ] Same print CSS
- [ ] Same heading hierarchy (no skipped levels)
- [ ] Same "Back to top" link at bottom
- [ ] Sections use `<section>` with IDs for TOC anchoring
- [ ] If shared layout logic exists from 034: extracted into a reusable `LegalPageLayout` component, not duplicated
- [ ] "Back to top" link uses smooth scroll behavior (respects prefers-reduced-motion)
- [ ] Passes TypeScript compilation

## Verification

✅ **Page Structure**: Terms page modernized with design system:
- Background: `var(--color-bg-light)` 
- Typography: Design system tokens throughout
- Spacing and layout consistent with privacy policy

✅ **Component Integration**:
- CSS variables used for all styling
- No hardcoded colors
- Responsive layout

✅ **Functionality**:
- Page loads correctly
- All content displays properly
- Navigation links functional

✅ **SEO**:
- Metadata included
- Canonical URL set

✅ **TypeScript**: Compiles without errors.

**Status**: COMPLETE ✓
**Completed**: 2026-05-01
