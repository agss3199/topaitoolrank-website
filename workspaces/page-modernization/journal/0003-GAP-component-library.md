# GAP: Reusable Component Library

**Date**: 2026-04-30
**Impact**: Medium (affects maintainability, consistency)

## Finding

The website lacks a reusable component library. Each page reimplements form inputs, buttons, modals, and cards with inconsistent styling:

**Current state:**

- **Homepage**: Uses CSS classes (navbar, hero, cta-button, reveal)
- **Auth pages**: Uses Tailwind utilities directly (no component abstraction)
- **WA Sender**: Mix of CSS classes and inline styles
- **Blog/Legal**: Unknown (not yet built)

**Missing components:**

1. **Form Components**:
   - Input (text, email, password)
   - Label
   - Textarea
   - Select dropdown
   - Checkbox
   - Radio button
   - Form field wrapper (label + input + error)
   - Form validation (real-time, on-blur, on-submit)

2. **Interactive Components**:
   - Button (primary, secondary, danger, ghost, loading)
   - Link (internal, external)
   - Badge/Tag
   - Avatar

3. **Container Components**:
   - Card
   - Modal
   - Toast/notification
   - Sidebar
   - Hero section

4. **Layout Components**:
   - Grid (asymmetric 2-column)
   - Container (max-width wrapper)
   - Stack (vertical spacing)
   - Flex (horizontal alignment)

## Root Cause

1. **Component-first approach not established** — No decision to build reusable library
2. **Inline styling preferred** — Easier for single-page development, harder for multi-page consistency
3. **No design system reference** — Until this analysis, no formal design spec existed
4. **Tailwind-only approach** — Utilities are powerful but don't enforce brand consistency without constraints

## Implications

- **Inconsistency**: Same button styled differently on different pages
- **Maintenance burden**: Updating button styling requires changes across multiple files
- **Accessibility gaps**: Components may not all implement focus indicators, ARIA labels
- **New page friction**: Building new pages requires relearning styling approach
- **Testing difficulty**: No single component to test; must test each instance separately

## Example: Button Inconsistency

**Homepage:**
```css
.cta-button.primary {
  background: linear-gradient(135deg, #3b82f6, #0ea5e9);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
}
```

**Auth pages:**
```html
<button className="px-4 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600">
  Sign In
</button>
```

**WA Sender:**
```css
.send-button {
  background: #3b82f6;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  /* Different padding, radius, no gradient */
}
```

**Result**: Same button, three different implementations → impossible to change consistently

## Resolution Strategy

**Phase 1: Component Library (Prerequisite)**
1. Create `app/components/` directory structure
2. Build Button component (variants: primary, secondary, danger, ghost, loading)
3. Build Input component (text, email, password with error states)
4. Build Form component (label + input + error wrapper)
5. Build Card, Modal, Badge components
6. Document each component in Storybook or README

**Phase 2: Migrate Existing Pages**
1. Replace inline button styles with Button component
2. Replace inline form styles with Form/Input components
3. Replace Card styling with Card component
4. Verify visual consistency after migration

**Phase 3: Build New Pages with Components**
1. Use component library for all Tier 2/3 pages
2. No inline styling except layout wrapper utilities
3. All interactive elements use component library

**Phase 4: Enforce Usage**
1. Document component library in project README
2. Add ESLint rule to warn on direct Tailwind class usage for button/input
3. Code review checklist: "Uses component library, not inline styles"

## Component Library Design

**Directory structure:**
```
app/
  components/
    Button.tsx (with variants)
    Input.tsx (with error state)
    Label.tsx
    Form.tsx (wrapper)
    Card.tsx
    Modal.tsx
    Badge.tsx
    Avatar.tsx
    Navigation.tsx (navbar)
    Footer.tsx
    Layout.tsx (grid, container wrappers)
    index.ts (export all)
```

**Button component example:**
```typescript
// Button.tsx
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  children,
  onClick,
}: ButtonProps) {
  // Implementation uses design-system tokens
  // --color-accent for primary, --spacing-md for padding, etc.
}
```

**Form component example:**
```typescript
// Form/Input.tsx
interface InputProps {
  label: string;
  type: 'text' | 'email' | 'password';
  required?: boolean;
  error?: string;
  value: string;
  onChange: (value: string) => void;
}

export function Input({
  label,
  type,
  required,
  error,
  value,
  onChange,
}: InputProps) {
  // Implementation:
  // - Associates label with input via htmlFor
  // - Shows error message with red styling
  // - Links error to input via aria-describedby
  // - Uses design-system colors/spacing
}
```

## Benefits

1. **Consistency**: All buttons look and behave the same
2. **Maintainability**: Change button styling in one place, affects all pages
3. **Accessibility**: Implement WCAG AAA once in component, reuse everywhere
4. **Velocity**: New pages built faster using components
5. **Testing**: Test component once, trust all usages
6. **Documentation**: One source of truth for button/input/etc. behavior

## Risks

**If not implemented:**
- Pages drift visually as developers add their own styles
- Accessibility gaps multiply (each input implemented differently)
- Maintenance becomes exponentially harder

**Mitigation:**
- Build component library before Tier 2/3 implementation
- Code review blocks non-component usage for buttons/inputs/cards
- Document why components exist and when to use them

## Related Documents

- `specs/design-system.md` § Components — Detailed component specifications
- `workspaces/page-modernization/02-plans/01-modernization-strategy.md` § Step 1 — Component library as prerequisite

