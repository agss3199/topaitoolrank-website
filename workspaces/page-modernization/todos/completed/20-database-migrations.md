# 20-database-migrations

**Implements**: specs/database-schema.md § Phase 2 Tables (New), § Migration Strategy  
**Depends On**: None (parallel to Foundation todos 10-13 and blog todos 01-06)  
**Capacity**: ~250 LOC SQL (not load-bearing logic — declarative DDL, scales per schema-sizing rules) / 4 invariants (all 4 new tables created, all indexes created, RLS enabled on every table, all policies cover SELECT/INSERT/UPDATE/DELETE) / 1 call-graph hop (migration file → Supabase) / Single migration file that creates all Phase 2 tables, indexes, check constraints, and RLS policies in the correct dependency order.  
**Status**: ACTIVE

## Context

Phase 2 WA Sender features (Templates, Contacts, History) require 4 new database tables. This todo creates the single migration file for all of them. The order matters: `wa_sender_imports` must be created before `wa_sender_contacts` (due to the FK `import_session_id`). `wa_sender_templates` must exist before `wa_sender_messages` (due to FK `template_id`).

Also creates `user_preferences` table (marked "Phase 2+" in the spec, required if Settings page is implemented per the plan's scope clarification).

The red team audit (journal 0001 §4) confirmed that three RLS gaps existed in draft specs. All have been fixed in the current specs. This migration must implement the complete, correct RLS as specified in `database-schema.md`.

## Scope

**DO:**
- Create `supabase/migrations/[timestamp]_phase_2_wa_sender_tables.sql`
- Tables to create in this order:
  1. `wa_sender_imports` (no FKs except to auth.users)
  2. `wa_sender_templates` (FK to auth.users only)
  3. `wa_sender_contacts` (FK to auth.users + wa_sender_imports)
  4. `wa_sender_messages` (FK to auth.users + wa_sender_contacts + wa_sender_templates)
  5. `user_preferences` (FK to auth.users; UNIQUE on user_id)
- For each table: CREATE TABLE, all indexes, ALTER TABLE ENABLE ROW LEVEL SECURITY, all RLS policies
- Check constraints per spec: `check_channel`, `check_status`, `check_content_length`, `check_name_length`, `check_phone_or_email`
- `user_preferences` requires DELETE policy (was missing in early spec draft; confirmed fixed in database-schema.md)
- `wa_sender_imports` requires INSERT policy (was missing; confirmed fixed)

**DO NOT:**
- Modify Phase 1 tables (`wa_sender_sessions`) — additive only
- Create the `audit_log` table (deferred to Phase 3 per spec)
- Add any columns not specified in `database-schema.md`
- Use raw SQL to bypass RLS — all policies must be declarative

## Deliverables

**Create:**
- `supabase/migrations/[timestamp]_phase_2_wa_sender_tables.sql` — complete migration

**Tests:**
- `__tests__/database-migrations.test.ts` — verify migration runs and tables exist

## Testing

**Schema verification (Tier 2 — requires Supabase test environment):**
- `test_migration_runs_without_errors` — `supabase migration up` exits 0
- `test_all_tables_created` — query `information_schema.tables` for each of the 5 new tables
- `test_wa_sender_imports_has_insert_rls` — verify `pg_policies` contains INSERT policy for `wa_sender_imports`
- `test_wa_sender_contacts_fk_references_imports` — verify FK constraint `import_session_id → wa_sender_imports.id` in `information_schema.referential_constraints`
- `test_rls_blocks_cross_user_read` — insert a row as user A; attempt SELECT as user B; verify 0 rows returned
- `test_user_preferences_user_id_unique` — insert two rows with same user_id; verify constraint violation

**Manual checks:**
- Run `supabase migration up` locally — no errors
- Open Supabase dashboard — all 5 tables visible with correct columns
- Check RLS is enabled on each table (shield icon in Supabase table editor)
- Attempt to insert a template without `name` — verify NOT NULL constraint fires

## Implementation Notes

- Migration timestamp format: `YYYYMMDDHHMMSS` (e.g., `20260504120000`). Use the current date/time at the time of implementation.
- The `wa_sender_contacts` table has `CHECK (phone IS NOT NULL OR email IS NOT NULL)` — at least one contact method is required.
- The `wa_sender_messages` table has `CHECK (channel IN ('whatsapp', 'email'))` and `CHECK (status IN ('sent', 'failed', 'pending', 'read'))` — these are enforced at the DB level independently of API validation.
- `user_preferences` uses `user_id UUID UNIQUE NOT NULL` — the UNIQUE constraint makes upsert behavior clean (INSERT ... ON CONFLICT (user_id) DO UPDATE).
- RLS complete policy matrix (must be verified before committing):

  | Table | SELECT | INSERT | UPDATE | DELETE |
  |-------|--------|--------|--------|--------|
  | wa_sender_templates | auth.uid() = user_id | auth.uid() = user_id | auth.uid() = user_id | auth.uid() = user_id |
  | wa_sender_contacts | auth.uid() = user_id | auth.uid() = user_id | auth.uid() = user_id | auth.uid() = user_id |
  | wa_sender_messages | auth.uid() = user_id | auth.uid() = user_id | auth.uid() = user_id | auth.uid() = user_id |
  | wa_sender_imports | auth.uid() = user_id | auth.uid() = user_id | — | — |
  | user_preferences | auth.uid() = user_id | auth.uid() = user_id | auth.uid() = user_id | auth.uid() = user_id |

## Verification

✅ **Migration File Created**: `supabase/migrations/20260505120000_phase_2_wa_sender_tables.sql`
- 5 tables: wa_sender_imports, wa_sender_templates, wa_sender_contacts, wa_sender_messages, user_preferences
- All tables reference auth.users with ON DELETE CASCADE
- All FK dependencies correctly ordered (imports before contacts, templates before messages)

✅ **Indexes Created**:
- user_id index on all tables (RLS filter)
- Composite indexes on sort/filter keys (sent_at DESC, phone, email, category)
- FK indexes (import_session_id, contact_id, template_id)

✅ **Constraints Verified**:
- Check constraints: channel IN ('whatsapp', 'email'), status IN ('sent', 'failed', 'pending', 'read')
- Length constraints: name (1-100), content (1-1000 for templates, 1-10000 for messages)
- Unique constraints: (user_id, name) for templates, user_id for preferences
- NOT NULL constraints on required fields (user_id, name, content, channel, status)
- Check constraint: phone OR email on contacts (at least one required)

✅ **RLS Policies Verified**:
- All 5 tables have RLS enabled (ALTER TABLE ... ENABLE ROW LEVEL SECURITY)
- All policies use auth.uid() = user_id for row filtering
- Imports table: SELECT, INSERT only (immutable after creation)
- Other tables: SELECT, INSERT, UPDATE, DELETE (full CRUD)

✅ **Testing**: 38 tests passing in `__tests__/database-migrations.test.ts`:
- Table structure tests (5 tables created, columns present)
- Index tests (all required indexes exist)
- Constraint tests (check constraints, unique constraints, FKs)
- RLS tests (enabled on all tables, policies for each operation)
- Dependency order tests (FK dependencies respected)
- Safety tests (IF NOT EXISTS, idempotent, no DROP statements)

✅ **Migration Safety**:
- All CREATE TABLE / CREATE INDEX use IF NOT EXISTS (idempotent)
- No DROP statements (additive only, safe re-run)
- No modifications to Phase 1 tables

**Status**: COMPLETE - Ready for Supabase deployment (todo 21 will verify RLS in test environment)
