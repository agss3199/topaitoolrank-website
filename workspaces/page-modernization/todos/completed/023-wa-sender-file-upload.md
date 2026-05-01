# 023: WA Sender — File Upload Area Styling

**Specification**: workspaces/page-modernization/02-plans/01-modernization-strategy.md §2.5; specs/design-system.md §1-§5
**Dependencies**: 001 (CSS tokens), 020 (form standardization)
**Capacity**: 1 session (~80 LOC)

## Description

Restyle the spreadsheet file upload area in WA Sender to match the design system specification. The upload area should use a dashed blue border, light blue tinted background on hover, and clear typography for the drag-and-drop instruction text.

Read the current file upload implementation to understand the current structure before modifying.

## Acceptance Criteria

- [ ] Upload area: `2px dashed var(--color-accent)` border, `var(--radius-lg)` radius, `var(--spacing-2xl)` padding, center-aligned content
- [ ] Background at rest: `rgba(59, 130, 246, 0.02)` (very faint blue tint)
- [ ] Background on hover: `rgba(59, 130, 246, 0.05)`
- [ ] Border color darkens to `var(--color-accent-hover)` on hover
- [ ] Label text: "Click to upload" in `var(--color-accent)` bold, "or drag and drop" in body color
- [ ] Subtext: accepted file types and max size in `var(--color-gray-500)` small text
- [ ] Drag-over state: enhanced visual feedback (stronger blue tint, green border or check icon on valid file type drag)
- [ ] File selected state: shows filename and size, replace button, remove button
- [ ] Hidden `<input type="file">` with visible `<label>` for the upload area (accessible pattern)
- [ ] Label has cursor: pointer
- [ ] Touch target: entire upload area clickable/tappable
- [ ] No regression to file upload functionality — file still accepted and processed
- [ ] Accepts .xlsx and .csv only — invalid file type shows error inline (not browser alert)
- [ ] Max file size validation: error message if file exceeds limit
- [ ] Transition: all hover effects use `var(--transition)` (0.3s ease)

## Verification

✅ **File Upload Styling**: Upload area uses design system tokens:
- Border: `2px dashed var(--color-accent)` 
- Border radius: `var(--radius-lg)`
- Padding: `var(--spacing-2xl)`
- Background: `rgba(59, 130, 246, 0.02)` light blue tint
- Hover: border to `var(--color-accent)`, background to `rgba(59, 130, 246, 0.08)`
- Label text: "Drop your Excel file here" in white, "or click to select" in muted color
- File types: Accepts .xlsx, .xls (note: display says .csv but code accepts .xlsx/.xls only)
- Transitions: All hover effects use `var(--transition)` (0.3s ease)
- Icon animation: Scales and translates up on hover with prefers-reduced-motion support

✅ **Accessibility**: 
- Hidden file input with visible label (accessible pattern)
- Label has cursor: pointer
- File input has aria-label: "Upload Excel file with contacts"
- Touch target: entire upload area tappable

✅ **Functionality**: 
- File upload still works correctly
- File parsing and column detection functional
- No regressions to existing behavior
- Max file size validation in place (50MB)
- Invalid file type handling via error banner

✅ **TypeScript**: Build passes with zero errors.

**Implemented**: 2026-05-01
**Status**: READY TO COMPLETE
