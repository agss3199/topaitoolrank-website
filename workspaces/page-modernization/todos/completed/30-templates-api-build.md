# 30-templates-api-build

**Implements**: specs/wa-sender-templates.md § API Endpoints (full implementation), § Variable Extraction, § Security & Permissions  
**Depends On**: 22-api-routes-stubs (route files must exist), 20-database-migrations (tables must exist), 21-database-rls-verification (RLS confirmed working)  
**Capacity**: ~250 LOC load-bearing logic / 5 invariants (variable extraction regex, name uniqueness per user, auth on every endpoint, 409 on duplicate name, RLS enforced at DB level) / 3 call-graph hops (route → validate → DB helper → Supabase) / Implements full CRUD business logic for the `/api/wa-sender/templates` routes: input validation, variable extraction, name uniqueness check, Supabase persistence, and correct HTTP status codes.  
**Status**: ACTIVE

## Context

The route scaffolding from todo 22 returns empty responses. This todo fills in the actual business logic. After this todo, the templates API is fully functional and the Templates UI (todo 31) can wire to real data.

Variable extraction is the key logic: the regex `/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g` must extract all valid placeholders from template content, deduplicate them, and reject invalid ones (e.g., `{123}`, `{name with spaces}`).

## Scope

**DO:**
- Implement `GET /api/wa-sender/templates` — query Supabase for all user's templates; optional `?category=` filter; return array sorted by `created_at` DESC
- Implement `POST /api/wa-sender/templates` — validate input (name required, max 100; content required, max 1000; optional description max 500; optional category from predefined list); extract variables from content; insert to Supabase; return 201 with new record
- Implement `GET /api/wa-sender/templates/:id` — fetch single template; return 404 if not found (RLS already scopes to user)
- Implement `PUT /api/wa-sender/templates/:id` — validate input; re-extract variables from new content; update; return 200 or 404
- Implement `DELETE /api/wa-sender/templates/:id` — delete; return 204 or 404
- Implement `extractVariables(content: string): string[]` in `app/lib/templates.ts` — regex extraction + deduplication + validation (reject invalid patterns)
- Implement `validateTemplateCategory(category: string | undefined): boolean` — check against predefined list
- Handle 409 Conflict when name already exists for user (unique constraint violation from Supabase)
- Fully implement all `app/lib/db/wa-sender.ts` template helper functions

**DO NOT:**
- Implement variable substitution (that is todo 32, during Dashboard wiring)
- Build the UI component (todo 31)
- Add template version history (Phase 3)
- Allow more template categories than the 7 defined in the spec

## Deliverables

**Modify:**
- `app/api/wa-sender/templates/route.ts` — full GET, POST implementation
- `app/api/wa-sender/templates/[id]/route.ts` — full GET, PUT, DELETE implementation
- `app/lib/db/wa-sender.ts` — implement template helper functions (was stubbed in todo 22)

**Create:**
- `app/lib/templates.ts` — `extractVariables()` and `validateTemplateCategory()` functions

**Tests:**
- `__tests__/wa-sender-templates-api.test.ts` — unit tests for API business logic

## Testing

**Unit tests (Tier 1):**
- `test_extract_variables_finds_valid_placeholders` — `extractVariables("Hi {name}, code {promo_code}")` returns `["name", "promo_code"]`
- `test_extract_variables_deduplicates` — `extractVariables("{name} and {name} again")` returns `["name"]` (not duplicated)
- `test_extract_variables_rejects_invalid_syntax` — `"Hi {123}"` raises validation error; `"Hi {name with spaces}"` raises validation error
- `test_extract_variables_valid_underscore` — `"{first_name}"` is valid; returns `["first_name"]`
- `test_create_template_returns_201` — POST with valid body returns 201 with `id` and `variables` fields
- `test_create_template_returns_400_missing_name` — POST without `name` returns 400
- `test_create_template_returns_400_content_too_long` — POST with content > 1000 chars returns 400
- `test_create_template_returns_409_duplicate_name` — POST with duplicate name for same user returns 409
- `test_delete_template_returns_204` — DELETE existing template returns 204
- `test_delete_template_returns_404_for_nonexistent` — DELETE non-existent ID returns 404
- `test_get_templates_filters_by_category` — GET with `?category=promotional` returns only promotional templates
- `test_update_template_re_extracts_variables` — PUT with new content re-runs variable extraction; `variables` in response reflects new content

**Integration check (Tier 2):**
- `test_templates_api_full_crud_cycle` — create → list → get → update → delete, verify state at each step via read-back

## Implementation Notes

- Variable extraction regex: `/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g` matches variables starting with letter or underscore, followed by alphanumeric/underscores. This is evaluated against the content string using `matchAll` or `exec` loop.
- For invalid variable detection: run a second pass with `/\{[^}]+\}/g` to find all `{...}` patterns; for any that don't match the valid pattern, collect them and return a 400 with a message like `"Invalid variable syntax: {123}, {name with spaces}"`.
- Name uniqueness: Supabase will throw a unique constraint violation on `UNIQUE(user_id, name)`. Catch this specific Postgres error code (`23505`) and return 409; let other DB errors propagate as 500.
- Predefined categories list (must match spec exactly):
  `["greeting", "promotional", "support", "notification", "appointment", "followup", "other"]`
- The `variables` column in the DB is JSON (not JSONB) per the schema spec — use `JSON.stringify(variables)` when writing and `JSON.parse()` when reading if the Supabase client doesn't auto-parse.
