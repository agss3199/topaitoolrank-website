# TODO-601: Fix Fixed Header Content Compensation

**Status**: ACTIVE  
**Severity**: CRITICAL  
**Effort**: 1 implementation cycle (~30 min)  
**Implements**: specs/layout-system-responsive-design.md § Fixed Header Specification, § Header Visibility & Keyboard Accessibility  
**Depends on**: nothing (standalone CSS + HTML change)  
**Blocks**: TODO-602 (blogs header — must confirm scroll-padding works before adding header to more pages)

---

## Description

The site header uses `position: fixed; top: 18px` with an effective visual height of ~108px. Nothing compensates for this offset, so the first ~108px of page content is hidden behind the header on load, and anchor navigation (`#home`, `#services`, etc.) scrolls content under the header rather than into view.

Additionally, keyboard users have no way to skip past the fixed header to reach main content — violating WCAG 2.1 SC 2.4.1 (Bypass Blocks).

These two issues are addressed together because they both live in `app/globals.css` and `app/layout.tsx` and the fix is low-risk.

---

## Acceptance Criteria

- [ ] `html { scroll-padding-top: 120px; }` is present in `app/globals.css`
- [ ] Anchor links (`#home`, `#services`, `#tools`, `#contact`) scroll to the correct position — top of target section is visible below the header, not behind it
- [ ] A skip-to-content link (`<a href="#main">Skip to main content</a>`) is the first focusable element in `app/layout.tsx`
- [ ] The skip link is visually hidden until focused (CSS: off-screen by default, fixed position on `:focus`)
- [ ] `<main>` in relevant page layouts has `id="main"` so the skip link target resolves
- [ ] No regressions: homepage hero still renders at full height, no unintended margin/padding changes
- [ ] Manual check: load homepage, Tab once — skip link appears; press Enter — focus moves to main content, header does not obscure it

---

## Subtasks

- [ ] Add `scroll-padding-top` to `app/globals.css` (Est: 5 min) — Verification: grep confirms property present; click `#services` anchor, section header visible below nav
- [ ] Add skip-to-content link as first child of `<body>` in `app/layout.tsx` (Est: 10 min) — Verification: DOM inspector shows `<a href="#main">` before `<Header />`
- [ ] Add skip-to-content CSS to `app/globals.css` (Est: 5 min) — Verification: Tab on homepage shows styled skip link overlay, then disappears on next Tab
- [ ] Confirm `id="main"` exists on `<main>` element in `app/(marketing)/page.tsx` (Est: 5 min) — Verification: `document.getElementById("main")` returns the element in browser console
- [ ] Smoke test: anchor navigation from homepage nav links works correctly (Est: 5 min) — Verification: clicking each nav link scrolls section into view without content hidden behind header

---

## Files to Change

| File | Change |
|------|--------|
| `app/globals.css` | Add `html { scroll-padding-top: 120px; }` and skip-to-content CSS |
| `app/layout.tsx` | Add `<a href="#main" className="skip-to-content">Skip to main content</a>` as first child |
| `app/(marketing)/page.tsx` | Confirm or add `id="main"` on `<main>` element |

No new files required.

---

## Implementation Notes

The scroll-padding-top value should be the effective header height. The spec calculates it as 72px (navContainer min-height) + 18px (top offset) + ~18px buffer = ~108px. Use 120px to provide comfortable clearance.

Skip-to-content CSS pattern:
```css
.skip-to-content {
  position: absolute;
  left: -9999px;
  top: auto;
  width: 1px;
  height: 1px;
  overflow: hidden;
}

.skip-to-content:focus {
  position: fixed;
  left: 16px;
  top: 110px;
  width: auto;
  height: auto;
  overflow: visible;
  background: var(--color-accent, #6366f1);
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  z-index: 9999;
  font-weight: 600;
  text-decoration: none;
}
```

Do not use `display: none` for the hidden state — that removes it from the accessibility tree entirely and keyboard users cannot reach it.

---

## Definition of Done

- [ ] All acceptance criteria checked manually in browser
- [ ] `app/globals.css` has scroll-padding-top
- [ ] Skip link present, styled, and functional
- [ ] No existing CSS tests broken
- [ ] Commit message: `fix(layout): add scroll-padding-top and skip-to-content for fixed header`
