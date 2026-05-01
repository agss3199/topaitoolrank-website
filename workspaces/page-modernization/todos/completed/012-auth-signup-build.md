# 012: Build Signup Page — Visual Structure

**Specification**: specs/design-system.md §1-§8; workspaces/page-modernization/02-plans/01-modernization-strategy.md § Tier 1
**Dependencies**: 001, 002, 003, 004, 008 (CSS tokens + Button + Input + Card + component index)
**Capacity**: 1 session (~200 LOC)

## Description

Build or replace the signup page at `app/auth/signup/page.tsx` to match the login page's visual approach (light theme, blue accent, two-column layout). The current state is unknown (analysis marks it as "likely follows similar pattern to login page").

Before implementing: read the current signup page file to understand existing state. Preserve any existing signup fields (name, email, password, confirm password).

## Acceptance Criteria

- [ ] Page background: `var(--color-bg-light)`, no dark gradient
- [ ] Same two-column layout as login page (brand messaging left, form card right)
- [ ] Responsive: single column on mobile/tablet (same breakpoints as login)
- [ ] Form card uses `<Card>` component
- [ ] Name field: `<FormField>` type="text", label "Full name", required
- [ ] Email field: `<FormField>` type="email", label "Email address", required
- [ ] Password field: `<FormField>` type="password", label "Password", required, show/hide toggle
- [ ] Confirm password field: `<FormField>` type="password", label "Confirm password", required, show/hide toggle, validates match client-side
- [ ] Submit button: `<Button variant="primary">` full-width, text "Create account"
- [ ] Loading state: spinner + "Creating account..." text, fields disabled
- [ ] Error banner: same pattern as login page (role="alert", aria-live="assertive")
- [ ] Success state: friendly confirmation message or redirect (not a blank page)
- [ ] "Already have an account? Sign in" link below form, links to `/auth/login`
- [ ] Password match validation: shows inline error on confirm-password field when values differ, clears when they match
- [ ] Heading hierarchy: h1 page title, h2 inside card
- [ ] All focus states visible
- [ ] No emojis, no dark theme, no glassmorphism
- [ ] Passes TypeScript compilation

## Verification

✅ **Visual Structure**: Light background (var(--color-bg-light)). Two-column responsive layout matching login page. Left column: h1 "Create Your Account" and descriptive subtitle. Right column: form in Card component. Single column on mobile/tablet with proper padding.

✅ **Form Fields**: Name field (FormField, type="text", label "Full Name", required). Email field (FormField, type="email", label "Email address", required). Password field (FormField, type="password", label "Password", required). Confirm password field (FormField, type="password", label "Confirm Password", required).

✅ **Validation**: Client-side password match validation implemented. Error banner shows "Passwords do not match" when values differ. Validation occurs before API call.

✅ **Button & Loading**: Submit button uses Button component (variant="primary", full-width, text "Create Account"). Loading state shows spinner and "Creating account..." text. Fields disabled during request.

✅ **Error Handling**: Error banner with role="alert" and aria-live="assertive" displays server errors. Sign in link below form with accent color, links to /auth/login.

✅ **Design System**: All colors, spacing, fonts use CSS variables. No emojis, no dark theme, no glassmorphism. Focus states visible. Proper heading hierarchy (h1 page title, h2 inside card).

✅ **TypeScript**: Build passes with zero errors.

**Implemented**: 2026-04-30
**Status**: READY TO COMPLETE
