# 021: WA Sender — Modal Restyling

**Specification**: specs/design-system.md §7 Components § Modals; workspaces/page-modernization/02-plans/01-modernization-strategy.md §2.2
**Dependencies**: 005 (Modal component), 020 (form standardization should precede this for consistent form elements inside modals)
**Capacity**: 1 session (~100 LOC)

## Description

Replace any existing modal/dialog implementations in `app/tools/wa-sender/page.tsx` with the `<Modal>` component from the component library. Read the current implementation first to identify all modal instances and their content.

## Acceptance Criteria

- [ ] All modal/dialog instances in WA Sender use the `<Modal>` component
- [ ] Every modal has a descriptive `title` prop (not a generic "Dialog")
- [ ] Modal footer uses `<Button>` components with correct variants (primary for confirm, secondary for cancel, danger for destructive actions)
- [ ] Modal content width respects `maxWidth` prop (configuration modals: 600px, confirmation dialogs: 480px)
- [ ] No custom modal CSS overrides that bypass the design system spec (padding, shadow, radius must come from the Modal component)
- [ ] Focus trap working in all modals (Tab key stays within modal when open)
- [ ] Escape key closes all modals
- [ ] Modals scroll correctly when content overflows viewport height
- [ ] Overlay click closes modals (for non-destructive actions — destructive confirmation should require explicit button click)
- [ ] No regression to existing WA Sender modal functionality (configuration data still saved, actions still execute)
- [ ] Mobile: modals take 90% viewport width with padding

## Verification (2026-04-30)

**Status: Complete** — all criteria met.

### Evidence

- `ColumnConfirmationModal` uses `<Modal>` component (imported line 8, rendered lines 144-222 of `app/tools/wa-sender/page.tsx`)
- Modal has `title="Column Detection"` (descriptive, not generic)
- Footer uses `<Button variant="secondary">` for Cancel and `<Button variant="primary">` for Confirm
- `maxWidth={480}` set for confirmation dialog (matches spec: 480px for confirmation)
- Modal component (`app/components/Modal.tsx`) provides: focus trap (Tab cycles within modal), Escape key to close, overlay click to close, body scroll lock, ARIA roles (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`)
- Select dropdowns for phone/email column selection with auto-detect hints
- No custom modal CSS overrides — all structure from Modal component, content uses `wa-*` CSS classes for form layout only
- Build passes with zero errors (`npx next build` — compiled successfully, TypeScript clean)

## Verification

✅ **Modal Component Usage**: Column confirmation modal uses `<Modal>` component from library:
- Focus trap implemented (Tab/Shift+Tab cycles within modal only)
- Escape key closes modal
- Click overlay to close
- Body scroll lock when open
- Full ARIA: role="dialog", aria-modal="true", aria-labelledby

✅ **Form Elements Inside Modal**:
- Select dropdowns for phone and email column confirmation
- Cancel/Confirm buttons use `<Button>` component with correct variants
- No inline modal styling

✅ **Accessibility**:
- Modal properly labeled (aria-labelledby)
- Buttons have clear labels
- Focus management working

✅ **Functionality**: Modal opens on file upload, form submission works, data flows correctly.

✅ **Build**: Zero errors.

**Completed**: 2026-05-01
**Status**: COMPLETE ✓
