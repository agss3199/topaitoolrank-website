# 004: Build Card Component

**Specification**: specs/design-system.md §7 Components § Cards
**Dependencies**: 001 (CSS tokens)
**Capacity**: 1 session (~60 LOC)

## Description

Build a reusable `Card` React component at `app/components/Card.tsx`. Cards are used on the auth pages (form container), blog listing page (post previews), and any future feature listing. The card spec requires white background, 1px gray-200 border, 24px padding, soft shadow, 12px radius, with hover state applying card shadow and slightly darker border.

## Acceptance Criteria

- [x] `app/components/Card.tsx` with TypeScript interface: `children`, `className`, `padding` (default md), `hover` (boolean, enables hover lift effect), `as` (element tag, default `div`)
- [x] White background, `1px solid var(--color-gray-200)` border
- [x] Default padding: `var(--spacing-lg)` (24px) on all sides
- [x] Shadow: `var(--shadow-soft)` at rest
- [x] Border-radius: `var(--radius-lg)` (12px)
- [x] Hover state (when `hover=true`): transitions to `var(--shadow-card)`, border becomes `var(--color-gray-300)`, transition uses `var(--transition)`
- [x] Respects `prefers-reduced-motion` (no transform on hover when motion reduced)
- [x] Exported from `app/components/index.ts`
- [x] Renders correct semantic element via `as` prop (e.g., `<article>` for blog cards)

## Verification

Card component fully implemented:

1. **Component structure** ✅
   - Created: `app/components/Card.tsx` (56 lines, TypeScript)
   - Created: `app/components/Card.css` (60 lines)
   - Supports semantic HTML via `as` prop (div, article, section, etc.)
   - forwardRef for direct DOM access

2. **Styling** ✅
   - White background: var(--color-white)
   - Border: 1px solid var(--color-gray-200)
   - Padding variants: sm (var(--spacing-sm)), md (var(--spacing-lg)), lg (var(--spacing-xl))
   - Border radius: var(--radius-lg) (12px)
   - Shadow at rest: var(--shadow-soft)

3. **Hover effect** ✅
   - When hover=true:
     - Border transitions to var(--color-gray-300)
     - Shadow transitions to var(--shadow-card)
     - Transform translateY(-2px)
     - All transitions use var(--transition)
   - Active state resets transform
   - Cursor pointer for interactive feedback

4. **Accessibility** ✅
   - Respects prefers-reduced-motion (no transform)
   - Proper semantic element support via as prop
   - User-select: none to prevent text selection on hover

5. **Design system compliance** ✅
   - All colors use CSS variables
   - All spacing uses tokens
   - All shadows use tokens
   - All transitions use token

6. **Build verification** ✅
   - npm run build succeeded with 0 TypeScript errors
   - Production-ready

**Status**: ✅ COMPLETE — Card component is production-ready for use in forms, blog listings, and content containers.

