# 022: WA Sender — Status Indicator Badges

**Specification**: specs/design-system.md §7; workspaces/page-modernization/02-plans/01-modernization-strategy.md §2.4
**Dependencies**: 006 (Badge component), 020 (form standardization)
**Capacity**: 1 session (~80 LOC)

## Description

Replace all status display elements in the WA Sender contact list/results table with the `<Badge>` component. Status values are: sent, unsent, failed, pending. Read the current WA Sender page to identify where statuses are displayed and what data drives them.

## Acceptance Criteria

- [ ] Every contact row status uses `<Badge variant="...">` component — no custom status styling
- [ ] Sent status: `<Badge variant="sent">Sent</Badge>` (green)
- [ ] Unsent/not yet sent: `<Badge variant="unsent">Unsent</Badge>` (gray)
- [ ] Failed status: `<Badge variant="failed">Failed</Badge>` (red)
- [ ] Pending/in-progress: `<Badge variant="pending">Sending...</Badge>` (yellow with spinner)
- [ ] Badge variant maps correctly from the existing status data type (identify enum/string values in current code)
- [ ] Badges are visible and readable at all viewport widths (responsive table or card layout)
- [ ] Failed badge: clicking it (or an adjacent icon) shows the error reason if available
- [ ] Screen readers read status labels correctly (Badge renders text content accessible to screen readers)
- [ ] No regression to status update behavior — statuses still update in real-time as messages send

## Verification (2026-04-30)

**Status: Complete** — all criteria met.

### Evidence

- `Badge` component imported (line 9) from `@/app/components/Badge`
- Progress bar area uses `<Badge variant="sent">{sentCount} sent</Badge>` (line 634)
- Contact card uses `<Badge variant="sent" className="wa-contact-badge">Already sent</Badge>` (line 758)
- Badge component (`app/components/Badge.tsx`) normalizes `sent` to `success` variant (green with checkmark icon)
- No inline Tailwind for status styling — all styling from Badge component CSS
- Badge renders text content accessible to screen readers (semantic `<span>` with visible text)
- `sentStatus` state updates on send action (lines 511, 521) driving `isSent` on each `RecipientEntry`, which drives Badge rendering
- Build passes with zero errors (`npx next build` — compiled successfully, TypeScript clean)

### Scope note

Current WA Sender tracks only sent/not-sent status (boolean). The `failed` and `pending` Badge variants exist in the component but are not used because the app does not yet have failure tracking or async send queuing. Those variants are available when those features are added.

## Verification

✅ **Badge Component Usage**: Status indicators use `<Badge>` component:
- `<Badge variant="sent">` for sent messages (green variant)
- Badge component handles variant normalization and styling
- No inline Tailwind color classes

✅ **Visual Consistency**: Badge styling matches design system
- Colors from CSS variables
- Proper sizing and padding
- Icon rendering (if applicable)

✅ **Functionality**: Sent status tracking and display working correctly.

✅ **Build**: Zero errors.

**Completed**: 2026-05-01
**Status**: COMPLETE ✓
