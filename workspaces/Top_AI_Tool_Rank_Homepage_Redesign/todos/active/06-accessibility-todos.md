# Milestone 6: Accessibility Audit & Fixes — Detailed Todos

**Specs:** `specs/accessibility.md`
**Todos:** 056–069
**Estimated:** 1 session
**Gate:** axe DevTools reports zero violations, Lighthouse accessibility score ≥95, keyboard navigation works through entire page, screen reader test passes all checklist items.

---

## Todo 056: Run axe DevTools Accessibility Audit

**Task:** Install the axe DevTools browser extension and run a full automated accessibility audit on the homepage. Document every violation and critical finding.

**Spec reference:** `specs/accessibility.md` — Accessibility Testing Checklist: Automated Tools.

**Acceptance Criteria:**
- [ ] axe DevTools extension installed in Chrome or Firefox
- [ ] Audit run on production build (`npm run build && npm start`)
- [ ] All violations documented with: rule ID, element affected, suggested fix
- [ ] Zero "critical" or "serious" violations before this milestone is marked complete
- [ ] Zero "moderate" violations before this milestone is marked complete
- [ ] "Minor" violations reviewed and fixed if straightforward
- [ ] axe report screenshot saved as artifact

**Files Affected:** Read-only initial audit. Fixes applied in subsequent todos (056–069).

**Dependencies:** Todos from Milestones 1–4 complete (design system and interactions in place before auditing)

**Verification:**
1. Install axe DevTools browser extension
2. Open homepage — axe DevTools panel — "Analyze Page"
3. Export results — document all violations
4. After fixes: re-run — confirm zero violations

---

## Todo 057: Run Lighthouse Accessibility Test (Target: ≥95)

**Task:** Run Lighthouse accessibility audit and achieve a score of ≥95. Review all flagged items and fix any that prevent the target score.

**Spec reference:** `specs/accessibility.md` — Ongoing Accessibility: "Lighthouse audit target ≥95 accessibility score". `specs/performance-requirements.md` — Lighthouse Audit Targets: Accessibility ≥95.

**Acceptance Criteria:**
- [ ] Lighthouse run on production build
- [ ] Accessibility score: ≥95
- [ ] All "Accessibility" failures in Lighthouse report fixed
- [ ] All "Accessibility" warnings reviewed (fix if straightforward)
- [ ] Score re-verified after fixes

**Files Affected:** Varies based on Lighthouse findings.

**Dependencies:** Todo 056 (axe audit already surfaced most issues)

**Verification:**
1. Chrome DevTools Lighthouse — run audit — "Accessibility" category
2. Score: ≥95
3. Zero red failing items in Accessibility section

---

## Todo 058: Verify Heading Hierarchy (H1, H2, H3)

**Task:** Audit the entire page heading structure to confirm H1 → H2 → H3 hierarchy is maintained without skipping levels.

**Spec reference:** `specs/accessibility.md` — Semantic HTML: Proper Use of Heading Hierarchy.

**Acceptance Criteria:**
- [ ] Exactly one `<h1>` on the page (hero headline)
- [ ] Each section uses `<h2>` for its section title (Services, Tools, Why Us, Process, Contact)
- [ ] Each card or item title uses `<h3>` (or lower) — never jumps from `<h1>` to `<h3>` without an intervening `<h2>`
- [ ] No heading levels skipped anywhere on the page
- [ ] Heading text is descriptive (not "Section" or "Title")
- [ ] Screen reader can navigate the page using heading keys and encounter a logical outline

**Files Affected:**
- `app/page.tsx` — verify all heading tags

**Dependencies:** None (read-only audit, changes if issues found)

**Verification:**
1. Install HeadingsMap browser extension OR use axe DevTools "Headings" view
2. Review heading outline — confirm H1 (1 instance) → H2 (each section) → H3 (each card)
3. `grep -n "<h[1-6]" app/page.tsx` — review ordering

---

## Todo 059: Add Skip-to-Main-Content Link

**Task:** Add a visually hidden "Skip to main content" link as the first focusable element on the page. It becomes visible on keyboard focus, allowing keyboard users to skip the navigation bar.

**Spec reference:** `specs/accessibility.md` — Keyboard Navigation: Skip Links ("Optional but recommended").

**Acceptance Criteria:**
- [ ] `<a href="#main-content">Skip to main content</a>` is the first focusable element in the DOM
- [ ] Link is visually hidden by default (via CSS clip or negative position)
- [ ] Link becomes visible when focused (`:focus` or `:focus-visible` reveals it)
- [ ] Visible style: clearly readable text with high contrast and neon lime focus indicator
- [ ] `<main id="main-content">` exists on the page to receive focus
- [ ] Clicking/activating the link moves keyboard focus to `<main>` element
- [ ] Link is accessible to screen readers (not `aria-hidden`)

**Files Affected:**
- `app/page.tsx` — add skip link as first element, add `id="main-content"` to `<main>`
- `app/globals.css` — visually hidden + focus-visible styles for skip link

**Dependencies:** None

**Verification:**
1. Tab to start of page — skip link appears
2. Press Enter — focus jumps to `<main>` element
3. Screen reader announces "Skip to main content" as first focusable element

---

## Todo 060: Verify All Images Have Alt Text

**Task:** Audit every `<img>` element and inline SVG on the page to confirm appropriate alt text is set.

**Spec reference:** `specs/accessibility.md` — Images & Icons: Alt Text rules. Decorative: `alt=""`. Logo: `alt="Top AI Tool Rank"`. SVGs: use `<title>` or `aria-label`.

**Acceptance Criteria:**
- [ ] Logo image: `alt="Top AI Tool Rank"`
- [ ] Hero visual SVG: has `<title>` element or `aria-label` with descriptive text (e.g., "Workflow automation dashboard")
- [ ] All decorative icons: `alt=""` (empty string) or `aria-hidden="true"`
- [ ] No `<img>` without an `alt` attribute (even if empty)
- [ ] No SVG without `<title>` or `aria-label` unless it has `aria-hidden="true"`
- [ ] Alt text is meaningful and descriptive (not "image" or "graphic")

**Files Affected:**
- `app/page.tsx` — add/fix alt text on all image elements

**Dependencies:** None

**Verification:**
1. `grep -n "<img" app/page.tsx` — each result has `alt="..."` attribute
2. `grep -n "<svg" app/page.tsx` — each non-decorative SVG has `aria-label` or contains `<title>`
3. axe DevTools — "Image Alternative Text" rule — zero violations

---

## Todo 061: Verify All Form Inputs Have Labels

**Task:** Audit the contact form to confirm every input has a properly associated `<label>` element using `for`/`id` pairing.

**Spec reference:** `specs/accessibility.md` — Forms Accessibility: Labels.

**Acceptance Criteria:**
- [ ] Name input: `<label for="name">Name</label>` + `<input id="name" ...>`
- [ ] Email input: `<label for="email">Email address</label>` + `<input id="email" type="email" ...>`
- [ ] Message textarea: `<label for="message">Message</label>` + `<textarea id="message" ...>`
- [ ] Submit button: clear label text ("Send Message" or similar — not just "Submit")
- [ ] No input uses `placeholder` as its only label (placeholder is NOT a label substitute)
- [ ] All `for` attributes match their corresponding input `id` attributes exactly

**Files Affected:**
- `app/page.tsx` — contact form JSX

**Dependencies:** None

**Verification:**
1. `grep -A2 "<label" app/page.tsx` — each label has `for` attribute
2. axe DevTools — "Form Label" rule — zero violations
3. Tab to each form field with screen reader — field name announced correctly

---

## Todo 062: Test Keyboard Navigation (Tab Key, Tab Order)

**Task:** Navigate the entire page using only the Tab key (no mouse). Verify that all interactive elements are reachable and in a logical order.

**Spec reference:** `specs/accessibility.md` — Keyboard Navigation: Tab Order.

**Acceptance Criteria:**
- [ ] Tab key reaches: nav links, CTA buttons, hamburger menu button (at mobile), all form inputs, submit button, footer links
- [ ] Tab order follows visual left-to-right, top-to-bottom flow (no jumps backwards or across the page)
- [ ] No interactive element is unreachable by Tab
- [ ] No non-interactive element receives focus (no `tabindex="0"` on divs that serve no interactive purpose)
- [ ] Focus never disappears (trapped or lost) at any point
- [ ] Shift+Tab moves focus backwards correctly

**Files Affected:**
- `app/page.tsx` — fix any `tabindex` issues found
- CSS — ensure no `display: none` or `visibility: hidden` accidentally hiding focusable elements

**Dependencies:** Todo 059 (skip link in place), Todo 032 (focus indicators visible)

**Verification:**
1. Open homepage — press Tab repeatedly — document every element that receives focus in order
2. Verify order matches visual layout top-to-bottom
3. Verify every interactive element appears in the tab sequence

---

## Todo 063: Test Focus Indicator Visibility

**Task:** Verify that the focus indicator (2px neon lime outline) is visible on every focusable element against its background color.

**Spec reference:** `specs/accessibility.md` — Focus Indicators: "2px solid neon lime `#d4ff00`, offset 2px. Must be clear on light and dark backgrounds."

**Acceptance Criteria:**
- [ ] Every focusable element shows the 2px neon lime outline when focused via keyboard
- [ ] Focus indicator visible on white backgrounds (hero section, card backgrounds)
- [ ] Focus indicator visible on light gray backgrounds (credibility strip)
- [ ] Focus indicator visible on dark backgrounds (if any)
- [ ] No element has `outline: none` or `outline: 0` without replacement indicator
- [ ] Focus ring does not overlap adjacent content in a confusing way

**Files Affected:**
- `app/globals.css` — fix any `outline: none` violations found

**Dependencies:** Todo 032 (focus indicator styles from Milestone 4)

**Verification:**
1. Tab through entire page — screenshot each unique focus state
2. Check contrast: neon lime `#d4ff00` outline on white `#ffffff` — visible (bright, high chroma)
3. DevTools: focused element — computed `outline: 2px solid rgb(212, 255, 0)`

---

## Todo 064: Test with Screen Reader (NVDA or VoiceOver)

**Task:** Test the homepage with a screen reader, following the test checklist from the accessibility spec. All items must pass.

**Spec reference:** `specs/accessibility.md` — Screen Reader Testing: Test Checklist.

**Acceptance Criteria:**
- [ ] Page title is descriptive and announced on load (check `<title>` in `app/layout.tsx`)
- [ ] Heading hierarchy reads logically in linear order (H1 > H2 > H3 structure makes sense when heard)
- [ ] Button labels are clear — no "Button" or unlabeled buttons
- [ ] Link labels are descriptive — no "click here" or "learn more" without context
- [ ] All images have announced alt text (decorative images skipped)
- [ ] Form labels associated — screen reader announces field name on focus
- [ ] Error messages announced via `role="alert"` when form submitted with errors
- [ ] Navigation is skippable via skip link

**Tools:** NVDA (Windows, free) or VoiceOver (macOS, built-in `Cmd+F5`).

**Files Affected:**
- `app/layout.tsx` — fix `<title>` if not descriptive
- `app/page.tsx` — fix any announced text issues found during screen reader test

**Dependencies:** Todos 058–063 (structural issues fixed before screen reader test)

**Verification:**
1. Enable NVDA (Windows) or VoiceOver (macOS)
2. Navigate to homepage
3. Work through each checklist item above — check/fail each
4. Document any failures and apply fixes

---

## Todo 065: Verify prefers-reduced-motion Support

**Task:** Enable the OS-level "reduce motion" preference and verify that all animations on the page become instant while all functionality remains intact.

**Spec reference:** `specs/accessibility.md` — Motion & Vestibular: prefers-reduced-motion CSS block.

**Acceptance Criteria:**
- [ ] With `prefers-reduced-motion: reduce` active: all CSS transitions are instant (<0.02s)
- [ ] Scroll reveal elements still become visible (just instant, not animated)
- [ ] Button hover state still changes color (just instant, no transition)
- [ ] Mobile menu still opens/closes (just instant)
- [ ] No functionality broken by motion removal
- [ ] The `@media (prefers-reduced-motion: reduce)` rule covers all `transition-duration` and `animation-duration` declarations

**Files Affected:**
- `app/globals.css` — verify prefers-reduced-motion rule from Todo 042 is comprehensive

**Dependencies:** Todo 042 (prefers-reduced-motion CSS rule from Milestone 4)

**Verification:**
1. Chrome DevTools — Rendering tab — "Emulate CSS media feature prefers-reduced-motion: reduce"
2. Hover buttons — state changes instantly, no transition visible
3. Scroll to cards — they appear instantly, no fade/slide animation
4. Open mobile menu — appears instantly

---

## Todo 066: Verify Color Contrast Ratios (7:1 Minimum for AAA)

**Task:** Verify all text/background color combinations on the page meet WCAG AAA 7:1 contrast ratio. Validate against the contrast table in the accessibility spec.

**Spec reference:** `specs/accessibility.md` — Color Contrast: Text Contrast Ratios table.

**Acceptance Criteria:**
- [ ] Body text (`#334155` on `#ffffff`): contrast ratio 10.25:1 — AAA ✅
- [ ] Headlines (`#0f1419` on `#ffffff`): 21.5:1 — AAA ✅
- [ ] Neon lime text on black (`#d4ff00` on `#0f1419`): 19.3:1 — AAA ✅
- [ ] Button text (black `#000000` on lime `#d4ff00`): 19.3:1 — AAA ✅
- [ ] Captions/muted text (`#64748b` on `#ffffff`): 7.2:1 — AAA ✅
- [ ] Neon lime text is NEVER used on white background for body text (5.2:1 ratio is only AA, not AAA)
- [ ] All computed contrast ratios verified via Tanaguru Contrast Finder, axe DevTools, or Chrome DevTools Color Picker

**Files Affected:**
- `app/globals.css` — fix any color combinations that fail 7:1

**Dependencies:** Todo 001 (color system established with correct values)

**Verification:**
1. axe DevTools — "Color Contrast" rule — zero violations
2. Chrome DevTools Color Picker on each text element — check contrast ratio in tooltip
3. Confirm neon lime is not used as body text color on any white background section

---

## Todo 067: Test at 200% Zoom (No Horizontal Scroll Required)

**Task:** Zoom browser to 200% and verify the page is usable without horizontal scrolling. All content must reflow appropriately.

**Spec reference:** `specs/accessibility.md` — Responsive Design & Accessibility: Text Zoom. "Site must remain usable at 200% zoom. No horizontal scrolling required."

**Acceptance Criteria:**
- [ ] At 200% browser zoom: zero horizontal scrollbar
- [ ] All text content is readable and not overflowing containers
- [ ] All interactive elements still reachable and large enough to activate
- [ ] Layout may stack to single column at 200% zoom — this is acceptable
- [ ] No text is clipped or truncated at 200% zoom
- [ ] Forms remain functional at 200% zoom

**Files Affected:**
- CSS — fix any `overflow: hidden` or fixed pixel widths causing horizontal overflow at zoom

**Dependencies:** Todo 020 (mobile-first responsive layout handles most of this)

**Verification:**
1. Chrome: `Ctrl+` pressed 5 times from 100% to reach ~200% zoom
2. Check for horizontal scrollbar — must be absent
3. Navigate through the page — all interactive elements reachable

---

## Todo 068: Verify No Color-Only Information (Error Messages Have Text Labels)

**Task:** Audit all elements that convey information through color to ensure that color is not the ONLY way the information is communicated.

**Spec reference:** `specs/accessibility.md` — Accessibility Success Criteria: "Color not sole information ✅ Error messages include text."

**Acceptance Criteria:**
- [ ] Form error state: red border AND text error message present — not just red border alone
- [ ] Form success state (if any): includes text confirmation, not just green color
- [ ] Required fields: marked with text "(required)" or asterisk with legend, not just color
- [ ] Any status indicators on the page use text or icons in addition to color
- [ ] Link vs non-link text: links have underline on hover (not just color difference from body text)

**Files Affected:**
- `app/page.tsx` — add text indicators where color-only patterns are found

**Dependencies:** Todo 039 (error states from Milestone 4)

**Verification:**
1. Trigger form error states — read the page with colors disabled (Chrome DevTools can emulate vision deficiencies)
2. DevTools — Rendering tab — "Emulate vision deficiencies: Achromatopsia" — page still communicates same information

---

## Todo 069: Fix Any Failing Accessibility Issues Found in Todos 056–068

**Task:** Consolidation and final fix todo. Address any remaining accessibility violations discovered during the audit phase. Re-run axe DevTools and Lighthouse after all fixes to confirm zero violations and ≥95 score.

**Spec reference:** `specs/accessibility.md` — Accessibility Success Criteria table.

**Acceptance Criteria:**
- [ ] axe DevTools: zero violations (critical, serious, moderate)
- [ ] Lighthouse Accessibility score: ≥95
- [ ] All items in the WCAG AAA Success Criteria table from the spec are satisfied:
  - [ ] Text contrast ≥7:1
  - [ ] Heading hierarchy correct
  - [ ] Keyboard navigation logical
  - [ ] Focus indicators visible
  - [ ] Form labels present
  - [ ] Alt text meaningful
  - [ ] Motion respects preference
  - [ ] Color not sole information
  - [ ] Screen reader compatible
- [ ] Any fix applied in this todo has a corresponding entry in the commit message

**Files Affected:** Varies — whichever files contain remaining violations.

**Dependencies:** Todos 056–068 (all audit todos completed)

**Verification:**
1. Final axe DevTools run — screenshot showing "0 violations"
2. Final Lighthouse run — screenshot showing Accessibility ≥95
3. Both screenshots saved as milestone completion artifacts
