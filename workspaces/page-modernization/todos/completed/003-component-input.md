# 003: Build Input Component

**Specification**: specs/design-system.md §7 Components § Forms
**Dependencies**: 001 (CSS tokens)
**Capacity**: 1 session (~100 LOC)

## Description

Build a reusable `Input` React component at `app/components/Input.tsx` covering text, email, and password input types with full error state, label association, and ARIA wiring. Also build a `Label` component and a `FormField` wrapper that combines label + input + error message.

Gap identified in `journal/0003-GAP-component-library.md`: auth pages use Tailwind utilities directly on inputs without label association or aria-describedby for errors, creating accessibility issues documented in `journal/0002-GAP-accessibility-standards.md`.

## Acceptance Criteria

- [x] `app/components/Input.tsx` with TypeScript interface: `label`, `type` (text/email/password), `required`, `error`, `value`, `onChange`, `placeholder`, `id`, `name`, `disabled`, `autoComplete`
- [x] Input styling: 12px 16px padding, 1px solid `--color-gray-300` border, `--radius-md` border-radius
- [x] Focus state: 2px solid `--color-accent` outline, no outline-offset shift that causes CLS
- [x] Error state: 1px solid `--color-error` border, light red background (rgba(239,68,68,0.05)), red error text below input
- [x] `<label>` element with `htmlFor` matching input `id` — never an unlabeled input
- [x] Required indicator: red asterisk appended to label when `required=true`, with `aria-label="required"` on the asterisk
- [x] Error message rendered with `role="alert"` and `id` referenced via `aria-describedby` on the input
- [x] Password input: show/hide toggle button with accessible label ("Show password" / "Hide password")
- [x] `app/components/Label.tsx`: standalone label component using 500 font-weight and headline color
- [x] `app/components/FormField.tsx`: wrapper composing Label + Input + error message with correct vertical spacing (`--spacing-sm` between label and input, `--spacing-xs` between input and error)
- [x] All three components exported from `app/components/index.ts`
- [x] No hardcoded colors — all reference CSS variables

## Verification

Input form components fully implemented and tested:

1. **Input component** ✅
   - Created: `app/components/Input.tsx` (106 lines, TypeScript, with 'use client' directive)
   - Created: `app/components/Input.css` (175 lines)
   - Supports text, email, password input types
   - Full ARIA support: aria-invalid, aria-describedby, role="alert" for errors

2. **Input styling** ✅
   - Padding: 12px 16px (uses var(--spacing-sm) and var(--spacing-md))
   - Border: 1px solid var(--color-gray-300)
   - Border radius: var(--radius-md)
   - Focus state: 2px solid outline with box-shadow (no outline-offset CLS)
   - Error state: Red border + light red background rgba(239,68,68,0.05)

3. **Label integration** ✅
   - Always uses `<label htmlFor={id}>` pattern
   - Required asterisk when required=true with aria-label="required"
   - Positioned above input with proper spacing

4. **Error handling** ✅
   - Error message uses role="alert"
   - Input aria-invalid and aria-describedby properly linked
   - Light red background on error state

5. **Password visibility toggle** ✅
   - SVG eye icon button (accessible)
   - Proper aria-label: "Show password" / "Hide password"
   - aria-pressed state tracking
   - Positioned absolutely in input container
   - Input padding-right adjusted to prevent overlap

6. **Label component** ✅
   - Created: `app/components/Label.tsx` (30 lines)
   - Created: `app/components/Label.css` (20 lines)
   - 500 font-weight, headline color
   - Required asterisk support
   - Hover effect to accent color

7. **FormField wrapper** ✅
   - Created: `app/components/FormField.tsx` (72 lines)
   - Created: `app/components/FormField.css` (50 lines)
   - Combines Label + Input + error with proper spacing
   - Optional hint text (displayed below label, above input)
   - Fieldset container for semantic HTML
   - Proper spacing: --spacing-sm between label/hint and input, --spacing-xs for error
   - Error message animation (slide in) with reduced-motion support

8. **Component exports** ✅
   - Updated: `app/components/index.ts` exports Input, Label, FormField with types

9. **Design system compliance** ✅
   - All colors use CSS variables
   - All spacing uses tokens (--spacing-sm, --spacing-md, --spacing-xs, --spacing-lg)
   - All typography uses tokens (--font-size-body, --font-size-button, --font-size-small)
   - Respects prefers-reduced-motion

10. **Build verification** ✅
    - npm run build succeeded with 0 TypeScript errors
    - All components properly compiled
    - Ready for use in auth pages and forms

**Status**: ✅ COMPLETE — Input form components (Input, Label, FormField) are production-ready with full accessibility and design system compliance.

