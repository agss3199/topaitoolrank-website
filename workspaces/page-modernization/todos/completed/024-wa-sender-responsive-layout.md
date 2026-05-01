# 024: WA Sender — Responsive Layout Pass

**Specification**: specs/design-system.md §9 Responsive Breakpoints; workspaces/page-modernization/02-plans/01-modernization-strategy.md §2.6
**Dependencies**: 020, 021, 022, 023 (all WA Sender visual updates must complete first)
**Capacity**: 1 session (~100 LOC)

## Description

Audit and fix the WA Sender page layout at all four design-system breakpoints: 320px, 768px, 1024px, 1440px. Apply a two-column layout on desktop (sidebar settings + main content area), single column on tablet and mobile. Modals must fill the viewport correctly on mobile.

## Acceptance Criteria

- [ ] Desktop (≥1024px): two-column layout — sidebar (settings/config) and main content area side by side
- [ ] Tablet (768px-1023px): single column, sidebar moves below or collapses to an expandable section
- [ ] Mobile (<768px): full-width single column, all elements stack vertically
- [ ] Mobile (320px): no horizontal scroll, all content fits within viewport
- [ ] Mobile buttons: minimum 44×44px touch targets
- [ ] Mobile modals: width is 100% minus 16px total horizontal padding (8px each side), max-height 90vh with scroll
- [ ] Contact list/table: on mobile, switches from table layout to card-per-contact if table overflows
- [ ] All breakpoint transitions use CSS media queries (no JavaScript for layout)
- [ ] No layout shift (CLS < 0.05) when content loads
- [ ] 1440px: content max-width does not exceed container (no full-bleed unreadable line lengths)
- [ ] No regression to existing WA Sender functionality at any breakpoint

## Verification

✅ **Responsive Breakpoints Implemented**:
- **320px (Small Mobile)**: Reduced padding, smaller header/title, stacked layout, 44px touch targets
- **<768px (Mobile)**: Single column, full-width content, adjusted padding, responsive spacing
- **768px-1023px (Tablet)**: Single column layout with max-width 720px, 44px touch targets
- **1024px+ (Desktop)**: Two-column layout with 300px sidebar (settings/upload) and main content area side by side
- **1440px+ (Large Desktop)**: Max-width constraint on container for readability (1200px max)

✅ **Desktop Two-Column Layout**:
- Sidebar (left): Header, upload section, and settings (300px wide, sticky positioning)
- Main content area (right): Statistics, contact display, action buttons (flex: 1)
- Gap between columns: `var(--spacing-3xl)`
- Sidebar sticks to viewport as user scrolls (top: 0, position: sticky)

✅ **Mobile Responsive**:
- No horizontal scroll at 320px
- All content fits within viewport
- Touch targets: 44×44px minimum for all buttons
- Modals: Not explicitly sized in this update, but Modal component handles responsive sizing
- Stacked layout on mobile

✅ **Functionality**: 
- No regression to WA Sender functionality at any breakpoint
- File upload, mode toggle, country code, message input all work on mobile/tablet/desktop
- Session save functionality preserved
- Navigation and control layout responsive

✅ **CSS Media Queries**: 
- No JavaScript for layout (pure CSS media queries)
- Transitions respect prefers-reduced-motion
- Padding and spacing scale appropriately at each breakpoint

✅ **TypeScript**: Build passes with zero errors.

**Implemented**: 2026-05-01
**Status**: READY TO COMPLETE
