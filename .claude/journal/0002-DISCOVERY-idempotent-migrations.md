---
date: 2026-04-29
type: DISCOVERY
title: PostgreSQL Idempotent Migration Patterns
---

## Summary

Discovered the correct PostgreSQL syntax for writing migrations that can be safely re-run without errors.

## Pattern Details

### Column Additions

**Incorrect (fails on re-run):**
```sql
ALTER TABLE public.wa_sender_sessions
ADD COLUMN email_subject TEXT,
ADD COLUMN email_body TEXT;
```

Error on second run: `ERROR: 42701: column "email_subject" of relation "wa_sender_sessions" already exists`

**Correct (idempotent):**
```sql
ALTER TABLE public.wa_sender_sessions
ADD COLUMN IF NOT EXISTS email_subject TEXT,
ADD COLUMN IF NOT EXISTS email_body TEXT;
```

### Policy Management

**Incorrect:**
```sql
CREATE POLICY "Users can read their own sessions" ...
```

Error on re-run: `ERROR: 42601: policy "Users can read their own sessions" already exists`

**Correct:**
```sql
DROP POLICY IF EXISTS "Users can read their own sessions" ON public.wa_sender_sessions;
CREATE POLICY "Users can read their own sessions" ...
```

### Index Creation

**Incorrect:**
```sql
CREATE INDEX idx_users_email ON public.users(email);
```

**Correct:**
```sql
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
```

## Why This Matters

Idempotent migrations can be:
- Re-run safely in dev/staging/prod without failing
- Partially applied (e.g., migration 002 runs twice) without errors
- Rolled forward after a failed deployment

This makes recovery and debugging much simpler — if you're unsure whether migration N applied, just re-run it without fear of errors.

## Implementation in This Project

All three migrations (001, 002, 003) now use idempotent syntax:
- 001: DROP POLICY IF EXISTS + CREATE POLICY pattern for all 6 policies
- 002: ADD COLUMN IF NOT EXISTS for email_subject and email_body
- 003: ADD COLUMN IF NOT EXISTS for sent_status

This allows migrations to be safely re-run in the future if needed.

## Recommendation for Future Work

When writing DDL migrations:
1. Always use `IF NOT EXISTS` for CREATE INDEX
2. Always use `ADD COLUMN IF NOT EXISTS` for ALTER TABLE
3. Always use `DROP ... IF EXISTS` before CREATE POLICY (no native IF NOT EXISTS support)
4. Test migrations by running them twice in sequence to verify idempotency
