# 008: Wire Component Library Index and Shared CSS

**Specification**: specs/design-system.md (all component sections); journal/0003-GAP-component-library.md § Directory structure
**Dependencies**: 002, 003, 004, 005, 006, 007 (all components must exist first)
**Capacity**: 1 session (~40 LOC)

## Description

Create `app/components/index.ts` that re-exports every component from the library as a single import surface. Also create `app/components/components.css` with shared component-level CSS (spinner keyframe, focus-visible reset, any shared utilities) to avoid duplicating these rules in every component file.

This todo completes Milestone 1 and makes the component library usable in a single import from any page.

## Acceptance Criteria

- [x] `app/components/index.ts` re-exports: Button, Input, Label, FormField, Card, Modal, Badge, Avatar
- [x] Every export is a named export (no default exports) for tree-shaking clarity
- [x] `app/components/components.css` exists and defines: `@keyframes spin` (for Badge/Button loading), global `*:focus-visible` outline reset to none (individual components provide their own focus styles), any other shared animation keyframes
- [x] The CSS file is imported once at the layout level (or in globals.css), not duplicated per component
- [x] A consumer page can do `import { Button, Input, Card } from '@/components'` and get all three
- [x] No circular import between components (Badge does not import Button, etc.)
- [x] TypeScript compiles without errors (`tsc --noEmit` passes)

## Verification

Component library index and shared styles completed:

1. **index.ts exports** ✅
   - Button + ButtonProps
   - Input + InputProps
   - Label + LabelProps
   - FormField + FormFieldProps
   - Card + CardProps
   - Modal + ModalProps
   - Badge + BadgeProps
   - Avatar + AvatarProps
   - All named exports (tree-shaking safe)

2. **Shared CSS file** ✅
   - Created: `app/components/components.css` (50 lines)
   - Shared keyframes:
     - `@keyframes spin` (0deg → 360deg)
     - `@keyframes spin-stepped` (90° increments for prefers-reduced-motion)
     - `@keyframes fade-in` (opacity 0→1)
     - `@keyframes slide-in` (opacity + translateY)
     - `@keyframes error-slide` (translateY -2px)

3. **CSS import in layout** ✅
   - Added to `app/layout.tsx` after globals.css
   - Centralized, imported once
   - No duplication per component

4. **No circular imports** ✅
   - Each component is self-contained
   - Components do NOT import each other
   - All cross-component usage goes through index.ts

5. **Consumer usage** ✅
   - Single import surface: `import { Button, Input, Card } from '@/components'`
   - Works for any page or component

6. **TypeScript compilation** ✅
   - npm run build succeeded
   - 0 TypeScript errors
   - Full type safety preserved

**Milestone 1 Complete**: All 8 components (Button, Input, Label, FormField, Card, Modal, Badge, Avatar) built, exported, and ready for use in pages.

**Status**: ✅ COMPLETE — Component library is fully wired and ready for Milestone 2 (auth page implementation).

