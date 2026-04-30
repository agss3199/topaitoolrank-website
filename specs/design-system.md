# Design System Specification

## Color Palette

### Primary Colors
- **Black (Primary Text):** `#0f1419` or `#000000` (use #000 for true black)
- **White (Background):** `#ffffff` or `#fafbfc` (off-white for subtle depth)
- **Gray (Secondary Text):** `#64748b` (body text, muted captions)

### Accent Color
- **Neon Lime:** `#d4ff00` (primary interaction color)
  - Usage: CTA buttons, key highlights, hover states, accent text
  - Contrast ratio on black: 19.3:1 (WCAG AAA)
  - Contrast ratio on white: 5.2:1 (WCAG AA)

### Semantic Colors
- **Success:** `#10b981` (for valid states, positive feedback)
- **Warning:** `#f59e0b` (for caution, alerts)
- **Error:** `#ef4444` (for errors, validation failures)
- **Info:** `#3b82f6` (for informational messages)

### Backgrounds
- **Light Background:** `#ffffff` or `#f8fafc`
- **Dark Background:** `#0f1419` (only for hero section or sections with dark overlay)
- **Accent Background:** `#d4ff00` (high-contrast sections, minimal use)

---

## Typography

### Font Families
- **Headlines (H1-H3):** `system-ui, -apple-system, sans-serif`
  - Fallback: `Segoe UI, Roboto, sans-serif`
  - Weight: 700, 800, or 900 (bold, confident)
  
- **Body Text (P, span, labels):** `system-ui, -apple-system, sans-serif`
  - Fallback: `Segoe UI, Roboto, sans-serif`
  - Weight: 400 or 500 (regular, readable)

### Font Sizes (Responsive)

#### Desktop (1024px+)
| Element | Size | Line Height | Weight |
|---------|------|-------------|--------|
| H1 (Hero) | 180px | 1.05 | 900 |
| H2 (Section) | 56px | 1.2 | 800 |
| H3 (Subsection) | 36px | 1.3 | 700 |
| Body (P) | 18px | 1.6 | 400 |
| Small (caption, meta) | 14px | 1.5 | 400 |
| Button text | 16px | 1.5 | 600 |

#### Tablet (768px - 1023px)
- H1: 120px
- H2: 40px
- H3: 28px
- Body: 16px
- Small: 14px

#### Mobile (< 768px)
- H1: 48px
- H2: 32px
- H3: 24px
- Body: 16px
- Small: 14px

### Letter Spacing
- Headlines: `-0.03em` (tighter for confidence)
- Body: `0em` (normal)
- All Caps: `0.05em` (wider for clarity)

### Line Height (Vertical Rhythm)
- Headlines: 1.05 - 1.2 (tight, dramatic)
- Body: 1.6 (generous for readability)
- Small: 1.5 (balanced)

---

## Spacing System (8px Base)

| Unit | Value | Use Cases |
|------|-------|-----------|
| xs | 4px | Micro-spaces (between icons and text) |
| sm | 8px | Padding inside buttons, small gaps |
| md | 16px | Component padding, minor sections |
| lg | 24px | Section padding, spacing between items |
| xl | 40px | Section spacing, major gaps |
| 2xl | 60px | Hero padding, between sections |
| 3xl | 80px | Section top/bottom padding |
| 4xl | 120px | Full section spacing, hero offset |

### Standard Padding/Margin
- Button: `12px 24px` (sm + md)
- Card: `24px` (lg)
- Section: `60px 0` (2xl; desktop), `40px 0` (xl; tablet), `32px 0` (lg; mobile)
- Container: `40px` sides (md + lg; responsive)

---

## Border Radius

| Variant | Value | Use Cases |
|---------|-------|-----------|
| None | 0px | Edges, borders |
| sm | 8px | Small buttons, small badges |
| md | 12px | Input fields, cards |
| lg | 16px | Medium components |
| xl | 24px | Large cards, major components |
| full | 999px | Buttons, pills, rounded elements |

---

## Shadows

- **None:** No shadow (use borders for definition)
- **Soft (hover):** `0 4px 12px rgba(0, 0, 0, 0.08)`
- **Card:** `0 10px 25px rgba(0, 0, 0, 0.1)`
- **Lift (active):** `0 20px 40px rgba(0, 0, 0, 0.15)`

---

## Component Specifications

### Buttons

**Primary (CTA):**
- Background: Neon lime (`#d4ff00`)
- Text: Black (`#000000`)
- Padding: `12px 24px`
- Border radius: 8px
- Font weight: 600
- Font size: 16px
- Border: None
- Hover: Darken background to `#b8e600`, add soft shadow
- Active: Darken to `#9fd400`, add lift shadow

**Secondary:**
- Background: `#f0f1f3` (light gray)
- Text: Black (`#0f1419`)
- Padding: `12px 24px`
- Border radius: 8px
- Border: 1px solid `#d1d5db`
- Hover: Background to `#e5e7eb`, add soft shadow
- Active: Background to `#d1d5db`

**Text (Link):**
- Background: transparent
- Text: Neon lime (`#d4ff00`)
- Underline: None (default)
- Hover: Underline appears, text remains lime
- Active: Darker lime

### Input Fields
- Background: `#ffffff` or `#f8fafc`
- Border: 1px solid `#d1d5db`
- Border radius: 8px
- Padding: `12px 16px`
- Font size: 16px
- Focus: Border color to neon lime, soft shadow
- Disabled: Background `#f3f4f6`, text `#9ca3af`

### Cards
- Background: `#ffffff`
- Border: 1px solid `#e5e7eb`
- Border radius: 12px
- Padding: `24px`
- Shadow: Soft
- Hover: Shadow lift, subtle scale (1.02)

---

## States

### Hover
- Background lightens (if solid color) or adds soft shadow
- Text may change color to accent
- Cursor changes to pointer (for interactive elements)

### Focus
- Outline: 2px solid neon lime, offset 2px
- Or: Colored border (on form inputs)
- Must be visible for accessibility (WCAG AAA)

### Active/Pressed
- Background darkens or becomes accent color
- May include scale transform (0.98)
- Shadow deepens

### Disabled
- Opacity: 50%
- Cursor: `not-allowed`
- No hover effects

---

## Dark Mode (Optional Future)

If dark mode is added:
- Background: `#0f1419` or `#1a1f2e`
- Text: `#ffffff`
- Neon lime: Remains `#d4ff00` (already high contrast on dark)
- Cards: `#1f2335` with 1px border `#404854`
