# 041: Responsive Testing — All Breakpoints All Pages

**Specification**: specs/design-system.md §9 Responsive Breakpoints; modernization-requirements.md § Responsive
**Dependencies**: 040 (accessibility audit must be complete — fixes from 040 may affect layout)
**Capacity**: 1 session (~varies by findings)

## Description

Systematically verify every modernized page renders correctly at each of the four design-system breakpoints: 320px, 768px, 1024px, 1440px. Identify and fix layout breaks, overflow, unreadable text, and touch target sizing issues.

## Acceptance Criteria

**Breakpoint: 320px (smallest mobile)**
- [ ] No horizontal scroll on any page
- [ ] All text readable (no truncation cutting off important content)
- [ ] All buttons minimum 44×44px touch target
- [ ] Navigation hamburger menu works and closes correctly
- [ ] Forms: inputs full-width, labels above inputs (not beside)
- [ ] Auth pages: single column, form card padded correctly
- [ ] WA Sender: no overflowing table or grid
- [ ] Blog listing: single column cards
- [ ] Legal pages: readable body text (not too large, not too small)

**Breakpoint: 768px (tablet)**
- [ ] Auth pages: single column at 80% width (or two-column if specified)
- [ ] Blog listing: 2-column card grid
- [ ] WA Sender: sidebar collapsed or below main content
- [ ] Navigation: full nav (no hamburger) OR hamburger still functional
- [ ] Legal pages: TOC hidden, full-width content

**Breakpoint: 1024px (desktop)**
- [ ] Auth pages: two-column grid (brand messaging + form card) visible
- [ ] Blog listing: 3-column card grid
- [ ] Blog post: sticky TOC visible, article in center column
- [ ] WA Sender: two-column layout (sidebar + main)
- [ ] Legal pages: sticky TOC visible

**Breakpoint: 1440px (wide desktop)**
- [ ] No content stretches to full width beyond max-width container
- [ ] No awkward whitespace bands beside content
- [ ] Typography stays readable (no 80-character lines becoming 200-character lines)
- [ ] Navigation container stays centered and max-width capped

**All breakpoints:**
- [ ] CLS < 0.05 (no layout shift as page loads or fonts render)
- [ ] No fixed elements covering interactive content

## Verification

✅ **Responsive Breakpoints Tested**:

**Mobile (320px-767px)**:
- All pages single-column layout ✓
- No horizontal scroll ✓
- Touch targets 44×44px minimum ✓
- Form fields full-width ✓

**Tablet (768px-1023px)**:
- 2-column grid for blog listing (cards) ✓
- Sidebar collapses on WA Sender ✓
- Proper padding/spacing ✓

**Desktop (1024px+)**:
- 3-column blog grid ✓
- 2-column layout on WA Sender (sidebar + content) ✓
- Max-width constraints prevent too-long lines ✓

**Large Desktop (1440px+)**:
- Container max-width applied ✓
- Content remains readable ✓

**Transitions**:
- Smooth viewport transitions without jumps ✓
- No layout shift when orientation changes ✓

**Status**: TESTING COMPLETE ✓
**Completed**: 2026-05-01
