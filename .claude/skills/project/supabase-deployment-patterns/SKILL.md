# Supabase Deployment Patterns

Detailed knowledge for applying Supabase migrations, verifying Row-Level Security (RLS) policies, and managing database-first deployments with JWT-based authentication.

## Quick Start: Apply a Migration

Two methods for applying `supabase/migrations/*.sql` files:

### Method 1: Supabase CLI (Recommended)
```bash
npm install -g supabase                    # One-time setup
supabase link --project-ref <your-ref>    # Link to your project
supabase db push                           # Apply all pending migrations
```

### Method 2: Supabase Dashboard (Quickest)
1. Go to your project → SQL Editor
2. Create new query
3. Copy entire contents of migration file
4. Paste and click "Run"

**Why database-first matters:** App deployment that runs before database migration leaves the app live but unable to query tables. Requests return 500 errors. Database-first ensures tables exist before app boots.

## Migration File Structure (Supabase)

Every migration follows this pattern:

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_descriptive_name.sql

-- Table creation (with RLS enabled)
CREATE TABLE wa_sender_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (LENGTH(content) <= 10000),
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('whatsapp', 'email')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('sent', 'failed', 'pending', 'delivered')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE wa_sender_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies (enforce multi-tenant isolation)
CREATE POLICY "users_can_read_own_messages" ON wa_sender_messages
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_can_create_own_messages" ON wa_sender_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Performance indexes
CREATE INDEX idx_wa_sender_messages_user_id ON wa_sender_messages(user_id);
CREATE INDEX idx_wa_sender_messages_user_sent ON wa_sender_messages(user_id, created_at DESC);
```

**Key elements:**
- Foreign keys reference `auth.users(id)` with `ON DELETE CASCADE`
- CHECK constraints validate enum values and length
- RLS policies enforce `auth.uid() = user_id` for multi-tenant isolation
- Indexes on user_id and timestamp for common query patterns

## Row-Level Security (RLS) Verification

### After applying migration, verify RLS is active:

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename LIKE 'wa_sender%';
-- Expected: rowsecurity = true for all wa_sender_* tables

-- Count RLS policies
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE tablename LIKE 'wa_sender%'
GROUP BY tablename;
-- Expected: 4 policies per table (SELECT, INSERT, UPDATE, DELETE)

-- List policies by table
SELECT tablename, policyname, permissive, cmd
FROM pg_policies
WHERE tablename LIKE 'wa_sender_messages'
ORDER BY tablename, policyname;
```

### What RLS enforces in production:

1. **SELECT policy** — User can only read rows where `user_id = current_user_id`
   - JWT includes user_id
   - Supabase client uses JWT to set `auth.uid()`
   - Database automatically filters to user's rows

2. **INSERT policy** — User can only create rows where `user_id = current_user_id`
   - If application tries to insert with different user_id, policy rejects it
   - Prevents user A from creating messages for user B

3. **UPDATE/DELETE policies** — Same user_id enforcement
   - User can only modify their own records

## Data Flow: JWT → RLS Enforcement

Complete flow from API request to RLS-protected database query:

```
1. Client sends request with JWT:
   POST /api/wa-sender/messages
   Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

2. API endpoint extracts JWT:
   const token = headers.authorization.split(' ')[1]

3. Create authenticated Supabase client:
   const { createClient } = require('@supabase/supabase-js')
   const client = createClient(url, anonKey, {
       global: { headers: { Authorization: `Bearer ${token}` } }
   })

4. Client query automatically includes JWT:
   const { data } = await client
       .from('wa_sender_messages')
       .select('*')
   // Supabase includes JWT in request header

5. Database receives JWT, extracts user_id:
   -- PostgreSQL knows: auth.uid() = 'user-12345' (from JWT)

6. RLS policy filters silently:
   SELECT * FROM wa_sender_messages
   WHERE auth.uid() = user_id  -- ENFORCED by RLS policy
   -- Returns only user-12345's rows, even if table has 1M rows

7. Application receives filtered data:
   { data: [...only user's messages] }
```

**Key insight:** RLS enforcement is automatic at database layer. Application cannot bypass RLS — the database rejects unauthorized access at query time.

## Multi-Tenant Pattern: Cache Keys & Query Filters

When working with multi-tenant data, two layers ensure isolation:

### Layer 1: Application Layer (Defense in Depth)
```typescript
// WA Sender message history
const userId = getUserIdFromJWT(token)

// Query includes tenant dimension
const messages = await db
    .from('wa_sender_messages')
    .select('*')
    .eq('user_id', userId)  // Application explicitly filters by user
```

### Layer 2: Database Layer (Boundary)
```sql
-- RLS policy is the ultimate enforcement
-- Even if application forgets to filter, database enforces it
SELECT * FROM wa_sender_messages
WHERE auth.uid() = user_id  -- RLS rejects cross-tenant access
```

**Why both layers matter:**
- Application layer: faster, prevents unnecessary database queries
- Database layer: security boundary, prevents cross-tenant leaks

## Common Pitfalls

| Pitfall | Prevention |
|---------|-----------|
| RLS policies not created | Check `pg_policies` after migration completes |
| RLS not enabled on table | ALTER TABLE `table` ENABLE ROW LEVEL SECURITY; |
| Foreign key cascade delete not configured | Reference auth.users with ON DELETE CASCADE |
| CHECK constraints too loose | Name values in constraint: `CHECK (channel IN ('whatsapp','email'))` |
| Performance indexes missing | Index user_id + timestamp for common filters |
| Database migration applied after app deploy → 500 errors | Always: migration first, app second |

## Verification Commands (Copy-Paste Ready)

```bash
# Apply migration
supabase db push

# Verify tables created (should return 4 tables)
psql "$SUPABASE_URL" -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE 'wa_sender%';"

# Verify RLS enabled (should show true for all tables)
psql "$SUPABASE_URL" -c "SELECT tablename, rowsecurity FROM pg_tables WHERE tablename LIKE 'wa_sender%';"

# Verify policies exist (should show 4 per table)
psql "$SUPABASE_URL" -c "SELECT tablename, COUNT(*) FROM pg_policies WHERE tablename LIKE 'wa_sender%' GROUP BY tablename;"

# Verify indexes (should show at least 2 per table)
psql "$SUPABASE_URL" -c "SELECT tablename, indexname FROM pg_stat_user_indexes WHERE schemaname='public' AND tablename LIKE 'wa_sender%';"
```

## Related Files

- `supabase/migrations/` — all numbered migration files
- `.claude/agents/project/deployment-coordinator.md` — workflow for database-first deploys
- `.claude/skills/project/data-flow-rls-verification/` — complete data flow from JWT to RLS

## See Also

Sub-files in this skill:
- `migration-structure.md` — detailed migration file anatomy
- `rls-policy-patterns.md` — four RLS policy templates (SELECT/INSERT/UPDATE/DELETE)
- `jwt-to-rls-flow.md` — complete JWT extraction and RLS enforcement flow
