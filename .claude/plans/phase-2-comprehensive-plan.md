# Phase 2 Plan: WA Sender Enhancement + Blog Scalability

**Status**: Ready for `/todos` approval gate

**Scope**: Both Track A (WA Sender) and Track B (Blog) running in parallel

**Complexity**: Moderate (14/20) — low governance risk, medium strategic risk, medium technical risk

---

## Executive Summary

Phase 2 has two independent work tracks:

### Track A: WA Sender Enhancement (3-4 sessions)
Restructure monolithic 938-line component into a multi-route tool with ToolShell integration. Add persistent templates, contacts, and send history. No new external dependencies. Builds on Phase 1 auth + registry foundation.

### Track B: Blog Scalability (1-2 sessions)
Add tag/category index pages, RSS feed, and build-time search index. Leverages existing MDX pipeline. Zero database changes. Pure file-based content system.

**Why parallel?** Zero data dependencies, separate route groups, different skill sets (state management for A, static generation for B).

---

## Phase 2A: Blog Scalability (Start First — Lower Risk)

**Effort**: ~1 session  
**Risk**: Low (additive, no breaking changes)  
**Dependencies**: None on Phase 2C

### Deliverables

1. **Tag Index Pages** (`/blogs/tag/[tag]`)
   - `generateStaticParams` for all unique tags
   - Filtered post list per tag
   - JSON-LD CollectionPage schema
   - Canonical links
   - Tests: `test_tag_pages_generate_correctly`, `test_tag_filters_posts`

2. **Category Index Pages** (`/blogs/category/[category]`)
   - `generateStaticParams` for all categories
   - Filtered post list per category
   - JSON-LD CollectionPage schema
   - Tests: `test_category_pages_generate_correctly`

3. **RSS Feed** (`/feed.xml`)
   - Valid RSS 2.0 output
   - All published posts (status="published" only)
   - Linked in `<head>` of all pages
   - Tests: `test_rss_feed_generates`, `test_rss_validates_schema`

4. **Search Index**
   - Build-time JSON generation (`public/search-index.json`)
   - Client-side Fuse.js fuzzy search
   - Search results link to posts
   - Tests: `test_search_index_generated`, `test_fuzzy_search_finds_posts`

5. **Sitemap Updates**
   - Add tag/category pages to sitemap
   - Correct priorities (0.8 for collections, 0.9 for posts)
   - Tests: `test_sitemap_includes_tag_pages`

### Files to Create/Modify

**Create:**
- `app/(blog)/tag/[tag]/page.tsx`
- `app/(blog)/category/[category]/page.tsx`
- `app/feed.xml/route.ts`
- `app/lib/search-index.ts`
- `app/components/BlogSearch.tsx`
- `__tests__/blog-indexing.test.ts`

**Modify:**
- `app/lib/blog.ts` (add search index generation to build pipeline)
- `app/sitemap.ts` (add tag/category pages)
- `app/layout.tsx` (add feed link + search component)
- `next.config.ts` (no changes needed, ISR already works)
- `package.json` (add `fuse.js` dependency)

### Success Criteria

- [ ] `/blogs/tag/ai-agents` returns static HTML with all posts tagged "ai-agents"
- [ ] `/blogs/category/tutorial` returns static HTML with all tutorial posts
- [ ] `/feed.xml` is valid RSS 2.0 (validate with W3C RSS Validator)
- [ ] `public/search-index.json` is generated at build time
- [ ] BlogSearch component loads index, filters on keystroke, shows results
- [ ] Sitemap includes all tag/category pages
- [ ] No regression in existing blog listing, article pages, or search
- [ ] All new tests pass

---

## Phase 2C: WA Sender Enhancement (Start After 2A Foundation)

**Effort**: ~3-4 sessions  
**Risk**: Medium (state management refactor)  
**Dependencies**: None on 2B

### 2C-Foundation: Architecture & State Setup (Session 1)

**Goal**: Refactor monolithic WA Sender into sub-routes with shared state, backwards compatible with Phase 1.

**Deliverables**:

1. **React Context for Shared State**
   - `WASenderContext` with session, send workflow, UI state
   - `useWASender()` hook for sub-routes
   - Tests: `test_context_provider_initializes`, `test_use_wa_sender_hook`

2. **Layout Integration with ToolShell**
   - `app/tools/wa-sender/layout.tsx` wraps in `<ToolShell>`
   - Auth guard at layout level
   - Navigation reads from manifest
   - Tests: `test_layout_renders_tool_shell`, `test_auth_guard_blocks_anonymous`

3. **Sub-Route Structure**
   - Create routes: dashboard, messages, templates, settings
   - Each route is a fully-functional page (no empty stubs)
   - Contacts accessed within Dashboard (receiver selection), not as separate route
   - Each route lazy-loads via Next.js code splitting
   - Navigation between routes preserves context
   - Tests: `test_context_persists_across_routes`

4. **Session Persistence**
   - Existing sessions load on mount
   - Auto-save to Supabase every 500ms (context changes trigger save)
   - localStorage keys unchanged (backwards compat)
   - Tests: `test_existing_session_loads`, `test_auto_save_fires`

5. **Dashboard Component** (core send workflow)
   - Extract from current `page.tsx`
   - Consume context (file, columns, recipients, selectedTemplate, selectedContacts)
   - All current features work (Excel upload, validation, send, export)
   - Tests: `test_dashboard_upload_parse_send` (integration test)

**Files to Create/Modify**:

**Create:**
- `app/tools/wa-sender/layout.tsx`
- `app/tools/wa-sender/context.ts`
- `app/tools/wa-sender/page.tsx` (refactored — Dashboard with send workflow)
- `app/tools/wa-sender/messages/page.tsx` (minimal: 404 or redirect, fully implemented in 2C-History)
- `app/tools/wa-sender/templates/page.tsx` (minimal: 404 or redirect, fully implemented in 2C-Templates)
- `app/tools/wa-sender/settings/page.tsx` (minimal: 404 or redirect, fully implemented in 2C-Foundation)
- `__tests__/wa-sender-refactor.test.ts`

**Note**: Minimal pages return 404 with "Coming soon" or redirect to Dashboard. They are not empty stubs — they are real pages with error states. Full functionality lands in subsequent sessions (2C-Templates, 2C-Contacts, 2C-History).

**Modify:**
- `app/tools/wa-sender/wa-sender.css` (adjust for new layout if needed)
- `lib/useAuth.ts` (refactor to accept `toolId` parameter)
- `app/tools/wa-sender/tool.manifest.json` (no changes, already declares nav items)

**Files to Remove:**
- Old `app/tools/wa-sender/[slug]/page.tsx` (if it exists; replaced by new sub-routes)

**Success Criteria**:

- [ ] ToolShell renders with WA Sender nav items
- [ ] Navigation between tabs (Dashboard, Messages, Templates, Contacts, Settings) works
- [ ] Dashboard tab shows the send workflow (looks like Phase 1, functions same)
- [ ] Context persists file/columns/template selection across navigation
- [ ] Session auto-saves on context changes
- [ ] Existing sessions load on first visit
- [ ] Code splitting works (check browser Network tab: messages.js, templates.js lazy-loaded)
- [ ] No localStorage key changes
- [ ] All tests pass
- [ ] No regression in send workflow

**Risk Mitigation**: Gradual extraction. Keep Dashboard functional first, stubs for other routes. Validate backwards compat with existing session reload test.

---

### 2C-Database: Schema & Migrations (Session 2, Parallel with 2C-Foundation)

**Goal**: Create Supabase tables for templates, contacts, messages, imports with RLS policies.

**Deliverables**:

1. **Database Migration**
   - Create tables: `wa_sender_templates`, `wa_sender_contacts`, `wa_sender_messages`, `wa_sender_imports`
   - Add indexes on user_id, phone, email, sent_at, status
   - Add check constraints (status values, length limits)
   - Tests: `test_migration_succeeds`, `test_tables_created_with_correct_schema`

2. **RLS Policies**
   - All tables enforce user_id filter on SELECT/INSERT/UPDATE/DELETE
   - No cross-user data access possible
   - Tests: `test_rls_blocks_cross_user_read`, `test_rls_allows_own_data`

3. **API Routes (Stubs)**
   - Create route handlers (empty or with error responses for now)
   - `/api/wa-sender/templates` (GET, POST, PUT, DELETE)
   - `/api/wa-sender/contacts` (GET, POST)
   - `/api/wa-sender/contacts/import` (POST)
   - `/api/wa-sender/contacts/export` (GET)
   - `/api/wa-sender/messages` (GET, POST, PUT)
   - Tests: `test_api_routes_exist`, `test_endpoints_require_auth`

4. **Database Client Utilities**
   - TypeScript types for all tables
   - Supabase client helpers (readTemplates, createTemplate, etc.)
   - Tests: `test_types_compile`, `test_database_helpers_connect`

**Files to Create/Modify**:

**Create:**
- `supabase/migrations/[timestamp]_phase_2_wa_sender_tables.sql`
- `app/lib/types/wa-sender.ts` (TypeScript types)
- `app/lib/db/wa-sender.ts` (Supabase client helpers)
- `app/api/wa-sender/templates/route.ts` (GET, POST)
- `app/api/wa-sender/templates/[id]/route.ts` (GET, PUT, DELETE)
- `app/api/wa-sender/contacts/route.ts` (GET, POST)
- `app/api/wa-sender/contacts/import/route.ts` (POST)
- `app/api/wa-sender/contacts/export/route.ts` (GET)
- `app/api/wa-sender/messages/route.ts` (GET, POST)
- `app/api/wa-sender/messages/[id]/route.ts` (GET, PUT)
- `__tests__/wa-sender-database.test.ts`

**Modify:**
- `.env.example` (add any new env vars if needed)

**Success Criteria**:

- [ ] Migrations run without errors
- [ ] Tables exist in Supabase with correct schema
- [ ] RLS policies are enabled and tested
- [ ] All API routes exist and return 200 (or 401 if not auth'd)
- [ ] TypeScript types compile
- [ ] Database helpers connect to Supabase
- [ ] RLS test proves cross-user queries are blocked
- [ ] All tests pass

**Parallel with 2C-Foundation?** YES. Database work is independent of frontend refactor. Both can proceed in parallel.

---

### 2C-Templates: Full CRUD (Session 3)

**Goal**: Implement message templates feature fully — storage, API, UI.

**Deliverables**:

1. **API Implementation** (wa-sender-templates.md)
   - GET /api/wa-sender/templates (list with optional filtering)
   - POST /api/wa-sender/templates (create, validate, extract variables)
   - GET /api/wa-sender/templates/:id (fetch single)
   - PUT /api/wa-sender/templates/:id (update, re-extract variables)
   - DELETE /api/wa-sender/templates/:id (delete)
   - Tests: `test_create_template_validates_input`, `test_delete_template_forbidden_for_other_user`

2. **Templates Page** (`app/tools/wa-sender/templates/page.tsx`)
   - List all templates (paginated table)
   - Create form with live variable extraction
   - Edit modal for existing templates
   - Delete with confirmation
   - Search/filter by category
   - Tests: `test_template_list_renders`, `test_create_form_extracts_variables`

3. **Template Selection in Dashboard**
   - Modal to select saved template
   - Populate content into send workflow
   - Store selected template ID in context
   - Tests: `test_select_template_populates_content`

4. **Variable Substitution**
   - When sending with template, variables substituted from contact data
   - Missing variables left as-is (don't error)
   - Tests: `test_variable_substitution_replaces_variables`, `test_missing_variable_left_as_is`

**Files to Create/Modify**:

**Create:**
- `app/tools/wa-sender/templates/page.tsx` (full list + CRUD UI)
- `app/tools/wa-sender/templates/[id]/edit/page.tsx` (edit modal)
- `app/components/TemplateModal.tsx` (reusable template selector)
- `app/lib/templates.ts` (variable extraction logic)
- `__tests__/wa-sender-templates.test.ts`

**Modify:**
- `app/api/wa-sender/templates/route.ts` (full implementation)
- `app/api/wa-sender/templates/[id]/route.ts` (full implementation)
- `app/tools/wa-sender/context.ts` (add selectedTemplate state)
- `app/tools/wa-sender/page.tsx` (Dashboard: add "Select Template" button)

**Success Criteria**:

- [ ] List page shows all user's templates
- [ ] Create form validates name uniqueness, extracts variables correctly
- [ ] Variables in content like {name}, {company} are extracted to array
- [ ] Invalid syntax like {123} or {name with spaces} rejected
- [ ] Edit modal pre-populates with current values
- [ ] Delete requires confirmation, actually deletes from Supabase
- [ ] Template selection modal appears on Dashboard "Select Template" click
- [ ] Selected template content populates message field
- [ ] Variable substitution works (template + contact data = final message)
- [ ] All tests pass
- [ ] No regression in Dashboard send workflow

---

### 2C-Contacts: Full CRUD + Import (Session 3-4)

**Goal**: Implement contact management — storage, API, UI, import with deduplication.

**Deliverables**:

1. **API Implementation** (wa-sender-contacts.md)
   - GET /api/wa-sender/contacts (list with pagination, search, filter)
   - POST /api/wa-sender/contacts (create single contact)
   - POST /api/wa-sender/contacts/import (bulk import Excel with deduplication)
   - GET /api/wa-sender/contacts/export (download CSV or Excel)
   - DELETE /api/wa-sender/contacts/:id (delete)
   - Tests: `test_import_deduplicates_by_phone`, `test_export_filters_correctly`

2. **Contacts Page** (`app/tools/wa-sender/contacts/page.tsx`)
   - List all contacts with pagination (50 per page)
   - Search by name, phone, email, company
   - Filter by import date
   - View contact details modal
   - Delete with confirmation
   - Export button (format selector: CSV / Excel)
   - Tests: `test_contacts_list_paginates`, `test_search_filters_contacts`

3. **Import Sub-Page** (`app/tools/wa-sender/contacts/import/page.tsx`)
   - File upload (Excel/CSV)
   - Column mapping UI (auto-detect, manual override)
   - Deduplication toggle (enabled by default)
   - Progress bar during import
   - Error summary post-import
   - Import history list
   - Tests: `test_import_reads_excel`, `test_deduplication_merges_duplicates`

4. **Phone Normalization**
   - Normalize all phone numbers to E.164 format
   - Support multiple country codes
   - Store both original and normalized (if needed)
   - Tests: `test_phone_normalization_converts_to_e164`

5. **Contact Selection in Dashboard**
   - "Select Contacts" button opens modal with paginated contact list
   - Checkboxes to select multiple
   - "Use Selected" populates Dashboard send list
   - Store selected contact IDs in context
   - Tests: `test_contact_selection_populates_dashboard`

**Files to Create/Modify**:

**Create:**
- `app/tools/wa-sender/contacts/page.tsx` (full list UI + CRUD)
- `app/tools/wa-sender/contacts/import/page.tsx` (import form + progress)
- `app/components/ContactModal.tsx` (reusable contact selector)
- `app/lib/contacts.ts` (phone normalization, deduplication logic)
- `app/lib/excel.ts` (Excel parsing utility, reuse from Phase 1)
- `__tests__/wa-sender-contacts.test.ts`

**Modify:**
- `app/api/wa-sender/contacts/route.ts` (full implementation)
- `app/api/wa-sender/contacts/import/route.ts` (full implementation)
- `app/api/wa-sender/contacts/export/route.ts` (full implementation)
- `app/tools/wa-sender/context.ts` (add selectedContacts state)
- `app/tools/wa-sender/page.tsx` (Dashboard: add "Select Contacts" button, populate send list)

**Success Criteria**:

- [ ] Contact list paginates correctly (50 per page)
- [ ] Search filters by name, phone, email, company (case-insensitive)
- [ ] Import reads Excel, validates phone/email presence
- [ ] Deduplication merges contacts by phone number
- [ ] Phone numbers normalized to E.164 (e.g., +1-555-123-4567)
- [ ] Custom fields (arbitrary columns) stored in JSONB
- [ ] Import history shows file name, row count, import date
- [ ] Export downloads CSV or Excel with selected contacts
- [ ] Contact selection modal allows multi-select
- [ ] Selected contacts populate Dashboard recipient list
- [ ] All tests pass
- [ ] No regression in Dashboard send workflow

**Complexity**: Higher than templates (import logic, deduplication, phone normalization). May require 1.5 sessions.

---

### 2C-History: Message Logging & Analytics (Session 4)

**Goal**: Implement send history — logging API calls, analytics dashboard, filtering.

**Deliverables**:

1. **API Implementation** (wa-sender-history.md)
   - GET /api/wa-sender/messages (list with pagination, filtering, date range, search)
   - POST /api/wa-sender/messages (log a send)
   - GET /api/wa-sender/messages/:id (fetch single message)
   - PUT /api/wa-sender/messages/:id (update status, mark as read)
   - Tests: `test_message_log_filters_by_status`, `test_stats_calculation_correct`

2. **Messages Page** (`app/tools/wa-sender/messages/page.tsx`)
   - Message list (paginated table)
   - Columns: recipient, channel, status, sent_at
   - Filters: status, channel, date range, template
   - Search by recipient name/phone/email
   - Sort by sent_at (default desc), status, channel
   - Analytics summary (top of page):
     - Total sent, Failed count, Failure rate, Read count
   - Row click expands to show full message content
   - Export filtered results as CSV
   - Tests: `test_message_list_renders`, `test_analytics_calculated_correctly`

3. **Message Logging in Dashboard**
   - After successful send, call POST /api/wa-sender/messages
   - On error, set status to "failed" with error_message
   - Tests: `test_send_logs_message_to_history`

4. **Retry Flow**
   - Failed messages can be retried from Messages tab
   - Reselect failed message recipients, resend
   - Creates new message log entry (not updated)
   - Tests: `test_retry_creates_new_message_log`

**Files to Create/Modify**:

**Create:**
- `app/tools/wa-sender/messages/page.tsx` (full list UI + analytics)
- `__tests__/wa-sender-history.test.ts`

**Modify:**
- `app/api/wa-sender/messages/route.ts` (full implementation)
- `app/api/wa-sender/messages/[id]/route.ts` (full implementation)
- `app/tools/wa-sender/page.tsx` (Dashboard: call POST /api/wa-sender/messages after send)

**Success Criteria**:

- [ ] Message list paginates correctly (50 per page)
- [ ] Filters work: status, channel, date range, template
- [ ] Search filters by recipient name/phone/email
- [ ] Analytics cards show correct numbers (sent, failed, read, failure rate)
- [ ] Row click expands to show full message content
- [ ] Export downloads CSV with selected messages
- [ ] Send in Dashboard logs message with status "sent"
- [ ] Failed sends log message with status "failed" + error message
- [ ] Failed message retry creates new log entry
- [ ] All tests pass
- [ ] No regression in Dashboard send workflow

---

## Critical Fixes from Red Team Validation

### Manifest Schema Alignment
- **Issue**: Manifest uses `"navigation"` field with `"href"` (not `"nav_items"` with `"path"`)
- **Fix**: Specs updated; implementation must read `manifest.navigation` and use `href` values
- **Manifest also declares** `wa_sender_conversations` table but all specs use `wa_sender_messages`. Implementation should use `wa_sender_messages` (conversations deferred to Phase 3).

### localStorage Key Correction
- **Issue**: Spec incorrectly claimed key was `wa_sender_session_id`; actual is `wa-sender-session-${userId}` (hyphenated, user-scoped)
- **Fix**: Spec corrected; implementation must use the user-scoped hyphenated key for backwards compatibility

### Blog Category List Updated
- **Issue**: Spec defined 7 new categories but existing content uses "AI Tools" and "Development"
- **Fix**: Category list expanded to include existing categories; all posts will continue to work

### Database RLS Completeness
- **Issue**: `user_preferences` missing ENABLE RLS and INSERT/DELETE policies; `wa_sender_imports` missing INSERT policy
- **Fix**: All policies added; migration SQL will be complete

### `getAllPosts()` Interface Change
- **Issue**: Blog specs assume async (`await getAllPosts()`) but existing code is synchronous
- **Fix**: This is a deliberate breaking change. Implementation should make `getAllPosts()` async. Required because tag/category generation at build time needs to enumerate all posts.

### user_preferences Scope Clarification
- **Issue**: "Optional, Phase 2+" language was ambiguous
- **Fix**: Settings page (line 175-183 in wa-sender-core.md) saves to user_preferences. It is a Phase 2 deliverable if Settings page is implemented.

---

## Implementation Notes & Assumptions

### Phase 2A Assumptions
- Blog content volume stays low (<100 posts) — filesystem scanning is fast
- Static generation at build time acceptable (rebuilds ~10-30s)
- No database needed for blog (Markdown + frontmatter only)

### Phase 2C Assumptions
- Supabase RLS policies are sufficient for user isolation (no additional auth in code)
- Phone number library (`libphonenumber-js` or similar) available and battle-tested
- Excel parsing reuses Phase 1 logic (xlsx library already in package.json)
- WhatsApp Web integration stays client-side (wa.me links, no API)
- Message status "sent" is best-effort (user confirms sending via UI link, not webhook)

### Risk Mitigation
- **2C-Foundation priority**: Validate context + backwards compat before adding features
- **2C-Database parallel**: No conflict with frontend work
- **2C-Templates + Contacts sized carefully**: Each session-sized (≤500 LOC load-bearing logic)
- **Session auto-save**: Existing logic + context changes trigger save automatically
- **No schema changes**: Only new tables, no migration of existing data

### Backwards Compatibility
- localStorage keys unchanged (wa_sender_session_id)
- Existing sessions load automatically on first visit
- Dashboard sends work identically to Phase 1
- No breaking changes to tool registry or auth system

---

## Success Criteria (Phase 2 Overall)

**Blog (Track A)**:
- ✅ All tag/category pages generated and SEO-optimized
- ✅ RSS feed is valid and discoverable
- ✅ Search index built at build time, client-side fuzzy search works
- ✅ No regression in existing blog features

**WA Sender (Track B)**:
- ✅ ToolShell wraps WA Sender with working navigation
- ✅ Sub-routes lazy-load (code splitting verified)
- ✅ Context persists state across routes
- ✅ Session backwards compatible (existing sessions load)
- ✅ Templates CRUD fully functional
- ✅ Contacts CRUD + import + deduplication fully functional
- ✅ Send history logs and analytics fully functional
- ✅ Dashboard send workflow works identically to Phase 1
- ✅ All new API endpoints have auth guards + RLS enforcement
- ✅ All tests pass (unit + integration)

---

## Timeline Estimate (Autonomous Execution)

**Track B (Blog)**: ~1 session
**Track A Foundation**: ~1 session (parallel with B)
**Track A Database**: ~0.5 session (parallel with Foundation)
**Track A Templates**: ~1 session
**Track A Contacts**: ~1.5 sessions (complex import logic)
**Track A History**: ~1 session

**Total**: ~3-4 autonomous sessions (~3-4 business days in 24/7 autonomous mode)

**Critical path**: Blog first (lower risk, faster validation), then WA Sender Foundation in parallel with Database work.

---

## Approval Gate Checklist

Before moving to `/todos`:

- [ ] Specs complete and detailed (`specs/wa-sender-*.md`, `specs/blog-indexing.md`, `specs/database-schema.md`)
- [ ] Architecture ADRs documented (ToolShell integration, file-based blog)
- [ ] Risk register reviewed (no surprises)
- [ ] Dependencies identified (only internal, Phase 1 foundation)
- [ ] Backwards compatibility confirmed (existing sessions, localStorage keys)
- [ ] Feature scope finalized (essential vs. optional for Phase 2)
- [ ] No scope creep (scheduling, WhatsApp Business API deferred to Phase 3)
- [ ] All success criteria defined and testable

✅ **Ready for `/todos` phase**
