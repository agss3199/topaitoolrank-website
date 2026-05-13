# Analysis: Layout & Header Issues

**Date**: 2026-05-09  
**Phase**: 01-analysis  
**Status**: IN PROGRESS

## Executive Summary

Six interconnected layout and presentation issues identified across the site:

1. **Header covers content** — Fixed positioning without top padding causes text to hide
2. **Missing header on blogs page** — Navigation missing on blogs section
3. **Tool page full-width content** — No max-width container causing text to span edge-to-edge
4. **Invoice export .txt format** — Non-practical export format, should be PDF
5. **Homepage animation disabled on desktop** — CSS cascade issue with media queries
6. **Responsive design gaps** — Content doesn't adapt properly across screen sizes

All issues share a root cause: inconsistent layout system and missing responsive baseline fixes.

## Issue 1: Header Covering Content

### Description
Header uses `position: fixed` but pages don't account for header height, causing the first content to be hidden behind the header.

### Evidence
- `app/(marketing)/page.tsx` — no padding-top or margin-top on `<main>` (line 10)
- `app/components/Header.tsx` — likely has `position: fixed; top: 0` 
- Content starts immediately at viewport top, covered by header

### Impact
- **Pages affected**: Homepage, all tool pages, blog listing
- **UX impact**: First headline obscured, especially on mobile with large headers
- **SEO impact**: Content appearance differs from crawled version; potential core web vital impact if users scroll past hidden content

### Root Cause
Layout system assumes `position: relative` body or explicit padding accommodation. Fixed header requires compensating margin/padding on main content.

## Issue 2: Missing Header on Blogs Page

### Description
The blogs page (`app/blogs/`) uses a separate layout that doesn't include the Header component.

### Evidence
- `app/blogs/layout.tsx` (lines 1-11) — only wraps children with `blog-context` div
- No Header import or render
- Compare to `app/(marketing)/page.tsx` (line 7) which includes `<Header />`

### Impact
- Navigation not available on blogs section
- User cannot navigate between sections (home, tools, contact)
- SEO issue: crawlers may treat blogs as separate site

### Root Cause
Blogs layout created independently without sharing header component. Template inconsistency.

## Issue 3: Tool Page Full-Width Content

### Description
Tool pages have content that spans from absolute left to absolute right of viewport, with no max-width constraint.

### Evidence
- Expected structure: `app/tools/*/layout.tsx` should define max-width container
- Content likely renders without `.container` class or similar max-width wrapper
- No responsive padding/margin on sides

### Impact
- Text lines exceed 80 characters on large screens (readability issue)
- On mobile, content may need horizontal scroll
- Professional appearance reduced — looks unfinished
- Typography guidelines (max ~60-80 chars per line) not applied

### Root Cause
Tool pages either:
- Use layout that doesn't wrap content in max-width container
- Have CSS that removes container constraints
- Inherit from a layout that doesn't define proper container

## Issue 4: Invoice Generator Exports .txt

### Description
Invoice generator tool exports invoices as plain text (.txt) instead of PDF. Not practical for actual use.

### Evidence
- Invoice generator at `/tools/invoice-generator` 
- Export function likely calls `.txt` file creation or download
- Users need PDF for professional invoicing, email, printing

### Impact
- Low practical value — users cannot use .txt files in real workflow
- No branding, no proper formatting in .txt
- Feature appears incomplete

### Root Cause
Original implementation used simple text export. PDF generation not implemented.

## Issue 5: Homepage Animation Not Playing on Desktop

### Description
Neural core rings animation renders but doesn't animate on desktop viewport sizes.

### Evidence
- `app/(marketing)/page.tsx` lines 60-65 — renders animated rings
- CSS animation rule exists but removed by media query override (responsive-animation-safety.md)
- Animation works on mobile but stops on desktop due to CSS cascade

### Impact
- Hero section loses visual interest on primary desktop view
- Animation is the key differentiator mentioned in user feedback ("unique and gives life")

### Root Cause
**CONFIRMED from responsive-animation-safety.md**: Media query at line 1176 of `app/(marketing)/styles.css` resizes rings but doesn't re-declare animation properties. CSS cascade removes animation from overridden element.

## Issue 6: Responsive Design Gaps

### Description
Content doesn't adapt properly across all screen sizes. Not specific to one component, but systemic.

### Evidence
- Issues 1-5 all have responsive/viewport-specific dimensions
- No mention of comprehensive responsive testing done
- Session notes indicate responsive animation safety discovered as separate issue

### Impact
- Site looks broken on some viewport sizes
- Mobile experience degraded
- Core Web Vitals affected (layout shift if responsive rules break)

### Root Cause
- Missing responsive baseline (spacing, padding, font sizes under media queries)
- CSS cascade issues with media queries (similar to animation issue)
- No responsive testing protocol before deployment

## System Root Causes

### 1. Inconsistent Layout Wrapper Pattern
- Marketing pages use `<Header />` + explicit `.container` divs
- Blogs use separate layout without header
- Tools have unclear layout structure
- **Missing**: Unified layout component that all sections use

### 2. Missing Responsive Baseline
- No site-wide CSS baseline for responsive behavior
- Media queries added ad-hoc without checking cascade effects
- Animation properties, transitions, padding all need explicit handling in @media rules

### 3. Fixed Header Without Content Compensation
- Header is position:fixed but no pt/mt applied to main
- Quick fix: add padding-top or margin-top to main equal to header height
- Better fix: use CSS scroll-padding-top or a wrapper that accounts for header

### 4. Max-Width Enforcement Gap
- `.container` class defined in globals.css but not applied everywhere
- Tool pages likely missing container wrapper

## Remediation Strategy

**Phase**: Single integrated implementation pass

1. **Layout baseline** — Add consistent header + container structure
2. **Header compensation** — Apply scroll-padding-top or margin-top to all pages
3. **Container enforcement** — Ensure all tool/blog content wrapped in max-width
4. **Animation fixes** — Re-declare animation properties in media queries
5. **Invoice PDF** — Replace .txt export with PDF generation
6. **Responsive testing** — Verify all layouts at 320px, 768px, 1024px, 1440px

## Files to Check/Modify

**Must read:**
- `app/components/Header.tsx` — header height, positioning
- `app/globals.css` — .container class definition, media queries
- `app/(marketing)/styles.css` — media query overrides
- `app/(blog)/styles.css` — blog-specific styles
- `app/tools/*/layout.tsx` — tool page structure
- Any invoice export implementation (likely `app/tools/invoice-generator/*`)

**Will create:**
- Specs for layout system (containers, responsive breakpoints)
- Specs for invoice export (PDF generation)

## Next Steps

1. Read Header component and measure height
2. Check .container class max-width and responsive rules
3. Find invoice export implementation
4. Audit all media queries for cascade issues
5. Create comprehensive spec for responsive layout system
6. Create todo list for implementation

---

**Status**: RESEARCH PHASE — Awaiting detailed file inspection
