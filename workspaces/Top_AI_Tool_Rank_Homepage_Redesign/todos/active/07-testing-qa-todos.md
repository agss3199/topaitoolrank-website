# Milestone 7: Testing & QA — Detailed Todos

**Specs:** All specs (cross-referencing design, layout, interactions, performance, accessibility)
**Todos:** 070–084
**Estimated:** 1-2 sessions
**Gate:** All browsers and devices pass visual inspection, form submission works, no broken links, visual regression baseline created.

---

## Todo 070: Test on Chrome Desktop (Latest)

**Task:** Full manual test of the homepage on Chrome desktop (latest stable version) at 1280px viewport width. Verify layout, interactions, and visual correctness.

**Acceptance Criteria:**
- [ ] Page loads without JavaScript console errors
- [ ] Hero 2-column layout renders correctly (180px H1, visual on right)
- [ ] Hero visual overflows 120px into credibility strip
- [ ] All button hover states work (primary, secondary)
- [ ] All card hover states work (scale + shadow)
- [ ] Scroll reveal animations trigger on scroll
- [ ] Services grid: 4 columns, item 3 offset 40px
- [ ] Contact form: fills, submits, shows error states correctly
- [ ] Navigation: all links visible, no overflow
- [ ] Footer: 4 columns

**Browser:** Chrome latest stable
**Viewport:** 1280px width

**Dependencies:** Milestones 1–6 complete

**Verification:**
1. Open Chrome DevTools — Console tab — confirm zero errors on load
2. Scroll through entire page top-to-bottom — all sections render correctly
3. Document any visual discrepancies vs spec

---

## Todo 071: Test on Firefox Desktop (Latest)

**Task:** Full manual test on Firefox desktop (latest stable). CSS Grid rendering can differ slightly between Chrome and Firefox — verify asymmetric layouts are consistent.

**Acceptance Criteria:**
- [ ] All layout tests from Todo 070 pass in Firefox
- [ ] CSS Grid `transform: translateY(40px)` on service card 3 renders correctly
- [ ] `backdrop-filter: blur()` on navigation glassmorphic effect renders (Firefox requires `-webkit-` prefix for older versions — confirm it works)
- [ ] CSS animations and transitions play correctly
- [ ] No Firefox-specific console errors or warnings
- [ ] Focus indicators visible (Firefox has its own default focus ring — verify override works)

**Browser:** Firefox latest stable
**Viewport:** 1280px

**Dependencies:** Todo 070

**Verification:**
1. Load page in Firefox — console — zero errors
2. Compare layout side-by-side with Chrome — no meaningful differences
3. Test navigation blur effect — confirm visible

---

## Todo 072: Test on Safari Desktop (Latest)

**Task:** Full manual test on Safari desktop (latest stable on macOS). Safari has known differences with CSS Grid, Flexbox, and `backdrop-filter` — verify all layouts work.

**Acceptance Criteria:**
- [ ] All layout tests from Todo 070 pass in Safari
- [ ] `backdrop-filter: blur(18px)` on nav renders (requires `-webkit-backdrop-filter` prefix — verify)
- [ ] CSS Grid gap rendering matches Chrome
- [ ] CSS `transform` on service card 3 renders correctly
- [ ] No Safari-specific console errors
- [ ] `scroll-behavior: smooth` (if used) works in Safari
- [ ] Form inputs render correctly (Safari has unique default styling — verify CSS overrides it)

**Browser:** Safari latest stable (macOS only — use real Mac or macOS VM)
**Viewport:** 1280px

**Dependencies:** Todo 071

**Verification:**
1. Open Safari — Web Inspector — Console — zero errors
2. Visual comparison to Chrome — confirm no layout breaks
3. Test `backdrop-filter` on nav — visible blur effect

---

## Todo 073: Test on Safari iOS (iPhone 12, iPhone SE)

**Task:** Test homepage on Safari iOS, which has unique rendering quirks (100vh bug, tap highlight, bounce scrolling). Use real device if available, otherwise XCode iOS Simulator.

**Acceptance Criteria:**
- [ ] No 100vh overflow at bottom of page (Safari iOS 100vh includes browser chrome — use `dvh` or JavaScript workaround if needed)
- [ ] Hero section: single column, correct mobile layout
- [ ] Navigation: hamburger menu visible, tap opens/closes correctly
- [ ] Hamburger tap target: ≥44px × 44px
- [ ] All mobile touch interactions work (tap buttons, tap cards, form input focus)
- [ ] Scroll is smooth (no janky scroll)
- [ ] No layout overflow at iPhone SE width (375px)
- [ ] Form keyboard does not cause layout shift

**Devices:** iPhone 12 (390px) and iPhone SE 3rd gen (375px)
**Browser:** Safari iOS

**Dependencies:** Todo 020 (mobile layout)

**Verification:**
1. XCode Simulator or real device — load homepage
2. Tap through all interactive elements
3. Submit contact form (test both success and error paths)

---

## Todo 074: Test on Chrome Android (Pixel 4, Moto G4)

**Task:** Test homepage on Chrome for Android at two device sizes — Pixel 4 (medium, 393px) and Moto G4 (low-end, 360px). Verify performance and layout on both.

**Acceptance Criteria:**
- [ ] All mobile layout tests from Todo 073 pass on Chrome Android
- [ ] Moto G4 (360px): no layout overflow
- [ ] Page loads within 4 seconds on Moto G4 profile (4G simulation)
- [ ] Scroll reveal animations smooth (no jank on Moto G4 with 4x CPU throttle)
- [ ] Hamburger menu opens/closes correctly
- [ ] Form submission works

**Test method:** Chrome DevTools Device Toolbar with device emulation (or real Android device)
**Devices:** Moto G4 preset (360px) and Pixel 4 preset (393px)

**Dependencies:** Todo 055 (Moto G4 performance test), Todo 073

**Verification:**
1. DevTools Device Toolbar — select Moto G4 — test all interactions
2. DevTools Device Toolbar — select Pixel 4 — repeat

---

## Todo 075: Test on Samsung Galaxy (Android 12+)

**Task:** Test on a Samsung Galaxy device profile (typically 384px wide on Galaxy S series) to verify layout at this width and confirm Samsung Internet browser compatibility if possible.

**Acceptance Criteria:**
- [ ] Layout correct at 384px (no horizontal overflow)
- [ ] All touch interactions work
- [ ] If testing Samsung Internet browser: verify CSS Grid and CSS custom properties work
- [ ] No Galaxy-specific rendering issues

**Test method:** Chrome DevTools Device Toolbar with Galaxy S20 or similar preset

**Dependencies:** Todo 074

**Verification:**
1. DevTools — Galaxy S20 preset (360px) or Galaxy S8 (360px) — load page — visual check
2. Zero horizontal overflow

---

## Todo 076: Test Responsive Layout at Key Breakpoints (320px, 768px, 1024px)

**Task:** Systematic test at the three exact breakpoint boundaries defined in the spec. Verify layout switches occur at exactly the right widths and there are no layout issues at the boundary.

**Spec reference:** `specs/layout-specs.md` — Responsive Breakpoints table.

**Acceptance Criteria:**
- [ ] At 319px: mobile layout, single column, no overflow (edge case test)
- [ ] At 320px: mobile layout, single column, no overflow
- [ ] At 767px: mobile layout still active
- [ ] At 768px: tablet layout activates (services 2-column, hero single-column with 60px overflow)
- [ ] At 1023px: tablet layout still active
- [ ] At 1024px: desktop layout activates (services 4-column, hero 2-column with 120px overflow)
- [ ] At 1440px: desktop layout, max-width container enforced at 1180px
- [ ] No "flash" or jump in layout at any breakpoint transition

**Files Affected:** Read-only test. Any layout issues found create fix todos.

**Dependencies:** Todos 020, 021 (responsive CSS implemented)

**Verification:**
1. DevTools — manually type each width into the viewport size field
2. At each width: check column count, overflow, hero visual offset
3. Slowly drag viewport from 760px to 780px — layout transition at exactly 768px

---

## Todo 077: Test Form Submission (Name, Email, Message)

**Task:** Test the complete contact form submission flow — fill all fields correctly and submit. Verify the form handles submission gracefully (success state, API call, or error).

**Acceptance Criteria:**
- [ ] All three fields fillable: name (text), email (email type), message (textarea)
- [ ] Form submits when all fields valid
- [ ] On successful submission: user sees a success message ("Thank you, we'll be in touch")
- [ ] After success: form is cleared or replaced with success state
- [ ] Email validation works: entering "notanemail" shows an error, not submission
- [ ] Required field validation: submitting empty form shows errors on all required fields
- [ ] Form does NOT submit if any required field is empty

**Files Affected:** Read-only test. Fix any issues found in form logic.

**Dependencies:** Todo 039 (error states), Milestone 4 (form interactions)

**Verification:**
1. Fill all fields correctly — submit — success message appears
2. Submit with invalid email — validation error shown
3. Submit empty — all fields show error states

---

## Todo 078: Test Contact Form Error Handling

**Task:** Test error scenarios for the contact form, including network errors and server errors (if form submits to a backend API).

**Acceptance Criteria:**
- [ ] If form submits to an API endpoint: simulate network failure (DevTools — Network — offline) — form shows a user-friendly error ("Something went wrong, please try again")
- [ ] If form submits to an API endpoint: simulate 500 response — form shows error, not a broken UI
- [ ] Error messages use plain language (not "Error 500" or stack traces)
- [ ] User can retry after an error (form inputs retain their values)
- [ ] Error announcement via `role="alert"` reaches screen readers

**Files Affected:** Fix any error handling gaps found.

**Dependencies:** Todo 077

**Verification:**
1. DevTools Network — set to Offline — submit form — user-friendly error shown
2. Re-enable network — retry — form works
3. Screen reader: error message announced on failure

---

## Todo 079: Test Navigation Menu (Desktop + Mobile)

**Task:** Verify the navigation menu works on both desktop (horizontal links) and mobile (hamburger menu). All nav links navigate correctly.

**Acceptance Criteria:**
- [ ] Desktop: all nav links visible in single row, no overflow
- [ ] Desktop: all nav links navigate to correct sections (anchor links scroll smoothly or immediately per `prefers-reduced-motion`)
- [ ] Desktop CTA button: visible, navigates correctly
- [ ] Mobile: hamburger button visible, triggers menu open/close animation
- [ ] Mobile: all nav links visible when menu is open
- [ ] Mobile: each nav link navigates correctly and closes menu on tap
- [ ] Active page link indicated correctly (underline, weight 600)

**Dependencies:** Todos 040, 041 (hamburger animations)

**Verification:**
1. Desktop 1280px: hover and click each nav link
2. Mobile 375px: tap hamburger, tap each nav link

---

## Todo 080: Test All CTA Buttons (Navigate Correctly)

**Task:** Verify every call-to-action button on the page navigates to the correct destination.

**Acceptance Criteria:**
- [ ] Hero primary CTA: navigates to contact section or external link as specified
- [ ] Hero secondary CTA: navigates to correct section or page
- [ ] Any service card CTAs: navigate correctly
- [ ] Contact form submit button: submits form (not navigation)
- [ ] All buttons with `href`: correct URL
- [ ] All buttons that scroll to section: smooth scroll (or instant with reduced-motion) to correct section
- [ ] No broken links (404)

**Dependencies:** None

**Verification:**
1. Click each CTA button — verify destination
2. Network tab — no 404 responses for any button click

---

## Todo 081: Test All External Links (Correct href, Open in New Tab)

**Task:** Verify all external links (links going to other websites) have correct `href` values and include `target="_blank"` and `rel="noopener noreferrer"`.

**Acceptance Criteria:**
- [ ] All external links have `target="_blank"` (opens new tab)
- [ ] All external links have `rel="noopener noreferrer"` (security: prevents opener access)
- [ ] All external link `href` values are correct URLs (not placeholder "#" values)
- [ ] No internal links accidentally marked as external
- [ ] External link destinations load successfully (manual spot-check)

**Files Affected:**
- `app/page.tsx` — fix any external links missing `rel` or using wrong `target`

**Dependencies:** None

**Verification:**
1. `grep -n 'target="_blank"' app/page.tsx` — each result also has `rel="noopener noreferrer"`
2. Click each external link — opens in new tab, loads correctly

---

## Todo 082: Verify Hero Visual Displays Correctly (SVG Rendering)

**Task:** Verify the hero visual SVG renders correctly across all browsers and at all viewport sizes. Confirm it scales, maintains aspect ratio, and is not pixelated.

**Acceptance Criteria:**
- [ ] SVG renders in Chrome, Firefox, and Safari without distortion
- [ ] SVG scales correctly within the grid column at desktop (fills column, no overflow)
- [ ] SVG shows correct overflow at 120px below the hero section on desktop
- [ ] At tablet and mobile: SVG full-width, no clipping
- [ ] SVG is not pixelated at any viewport width (vector, scales cleanly)
- [ ] SVG has `aria-label` or `<title>` for accessibility (Todo 060 should have handled this)

**Dependencies:** Todos 013 (visual offset), 046 (SVG optimization), 060 (alt text)

**Verification:**
1. Load page in Chrome, Firefox, Safari — screenshot SVG in each
2. At 1440px, 1024px, 768px, 375px — SVG renders correctly
3. No pixelation or distortion at any size

---

## Todo 083: Create Visual Regression Baseline (Screenshots)

**Task:** Capture baseline screenshots of the homepage at three viewport widths that will serve as the visual regression reference for future deployments. Store screenshots as project artifacts.

**Acceptance Criteria:**
- [ ] Screenshot captured at 375px (mobile, iPhone SE)
- [ ] Screenshot captured at 768px (tablet, iPad portrait)
- [ ] Screenshot captured at 1280px (desktop, common laptop)
- [ ] Full-page screenshots (entire page, not just visible viewport)
- [ ] Screenshots captured from production build (`npm run build && npm start`) not dev server
- [ ] Screenshots saved to: `workspaces/Top_AI_Tool_Rank_Homepage_Redesign/04-validate/visual-baseline/`
- [ ] Screenshots named: `baseline-mobile-375.png`, `baseline-tablet-768.png`, `baseline-desktop-1280.png`

**Tool options:**
- Chrome DevTools — Device Toolbar — right-click page — "Capture full size screenshot"
- `playwright screenshot` (if Playwright is available)
- `npx capture-website-cli` or similar

**Files Affected:**
- New directory: `workspaces/Top_AI_Tool_Rank_Homepage_Redesign/04-validate/visual-baseline/`
- Three screenshot files

**Dependencies:** Todos 070–082 (all issues fixed before baseline is set)

**Verification:**
1. All three screenshots saved at correct paths
2. Screenshots show the complete page with no visual regressions vs spec
3. These become the reference for Milestone 8 post-deploy comparison

---

## Todo 084: Manual Visual Inspection (Matches Design Spec)

**Task:** Final side-by-side review comparing the implemented page against the specs. Verify every spec requirement has been implemented.

**Spec reference:** All specs.

**Acceptance Criteria:**
- [ ] Color palette matches `specs/design-system.md` — neon lime `#d4ff00`, white `#ffffff`, dark `#0f1419`
- [ ] Typography scale matches spec — 180px H1 on desktop, correct H2/H3/body sizes
- [ ] Layout structure matches `specs/layout-specs.md` — section order, column counts, gaps, padding
- [ ] Hero visual overflow: 120px on desktop
- [ ] Services grid item 3 offset: 40px
- [ ] Navigation: glassmorphic effect, 72px height, fully rounded
- [ ] Credibility strip: 4 columns, light gray background
- [ ] All interactions match `specs/interactions.md` — hover colors, animation timings, focus states
- [ ] No placeholder content ("Lorem ipsum", "Coming soon", "TODO")
- [ ] No broken layout areas or visual artifacts

**Files Affected:** Fix any spec discrepancies found.

**Dependencies:** Todos 070–083

**Verification:**
1. Open `specs/layout-specs.md` alongside the live page
2. Step through each section in the spec — confirm each element matches
3. Open `specs/interactions.md` — test each hover and focus state
4. Open `specs/design-system.md` — confirm color and typography matches visually
