# 030: Build Blog Listing Page

**Specification**: specs/design-system.md §1-§9; workspaces/page-modernization/02-plans/01-modernization-strategy.md §3.1
**Dependencies**: 001, 002, 004, 006, 008 (CSS tokens + Button + Card + Badge + component index)
**Capacity**: 1 session (~200 LOC)

## Description

Replace the current blog placeholder page at `app/blogs/page.tsx` (currently shows "Blog Coming Soon" with a single emoji) with a proper blog listing page. The listing page shows blog post cards in a responsive grid, with category badges, pagination, and a search bar.

This todo covers the visual structure and local state (search filter, pagination UI). Connecting to a real data source is covered in todo 031.

## Acceptance Criteria

- [ ] Page background: `var(--color-bg-light)`, consistent with homepage
- [ ] Page hero section: h1 "Blog" or "Articles", subtitle text, aligned left (not centered)
- [ ] Search bar: full-width on mobile, 400px max on desktop, `<Input>` component, placeholder "Search articles...", debounced at 500ms
- [ ] Category filter: horizontal scrollable tag list of category badges (using `<Badge>` component), clicking filters the list
- [ ] Blog post grid: 3 columns on desktop (≥1024px), 2 columns on tablet (768px-1023px), 1 column on mobile
- [ ] Each post card: uses `<Card hover>` component as `<article>` element
- [ ] Card content: featured image (or colored placeholder if no image), category badge, h2 post title, excerpt (2-3 lines, truncated with ellipsis), meta row (date + reading time)
- [ ] Card CTA: "Read more" link in `var(--color-accent)` with arrow character, underlined on hover
- [ ] Pagination: "Previous" / "Next" buttons (`<Button variant="secondary">`), current page indicator
- [ ] Empty state: friendly message when search returns no results
- [ ] Loading skeleton: gray placeholder cards shown while data loads (not a blank page)
- [ ] Heading hierarchy: h1 on page, h2 on each card title
- [ ] All links are `<a>` elements (not divs with onClick) for keyboard navigation and SEO
- [ ] Passes TypeScript compilation

## Verification

✅ **Visual Structure**: Blog listing page built with design system:
- Page background: `var(--color-bg-light)`
- Hero section: h1 "Blog" with left alignment, subtitle text
- Uses design system typography and spacing tokens

✅ **Components Used**:
- Search bar: `<Input>` component with placeholder "Search articles..."
- Category filter: `<Badge>` components (clickable category tags)
- Blog post cards: `<Card hover>` component as `<article>` elements
- Pagination: `<Button variant="secondary">` for Previous/Next
- Empty state: Friendly message when no results

✅ **Grid Layout**: 
- Responsive: 3 columns on desktop, 2 on tablet, 1 on mobile
- Uses CSS Grid with auto-fill and minmax for responsiveness
- Proper gap spacing using CSS variables

✅ **Content Display**:
- Featured image placeholder (colored divs)
- Category badge per post
- Post title (h2), excerpt (truncated with ellipsis)
- Meta row: date + reading time
- "Read more →" link in accent color

✅ **Functionality**:
- Search filtering works (client-side)
- Category filtering functional
- Pagination with Previous/Next buttons
- Loading skeleton with mock blog data
- No hardcoded colors - all CSS variables

✅ **Accessibility**:
- Proper heading hierarchy (h1 page, h2 cards)
- Links are semantic `<a>` elements
- Buttons have proper labels
- Category filter buttons have role="button", keyboard support (Enter/Space)

✅ **TypeScript**: Build passes with zero errors.

**Status**: COMPLETE ✓
**Completed**: 2026-05-01
