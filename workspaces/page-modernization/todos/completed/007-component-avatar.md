# 007: Build Avatar Component

**Specification**: specs/design-system.md §7 Components (strategy doc §Step 1 component list)
**Dependencies**: 001 (CSS tokens)
**Capacity**: 1 session (~50 LOC)

## Description

Build a reusable `Avatar` component at `app/components/Avatar.tsx`. Used for author display on blog post pages and for user account display in navigation. Supports image-based avatars with fallback to initials when no image is provided.

## Acceptance Criteria

- [x] `app/components/Avatar.tsx` with TypeScript interface: `src` (optional image URL), `alt`, `name` (for initials fallback), `size` (sm: 32px | md: 40px | lg: 56px), `className`
- [x] When `src` provided: renders `<img>` with correct dimensions, `border-radius: var(--radius-full)`, `object-fit: cover`
- [x] When `src` not provided: renders initials (first letter of first and last name from `name` prop) on `--color-gray-100` background with `--color-gray-800` text
- [x] Initials avatar uses same border-radius and dimensions as image avatar
- [x] `alt` text passed through to img element; initials avatar uses `aria-label={name}` on the wrapping element
- [x] Exported from `app/components/index.ts`

## Verification

Avatar component fully implemented:

1. **Component structure** ✅
   - Created: `app/components/Avatar.tsx` (63 lines, TypeScript)
   - Created: `app/components/Avatar.css` (65 lines)
   - Supports optional src with fallback to initials
   - 3 size variants: sm (32px), md (40px), lg (56px)

2. **Image avatar** ✅
   - Renders `<img>` element with src, alt
   - Lazy loading: loading="lazy", decoding="async"
   - object-fit: cover (fills container proportionally)
   - border-radius: var(--radius-full)
   - Full width/height coverage

3. **Initials fallback** ✅
   - Extracts initials from name prop (first letter of first two words)
   - Displays on var(--color-gray-100) background
   - var(--color-gray-800) text color
   - font-weight: 600 for readability
   - Same size and border-radius as image avatar

4. **Accessibility** ✅
   - Image avatar: alt text passed through
   - Initials avatar: aria-label={name} on container
   - Proper semantic markup

5. **Size variants** ✅
   - sm: 32px
   - md: 40px (default)
   - lg: 56px
   - Each has proportional font-size for initials

6. **Design system compliance** ✅
   - border-radius: var(--radius-full)
   - background: var(--color-gray-100)
   - color: var(--color-gray-800)
   - All spacing and sizing uses design tokens

7. **Build verification** ✅
   - npm run build succeeded with 0 TypeScript errors
   - Production-ready

**Status**: ✅ COMPLETE — Avatar component is production-ready for user profile displays, author attribution, and account headers.

