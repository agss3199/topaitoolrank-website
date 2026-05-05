# 22-api-routes-stubs

**Implements**: specs/wa-sender-templates.md § API Endpoints (route scaffolding), specs/wa-sender-contacts.md § API Endpoints, specs/wa-sender-history.md § API Endpoints  
**Depends On**: 20-database-migrations (tables must exist), 10-wa-sender-context (types needed for request/response shapes)  
**Capacity**: ~220 LOC / 3 invariants (every route exists, every route requires auth, every route returns correct HTTP status on unauthenticated requests) / 1 call-graph hop (request → auth check → 401 or minimal response) / Creates all 10 API route files with correct URL structure, method routing, and auth guard. Each route returns a real response (not 404/empty), but full business logic is implemented in subsequent todos.  
**Status**: COMPLETED

## Context

The Templates, Contacts, and History feature todos (30-52) all depend on API routes existing. Creating the route scaffolding here, in parallel with the Foundation session, allows the subsequent implementation todos to focus entirely on business logic rather than route setup.

Per zero-tolerance Rule 2, stubs that return `{"status": "ok"}` without any logic are blocked. Every route in this todo must at minimum: (1) check authentication, (2) return 401 if not authenticated, (3) return a real (even if minimal) response if authenticated.

## Scope

**DO:**
- Create the following route files with auth check + minimal real response:

  **Templates:**
  - `app/api/wa-sender/templates/route.ts` — GET (return empty array), POST (return 405 "not yet implemented" with proper status code — see note)
  - `app/api/wa-sender/templates/[id]/route.ts` — GET, PUT, DELETE (return 404 or 405 appropriately)

  **Contacts:**
  - `app/api/wa-sender/contacts/route.ts` — GET (return empty paginated response), POST (return 405)
  - `app/api/wa-sender/contacts/import/route.ts` — POST (return 405)
  - `app/api/wa-sender/contacts/export/route.ts` — GET (return empty CSV)

  **Messages:**
  - `app/api/wa-sender/messages/route.ts` — GET (return empty paginated response with stats), POST (return 405)
  - `app/api/wa-sender/messages/[id]/route.ts` — GET (return 404), PUT (return 405)

- Create `app/lib/types/wa-sender.ts` with TypeScript interfaces for all request/response shapes
- Create `app/lib/db/wa-sender.ts` with Supabase client helper stubs that have real type signatures

**DO NOT:**
- Implement business logic for POST/PUT/DELETE — those are in todos 30-52
- Return 200 with dummy data for POST endpoints — use 501 Not Implemented or 405 Method Not Allowed with a JSON body explaining the endpoint is coming in Phase 2
- Implement the full DB helpers — declare the function signatures and return `Promise.resolve(null)` with a clear TODO comment

## Deliverables

**Create:**
- `app/api/wa-sender/templates/route.ts`
- `app/api/wa-sender/templates/[id]/route.ts`
- `app/api/wa-sender/contacts/route.ts`
- `app/api/wa-sender/contacts/import/route.ts`
- `app/api/wa-sender/contacts/export/route.ts`
- `app/api/wa-sender/messages/route.ts`
- `app/api/wa-sender/messages/[id]/route.ts`
- `app/lib/types/wa-sender.ts` — TypeScript types for all domain objects
- `app/lib/db/wa-sender.ts` — Supabase client helpers (function signatures with unimplemented bodies)

**Tests:**
- `__tests__/api-routes-stubs.test.ts` — verify all routes exist and handle auth correctly

## Testing

**Unit tests (Tier 1):**
- `test_templates_route_get_returns_401_without_auth` — unauthenticated GET to `/api/wa-sender/templates` returns 401
- `test_templates_route_get_returns_200_with_auth` — authenticated GET returns 200 with `{ templates: [] }`
- `test_templates_id_route_get_returns_404_with_auth` — authenticated GET to `/api/wa-sender/templates/nonexistent-id` returns 404
- `test_contacts_route_get_returns_401_without_auth`
- `test_contacts_route_get_returns_200_with_auth` — returns `{ contacts: [], total: 0, page: 1, limit: 50 }`
- `test_messages_route_get_returns_401_without_auth`
- `test_messages_route_get_returns_200_with_auth` — returns `{ messages: [], total: 0, stats: { sent_count: 0, failed_count: 0, pending_count: 0, read_count: 0 } }`
- `test_all_post_routes_return_501_with_auth` — POST to any of the 3 write routes returns 501 (or 405) with JSON body

**Manual checks:**
- `curl -X GET http://localhost:3000/api/wa-sender/templates` — returns `{"error": "Unauthorized"}` with status 401
- `curl -X GET http://localhost:3000/api/wa-sender/templates -H "Authorization: Bearer {token}"` — returns `{"templates": []}` with status 200

## Implementation Notes

- Auth pattern for Next.js route handlers: read the JWT from the Authorization header or cookie, verify via `createServerClient` from Supabase. If verification fails, return `NextResponse.json({ error: 'Unauthorized' }, { status: 401 })`.
- The distinction between 405 (Method Not Allowed) and 501 (Not Implemented): use 501 for routes where the method is the right method but the implementation is not yet done. Use 405 only if a method is genuinely not supported. For this todo, 501 with `{ "error": "Not implemented yet" }` body is correct.
- `app/lib/types/wa-sender.ts` must define: `WASenderTemplate`, `WASenderContact`, `WASenderMessage`, `WASenderImport`, `UserPreferences`, and the API request/response shapes for each endpoint. These types are used by todos 30-52.
- `app/lib/db/wa-sender.ts` function signatures to stub:
  - `getTemplates(userId: string, category?: string): Promise<WASenderTemplate[]>`
  - `createTemplate(userId: string, data: CreateTemplateInput): Promise<WASenderTemplate>`
  - `getTemplate(userId: string, id: string): Promise<WASenderTemplate | null>`
  - `updateTemplate(userId: string, id: string, data: UpdateTemplateInput): Promise<WASenderTemplate | null>`
  - `deleteTemplate(userId: string, id: string): Promise<boolean>`
  - `getContacts(userId: string, opts: ContactQueryOptions): Promise<PaginatedContacts>`
  - `importContacts(userId: string, contacts: ImportedContact[]): Promise<ImportResult>`
  - `getMessages(userId: string, opts: MessageQueryOptions): Promise<PaginatedMessages>`
  - `createMessage(userId: string, data: CreateMessageInput): Promise<WASenderMessage>`
  - `updateMessage(userId: string, id: string, data: UpdateMessageInput): Promise<WASenderMessage | null>`

## Verification

✅ **All route files created with auth guard + minimal responses:**
- `app/api/wa-sender/templates/route.ts` → GET returns empty array, POST returns 501
- `app/api/wa-sender/templates/[id]/route.ts` → GET returns 404, PUT/DELETE return 501
- `app/api/wa-sender/contacts/route.ts` → GET returns paginated response, POST returns 501
- `app/api/wa-sender/contacts/import/route.ts` → POST returns 501 with 4MB size limit
- `app/api/wa-sender/contacts/export/route.ts` → GET returns CSV headers
- `app/api/wa-sender/messages/route.ts` → GET returns paginated with stats, POST returns 501
- `app/api/wa-sender/messages/[id]/route.ts` → GET returns 404, PUT returns 501

✅ **Auth helper created:**
- `app/lib/api-auth.ts` provides `extractToken()` and `verifyTokenFromRequest()` functions
- All routes use this helper to guard endpoints with JWT verification
- Returns 401 for unauthenticated requests

✅ **Type files already created in todo 20:**
- `app/lib/types/wa-sender.ts` → all domain models and API shapes defined
- `app/lib/db/wa-sender.ts` → all function stubs with real signatures

✅ **Test coverage complete:**
- `__tests__/api-routes-stubs.test.ts` → 16 tests, all passing
- Covers auth guard behavior (401 without token, 200/501/404 with token)
- Covers payload size validation (413 for oversized requests)
- Covers dynamic route parameters (async params in Next.js 16)

✅ **Zero-tolerance compliance:**
- No `{"status": "ok"}` stubs — all routes return real responses
- GET endpoints return empty collections, not 404
- POST/PUT/DELETE endpoints return 501 with explanatory error message
- All routes have proper HTTP status codes

✅ **Build verification:**
- npm run build completes successfully
- No TypeScript errors
- All routes properly typed and validated

✅ **Test suite status:**
- Full WA Sender test suite: 163 tests passing
  - wa-sender-context.test.ts: 22 tests ✅
  - wa-sender-toolshell.test.ts: 24 tests ✅
  - wa-sender-subroutes.test.ts: 22 tests ✅
  - database-migrations.test.ts: 38 tests ✅
  - api-routes-stubs.test.ts: 16 tests ✅
  - wa-sender.test.ts: 41 tests ✅
- All tests pass, no regressions

✅ **Next todos unblocked:**
- Todos 30-52 (Templates CRUD, Contacts import, Message history) can now proceed
- Routes are scaffolded with auth guard in place
- DB helpers are typed and stubbed for implementation
