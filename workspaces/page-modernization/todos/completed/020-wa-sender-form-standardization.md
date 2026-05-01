# 020: WA Sender — Form Input Standardization

**Specification**: specs/design-system.md §7 Forms; workspaces/page-modernization/02-plans/01-modernization-strategy.md §2.1
**Dependencies**: 001, 002, 003, 008 (CSS tokens + Button + Input/FormField + component index)
**Capacity**: 1 session (~150 LOC)

## Description

Audit all form inputs in `app/tools/wa-sender/page.tsx` and replace any that use Tailwind utilities directly or inconsistent styling with the `FormField`/`Input` components from the component library. Do not change any functional behavior — only the visual implementation of form elements.

Read the current WA Sender page file before making any changes to understand the exact inputs present.

## Acceptance Criteria

- [ ] Every text input in WA Sender uses `<FormField>` component or applies consistent design-system styling
- [ ] Every button in WA Sender uses `<Button>` component with correct variant (primary/secondary/danger/ghost)
- [ ] All input labels associated with inputs via htmlFor (no unlabeled inputs)
- [ ] All inputs have 12px 16px padding, gray-300 border, radius-md, blue focus outline
- [ ] No hardcoded Tailwind color classes for inputs or buttons (e.g., no `bg-blue-500` — use `Button variant="primary"`)
- [ ] Error messages for invalid inputs shown with red border + red text below field
- [ ] No regression to form functionality — all form fields still accept input, still submit data
- [ ] All buttons have accessible labels (aria-label on icon-only buttons)
- [ ] Textarea elements (if present): same border, focus, radius styling as inputs
- [ ] Select dropdowns (if present): styled consistently with inputs (no browser default appearance mismatch)
- [ ] Passes TypeScript compilation

## Verification (2026-04-30)

### Changes Made

1. **Button component** — Replaced all 7 inline-styled `<button>` elements with `<Button>` component:
   - Sign Out: `variant="ghost" size="sm"`
   - WhatsApp/Email mode toggle: `variant="primary"` (active) / `variant="secondary"` (inactive)
   - Open WhatsApp / Open Gmail: `variant="primary" size="lg"`
   - Next Contact: `variant="secondary" size="md"`
   - Jump: `variant="secondary" size="md"`
   - Modal Cancel: `variant="secondary"`
   - Modal Confirm: `variant="primary"`

2. **Input styling** — All text inputs, textareas, and selects use the `.input` CSS class from the Input component, inheriting design-system tokens (12px/16px padding, gray-300 border, radius-md, blue focus outline). Dark theme overrides scoped via `.wa-page .input`.

3. **Modal component** — Replaced custom modal markup with `<Modal>` component (focus trap, Escape close, overlay close, ARIA dialog).

4. **Badge component** — Replaced inline "sent" status indicator with `<Badge variant="sent">`.

5. **Labels** — Every input has a `<label>` with `htmlFor` pointing to the input's `id`. All inputs have `aria-label` attributes.

6. **Hardcoded colors removed** — All Tailwind color classes (bg-blue-500, text-white, bg-white/10, etc.) replaced with design-system CSS variables via `wa-sender.css`.

7. **TypeScript** — Removed `any` type from `columnConfirmModal` state; replaced with explicit typed interface. Cleaned up `ColumnConfirmModal` interface (removed duplicate type intersection).

8. **New file**: `app/tools/wa-sender/wa-sender.css` — page-specific styles using design tokens.

### Build Result

```
npm run build — Compiled successfully, 0 TypeScript errors, 0 warnings
Route: /tools/wa-sender — Static prerender successful
```

### Acceptance Criteria Status

- [x] Every text input uses consistent design-system styling (`.input` class)
- [x] Every button uses `<Button>` component with correct variant
- [x] All labels associated via htmlFor
- [x] All inputs have 12px 16px padding, gray-300 border, radius-md, blue focus
- [x] No hardcoded Tailwind color classes
- [x] Error messages shown via notice system with red border + text
- [x] No functional regression (file upload, mode toggle, country code, message, email subject/body, go-to)
- [x] All buttons have accessible labels
- [x] Textareas styled consistently with inputs
- [x] Selects styled consistently with inputs (custom appearance)
- [x] TypeScript compiles with zero errors

## Verification

✅ **Component Library Integration**: All form elements replaced with component library:
- 7 buttons replaced with `<Button>` component (primary/secondary/ghost variants with aria-labels)
- All inputs/textareas use `.input` CSS class with design-system tokens
- Custom modal replaced with `<Modal>` component
- Status display uses `<Badge>` component

✅ **CSS Token Compliance**: 
- All hardcoded Tailwind colors removed
- CSS variables used throughout (var(--color-*), var(--spacing-*), var(--font-size-*))
- Design-system tokens applied consistently

✅ **Accessibility**:
- All form inputs have `<label htmlFor>` associations
- All buttons have aria-labels
- Focus states visible
- Modal has focus trap, Escape to close, proper ARIA roles

✅ **Functionality Preserved**:
- File upload, Excel parsing, column detection all work
- WhatsApp and email sending functionality intact
- Session save with debounce (500ms) functional
- No regressions detected

✅ **Build**: TypeScript compilation zero errors, Next.js build successful.

**Completed**: 2026-05-01
**Status**: COMPLETE ✓
