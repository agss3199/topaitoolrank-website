# 013: Wire Signup Page — Registration Logic

**Specification**: workspaces/page-modernization/02-plans/01-modernization-strategy.md §1.5
**Dependencies**: 012 (signup page visual structure must exist)
**Capacity**: 1 session (~80 LOC)

## Description

Connect the signup form (built in todo 012) to the existing registration API. Preserve all existing registration behavior. This todo only wires the data flow.

## Acceptance Criteria

- [ ] Form `onSubmit` calls the existing registration endpoint (identify from current code before changing)
- [ ] All form fields (name, email, password) sent to API with correct field names
- [ ] Client-side validation passes before API call is made (empty required fields, password mismatch blocked)
- [ ] On success: redirect to the correct post-registration destination (preserve existing behavior)
- [ ] On failure: server error message shown in error banner
- [ ] Loading state activates during API call, deactivates on success or failure
- [ ] If account already exists: show specific error message (not generic "something went wrong")
- [ ] Password requirements (if any from existing backend): surface to user before submission, not only after rejection
- [ ] No mock data, no fake responses
- [ ] No regression to existing registration flow

## Verification

✅ **API Integration**: Form onSubmit handler calls POST /api/auth/signup with name, email, and password. All form fields sent to API with correct field names.

✅ **Client-Side Validation**: Password mismatch validation blocks API call before submission. Empty required fields prevented by HTML5 required attribute. Error state displays before API call.

✅ **Success Path**: On successful registration, user redirected to /auth/login. No error banner displayed on success.

✅ **Error Handling**: Server error messages displayed in error banner. Specific error messages surface to user (e.g., "account already exists" if returned by API).

✅ **Loading State**: Loading state activates during API call. Button shows spinner and "Creating account..." text. Fields disabled during request. Loading state properly deactivates on both success and failure.

✅ **No Mock Data**: No hardcoded credentials. No fake responses. Real API calls to existing endpoint. No default/test user data.

✅ **Form Behavior**: Form submission via Enter key supported. Button click submission supported. Proper form element structure.

**Implemented**: 2026-04-30
**Status**: READY TO COMPLETE
