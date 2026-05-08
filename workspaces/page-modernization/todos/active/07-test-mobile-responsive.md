# Task 07: Test Mobile & Responsive Behavior

**Objective**: Verify header works correctly on mobile and tablet view  
**Scope**: Test hamburger menu, responsive layout, touch interactions  
**Status**: Not started  
**Estimate**: 15 minutes  
**Depends on**: Tasks 01–06 (Desktop tests passed)

---

## Description

Test the header on mobile devices and tablet breakpoints to ensure responsive behavior works correctly.

---

## Test Environment

- Browser: Chrome DevTools (mobile device emulation)
- Breakpoints to test:
  - **Mobile**: 320px (small phone)
  - **Tablet**: 768px (iPad)
  - **Large mobile**: 480px (large phone)
- Dev server: `npm run dev`
- Base URL: `http://localhost:3000`

---

## Test Case 1: Mobile View (320px)

**Setup**: Open `http://localhost:3000` and resize to 320px width

| Action | Expected | Result |
|--------|----------|--------|
| Page loads | Header visible, hamburger menu visible | ✓/✗ |
| Hamburger button visible | Three-line icon appears on right side | ✓/✗ |
| Nav menu hidden | Navigation menu not visible (hidden by default) | ✓/✗ |
| Click hamburger | Menu slides/fades in with nav items | ✓/✗ |
| Menu items visible | Home, Services, Tools, Blogs, Contact all visible | ✓/✗ |
| Tools section | Tools has sub-menu or expanded items | ✓/✗ |
| Click nav link | Menu closes automatically after click | ✓/✗ |
| Click Tools in menu | Tools dropdown/submenu appears on mobile | ✓/✗ |
| Click tool link | Navigates to tool page, menu closes | ✓/✗ |
| Logo still clickable | Click logo navigates to homepage | ✓/✗ |
| No horizontal scroll | Content fits in 320px width (no overflow) | ✓/✗ |

**Observations**: ________________

---

## Test Case 2: Large Mobile View (480px)

**Setup**: Resize browser to 480px width

| Action | Expected | Result |
|--------|----------|--------|
| Hamburger visible | Still shows hamburger (not desktop nav) | ✓/✗ |
| Menu toggle works | Hamburger opens/closes menu | ✓/✗ |
| Navigation spacing | More breathing room than 320px view | ✓/✗ |
| Text readable | Nav text is readable without zooming | ✓/✗ |
| Links tap-friendly | Buttons/links large enough for touch (≥44px) | ✓/✗ |

**Observations**: ________________

---

## Test Case 3: Tablet View (768px)

**Setup**: Resize browser to 768px width

| Action | Expected | Result |
|--------|----------|--------|
| Hamburger visible | Hamburger still visible (transition happening) | ✓/✗ |
| Hamburger toggles menu | Click hamburger opens/closes | ✓/✗ |
| Menu layout | Menu stacks vertically, readable | ✓/✗ |
| Touch targets | Buttons large enough for touch (≥44px) | ✓/✗ |

**Note**: Breakpoint at 768px is where hamburger appears/disappears. Test both sides of this boundary.

---

## Test Case 4: Desktop View (1200px)

**Setup**: Resize browser to 1200px width

| Action | Expected | Result |
|--------|----------|--------|
| Hamburger hidden | No hamburger menu visible | ✓/✗ |
| Desktop nav visible | Home, Services, Tools, Blogs, Contact in row | ✓/✗ |
| Links horizontal | All nav items in single horizontal row | ✓/✗ |
| Dropdown on hover | Tools dropdown appears on hover | ✓/✗ |

**Observations**: ________________

---

## Test Case 5: Hamburger Menu Behavior

**Setup**: On mobile (320px), test menu interaction

| Interaction | Expected | Result |
|-------------|----------|--------|
| Click hamburger | Menu opens with animation | ✓/✗ |
| Hamburger icon changes | Icon changes appearance (animated) | ✓/✗ |
| Click hamburger again | Menu closes with animation | ✓/✗ |
| Click outside menu | Menu closes (if applicable) | ✓/✗ |
| Tap menu item | Page navigates, menu closes | ✓/✗ |
| Double-tap hamburger | Opens, closes without side effects | ✓/✗ |

**Observations**: ________________

---

## Test Case 6: Tools Dropdown on Mobile

**Setup**: Mobile view (320px), click "Tools" menu item

| Action | Expected | Result |
|--------|----------|--------|
| Tools item clicked | Submenu expands to show all tools | ✓/✗ |
| All tools visible | Can scroll if needed, all 10 tools listed | ✓/✗ |
| Tools categorized | Tools grouped (Featured, Text & Language, etc.) | ✓/✗ |
| Click a tool | Navigates to tool page, menu closes | ✓/✗ |
| Grouping visible | Category headers visible | ✓/✗ |

**Observations**: ________________

---

## Test Case 7: Page Navigation on Mobile

**Setup**: Mobile view (320px)

**Test these pages**:
1. Homepage (`/`)
2. Word Counter (`/tools/word-counter`)
3. Invoice Generator (`/tools/invoice-generator`)

| Page | Header renders | Nav works | No overflow | Content accessible |
|------|---|---|---|---|
| Homepage | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ |
| Word Counter | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ |
| Invoice Gen | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ |

**Observations**: ________________

---

## Test Case 8: Animations & Performance

| Check | Expected | Result |
|-------|----------|--------|
| Menu animation smooth | Menu slides/fades without jank | ✓/✗ |
| Scroll performance | Page scrolls smoothly (not laggy) | ✓/✗ |
| No layout shift | CLS (Cumulative Layout Shift) minimal | ✓/✗ |
| Touch responsiveness | Buttons respond instantly to tap | ✓/✗ |

**Observations**: ________________

---

## Test Case 9: Accessibility on Mobile

| Check | Expected | Result |
|-------|----------|--------|
| ARIA labels | Hamburger has aria-label, aria-expanded | ✓/✗ |
| Keyboard navigation | Tab through nav items works | ✓/✗ |
| Focus visible | Focused elements have visible outline | ✓/✗ |
| Text contrast | Nav text readable (7:1 contrast ratio) | ✓/✗ |

**Observations**: ________________

---

## Test Checklist

- [ ] Mobile (320px) navigation works
- [ ] Large mobile (480px) navigation works
- [ ] Tablet (768px) navigation works
- [ ] Desktop (1200px) shows correct layout
- [ ] Hamburger menu opens/closes smoothly
- [ ] Dropdown works on mobile
- [ ] All pages render correctly on mobile
- [ ] No horizontal scrolling
- [ ] Animations smooth, no lag
- [ ] No console errors on mobile view

---

## Issues Found

| Test Case | Issue | Severity | Action |
|-----------|-------|----------|--------|
| | | HIGH/MEDIUM/LOW | Fix / Document / Skip |

---

## Passing Criteria

- [ ] Hamburger menu visible and functional on mobile (320px, 480px)
- [ ] Desktop nav visible and functional on desktop (1200px)
- [ ] Smooth transition at 768px breakpoint
- [ ] All navigation links work on all breakpoints
- [ ] No horizontal scrolling at any breakpoint
- [ ] Menu closes after link click
- [ ] Animations smooth
- [ ] No console errors

---

## Performance Notes

If page feels slow on mobile:
- Check for heavy images not optimized
- Check for blocking CSS/JS
- Use Chrome DevTools Lighthouse for performance audit

---

## Next Task

→ **08-verify-deployment.md** — Final verification and deployment checklist

