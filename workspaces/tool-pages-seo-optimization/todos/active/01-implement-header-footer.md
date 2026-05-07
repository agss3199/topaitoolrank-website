# Todo 01: Implement Header & Footer Components

**Status**: Pending  
**Implements**: specs/tool-pages-header-footer.md  
**Dependencies**: None  
**Blocks**: 02-integrate-header-footer-to-tool-pages, 04-configure-per-tool-seo-metadata

## Description

Create shared, reusable Header and Footer React components for all 9 tool pages. These components must:
- Work across all 9 tools without CSS conflicts (no tool-specific CSS classes)
- Provide navigation (desktop + mobile hamburger)
- Display related tool links in footer
- Be responsive (desktop 1024px+, tablet 768px-1023px, mobile <768px)
- Follow accessibility standards (WCAG AA)

## Acceptance Criteria

- [x] Header component created at `app/tools/lib/Header.tsx`
- [x] Footer component created at `app/tools/lib/Footer.tsx`
- [x] Header CSS in `app/tools/lib/Header.module.css`
- [x] Footer CSS in `app/tools/lib/Footer.module.css`
- [x] Header displays correctly on all 9 tools
- [x] Footer displays correctly on all 9 tools
- [x] Mobile hamburger menu opens/closes properly
- [x] Tools dropdown displays all 10 tools organized by category
- [x] Footer shows 5 top tools with "View all" link
- [x] No CSS conflicts with tool-specific styles
- [x] Responsive layout passes mobile viewport test
- [x] ARIA labels on all interactive elements
- [x] Keyboard navigation works (Tab through menu items)
- [x] Color contrast passes WCAG AA (minimum 4.5:1 for text)

## Implementation Notes

**Header Component**:
- Left: Logo + "Top AI Tool Rank" text
- Center: Navigation (desktop) / Hamburger (mobile)
- Right: Empty (reserved for future)
- Height: 80px desktop, 64px mobile
- Sticky / fixed positioning: Up to you (spec doesn't mandate)

**Footer Component**:
- Dark gray background (#1f2937)
- 4-column grid (desktop), 1 column (mobile)
- Sections: Branding, Tools, Resources, Legal
- Bottom: Copyright notice
- Height: ~400px desktop, ~600px mobile

**CSS Isolation**:
- No tool-specific CSS classes in Header/Footer
- Use CSS Modules to avoid conflicts
- All selectors start with `.tool-header__` or `.tool-footer__`

**Navigation Structure**:
- Tools dropdown shows all 10 tools grouped by category
- Links: Blog, About, Contact
- Mobile: Slide-out sidebar with same links

**Testing**:
- Manual test: Visit each of 9 tools, verify header/footer appear
- Manual test: Resize browser from desktop to mobile, verify responsive layout
- Manual test: Click hamburger menu on mobile, verify slide-out appears
- Manual test: Click tools in dropdown, verify navigation works

## Related Specs

- Header design requirements: specs/tool-pages-header-footer.md § Header Component
- Footer design requirements: specs/tool-pages-header-footer.md § Footer Component
- CSS isolation: `.claude/rules/project/css-module-safety.md`

## Time Estimate

~2-3 hours (React components + CSS, moderate complexity)
