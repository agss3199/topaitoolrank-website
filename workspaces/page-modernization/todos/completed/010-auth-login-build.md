# 010: Build Login Page — Visual Structure

**Specification**: specs/design-system.md §1-§8; workspaces/page-modernization/02-plans/01-modernization-strategy.md § Tier 1 §1.1-§1.6
**Dependencies**: 001, 002, 003, 004, 008 (CSS tokens + Button + Input + Card + component index)
**Capacity**: 1 session (~200 LOC)

## Description

Replace the current dark-theme glassmorphic login page at `app/auth/login/page.tsx` with a light-theme design matching the homepage. The current page uses dark gradient backgrounds (slate-950 → purple-950), purple/blue/cyan animated blurs, glassmorphism, and emoji icons — all of which conflict with the homepage brand per `journal/0001-DISCOVERY-design-system-mismatch.md`.

This todo covers visual structure, layout, and local state only. Authentication logic (API calls, session handling) is covered in todo 011.

## Acceptance Criteria

- [ ] Page background uses `var(--color-bg-light)` (#fafafa), not dark gradient
- [ ] No animated blur effects, no glassmorphism, no backdrop-filter
- [ ] No emoji icons in the UI
- [ ] Layout: two-column grid on desktop (≥1024px) — left column has brand messaging (h1 + subtitle), right column has form card
- [ ] Single column on tablet (768px-1023px): form card centered at 80% width
- [ ] Single column on mobile (<768px): form card at 100% width with `var(--spacing-lg)` horizontal padding
- [ ] Left column heading: "Sign in to WA Sender" using `var(--font-size-h2)` and `var(--font-weight-headline)`, `var(--color-black)` text
- [ ] Left column subtitle: body text describing the tool (no emojis), `var(--color-gray-500)` color
- [ ] Form contained in `<Card>` component with white background and soft shadow
- [ ] Email field: `<FormField>` component, type="email", label "Email address", required indicator
- [ ] Password field: `<FormField>` component, type="password", label "Password", required indicator, show/hide toggle
- [ ] Submit button: `<Button variant="primary">` full-width, text "Sign in"
- [ ] Loading state: Button shows spinner and "Signing in..." text, fields disabled
- [ ] Error banner: displays when auth fails, red border, red text, `role="alert"`, `aria-live="assertive"`
- [ ] "Don't have an account? Sign up" link below form, accent color, links to `/auth/signup`
- [ ] Heading hierarchy: h1 for page title, h2 inside card for "Welcome back" subheading
- [ ] All focus states visible with 2px blue outline
- [ ] Form has `<form>` element with proper submit handler (no inline onClick on button)
- [ ] Passes TypeScript compilation with no errors

## Verification

✅ **Visual Structure**: Light background (var(--color-bg-light)), two-column responsive layout on desktop, single column on mobile. Left column has h1 "Sign in to WA Sender" and descriptive subtitle using design system tokens. Right column contains form in Card component.

✅ **Components**: All form fields use FormField component. Button uses Button component with primary variant. Error banner has role="alert" and aria-live="assertive". All styling uses CSS variables (var(--color-*), var(--spacing-*), var(--font-size-*)).

✅ **No Dark Theme/Glassmorphism**: Background is white (not dark gradient). No animated blur effects. No glassmorphism or backdrop-filter. No emoji icons.

✅ **Form Elements**: Email field (type="email", required). Password field (type="password", required). Submit button (full-width, text "Sign in", loading state with spinner). Sign up link with accent color.

✅ **Accessibility**: Focus states visible. Proper form element structure. Heading hierarchy (h1 for page title, h2 inside card for "Welcome back").

✅ **TypeScript**: Build passes with zero errors. Next.js compilation successful.

**Implemented**: 2026-04-30
**Status**: READY TO COMPLETE
