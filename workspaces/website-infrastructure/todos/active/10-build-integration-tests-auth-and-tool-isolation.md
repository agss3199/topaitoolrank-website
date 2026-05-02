# Todo: Build Integration Tests for Auth & Tool Isolation

**Status:** Pending  
**Implements:** specs/authentication.md §Security Threat Model  
**Dependencies:** Item 07 (WA Sender with real data), Item 09 (Tool B)  
**Blocks:** Item 11 (deployment)  
**Capacity:** Single session (~350 LOC tests)  

## Description

Write integration tests that verify auth isolation and tool scoping work correctly. Tests should verify that: (1) WA Sender token cannot access Tool B routes, (2) User A cannot see User B's data, (3) Expired tokens are rejected, (4) Token refresh works, (5) Wrong tool_id claim is rejected.

## Implementation

1. **Auth isolation tests** (`__tests__/auth-isolation.test.ts`):
   - Test: WA Sender token rejected on `/tools/tool-b/*` routes (401)
   - Test: Tool B token rejected on `/tools/wa-sender/*` routes (401)
   - Test: Expired token is rejected (401)
   - Test: Refresh token generates valid new access token
   - Test: Invalid token signature is rejected (401)
   - Test: Missing token redirects to login

2. **Tool data isolation tests** (`__tests__/tool-data-isolation.test.ts`):
   - Test: User A creates WA Sender conversation
   - Test: User B calls `/api/wa-sender/conversations`, gets empty array (not User A's data)
   - Test: User B creates Tool B template
   - Test: User A calls `/api/tool-b/templates`, gets empty array (not User B's data)
   - Test: Database queries include `tool_id` filter

3. **Tool scope validation tests** (`__tests__/tool-scope.test.ts`):
   - Test: JWT payload includes `tool_id` claim
   - Test: Middleware validates `tool_id` matches route
   - Test: Tool-scoped hook (`useWASenderSession`) throws if `tool_id !== 'wa-sender'`
   - Test: Tool-scoped hook returns session if `tool_id === 'wa-sender'`

## Acceptance Criteria

- [ ] All auth tests pass: `npm run test -- __tests__/auth-isolation.test.ts`
- [ ] All data isolation tests pass: `npm run test -- __tests__/tool-data-isolation.test.ts`
- [ ] All scope tests pass: `npm run test -- __tests__/tool-scope.test.ts`
- [ ] Total test coverage: ≥80% for auth/tool-related code
- [ ] No tests use mocked HTTP (all use real test database)
- [ ] Tests verify behavior, not implementation details
- [ ] Tests document the security invariants (comments explain what's being verified)

## Testing

```bash
# Run all integration tests
npm run test

# Run auth tests specifically
npm run test -- __tests__/auth-isolation.test.ts

# Run with coverage
npm run test -- --coverage

# Verify no mock data in tests (all use real database)
grep -r "MOCK_\|FAKE_\|jest.mock" __tests__/
# May have some mocks, but data should be real (no hardcoded responses)
```

