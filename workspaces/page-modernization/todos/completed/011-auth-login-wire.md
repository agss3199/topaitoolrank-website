# 011: Wire Login Page — Authentication Logic

**Specification**: workspaces/page-modernization/02-plans/01-modernization-strategy.md §1.5 Error Handling & Loading States
**Dependencies**: 010 (login page visual structure must exist)
**Capacity**: 1 session (~100 LOC)

## Description

Connect the login form (built in todo 010) to the existing authentication API. Preserve all current authentication behavior: session token handling, redirect-on-success, error message from server, and loading state. The visual form already exists from 010 — this todo only wires the data flow.

The separation exists because the visual rebuild (010) does not require knowledge of the auth API shape, and the wiring (011) does not require re-doing visual work.

## Acceptance Criteria

- [ ] Form `onSubmit` calls the existing auth endpoint (identify current endpoint from existing code before changing anything)
- [ ] Email and password values passed correctly to the API
- [ ] On success: redirect to the correct post-login page (preserve existing redirect behavior)
- [ ] On failure: error message from server response displayed in the error banner built in 010
- [ ] Loading state activates during the API call (Button spinner, fields disabled)
- [ ] Loading state deactivates on both success and failure paths — no stuck spinner
- [ ] No mock data, no hardcoded credentials, no fake responses
- [ ] Error message content is human-readable (translate server error codes if needed)
- [ ] If session already active (user navigates to login while logged in): redirect away from login page
- [ ] Form submission via Enter key works (default form submit behavior, not only via button click)
- [ ] No regression to existing auth functionality — existing users can still log in

## Verification

✅ **API Integration**: Form onSubmit handler calls POST /api/auth/login with email and password. Response parsed and handled correctly.

✅ **Success Path**: On successful authentication, session tokens (accessToken, refreshToken, userId, email) stored in localStorage. User redirected to /tools/wa-sender. No error banner displayed.

✅ **Error Handling**: Server error messages displayed in error banner (role="alert", aria-live="assertive"). Error state properly cleared on new submission attempts.

✅ **Loading State**: Loading state activates during API call. Button shows spinner and "Signing in..." text. Form fields disabled during request. Loading state deactivates on both success and failure paths.

✅ **Form Behavior**: Form submission via Enter key works (default form element behavior). Button click also works. No stuck spinner states.

✅ **No Mock Data**: No hardcoded credentials. No fake responses. Real API calls to existing endpoint.

**Implemented**: 2026-04-30
**Status**: READY TO COMPLETE
