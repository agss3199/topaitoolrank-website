# 21-database-rls-verification

**Implements**: specs/database-schema.md § Security Considerations (RLS), § Data Integrity  
**Depends On**: 20-database-migrations (tables must exist to verify RLS)  
**Capacity**: ~100 LOC test code / 3 invariants (no cross-user read, no cross-user write, no cross-user delete) / 1 call-graph hop (test → Supabase RLS enforcement) / Runs adversarial queries as two distinct users against every new table and confirms RLS blocks cross-user data access in all four operations.  
**Status**: ACTIVE

## Context

RLS policies are declared in SQL but only proven correct when tested adversarially — a missing `USING` clause vs `WITH CHECK` clause is easy to get wrong. This todo is a dedicated verification pass that tests every table's isolation guarantees before any application code relies on them.

This is a security-critical component per the testing rules (100% coverage for auth/security). It runs in a real Supabase test environment with two distinct authenticated users.

## Scope

**DO:**
- Create `__tests__/database-rls-verification.test.ts` with Tier 2 integration tests
- For each of the 5 new tables: test SELECT, INSERT, UPDATE (where policy exists), DELETE (where policy exists) from user_B's perspective against user_A's data
- Verify that all operations on own data succeed (RLS allows what it should allow)
- Verify that all operations on other user's data return empty results or errors (RLS blocks cross-user access)
- Create `app/lib/db/test-helpers.ts` with utilities for creating test Supabase clients with different auth tokens

**DO NOT:**
- Test Phase 1 tables (already tested) unless a regression is suspected
- Mock the Supabase client — this test MUST use a real Supabase test environment (Tier 2)
- Combine with todo 20's migration test — this is a separate verification concern

## Deliverables

**Create:**
- `__tests__/database-rls-verification.test.ts` — adversarial RLS tests
- `app/lib/db/test-helpers.ts` — Supabase test client helpers

**Tests (this todo IS the tests):**
- `test_templates_rls_blocks_cross_user_select` — user A creates a template; user B queries templates; gets 0 results
- `test_templates_rls_blocks_cross_user_delete` — user A creates a template; user B attempts DELETE by ID; receives 0 rows deleted (not an error, just empty result)
- `test_templates_rls_allows_own_select` — user A creates a template; user A queries; gets 1 result
- `test_contacts_rls_blocks_cross_user_select` — user A creates a contact; user B queries contacts; gets 0 results
- `test_contacts_rls_blocks_cross_user_update` — user A creates a contact; user B attempts UPDATE; 0 rows affected
- `test_messages_rls_blocks_cross_user_select` — same pattern for messages
- `test_imports_rls_blocks_cross_user_select` — same pattern for imports
- `test_user_preferences_rls_blocks_cross_user_select` — same pattern for user_preferences
- `test_rls_allows_own_insert_templates` — user A can INSERT into wa_sender_templates with their own user_id
- `test_rls_blocks_insert_with_wrong_user_id` — user A attempts INSERT with user_id = user_B's ID; Supabase rejects (WITH CHECK fails)

## Testing

These tests are the deliverable. All tests run against a real Supabase test environment.

**Setup requirements:**
- Two Supabase test users (user A, user B) created in test setup
- Test-specific JWT tokens for each user
- Tables created by migration (todo 20 prerequisite)
- Cleanup: delete all test rows after each test (teardown)

## Implementation Notes

- Supabase RLS testing pattern: use two separate Supabase clients, each initialized with a different user's JWT. The JWT contains the `sub` claim which Supabase uses as `auth.uid()`.
- For testing WITH CHECK (INSERT policy): to prove user A cannot insert a row with `user_id = user_B_id`, use user A's Supabase client and attempt `INSERT INTO wa_sender_templates (user_id, ...) VALUES (user_B_id, ...)`. Supabase should return a policy violation error.
- The `wa_sender_imports` table has no UPDATE or DELETE policy — verify that user A cannot UPDATE their own import record (intentional — imports are write-once metadata).
- Test teardown order matters due to FKs: delete `wa_sender_messages` before `wa_sender_contacts` and `wa_sender_templates`; delete `wa_sender_contacts` before `wa_sender_imports`.
- These tests should be tagged `@supabase` or `@integration` and excluded from CI runs that lack a Supabase environment. Add a jest config or test script for `npm run test:integration`.
