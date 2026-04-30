# Milestone 2: Layout Refactoring — Detailed Todos

**Specs:** `specs/layout-specs.md`
**Todos:** 011–022
**Estimated:** 1-2 sessions
**Gate:** Every section renders correctly at 320px, 768px, 1024px, and 1440px viewport widths with zero horizontal overflow.

---

## Todo 011: Remove Particle Canvas Element and JS from Hero Section

**Task:** Delete the particle canvas `<canvas>` element and all associated JavaScript from the hero section. This is a prerequisite for layout refactoring — the canvas occupies layout space and interferes with the 2-column grid.

**Acceptance Criteria:**
- [ ] `<canvas>` element removed from hero section HTML/JSX
- [ ] All JavaScript that initializes or drives particle animation is deleted (not commented out)
- [ ] No references to canvas or particles remain in any JS/TS files
- [ ] Hero section renders without canvas with no visual gaps or broken layout
- [ ] Zero JavaScript errors in browser console related to canvas or particles

**Files Affected:**
- `app/page.tsx` — remove `<canvas>` element
- Any file containing particle animation JS (e.g., `public/js/particles.js`, inline scripts)
- `app/globals.css` — remove canvas-specific position/size CSS rules

**Dependencies:** None (prerequisite for Todo 012)

**Verification:**
1. Open browser console — zero errors
2. `grep -r "canvas\|particle" app/ public/` — zero hits in production code
3. Hero section visible with no blank space where canvas was

---

## Todo 012: Refactor Hero Section to Asymmetric 2-Column Grid (Desktop)

**Task:** Implement the 2-column CSS Grid layout for the hero section at desktop (1024px+). Left column holds text content and proof stats; right column holds the hero visual.

**Spec reference:** `specs/layout-specs.md` — Hero Section Desktop, Grid System (Hero Grid CSS).

**Acceptance Criteria:**
- [ ] Hero uses `display: grid; grid-template-columns: 1fr 1fr; gap: 60px` on desktop
- [ ] Left column: H1 headline (180px), subtitle text (24px size), 2 CTA buttons, 3-column hero proof stats row
- [ ] Right column: hero visual element (SVG illustration or geometric shape)
- [ ] Container max-width: `min(1180px, calc(100% - 80px))` (1180px max, 40px sides each)
- [ ] Hero section top padding: 80px
- [ ] No horizontal scrollbar at any desktop viewport
- [ ] Grid collapses to single column at tablet and mobile (handled in Todos 020–021)

**Files Affected:**
- `app/page.tsx` — hero section JSX structure
- Hero section CSS (globals or module) — grid and container rules

**Dependencies:** Todo 011 (canvas removed)

**Verification:**
1. DevTools at 1024px+: 2 columns side by side with 60px gap
2. Container width caps at 1180px at wide viewports
3. H1 renders at 180px computed font-size

---

## Todo 013: Offset Hero Visual by 120px (Intentional Overflow into Next Section)

**Task:** Apply a `margin-bottom: -120px` to the hero visual container so it intentionally overflows 120px downward into the credibility strip below on desktop. Adjust the strip's `padding-top` to visually accommodate the overlap without hiding content.

**Spec reference:** `specs/layout-specs.md` — Hero Section Desktop ("overflows down by 120px"), Offset/Asymmetry Rules.

**Acceptance Criteria:**
- [ ] Hero visual overlaps the credibility strip by 120px at desktop (1024px+)
- [ ] Hero visual is NOT clipped — parent elements have no `overflow: hidden` on the vertical axis
- [ ] Credibility strip has sufficient `padding-top` so its text content is not obscured by the visual
- [ ] On tablet (768–1023px): overflow reduced to 60px (`margin-bottom: -60px`)
- [ ] On mobile (<768px): zero overflow (`margin-bottom: 0`)
- [ ] Z-index layering correct — hero visual appears on top of strip background, strip text appears on top of visual if they overlap

**Files Affected:**
- Hero visual container CSS — `margin-bottom` responsive values
- Credibility strip CSS — `padding-top` to accommodate overlap
- Parent section CSS — verify no `overflow: hidden`

**Dependencies:** Todo 012 (2-column hero grid in place)

**Verification:**
1. Desktop: DevTools shows hero visual bottom edge is 120px below the hero section's bottom border
2. Tablet: overlap is 60px
3. Mobile: no overlap; `margin-bottom` computed as 0
4. No content clipped anywhere

---

## Todo 014: Create Credibility Strip Section (4-Column Grid)

**Task:** Build the credibility strip — a thin horizontal bar between hero and services sections with 4 equal columns. Each column shows a stat or positioning label (e.g., "Built for Founders", "Useful for Operations Teams", "Focused on Speed + Clarity", and one additional).

**Spec reference:** `specs/layout-specs.md` — Credibility Strip section.

**Acceptance Criteria:**
- [ ] Section positioned in DOM between hero and services sections
- [ ] Uses `display: grid; grid-template-columns: repeat(4, 1fr)` on desktop
- [ ] Background: light gray or off-white (CSS variable `--color-bg-light`)
- [ ] Cell padding: 24px vertical, 16px horizontal
- [ ] Each cell contains a bold primary label and a regular-weight supporting label
- [ ] On tablet (768–1023px): 2-column grid
- [ ] On mobile (<768px): 1-column stacked
- [ ] Receives hero visual overflow from Todo 013 — `padding-top` accommodates 120px overlap without text collision

**Files Affected:**
- `app/page.tsx` — insert credibility strip JSX between hero and services sections
- Credibility strip CSS — grid, background, padding rules

**Dependencies:** Todo 013 (overflow spacing calibrated)

**Verification:**
1. Desktop DevTools: 4-column grid computed, 24px vertical padding per cell
2. At 768px: 2 columns
3. At 375px: 1 column
4. Strip background color matches `--color-bg-light` token

---

## Todo 015: Refactor Services Grid with Asymmetric Item Positioning

**Task:** Restructure the services section into a 4-column CSS Grid with intentional asymmetry: item 3 is offset down by 40px using `transform: translateY(40px)`.

**Spec reference:** `specs/layout-specs.md` — Asymmetric Grid Pattern (Services Grid), Services Grid CSS.

**Acceptance Criteria:**
- [ ] Services grid: `display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px`
- [ ] Service card 3 (third card in DOM order): `transform: translateY(40px)` applied via CSS class or direct style
- [ ] All 4 cards fully visible — no clipping from parent `overflow: hidden`
- [ ] Section heading: H2 (56px desktop) with kicker text above heading and description paragraph below
- [ ] Section vertical padding: 60px top and bottom
- [ ] Card gap: 24px (matches grid gap)
- [ ] On tablet (768–1023px): 2-column grid, no `translateY` offset
- [ ] On mobile (<768px): 1-column, no `translateY` offset

**Files Affected:**
- `app/page.tsx` — services section JSX, card 3 receives offset class
- Services section CSS — grid, translateY, responsive overrides

**Dependencies:** Todo 012 (container pattern established)

**Verification:**
1. DevTools: card 3 computed transform shows `matrix(1,0,0,1,0,40)`
2. On tablet at 768px: no transform on any card
3. Section padding-top and padding-bottom: both 60px

---

## Todo 016: Refactor Tools Grid Layout

**Task:** Refactor the tools section to use an auto-fit minmax grid that produces 2 columns on desktop and 1 column on mobile.

**Spec reference:** `specs/layout-specs.md` — General Card Grid CSS.

**Acceptance Criteria:**
- [ ] Tools grid: `display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px`
- [ ] Section heading: H2 with kicker and description
- [ ] Section vertical padding: 60px
- [ ] At desktop widths: 2 columns
- [ ] At mobile widths (<640px): 1 column
- [ ] Cards use `align-items: stretch` so cards in same row are equal height
- [ ] No horizontal overflow

**Files Affected:**
- `app/page.tsx` — tools section JSX
- Tools section CSS — grid styles

**Dependencies:** Todo 012

**Verification:**
1. At 1440px: 2 columns (auto-fit with 300px min produces 2 with standard container)
2. At 375px: 1 column
3. Cards within a row are equal height

---

## Todo 017: Refactor Why-Us Section (4-Column Reasons Grid)

**Task:** Refactor the "Why Us" / reasons section into a 4-column grid on desktop — same grid pattern as services but without any translateY offset.

**Spec reference:** `specs/layout-specs.md` — Section Layout (Generic), Section ordering.

**Acceptance Criteria:**
- [ ] Why-Us grid: `display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px`
- [ ] Section heading: H2 (56px) with kicker and description
- [ ] Section vertical padding: 60px
- [ ] Each reason card: optional icon, H3 title (28–36px), body text (18px)
- [ ] On tablet (768–1023px): 2 columns
- [ ] On mobile (<768px): 1 column
- [ ] No translateY offsets (uniform grid, unlike services)

**Files Affected:**
- `app/page.tsx` — why-us section JSX
- Why-us section CSS

**Dependencies:** Todo 012

**Verification:**
1. Desktop: 4 equal columns
2. Tablet: 2 columns
3. Mobile: 1 column
4. All card content visible, no overflow

---

## Todo 018: Refactor Process Section (4-Step Timeline)

**Task:** Refactor the process section into a 4-column horizontal timeline on desktop and a vertical stacked list on mobile. Include a visual connector (line or chevron) between steps on desktop.

**Spec reference:** `specs/layout-specs.md` — Section ordering: "Process (4-step timeline)".

**Acceptance Criteria:**
- [ ] Process grid: `display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px` on desktop
- [ ] Each step contains: step number (visually prominent), H3 title, short description
- [ ] Visual connector between steps on desktop (CSS `::after` border-top or similar) — must NOT use images
- [ ] Section heading: H2 with kicker and description
- [ ] Section vertical padding: 60px
- [ ] On mobile (<768px): single column stacked, no horizontal connectors
- [ ] On tablet: 2 columns or single column acceptable

**Files Affected:**
- `app/page.tsx` — process section JSX with step structure
- Process section CSS — grid, step numbering, connector pseudo-elements

**Dependencies:** Todo 012

**Verification:**
1. Desktop: 4 horizontal steps, connector lines visible between steps
2. Mobile: steps stacked vertically, no connector lines (or they're hidden)
3. Step numbers visually distinct from body text

---

## Todo 019: Refactor Contact Section (2-Column Layout)

**Task:** Refactor the contact section into a 2-column layout on desktop: left column has heading + description + contact details, right column has the contact form.

**Spec reference:** `specs/layout-specs.md` — Section ordering: "Contact (2-column: text + form)".

**Acceptance Criteria:**
- [ ] Contact grid: `display: grid; grid-template-columns: 1fr 1fr; gap: 60px` on desktop
- [ ] Left column: H2 heading, description paragraph, any contact info items
- [ ] Right column: contact form (name input, email input, message textarea, submit button)
- [ ] Section vertical padding: 60px
- [ ] On tablet (768–1023px): single column (form below text)
- [ ] On mobile (<768px): single column
- [ ] Form inputs use component styles from Todo 006 (design system)
- [ ] Submit button uses primary CTA button styles from Todo 005

**Files Affected:**
- `app/page.tsx` — contact section JSX
- Contact section CSS — 2-column grid, responsive collapse

**Dependencies:** Todo 012, Todo 005 (button styles), Todo 006 (form styles)

**Verification:**
1. Desktop at 1024px+: 2 columns with 60px gap
2. Tablet at 768px: single column
3. Form and text column equal height (via `align-items: stretch`)

---

## Todo 020: Create Mobile-First Responsive Layout (<768px)

**Task:** Audit and finalize all sections for mobile viewport widths below 768px. Every section must be single-column, centered, with no horizontal scroll and no overflow effects.

**Spec reference:** `specs/layout-specs.md` — Responsive Breakpoints table (Mobile row), Hero Section Mobile.

**Acceptance Criteria:**
- [ ] All sections: single column at <768px
- [ ] H1 font size: 48px at mobile (not 180px)
- [ ] H2 font size: 32px at mobile
- [ ] Zero horizontal scrollbar at 320px viewport width
- [ ] Hero visual: full width, zero overflow into next section
- [ ] Service cards, tool cards, why-us cards, process steps: single column
- [ ] Contact section: text then form, stacked
- [ ] Footer: single column stacked
- [ ] Nav: hamburger menu (not horizontal link row)
- [ ] All interactive elements: minimum 44px × 44px touch target
- [ ] Container side padding maintained (or proportionally reduced for very small viewports)

**Files Affected:**
- `app/globals.css` — `@media (max-width: 767px)` overrides for all sections
- Individual section CSS modules — mobile overrides

**Dependencies:** Todos 012–019 (all section layouts built)

**Verification:**
1. DevTools Device Toolbar at 320px — zero horizontal scroll (`document.documentElement.scrollWidth === window.innerWidth`)
2. DevTools at 375px — H1 is 48px computed
3. DevTools at 375px — all touch targets 44px+ (check via DevTools accessibility panel)

---

## Todo 021: Create Tablet Layout (768px–1023px)

**Task:** Define tablet breakpoint rules for all sections. Tablet gets intermediate layouts: 2-column maximum, reduced hero overflow (60px instead of 120px), and standard section spacing.

**Spec reference:** `specs/layout-specs.md` — Responsive Breakpoints table (Tablet row), Hero Section Tablet.

**Acceptance Criteria:**
- [ ] Hero at tablet: single column (content above, visual below), hero visual overflow 60px
- [ ] Services grid at tablet: 2 columns, no `translateY` on item 3
- [ ] Tools grid at tablet: 2 columns (auto-fit may handle this naturally)
- [ ] Why-Us at tablet: 2 columns
- [ ] Process at tablet: 2 columns or single column (either acceptable per spec)
- [ ] Contact at tablet: single column
- [ ] Footer at tablet: 2 columns
- [ ] H1 at tablet: responsive between 48px and 180px (spec suggests ~120px — use clamp or stepped value)
- [ ] No horizontal overflow at 768px or 1023px viewport width
- [ ] Desktop layout activates at exactly 1024px

**Files Affected:**
- All section CSS — `@media (min-width: 768px) and (max-width: 1023px)` rules
- Hero CSS — tablet overflow value

**Dependencies:** Todos 012–020

**Verification:**
1. DevTools at 768px: hero single column, services 2-column
2. DevTools at 1023px: same layout as 768px
3. DevTools at 1024px: desktop 2-column hero activates, services 4-column activates

---

## Todo 022: Verify Grid Layouts on Desktop, Tablet, Mobile

**Task:** Systematic cross-breakpoint verification of all layouts. Test at seven viewport widths and document pass/fail for each section. Create baseline screenshots for visual regression.

**Spec reference:** `specs/layout-specs.md` — Responsive Breakpoints table (all rows).

**Acceptance Criteria:**
- [ ] All sections pass visual inspection at: 320px, 375px, 768px, 1023px, 1024px, 1280px, 1440px
- [ ] Zero horizontal scroll confirmed at all seven widths via console check: `document.documentElement.scrollWidth === window.innerWidth`
- [ ] Hero overflow values: 0 at <768px, 60px at 768–1023px, 120px at 1024px+
- [ ] Typography scales correct (180px H1 desktop, 48px H1 mobile)
- [ ] All grid column counts match spec at each breakpoint
- [ ] No content clipped or hidden unintentionally
- [ ] Baseline screenshots captured at 375px, 768px, and 1280px for future visual regression comparison (used in Todo 083)

**Files Affected:** Read-only verification pass. Any failures found create new bug fix todos rather than modifying this todo.

**Dependencies:** Todos 011–021 (all layout work complete)

**Verification:**
```javascript
// Run in DevTools console at each viewport width
console.log('Overflow:', document.documentElement.scrollWidth > window.innerWidth);
// Expected: false at all 7 widths
```
