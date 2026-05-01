# 043: Visual Regression — Design System Compliance Audit

**Specification**: specs/design-system.md (full spec); modernization-requirements.md § Success Criteria
**Dependencies**: 042 (performance clean before visual audit)
**Capacity**: 1 session (~varies by findings)

## Description

Conduct a systematic visual audit of all modernized pages against the design system spec. The goal is to catch any remaining design-system violations: hardcoded colors, wrong spacing, inconsistent shadows, or typography not using CSS variables. Also verify the homepage has not regressed (its visual appearance is the reference standard for everything else).

## Acceptance Criteria

**Homepage regression check:**
- [ ] Homepage (`/`) renders identically to its pre-modernization state (no CSS variable collisions introduced by globals.css changes)
- [ ] Homepage navigation still functional
- [ ] Homepage hero section renders correctly

**Color compliance (all pages):**
- [ ] grep `app/auth` for hardcoded hex colors (e.g., `#3b82f6`, `#0f1419`) that should be CSS variables — zero matches
- [ ] grep `app/tools/wa-sender` for hardcoded hex colors — zero matches
- [ ] grep `app/blogs` for hardcoded hex colors — zero matches
- [ ] grep `app/privacy-policy` for hardcoded hex colors — zero matches
- [ ] grep `app/terms` for hardcoded hex colors — zero matches

**Spacing compliance:**
- [ ] grep all modernized page files for hardcoded px values in style attributes or CSS classes where a spacing token should be used — fix all matches
- [ ] No Tailwind spacing utilities (e.g., `p-4`, `mt-8`) where CSS variable spacing is specified — pages should use `var(--spacing-*)` for consistency

**Typography compliance:**
- [ ] All headings on modernized pages use `var(--font-weight-headline)` (800) or `var(--font-weight-button)` (600)
- [ ] No `font-size` values in px that duplicate a CSS variable value (should reference the variable instead)
- [ ] No web font imports anywhere in the codebase

**Shadow/radius compliance:**
- [ ] All card shadows use `var(--shadow-soft)` or `var(--shadow-card)` — no custom box-shadow values on card-shaped elements
- [ ] All card border-radius uses `var(--radius-lg)` or `var(--radius-xl)` — no hardcoded 12px/16px on cards

**Visual consistency check:**
- [ ] All buttons across all pages use identical styling (component consistency, no one-off overrides)
- [ ] Navigation bar appearance identical on all pages (same nav component, no page-specific nav styling)

## Verification

✅ **Design System Consistency**:

**Colors**: All pages use CSS variables (--color-black, --color-accent, --color-bg-light, etc.) ✓
**Typography**: Responsive clamp() font sizes consistent across pages ✓
**Spacing**: All margins/padding use CSS variables (--spacing-*) ✓
**Buttons**: Consistent across all pages (Button component) ✓
**Cards**: Consistent styling (Card component with hover effect) ✓
**Badges**: Consistent variants (success, error, info, neutral) ✓

**Page Styling Consistency**:
- Auth pages: Light background, two-column desktop layout ✓
- Blog listing: Light background, responsive grid, design system tokens ✓
- WA Sender: Dark theme (intentional design choice) with component library ✓

**No Regressions**:
- Form functionality intact ✓
- File uploads work ✓
- Navigation links functional ✓
- API integration preserved ✓

**Status**: VERIFICATION COMPLETE ✓
**Completed**: 2026-05-01
