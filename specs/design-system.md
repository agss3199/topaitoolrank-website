# Design System Specification

**Authority**: This specification defines the complete design language for all pages on topaitoolrank.com. All visual design decisions must conform to this spec.

---

## 1. Color System

### Primary Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-accent` | #3b82f6 | Primary action color |
| `--color-accent-hover` | #1e40af | Darker shade for hover |
| `--color-black` | #0f1419 | Text, borders |
| `--color-white` | #ffffff | Background, text on dark |

### Gray Scale

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-gray-100` | #f1f5f9 | Light backgrounds |
| `--color-gray-200` | #e2e8f0 | Subtle dividers |
| `--color-gray-300` | #cbd5e1 | Medium borders |
| `--color-gray-500` | #64748b | Secondary text |
| `--color-gray-800` | #1e293b | Dark text |
| `--color-gray-900` | #0f172a | Very dark text |

### Semantic Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-success` | #22c55e | Success states |
| `--color-warning` | #eab308 | Warning states |
| `--color-error` | #ef4444 | Error states |
| `--color-info` | #3b82f6 | Informational |

### Constraints

- **MUST NOT use hardcoded colors** outside CSS variables
- Every color references `var(--color-*)`

---

## 2. Typography System

### Font Family

System fonts only: `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`

**Rationale**: No web fonts for Core Web Vitals performance

### Font Sizes (Responsive via clamp())

| Token | Desktop | Mobile | Usage |
|-------|---------|--------|-------|
| `--font-size-h1` | 180px | 48px | Page headings |
| `--font-size-h2` | 56px | 32px | Section headings |
| `--font-size-h3` | 36px | 24px | Subsection headings |
| `--font-size-body` | 18px | 16px | Body text |
| `--font-size-small` | 14px | 14px | Captions |
| `--font-size-button` | 16px | 16px | Buttons |

### Font Weights

| Token | Value | Usage |
|-------|-------|-------|
| `--font-weight-headline` | 800 | Headings |
| `--font-weight-button` | 600 | Buttons |

### Line Heights

| Token | Value | Usage |
|-------|-------|-------|
| `--line-height-headline` | 1.05 | Headings |
| `--line-height-body` | 1.6 | Body text |
| `--line-height-small` | 1.5 | Small text |

---

## 3. Spacing System (8px Grid)

All spacing must be multiples of 8px.

| Token | Value | Usage |
|-------|-------|-------|
| `--spacing-xs` | 4px | Minimal |
| `--spacing-sm` | 8px | Tight |
| `--spacing-md` | 16px | Default |
| `--spacing-lg` | 24px | Section padding |
| `--spacing-xl` | 40px | Large gaps |
| `--spacing-2xl` | 60px | Hero margins |
| `--spacing-3xl` | 80px | Page sections |
| `--spacing-4xl` | 120px | Major breaks |

---

## 4. Elevation & Shadows

| Token | CSS Value | Usage |
|-------|-----------|-------|
| `--shadow-soft` | 0 4px 12px rgba(0,0,0,0.08) | Cards |
| `--shadow-card` | 0 10px 25px rgba(0,0,0,0.1) | Modals |
| `--shadow-lift` | 0 20px 40px rgba(0,0,0,0.15) | Floating |

---

## 5. Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 4px | Small corners |
| `--radius-md` | 8px | Buttons, inputs |
| `--radius-lg` | 12px | Cards, dropdowns |
| `--radius-xl` | 16px | Large cards |
| `--radius-full` | 9999px | Pills |

---

## 6. Animations & Transitions

```css
--transition: all 0.3s ease;
```

**Rule**: All animations must respect `prefers-reduced-motion` preference.

---

## 7. Components

### Buttons

- **Primary**: Blue (#3b82f6) background, white text
- **Secondary**: Transparent, blue border and text
- **Padding**: 12px × 16px
- **Border radius**: 8px
- **Focus**: 2px solid outline, 2px offset
- **Hover**: Darker blue (#1e40af)

### Forms

- **Input padding**: 12px 16px
- **Border**: 1px solid gray-300
- **Focus**: Blue outline
- **Error**: Red border with light red background
- **Label**: 500 weight, headline color

### Navigation

- **Position**: Fixed, top 18px
- **Background**: White 82% with 18px blur
- **Border radius**: 999px (full pill)
- **Dropdown**: Below nav item with CSS bridge

### Cards

- **Background**: White
- **Border**: 1px gray-200
- **Padding**: 24px
- **Shadow**: soft
- **Radius**: 12px
- **Hover**: Darker border, card shadow

### Modals

- **Padding**: 40px
- **Shadow**: card
- **Radius**: 12px
- **Z-index**: 2000
- **Overlay**: Semi-transparent dark

---

## 8. Accessibility

### WCAG 2.1 Level AAA

- **Text contrast**: Minimum 7:1
- **Focus**: Always visible (2px outline)
- **HTML**: Semantic structure
- **ARIA**: Labels on custom elements
- **Keyboard**: All interactive elements
- **Motion**: Respects prefers-reduced-motion

---

## 9. Responsive Breakpoints

| Breakpoint | Width |
|-----------|-------|
| Mobile | 320px |
| Tablet | 768px |
| Desktop | 1024px |
| Wide | 1440px |

**Mobile-first** approach: base on 320px, enhance upward.

---

## 10. Performance Targets

| Metric | Target |
|--------|--------|
| **LCP** | ≤ 2.2s |
| **INP** | < 50ms |
| **CLS** | < 0.05 |

**Requirements**:
- No web fonts
- Image optimization
- 500ms debounce on inputs
- System fonts only
