---
name: next-design-system-patterns
title: Next.js Design System & Page Modernization Patterns
description: Patterns, templates, and best practices for building design systems and modernizing pages in Next.js applications
phase: implement
domain: Frontend
---

# Next.js Design System & Page Modernization

This skill captures institutional knowledge from the Top AI Tool Rank page modernization project. Use these patterns for future design system work and page modernizations.

## Design System Fundamentals

### Token System

All styling is driven by CSS custom properties. No hardcoded colors.

```css
:root {
  /* Colors — semantic naming */
  --color-accent: #3b82f6;
  --color-gray-50/100/200/...: ...;
  
  /* Spacing — 8px grid */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  
  /* Typography — responsive with clamp() */
  --font-size-h1: clamp(2rem, 5vw, 3.5rem);
  --font-size-body: clamp(0.875rem, 1.5vw, 1rem);
  
  /* Transitions */
  --transition: 0.3s ease;
}
```

### Component Pattern

Every component uses:
- **forwardRef** for DOM ref exposure
- **TypeScript** for prop typing
- **CSS variables** for styling (no Tailwind utilities)
- **Focus states** (2px blue outline)
- **Semantic HTML** for accessibility

Example Button:

```tsx
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', loading, children, ...props }, ref) => (
    <button
      ref={ref}
      className={`btn btn--${variant} ${loading ? 'loading' : ''}`}
      {...props}
    >
      {loading && <span className="btn__spinner" />}
      <span className="btn__content">{children}</span>
    </button>
  )
);
```

### Page Modernization Workflow

1. **Build**: Layout + styling, no API integration
2. **Wire**: Connect to real APIs, replace mock data
3. **Verify**: Red team audit (design compliance, accessibility, responsiveness)

### Responsive Design

- **Base**: 320px mobile-first styles
- **Tablet**: 768px adjustments
- **Desktop**: 1024px full layout
- **Large**: 1440px max-width constraints
- **Typography**: Use `clamp()` instead of media queries
- **Touch targets**: Minimum 44×44px

### Accessibility (WCAG AA)

- Heading hierarchy (h1 → h2 → h3)
- Focus states on all interactive elements (2px outline)
- Form labels with `htmlFor` associations
- ARIA labels on icon buttons
- Keyboard navigation (Tab, Enter, Escape)
- `role="alert"` on error messages
- `role="dialog"` on modals with focus trap

## Common Patterns

### Colors & Spacing

```
❌ BLOCKED: Hardcoded colors in page code (#3b82f6, #fafafa)
✅ REQUIRED: CSS variables (var(--color-accent), var(--spacing-md))
```

### Components

```
❌ BLOCKED: Custom buttons, inputs, modals
✅ REQUIRED: Use library components (Button, Input, FormField, Modal, Card, Badge)
```

### Responsive

```
❌ BLOCKED: Tailwind responsive utilities in pages
✅ REQUIRED: CSS media queries + design tokens
```

### Forms

```
<FormField label="Email" error={error}>
  <Input type="email" name="email" required />
</FormField>
```

### Modal

```tsx
<Modal open={open} onOpenChange={setOpen} title="Confirm">
  {/* Focus trap, Escape key, scroll lock built-in */}
</Modal>
```

---

**See agents: design-system-builder, page-modernizer**
