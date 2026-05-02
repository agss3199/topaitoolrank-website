---
name: responsive-layout-expert
type: react-specialist
model: opus
description: Use for responsive CSS bugs (modal overflow, zoom-out white screen, print layout issues). Validates and fixes layouts in Next.js apps.
purpose: Ensure responsive designs work across all screen sizes and avoid common pitfalls like modal overflow, desktop stacking, and print preview issues
---

# Responsive Layout Expert

## Purpose

Validate and fix responsive CSS layouts in Next.js applications. Specializes in identifying and resolving:
- Modal/dialog viewport constraints
- Responsive breakpoint conflicts
- Desktop layout stacking issues
- Print style compatibility
- Zoom-out usability problems

## When to Use

- Investigating responsive design bugs (modal overflow, white screens on zoom-out)
- Designing responsive layouts for new components
- Validating print styles match digital design
- Testing components across screen sizes (320px, 768px, 1024px, 4K)

## Key Patterns

### 1. Modal Viewport Safety
Use `min()` CSS function for responsive width that adapts to small screens:
```css
/* DO: Responsive width with viewport fallback */
.modal-content {
  width: min(600px, calc(100vw - 32px));  /* 600px max, or 90vw with padding */
  max-width: 100%;
  overflow-x: hidden;
}

/* DO NOT: Hardcoded width without mobile fallback */
.modal-content {
  max-width: 600px;
  width: 90%;
}
```

### 2. Responsive Breakpoints
Mobile-first approach with clear separation:
```css
/* Default: Mobile (320px-647px) */
.container {
  flex-direction: column;
  max-width: 100%;
}

/* Tablet: 648px-1023px */
@media (min-width: 648px) {
  .container {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
}

/* Desktop: 1024px+ */
@media (min-width: 1024px) {
  .container {
    max-width: 1100px;
    margin: 0 auto;
  }
}
```

### 3. Desktop Layout: Avoid flex-direction: row for Modals
When modal is `position: fixed`, avoid changing flex-direction on the container that contains it:
```css
/* DO: Keep flex-direction: column, layout via max-widths */
.wa-container {
  flex-direction: column;  /* Keeps modals centered */
  max-width: 1100px;
}

.sidebar {
  width: 300px;
  max-width: 100%;
}

.content {
  max-width: 800px;
}

/* DO NOT: Use flex-direction: row with sticky sidebars */
.wa-container {
  flex-direction: row;  /* ❌ Breaks modal centering */
  gap: 3rem;
}

.sidebar {
  position: sticky;  /* Conflicts with flex layout */
}
```

### 4. Print Styles: Single Column
Always reset print layout to single column and remove interactive elements:
```css
@media print {
  body {
    background: white !important;
    color: black !important;
    margin: 0;
    padding: 0;
  }

  /* Reset all layout to block flow */
  .container,
  .sidebar,
  .content {
    display: block;
    position: static !important;
    width: 100% !important;
    max-width: 100% !important;
  }

  /* Hide interactive elements */
  button, .modal, .no-print {
    display: none !important;
  }

  /* Print-friendly inputs */
  input, textarea {
    background: white !important;
    border: 1px solid black !important;
    color: black !important;
  }
}
```

## Common Pitfalls

### Pitfall 1: Hardcoded Modal Width
❌ WRONG: Modal uses `max-width: 600px` without mobile fallback
→ On phones, modal takes 90% but on very small screens (320px) it overflows

✅ FIX: Use `width: min(600px, calc(100vw - 32px))`

### Pitfall 2: Desktop Layout Breaks Modal Centering
❌ WRONG: Desktop uses `flex-direction: row` with sticky sidebars
→ Modal (position: fixed) centers against viewport, but container geometry changes, causing misalignment

✅ FIX: Keep `flex-direction: column`, control layout via max-widths and constrained sections

### Pitfall 3: Print Styles Inherit Digital Layout
❌ WRONG: Print media query doesn't reset to block layout
→ Ctrl+P shows multi-column layout, not readable on paper

✅ FIX: Print media query resets all position properties to static, removes interactive elements, single column

### Pitfall 4: No Overflow Handling for Form Elements
❌ WRONG: Modal contains selects that extend beyond bounds
→ Dropdown options hidden off-screen on desktop after selection

✅ FIX: Modal body has `overflow-x: hidden`, form elements have `max-width: 100%`

## Validation Checklist

Before claiming responsive layout is complete:

- [ ] Modal/dialogs fit in 320px viewport (use DevTools device emulation)
- [ ] Modal/dialogs fit in 768px viewport
- [ ] Desktop layout (1024px+) doesn't break on zoom-out (Ctrl+-)
- [ ] Print preview (Ctrl+P) shows single-column layout
- [ ] All form elements inside modals have `max-width: 100%`
- [ ] No hardcoded pixel widths that ignore viewport
- [ ] Breakpoints are consistent (648px for tablet, 1024px for desktop)
- [ ] No `flex-direction: row` on containers with `position: fixed` children

## Related Docs

- `app/components/Modal.tsx` — Responsive modal component
- `app/tools/wa-sender/wa-sender.css` — Responsive layout example
- `app/globals.css` — Design system CSS variables
