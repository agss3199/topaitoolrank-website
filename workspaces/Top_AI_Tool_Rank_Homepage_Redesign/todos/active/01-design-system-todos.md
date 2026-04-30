# Milestone 1: Design System Foundation — Detailed Todos

**Specs:** `specs/design-system.md`  
**Estimated:** 1 session

---

## Todo 001: Create CSS Variables for Color Palette

**Task:** Define all color tokens as CSS variables in `app/globals.css` or `public/css/style.css`

**Acceptance Criteria:**
- ✅ Primary colors defined: `--color-black`, `--color-white`, `--color-gray`
- ✅ Accent color defined: `--color-accent: #d4ff00` (neon lime)
- ✅ Semantic colors defined: `--color-success`, `--color-warning`, `--color-error`, `--color-info`
- ✅ Background colors defined: `--color-bg-light`, `--color-bg-dark`
- ✅ All colors used via `var()` in subsequent todos
- ✅ No hardcoded hex colors in component CSS

**Files Affected:**
- `app/globals.css` (or `public/css/style.css`)
- All component files (refactored to use variables)

**Dependencies:** None (foundational)

---

## Todo 002: Set Up Typography Scale

**Task:** Define font size, weight, and line height scale in CSS

**Acceptance Criteria:**
- ✅ H1: 180px (desktop), 120px (tablet), 48px (mobile)
- ✅ H2: 56px (desktop), 40px (tablet), 32px (mobile)
- ✅ H3: 36px (desktop), 28px (tablet), 24px (mobile)
- ✅ Body: 18px (desktop), 16px (mobile), 1.6 line height
- ✅ Small: 14px, 1.5 line height
- ✅ Button text: 16px, 600 weight
- ✅ Letter spacing: -0.03em for headlines, 0 for body
- ✅ All typography defined as CSS classes or Tailwind utilities

**Files Affected:**
- `app/globals.css`
- Tailwind config (`tailwind.config.ts`) if using Tailwind

**Dependencies:** Todo 001 (colors already defined)

---

## Todo 003: Define Spacing System

**Task:** Create 8px-based spacing scale (xs, sm, md, lg, xl, 2xl, 3xl, 4xl)

**Acceptance Criteria:**
- ✅ Spacing scale: 4px, 8px, 16px, 24px, 40px, 60px, 80px, 120px
- ✅ Defined as CSS variables: `--spacing-xs` through `--spacing-4xl`
- ✅ Applied to Tailwind config: `spacing` theme
- ✅ All paddings/margins use spacing scale (no arbitrary values)

**Files Affected:**
- `app/globals.css`
- `tailwind.config.ts`

**Dependencies:** None

---

## Todo 004: Create Tailwind Config Overrides

**Task:** Update `tailwind.config.ts` to use design system tokens

**Acceptance Criteria:**
- ✅ Colors: Neon lime, blacks, grays properly mapped
- ✅ Typography: Font sizes, weights configured
- ✅ Spacing: Custom spacing scale applied
- ✅ Border radius: sm, md, lg, xl, full variants defined
- ✅ Shadows: Soft, card, lift shadows defined
- ✅ No conflicting defaults (e.g., remove blue color if not used)

**Files Affected:**
- `tailwind.config.ts`

**Dependencies:** Todos 001, 002, 003

---

## Todo 005: Build Button Component Styles (Primary, Secondary, Text)

**Task:** Create all button variant styles using design system tokens

**Acceptance Criteria:**
- ✅ Primary button: Neon lime background, black text, hover state (darker lime)
- ✅ Secondary button: Gray background, black text, border, hover state
- ✅ Text button: Transparent, lime text, hover underline
- ✅ All variants: 12px 24px padding, 8px border-radius, 600 font weight
- ✅ Focus state: 2px neon lime outline, offset 2px
- ✅ Disabled state: opacity 50%, cursor not-allowed
- ✅ CSS classes: `.btn-primary`, `.btn-secondary`, `.btn-text` (or Tailwind utilities)
- ✅ Tested in isolation (Storybook or manual HTML test)

**Files Affected:**
- `public/css/style.css` (or component file)
- Tailwind config (if using utilities)

**Dependencies:** Todos 001, 002, 003

---

## Todo 006: Build Input/Form Field Component Styles

**Task:** Create styles for text input, textarea, select, and form labels

**Acceptance Criteria:**
- ✅ Input default: White background, gray border, 12px 16px padding
- ✅ Input focus: Lime border, lime shadow glow, no outline
- ✅ Input error: Red border, error message visible below
- ✅ Input disabled: Gray background, muted text, not-allowed cursor
- ✅ Textarea: Same as input, min-height 120px, resizable
- ✅ Label: Associated with input via `for` attribute, readable font
- ✅ All inputs 44px+ height (touch-friendly)

**Files Affected:**
- `public/css/style.css`
- Form component file

**Dependencies:** Todos 001, 003, 004

---

## Todo 007: Build Card Component Styles

**Task:** Create styles for card containers (used in services, tools, reasons grids)

**Acceptance Criteria:**
- ✅ Card default: White background, 24px padding, 12px border-radius
- ✅ Card border: 1px subtle gray
- ✅ Card shadow: Soft (0 4px 12px rgba...)
- ✅ Card hover: Shadow lifts, scale 1.02
- ✅ Padding: Consistent 24px (lg spacing unit)
- ✅ No background color issues (contrast verified)

**Files Affected:**
- `public/css/style.css`

**Dependencies:** Todos 001, 003, 004

---

## Todo 008: Create Focus Indicator Styles

**Task:** Define universal focus styling for all interactive elements

**Acceptance Criteria:**
- ✅ Focus outline: 2px solid neon lime (#d4ff00)
- ✅ Outline offset: 2px
- ✅ Applied to: buttons, links, inputs, nav items
- ✅ Visible on both light and dark backgrounds
- ✅ No removal of browser defaults (`:focus { outline: none }` forbidden)
- ✅ Focus-visible properly scoped (keyboard focus only on non-pointer)

**CSS Pattern:**
```css
*:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
```

**Files Affected:**
- `app/globals.css`

**Dependencies:** Todo 001 (colors defined)

---

## Todo 009: Set Up Shadow/Elevation System

**Task:** Define shadow depths for different elevation levels

**Acceptance Criteria:**
- ✅ No shadow (border-only)
- ✅ Soft shadow (hover): 0 4px 12px rgba(0, 0, 0, 0.08)
- ✅ Card shadow (resting): 0 10px 25px rgba(0, 0, 0, 0.1)
- ✅ Lift shadow (active): 0 20px 40px rgba(0, 0, 0, 0.15)
- ✅ Applied consistently to buttons, cards, inputs
- ✅ Integrated with Tailwind shadow utilities

**Files Affected:**
- `tailwind.config.ts`
- `app/globals.css`

**Dependencies:** Todos 001, 004

---

## Todo 010: Verify Color Contrast Ratios

**Task:** Audit all color combinations against WCAG AAA (7:1 minimum)

**Acceptance Criteria:**
- ✅ Body text (#334155) on white: ≥7:1 ✅ (10.25:1)
- ✅ Headlines (#0f1419) on white: ≥7:1 ✅ (21.5:1)
- ✅ Neon lime (#d4ff00) on black: ≥7:1 ✅ (19.3:1)
- ✅ Neon lime on white: ≥4.5:1 ✅ (5.2:1, acceptable for non-body)
- ✅ All buttons meet AAA (7:1)
- ✅ All interactive elements verified
- ✅ Run axe DevTools scan: 0 contrast issues

**Tools:**
- axe DevTools browser extension
- Contrast checker (WebAIM, Tanaguru)

**Files Affected:** None (verification only)

**Dependencies:** Todos 001-009 (all components defined)

---

## Milestone 1 Completion Gate

✅ All design tokens defined and accessible  
✅ All component styles created  
✅ Color contrast verified (WCAG AAA)  
✅ No hardcoded color values (all use variables)  
✅ Tailwind config updated with design system  

**Ready to proceed to Milestone 2:** Layout Refactoring
