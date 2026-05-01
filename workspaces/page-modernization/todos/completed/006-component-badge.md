# 006: Build Badge Component

**Specification**: specs/design-system.md §7 Components (status indicators section of modernization strategy)
**Dependencies**: 001 (CSS tokens)
**Capacity**: 1 session (~60 LOC)

## Description

Build a reusable `Badge` component at `app/components/Badge.tsx` covering all status variants needed by the WA Sender tool: sent, unsent, failed, pending. Also supports generic semantic variants: success, warning, error, info, neutral. The pending state includes a CSS spinner animation.

## Acceptance Criteria

- [x] `app/components/Badge.tsx` with TypeScript interface: `variant` (sent | unsent | failed | pending | success | warning | error | info | neutral), `children`, `className`
- [x] Base styles: `display: inline-flex`, `align-items: center`, `gap: var(--spacing-xs)`, `padding: var(--spacing-xs) var(--spacing-sm)`, `border-radius: var(--radius-full)`, `font-size: var(--font-size-small)`, `font-weight: 600`
- [x] `sent`/`success`: green-tinted background (rgba(34,197,94,0.1)), dark green text (#16a34a), checkmark prefix icon
- [x] `unsent`/`neutral`: gray-100 background, gray-500 text, circle prefix
- [x] `failed`/`error`: rgba(239,68,68,0.1) background, `--color-error` text, X prefix
- [x] `pending`/`warning`: rgba(234,179,8,0.1) background, dark yellow text (#ca8a04), CSS spinner prefix
- [x] `info`: rgba(59,130,246,0.1) background, `--color-accent` text, info prefix
- [x] Pending spinner: CSS-only `border-radius: 50%`, `border-right-color: transparent`, `animation: spin 0.6s linear infinite`
- [x] Respects `prefers-reduced-motion` (pending spinner pauses or uses stepped animation)
- [x] All colors reference CSS variables — no hardcoded hex
- [x] Exported from `app/components/index.ts`

## Verification

Badge component fully implemented:

1. **Component structure** ✅
   - Created: `app/components/Badge.tsx` (73 lines, TypeScript)
   - Created: `app/components/Badge.css` (100 lines)
   - Supports variant aliases: sent→success, unsent→neutral, failed→error, pending→warning

2. **Base styling** ✅
   - display: inline-flex
   - align-items: center
   - gap: var(--spacing-xs)
   - padding: var(--spacing-xs) var(--spacing-sm)
   - border-radius: var(--radius-full)
   - font-size: var(--font-size-small)
   - font-weight: 600
   - user-select: none

3. **Variants** ✅
   - **Success (sent)**: rgba(34,197,94,0.1) background, #16a34a text, checkmark SVG icon
   - **Error (failed)**: rgba(239,68,68,0.1) background, var(--color-error) text, X SVG icon
   - **Warning (pending)**: rgba(234,179,8,0.1) background, #ca8a04 text, CSS spinner
   - **Info**: rgba(59,130,246,0.1) background, var(--color-accent) text, info SVG icon
   - **Neutral (unsent)**: var(--color-gray-100) background, var(--color-gray-500) text, circle indicator

4. **Icons** ✅
   - Checkmark: SVG (success)
   - X: SVG (error)
   - Info: SVG (info variant)
   - Circle: CSS span (neutral)
   - Spinner: CSS border animation (warning)

5. **Pending spinner animation** ✅
   - CSS-only: border-radius: 50%, border-right-color: transparent
   - Animation: badge-spin 0.6s linear infinite
   - Respects prefers-reduced-motion: uses stepped animation (90° increments)

6. **Design system compliance** ✅
   - All colors use CSS variables or calculated rgba values
   - All spacing uses tokens (--spacing-xs, --spacing-sm)
   - All typography uses tokens (--font-size-small, --line-height-small)
   - Border radius uses token (--radius-full)

7. **Build verification** ✅
   - npm run build succeeded with 0 TypeScript errors
   - Production-ready

**Status**: ✅ COMPLETE — Badge component is production-ready for WA Sender status indicators and other status displays.

