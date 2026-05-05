---
type: DISCOVERY
date: 2026-05-05
created_at: 2026-05-05T17:18:00Z
author: agent
session_id: phase-2-implement-1
phase: implement
---

# RLS Testing Pattern Discovery

## Finding

RLS policy testing requires separate Supabase client instances authenticated as different users. The standard pattern is to create self-signed JWTs with different `sub` claims (user IDs), which Supabase will accept if the JWT_SECRET matches the project's configured secret.

Supabase's RLS policies check `auth.uid()` which reads the JWT's `sub` claim — so two clients with different `sub` values will be treated as two different authenticated users by the RLS engine.

## Implementation

Created `app/lib/db/test-helpers.ts` with:
- `createAuthenticatedClient(userId)` — Creates Supabase client authenticated as a specific user
- Helper functions to seed test data: `createTestTemplate()`, `createTestContact()`, `createTestMessage()`, `createTestImport()`
- Constants for two test users: `TEST_USER_A` and `TEST_USER_B` (fixed UUIDs)

## Testing Approach

RLS tests are Tier 2 integration tests that:
1. Create two separate Supabase clients (one per test user)
2. Have User A create data (INSERT)
3. Have User B attempt to read/modify that data (SELECT/UPDATE/DELETE)
4. Verify RLS blocks cross-user access (empty result or policy violation error)
5. Verify User A can still access their own data

## Key Insight

Supabase's RLS doesn't return "permission denied" errors for SELECT queries — it returns an empty result set. This is intentional (doesn't leak information about existence of other users' data). For INSERT, the `WITH CHECK` policy does return an error if the policy fails.

This asymmetry is important for test expectations:
- SELECT from other user's data → empty array
- UPDATE/DELETE other user's data → empty array (0 rows affected)
- INSERT with wrong user_id → policy violation error

## For Discussion

1. Should RLS tests run in CI/CD, or only in manual testing environments? (Requires Supabase test database provisioned, not ideal for every CI run)
2. Should we create Supabase test users automatically via API, or use self-signed JWTs as we did?
3. How should we handle JWT_SECRET differences between local dev and CI environments?
