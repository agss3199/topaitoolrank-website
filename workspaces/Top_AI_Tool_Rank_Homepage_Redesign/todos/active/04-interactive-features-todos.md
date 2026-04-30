# Milestone 4: Interactive Features — Detailed Todos

**Specs:** `specs/interactions.md`
**Todos:** 029–043
**Estimated:** 1-2 sessions
**Gate:** All hover states, focus indicators, scroll reveals, and form interactions work correctly; `prefers-reduced-motion` disables all animations without breaking any functionality.

---

## Todo 029: Implement Button Hover States (Primary, Secondary, Text Variants)

**Task:** Apply hover and active CSS transitions to all three button variants (primary CTA neon lime, secondary gray, text link button) as specified.

**Spec reference:** `specs/interactions.md` — Hover States: CTA Buttons, Secondary Buttons.

**Acceptance Criteria:**
- [ ] Primary (neon lime) button default: `background: #d4ff00`, black text, no shadow
- [ ] Primary button hover: background darkens to `#b8e600`, add `box-shadow: 0 4px 12px rgba(0,0,0,0.08)`, `transition: all 0.3s ease`, `cursor: pointer`
- [ ] Primary button active (pressed): background `#9fd400`, shadow `0 10px 25px rgba(0,0,0,0.1)`, `transform: scale(0.98)`
- [ ] Secondary button default: gray background, black text, subtle border
- [ ] Secondary button hover: background `#e5e7eb`, add soft shadow, `transition: 0.3s ease`
- [ ] Secondary button active: background `#d1d5db`, lift shadow
- [ ] All transitions use `0.3s ease` (matches timing constants from spec)
- [ ] Cursor is `pointer` on all buttons

**Files Affected:**
- `app/globals.css` or button component CSS — hover/active state rules
- Any component file that renders buttons

**Dependencies:** Todo 005 (button component base styles from design system)

**Verification:**
1. Hover each button variant in browser — visual transition visible
2. Click (hold) each button — active state (scale 0.98 + darker bg) visible
3. DevTools: hover a primary button — computed `background-color` changes to `#b8e600`

---

## Todo 030: Implement Link Hover States (Nav Links, Text Links)

**Task:** Apply hover underline and active (current page) styles to navigation links and body text links.

**Spec reference:** `specs/interactions.md` — Hover States: Text Links / Nav Links.

**Acceptance Criteria:**
- [ ] Nav/text links default: neon lime text, no underline
- [ ] Nav/text links hover: underline appears (`text-decoration: underline`, color `#d4ff00`), `transition: 0.3s ease`
- [ ] Active/current page link: underline persistent, `font-weight: 600`
- [ ] Cursor: `pointer` on all links
- [ ] Transition applies only to text-decoration and color (not layout properties)

**Files Affected:**
- `app/globals.css` — link hover rules
- Navigation component CSS

**Dependencies:** Todo 001 (color variables), Todo 008 (focus indicators established for links)

**Verification:**
1. Hover each nav link — underline appears
2. Navigate to a page — current nav item shows persistent underline at weight 600
3. DevTools computed: hovered link `text-decoration-line: underline`

---

## Todo 031: Implement Card Hover States (Service, Tool, Why-Us Cards)

**Task:** Apply hover shadow lift and scale effect to all card components.

**Spec reference:** `specs/interactions.md` — Hover States: Cards.

**Acceptance Criteria:**
- [ ] Card default: white background, `border: 1px solid [subtle border color]`, soft shadow
- [ ] Card hover: shadow upgrades to lift shadow (`0 8px 24px rgba(0,0,0,0.12)` or equivalent), `transform: scale(1.02)`, `transition: 0.3s ease`
- [ ] Cursor: `pointer` on clickable cards
- [ ] Transition applies to `box-shadow` and `transform` only (not width/height)
- [ ] Hover works on service cards, tool cards, and why-us reason cards
- [ ] No layout shift when card scales (use `transform: scale()` not `width/height` change)

**Files Affected:**
- `app/globals.css` or card component CSS — `.card:hover` rules

**Dependencies:** Todo 007 (card base styles from design system)

**Verification:**
1. Hover each card type — scale and shadow lift visible
2. Layout does not shift when card scales (surrounding elements don't move)
3. `transition: 0.3s ease` confirmed in DevTools computed styles

---

## Todo 032: Implement Focus Indicators on All Interactive Elements

**Task:** Ensure every keyboard-focusable element (buttons, links, form inputs, hamburger menu button) has a visible focus indicator meeting the spec: 2px solid neon lime outline with 2px offset.

**Spec reference:** `specs/interactions.md` — (implied via focus state mentions). `specs/accessibility.md` — Focus Indicators section.

**Acceptance Criteria:**
- [ ] All buttons: `button:focus-visible { outline: 2px solid #d4ff00; outline-offset: 2px; }`
- [ ] All links: `a:focus-visible { outline: 2px solid #d4ff00; outline-offset: 2px; }`
- [ ] All form inputs: focus state uses lime border (not outline) per form spec — see Todo 038
- [ ] Hamburger menu button: same 2px lime outline on focus
- [ ] No element has `outline: none` or `outline: 0` without a replacement focus indicator
- [ ] Focus indicator visible on both light and dark backgrounds (lime works on both per accessibility spec)
- [ ] `focus-visible` pseudo-class used (not `focus`) so mouse clicks don't show outline

**Files Affected:**
- `app/globals.css` — global `*:focus-visible` rule (or per-element rules)

**Dependencies:** Todo 008 (design system focus indicator styles — this todo expands application to all elements)

**Verification:**
1. Tab through entire page using keyboard only — focus outline visible on every interactive element
2. No element is unreachable or loses focus visibility
3. Click a button with mouse — no outline shows (`:focus-visible` correctly suppresses on mouse click)

---

## Todo 033: Set Up Intersection Observer for Scroll Reveals

**Task:** Implement the Intersection Observer JavaScript that watches for elements with class `.reveal` entering the viewport and adds the `.visible` class to trigger their CSS animation.

**Spec reference:** `specs/interactions.md` — Scroll-Triggered Reveals, Trigger Threshold: `0.12`.

**Acceptance Criteria:**
- [ ] IntersectionObserver created with `threshold: 0.12`
- [ ] Observer watches all elements with class `.reveal`
- [ ] When element enters viewport (12% visible), the `.visible` class is added
- [ ] Once `.visible` is added the observer disconnects from that element (no repeat animation)
- [ ] Observer initialized after DOM is ready (inside `useEffect` if React, or `DOMContentLoaded` listener)
- [ ] No errors if no `.reveal` elements exist on the page
- [ ] Script is loaded deferred (after LCP) — not in `<head>` blocking

**Files Affected:**
- New file: `public/js/scroll-reveal.js` or inline in `app/page.tsx` as a `useEffect`
- `app/page.tsx` — add `defer` script tag or `useEffect` initialization

**Dependencies:** None (this is the infrastructure that Todos 034–037 build on)

**Verification:**
1. Open DevTools Performance tab — record scroll — confirm `visible` class added on elements as they enter viewport
2. Scroll to a `.reveal` element — class changes from `.reveal` to `.reveal.visible`
3. Elements already in viewport on page load: should NOT animate (or animate immediately) — verify behavior is consistent

---

## Todo 034: Add Reveal Animation CSS Classes (Fade + Slide Up)

**Task:** Create the CSS transition classes `.reveal`, `.reveal.visible`, and stagger delay variants (`.delay-1`, `.delay-2`, `.delay-3`) for the scroll-triggered animation system.

**Spec reference:** `specs/interactions.md` — Reveal Class Animations CSS block.

**Acceptance Criteria:**
- [ ] `.reveal` base: `opacity: 0; transform: translateY(30px); transition: opacity 0.6s ease, transform 0.6s ease`
- [ ] `.reveal.visible`: `opacity: 1; transform: translateY(0)`
- [ ] `.reveal.delay-1`: `transition-delay: 0.2s`
- [ ] `.reveal.delay-2`: `transition-delay: 0.4s`
- [ ] `.reveal.delay-3`: `transition-delay: 0.6s`
- [ ] Transition duration: `0.6s` (scroll reveal timing constant from spec)
- [ ] Easing: `ease` or `cubic-bezier(0.4, 0, 0.2, 1)` (ease-out curve from spec)
- [ ] `prefers-reduced-motion` media query overrides these durations to `0.01ms` (see Todo 042)

**Files Affected:**
- `app/globals.css` — reveal classes

**Dependencies:** Todo 033 (Observer adds the `.visible` class that these rules respond to)

**Verification:**
1. Add `.reveal` to a test element — it starts invisible
2. Scroll to it — it fades + slides up to visible
3. With `.delay-2` — animation starts 0.4s after scroll trigger

---

## Todo 035: Apply Staggered Reveals to Service Cards

**Task:** Add `.reveal` and stagger delay classes to the 4 service cards so they animate in sequence when the services section enters the viewport.

**Spec reference:** `specs/interactions.md` — Where Applied: "Service cards (staggered reveal, delay-1 / delay-2 / delay-3)".

**Acceptance Criteria:**
- [ ] Service card 1: class `.reveal` (no extra delay)
- [ ] Service card 2: classes `.reveal .delay-1`
- [ ] Service card 3: classes `.reveal .delay-2`
- [ ] Service card 4: classes `.reveal .delay-3`
- [ ] Stagger is visible in browser — cards animate in from left-to-right order with 0.2s gaps
- [ ] Section heading also has `.reveal` class (animates first, before cards)

**Files Affected:**
- `app/page.tsx` — add reveal classes to service card JSX elements

**Dependencies:** Todos 033, 034 (Observer and CSS classes in place)

**Verification:**
1. Scroll services section into view — cards animate in sequence, 0.2s stagger visible
2. DevTools: verify each card has its correct delay class

---

## Todo 036: Apply Reveals to Tool Cards

**Task:** Add `.reveal` and delay classes to tool cards.

**Spec reference:** `specs/interactions.md` — Where Applied: "Tool cards (staggered reveal)".

**Acceptance Criteria:**
- [ ] Tool card 1: class `.reveal` (no delay)
- [ ] Tool card 2: classes `.reveal .delay-1`
- [ ] Additional tool cards: continue stagger pattern
- [ ] Section heading: `.reveal` class

**Files Affected:**
- `app/page.tsx` — tool card JSX elements

**Dependencies:** Todos 033, 034

**Verification:**
1. Scroll tool section into view — cards animate in sequence

---

## Todo 037: Apply Reveals to Process Steps

**Task:** Add `.reveal` and delay classes to process step elements so they animate in sequence when the process section enters the viewport.

**Spec reference:** `specs/interactions.md` — Where Applied: "Process steps (reveal on scroll)".

**Acceptance Criteria:**
- [ ] Each process step gets `.reveal` with incrementing delay classes
- [ ] Step 1: `.reveal` (no delay), Step 2: `.reveal .delay-1`, Step 3: `.reveal .delay-2`, Step 4: `.reveal .delay-3`
- [ ] Section heading: `.reveal`
- [ ] Stagger visible on scroll

**Files Affected:**
- `app/page.tsx` — process step JSX elements

**Dependencies:** Todos 033, 034

**Verification:**
1. Scroll to process section — steps animate in left-to-right sequence

---

## Todo 038: Implement Form Input Focus States (Lime Border + Glow)

**Task:** Style form input focus state: neon lime border, remove browser default outline, add soft lime glow shadow.

**Spec reference:** `specs/interactions.md` — Form Interactions: Input Fields Focus.

**Acceptance Criteria:**
- [ ] Input default: white background, subtle gray border (e.g., `#d1d5db`)
- [ ] Input focus: `border-color: #d4ff00`, `outline: none`, `box-shadow: 0 0 0 3px rgba(212, 255, 0, 0.1)`, `transition: 0.2s ease`, `cursor: text`
- [ ] Textarea focus: same rules as input
- [ ] Transition duration: `0.2s ease` (quick interaction timing from spec)
- [ ] Filled state (has value): same appearance as default (no special filled styling)
- [ ] Disabled state: `background: #f3f4f6`, `color: #9ca3af`, `cursor: not-allowed`

**Files Affected:**
- `app/globals.css` or form component CSS — `input:focus`, `textarea:focus` rules

**Dependencies:** Todo 006 (base form styles from design system)

**Verification:**
1. Click/tab into each form input — lime border and glow appear
2. Tab away — border reverts to gray
3. DevTools: focused input computed `border-color: rgb(212, 255, 0)`

---

## Todo 039: Implement Form Input Error States (Red Border + Error Message)

**Task:** Implement the error state for form inputs: red border, error message displayed below input, associated via `aria-describedby`.

**Spec reference:** `specs/interactions.md` — Form Interactions: Error state. `specs/accessibility.md` — Forms Accessibility: Error Messages.

**Acceptance Criteria:**
- [ ] Error input: `border-color: #ef4444`
- [ ] Error message element visible below the input with descriptive text (e.g., "Please enter a valid email address")
- [ ] Error message element has `role="alert"` so screen readers announce it
- [ ] Input has `aria-describedby` pointing to the error message element's `id`
- [ ] Error state triggered on form submit attempt with empty or invalid fields
- [ ] Error state clears when user corrects the input (on `input` or `blur` event)
- [ ] Error color is NOT the sole indicator — text message always present (not red border alone)

**Files Affected:**
- `app/page.tsx` — form state logic and error message JSX
- Form CSS — `.input-error` class with red border

**Dependencies:** Todo 038 (form base and focus states), Todo 006 (form component styles)

**Verification:**
1. Submit form empty — error borders and messages appear on required fields
2. Tab to errored input with screen reader — error message announced
3. Fix the field — error state clears

---

## Todo 040: Implement Hamburger Menu Open/Close Animation (X Transform)

**Task:** Implement the CSS animation that transforms the three hamburger lines into an X when the mobile menu is opened.

**Spec reference:** `specs/interactions.md` — Navigation Menu (Mobile): Hamburger Button CSS block.

**Acceptance Criteria:**
- [ ] Hamburger button default: three horizontal lines, black color, `cursor: pointer`
- [ ] Hamburger button hover: opacity changes to 0.7
- [ ] When `.active` class is added to hamburger:
  - Line 1: `transform: rotate(45deg) translate(8px, 8px)`
  - Line 2: `opacity: 0`
  - Line 3: `transform: rotate(-45deg) translate(7px, -7px)`
- [ ] Transition for lines: smooth (0.3s ease)
- [ ] Toggle: clicking hamburger adds/removes `.active` class
- [ ] Hamburger button has `aria-label="Open menu"` / `aria-label="Close menu"` toggled via JavaScript
- [ ] `aria-expanded` attribute on button reflects open/closed state

**Files Affected:**
- `app/page.tsx` — hamburger button JSX with toggle logic
- Navigation CSS — hamburger span transform rules

**Dependencies:** None

**Verification:**
1. At mobile viewport: click hamburger — lines animate to X shape
2. Click again — X animates back to three lines
3. DevTools: button `aria-expanded` toggles between `true` and `false`
4. Button `aria-label` updates between "Open menu" and "Close menu"

---

## Todo 041: Implement Mobile Menu Dropdown Animation

**Task:** Implement the smooth expand/collapse animation for the mobile navigation dropdown menu.

**Spec reference:** `specs/interactions.md` — Navigation Menu (Mobile): Mobile Menu Dropdown.

**Acceptance Criteria:**
- [ ] Mobile menu default: hidden (`max-height: 0; overflow: hidden`)
- [ ] Mobile menu open: `max-height` animates to accommodate all menu items (`max-height: 500px` or content height), `transition: max-height 0.3s ease`
- [ ] Menu items: full width, minimum 44px height (touch-friendly)
- [ ] Menu items hover: light gray background highlight
- [ ] Menu closes when user taps a menu item (navigation occurs)
- [ ] Menu closes when user taps hamburger button again
- [ ] Menu is visually below the navigation bar

**Files Affected:**
- `app/page.tsx` — mobile menu state and JSX
- Navigation CSS — menu expand/collapse transition

**Dependencies:** Todo 040 (hamburger toggle in place)

**Verification:**
1. Mobile viewport: open menu — dropdown expands smoothly (0.3s)
2. Close menu — collapses smoothly
3. Menu items: tap target measured at minimum 44px height
4. Tap a nav item — menu closes and navigation occurs

---

## Todo 042: Add prefers-reduced-motion Media Query Support

**Task:** Add the global `prefers-reduced-motion: reduce` media query that collapses all animation durations to `0.01ms`, disabling motion for users with vestibular disorders while preserving all functionality.

**Spec reference:** `specs/interactions.md` — Motion Accessibility: Prefers Reduced Motion CSS block. `specs/accessibility.md` — Motion & Vestibular section.

**Acceptance Criteria:**
- [ ] Global CSS rule added:
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
  ```
- [ ] All animations and transitions (button hovers, scroll reveals, hamburger, form focus) become instant when `prefers-reduced-motion: reduce` is active
- [ ] All functionality preserved — elements still become visible, focus states still work, menu still opens/closes
- [ ] The `!important` overrides are present (required to beat specificity of component-level transitions)

**Files Affected:**
- `app/globals.css` — add prefers-reduced-motion rule (typically placed at end of file)

**Dependencies:** Should be done before or alongside all other animation todos (Todos 029–041)

**Verification:**
1. Chrome DevTools > Rendering tab > "Emulate CSS media feature prefers-reduced-motion: reduce"
2. Enable reduced motion — hover buttons, scroll to reveal elements, open mobile menu
3. All transitions appear instant (no visible animation duration)
4. All elements still visible and functional

---

## Todo 043: Test All Interactions on Mobile (Touch, No Hover)

**Task:** Final verification pass of all interactive elements on mobile viewports, confirming touch targets work correctly and hover-only styles do not break mobile experience.

**Spec reference:** `specs/interactions.md` — Touch Interactions (Mobile), No Hover (Mobile), Touch Target Size.

**Acceptance Criteria:**
- [ ] All buttons: tap produces same visual feedback as hover + click on desktop
- [ ] All nav links: tap navigates correctly
- [ ] All cards: tap works (navigates or opens detail if applicable)
- [ ] Hamburger menu: tap opens/closes with animation
- [ ] Form inputs: tap focuses with lime border + glow
- [ ] All touch targets: minimum 44px × 44px (measured with DevTools)
- [ ] Minimum 8px spacing between adjacent touch targets
- [ ] No hover styles are "stuck on" on mobile (CSS `@media (hover: none)` suppresses hover states if needed)
- [ ] Scroll reveals trigger correctly on mobile scroll

**Files Affected:**
- May require adding `@media (hover: none)` rules if hover styles cause issues on mobile

**Dependencies:** Todos 029–042 (all interaction implementations complete)

**Verification:**
1. DevTools Device Toolbar — iPhone SE (375px) — tap through all interactive elements
2. DevTools Accessibility panel — verify touch targets meet 44px minimum
3. If available, test on a real Android/iOS device
