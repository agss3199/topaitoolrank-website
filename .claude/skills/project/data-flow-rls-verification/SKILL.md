# Data Flow & RLS Verification

Complete verification protocol for tracing authenticated requests from JWT extraction through Row-Level Security enforcement at the database boundary.

## Quick Verification: The 5-Layer Check

Every authenticated API request that accesses multi-tenant data must pass through 5 layers:

```
Layer 1: HTTP Endpoint        — extracts JWT from Authorization header
Layer 2: Authenticated Client  — creates Supabase client with JWT
Layer 3: Query Construction    — includes user_id filter (defense in depth)
Layer 4: Database Query        — RLS policy enforces user_id = auth.uid()
Layer 5: Result Filtering      — only authorized rows returned
```

**If any layer is broken, multi-tenant isolation fails.**

## Layer 1: JWT Extraction

The API endpoint receives a request with JWT token:

```typescript
// app/api/wa-sender/messages/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export async function POST(request: Request) {
    // Extract JWT from Authorization header
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.split(' ')[1]  // "Bearer eyJhbGc..." → "eyJhbGc..."
    
    if (!token) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // JWT now contains user_id in the payload
    // Next: create authenticated client
}
```

**Verification:**
- Header present: `Authorization: Bearer <token>`
- Token extracted correctly: `split(' ')[1]`
- Missing token returns 401 ✓

## Layer 2: Authenticated Supabase Client

Create a Supabase client that includes the JWT in all subsequent requests:

```typescript
const { createClient } = require('@supabase/supabase-js')

// Create client with JWT included in headers
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
        global: {
            headers: {
                Authorization: `Bearer ${token}`  // ← JWT is now in every request
            }
        }
    }
)

// Every query from this client includes the JWT
const { data } = await supabase
    .from('wa_sender_messages')
    .select('*')
// The Supabase client automatically adds:
// Authorization: Bearer <token>
// to this request to the database
```

**Verification:**
- Client created with correct URL and key ✓
- JWT included in global headers ✓
- All subsequent queries use this authenticated client ✓

## Layer 3: Query Construction (Defense in Depth)

Even though RLS is the boundary, application code explicitly filters by user_id:

```typescript
const userId = parseJwt(token).sub  // Extract user_id from JWT payload

const { data } = await supabase
    .from('wa_sender_messages')
    .select('*')
    .eq('user_id', userId)  // Application explicitly filters
```

**Why both layers?**
- Application layer: faster (fewer database rows scanned)
- Database layer: security boundary (database rejects unauthorized access)

**Verification:**
- User ID extracted from JWT payload ✓
- Query includes `.eq('user_id', userId)` filter ✓
- Filter value matches the user making the request ✓

## Layer 4: RLS Policy (The Boundary)

Database RLS policy is the ultimate enforcement:

```sql
-- On table wa_sender_messages
CREATE POLICY "users_can_read_own_messages" ON wa_sender_messages
    FOR SELECT USING (auth.uid() = user_id);
```

When the database receives the query:

```sql
SELECT * FROM wa_sender_messages WHERE user_id = 'user-12345'
-- RLS policy applies:
WHERE auth.uid() = user_id
-- Result: Only rows where user_id = auth.uid() are returned
```

**The JWT is decoded at the database boundary:**
- Supabase includes JWT in request to database
- PostgreSQL extracts user_id from JWT via `auth.uid()`
- RLS policy compares: `auth.uid() = user_id`
- Rows NOT matching the policy are filtered out

**Verification:**
- RLS policy exists on the table ✓
- Policy uses `auth.uid() = user_id` ✓
- RLS is enabled on the table: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` ✓

## Layer 5: Result Filtering

Application receives only authorized rows:

```typescript
const { data } = await supabase
    .from('wa_sender_messages')
    .select('*')
    .eq('user_id', userId)

// data contains ONLY messages where user_id = <authenticated_user>
// Even if 1M rows exist in the table, only this user's rows are returned
console.log(data)  // [{ id: '...', user_id: 'user-12345', content: '...' }]
```

**Verification:**
- Data array contains only rows matching authenticated user's user_id ✓
- No rows from other users visible ✓

---

## Complete Request Flow: Detailed Trace

### Request arrives at API endpoint:
```
POST /api/wa-sender/messages HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMzQ1In0...
```

### Endpoint extracts JWT:
```typescript
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMzQ1In0..."
// Decode payload: { sub: 'user-12345' }
```

### Create authenticated client:
```typescript
const supabase = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } }
})
```

### Execute query:
```typescript
await supabase
    .from('wa_sender_messages')
    .select('*')
    .eq('user_id', 'user-12345')
```

### This translates to HTTP request to Supabase:
```
GET /rest/v1/wa_sender_messages?user_id=eq.user-12345 HTTP/1.1
Authorization: Bearer <token>
```

### Supabase receives request:
1. Decode JWT → extract user_id = 'user-12345'
2. Pass to PostgreSQL: `auth.uid() = 'user-12345'`
3. Execute query with RLS context

### PostgreSQL executes with RLS:
```sql
SELECT * FROM wa_sender_messages
WHERE user_id = 'user-12345'  -- application filter
AND auth.uid() = user_id       -- RLS policy filter
```

### Result: Only authorized rows returned:
```json
{
  "data": [
    { "id": "msg-1", "user_id": "user-12345", "content": "...", "created_at": "..." }
  ]
}
```

---

## Verification Commands

### Verify Layer 1: JWT extraction in endpoint
```bash
# Endpoint should extract JWT from Authorization header
grep -n "authorization\|Authorization" app/api/wa-sender/messages/route.ts
# Expected: finds .get('authorization') or similar
```

### Verify Layer 2: Authenticated client creation
```bash
# Check client includes JWT in headers
grep -n "global.*headers\|Authorization.*Bearer" app/api/wa-sender/messages/route.ts
# Expected: creates client with JWT in headers
```

### Verify Layer 3: Query construction
```bash
# Check application includes user filter
grep -n "eq.*user_id\|\.eq(" app/api/wa-sender/messages/route.ts
# Expected: query includes .eq('user_id', ...) filter
```

### Verify Layer 4: RLS policy existence
```bash
# Check RLS policy on table
psql "$SUPABASE_URL" << EOF
SELECT tablename, policyname, cmd, permissive
FROM pg_policies
WHERE tablename = 'wa_sender_messages'
ORDER BY cmd;
EOF
# Expected: 4 policies (SELECT, INSERT, UPDATE, DELETE) all using auth.uid() = user_id
```

### Verify Layer 5: RLS enabled
```bash
# Check RLS is enabled on table
psql "$SUPABASE_URL" -c "SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'wa_sender_messages';"
# Expected: rowsecurity = true
```

---

## Multi-Tenant Pattern: Cache Keys

When implementing multi-tenant caching, include tenant_id in the key:

```typescript
// ❌ WRONG: Cache key doesn't include user_id
const key = `messages:${page}`
// Two users with page=1 share the same cache slot!

// ✅ RIGHT: Cache key includes user_id
const key = `messages:user-${userId}:page-${page}`
// Each user has isolated cache slot
```

**Why:** Cache key construction is a common place for cross-tenant leaks when user_id is omitted.

---

## Common Verification Checklist

- [ ] JWT is extracted from Authorization header
- [ ] JWT is passed to Supabase client in global headers
- [ ] Query includes `.eq('user_id', userId)` filter
- [ ] RLS policy exists: `auth.uid() = user_id`
- [ ] RLS is enabled on table: `rowsecurity = true`
- [ ] 4 RLS policies exist (SELECT/INSERT/UPDATE/DELETE)
- [ ] Cache keys include user_id dimension
- [ ] No direct SQL construction (use Supabase client)

## Related Files

- `supabase/migrations/` — RLS policy definitions
- `.claude/skills/project/supabase-deployment-patterns/` — migration and RLS patterns
- `workspaces/page-modernization/04-validate/DATAFLOW_RLS_AUDIT.md` — complete audit of WA Sender message history flow
