# Todo: Wire WA Sender to Auth System & Real Data (No Mock Data)

**Status:** Pending  
**Implements:** specs/authentication.md, specs/tool-architecture.md §Tool Data Isolation  
**Dependencies:** Item 01 (auth), Item 06 (WA Sender components)  
**Blocks:** Item 10 (testing)  
**Capacity:** Single session (~350 LOC)  

## Description

Wire WA Sender components to real data sources. Create API routes that read/write to WA Sender database tables. All API routes validate JWT `tool_id` claim. Replace all mock data generators with real API calls. Ensure database schema includes `user_id` and `tool_id` columns for data isolation.

## Implementation

1. **Create API routes** (`app/tools/wa-sender/api/`):
   - `GET /api/wa-sender/conversations` — fetch user's conversations (filtered by user_id AND tool_id)
   - `POST /api/wa-sender/conversations/{id}/messages` — create message
   - `GET /api/wa-sender/templates` — fetch user's templates
   - `POST /api/wa-sender/templates` — create template
   - `PATCH /api/wa-sender/templates/{id}` — update template
   - `DELETE /api/wa-sender/templates/{id}` — delete template
   - Each route: validates JWT in Authorization header, checks `tool_id === 'wa-sender'`, filters by `user_id` AND `tool_id`

2. **Update database schema:**
   - Verify tables exist: `wa_sender_conversations`, `wa_sender_messages`, `wa_sender_templates`
   - Each table has `user_id` and `tool_id` columns
   - `tool_id` has DEFAULT 'wa-sender'
   - Unique key: `(user_id, tool_id, id)`
   - Indexes on `(user_id, tool_id)` for fast queries
   - Run migration: `npm run migrate:prod` (creates tables if not exist)

3. **Wire components to API:**
   - `WASenderDashboard.tsx` calls `GET /api/wa-sender/conversations` on mount
   - `MessageComposer.tsx` calls `POST /api/wa-sender/conversations/{id}/messages` on send
   - `TemplateManager.tsx` calls `GET /api/wa-sender/templates` on mount, renders real templates
   - All data fetching uses `fetch()` with Authorization header

4. **Remove all mock data:**
   - Delete any `generateMock*()` functions
   - Delete any `MOCK_*` or `FAKE_*` constants
   - Delete any hardcoded sample data arrays
   - Grep verify: no `generateConversations`, `mockTemplates`, etc.

## Acceptance Criteria

- [ ] All API routes exist and return real data (not mock)
- [ ] API routes validate JWT token and `tool_id` claim
- [ ] Database tables exist with `user_id` and `tool_id` columns
- [ ] Database queries filter by both `user_id` AND `tool_id` (no cross-user leakage)
- [ ] Components fetch from real API (no `fetch()` calls return hardcoded data)
- [ ] No `generateMock*` functions remain in codebase
- [ ] No `MOCK_*` or `FAKE_*` constants remain
- [ ] All tests pass: `npm run test`
- [ ] Local dev shows real data (or test user's data if seeded)
- [ ] Grep verify: no "mock", "fake", "dummy" in production code

## Testing

```bash
# Test API returns data
curl -H "Authorization: Bearer <wa-sender-token>" \
  http://localhost:3000/api/wa-sender/conversations
# Returns: [{ id: "...", user_id: "...", tool_id: "wa-sender", ... }]

# Test data is filtered by user_id + tool_id
# Create test user A, test user B
# User A logs in, creates conversation
# User B logs in, calls GET /api/wa-sender/conversations
# Should return empty array (not User A's data)

# Test wrong tool_id is rejected
# Create wa-sender token
# Try: curl -H "Authorization: Bearer <wa-sender-token>" \
#       http://localhost:3000/api/tool-b/data
# Returns: 401 Unauthorized

# Test no mock data remains
grep -r "MOCK_\|FAKE_\|generateMock\|generateFake" app/tools/wa-sender/
# Should return NOTHING
```

