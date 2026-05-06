# 31-templates-ui-build

**Implements**: specs/wa-sender-templates.md § UI: Template CRUD Page  
**Depends On**: 30-templates-api-build (API must be functional to wire the list/create/edit/delete flows), 12-wa-sender-subroutes (templates/page.tsx exists as "coming soon" to replace)  
**Capacity**: ~300 LOC load-bearing logic / 5 invariants (live variable extraction in create form, delete requires confirmation, edit pre-populates from existing data, category filter works, 1000-char counter visible) / 3 call-graph hops (component → fetch → API → Supabase) / Builds the full Templates CRUD page: paginated list with category filter, create form with live variable preview, edit modal, and delete confirmation.  
**Status**: ACTIVE

## Context

The templates sub-route currently shows "coming soon" from todo 12. This todo replaces that with the full feature UI. After this todo, users can manage their template library from `/tools/wa-sender/templates`.

The template selection modal (clicking "Select Template" in Dashboard) is part of todo 32, not this one. This todo is purely the Templates management page.

## Scope

**DO:**
- Replace `app/tools/wa-sender/templates/page.tsx` with the full CRUD page
- **List view:**
  - Paginated table (50 per page) showing: name, category badge, variable count, created_at, action buttons (edit, delete)
  - Sort by name/category/created_at
  - Filter dropdown: All categories + individual categories from predefined list
  - Loading state while fetching
  - Empty state: "No templates yet. Create your first template."
- **Create form:**
  - Fields: name (text, required), content (textarea, required, 1000-char counter), category (dropdown, optional), description (text, optional)
  - Live variable preview below content textarea — shows `{name}`, `{company}` as badges as user types
  - Real-time variable extraction (debounced 200ms) using the regex from `app/lib/templates.ts`
  - Save button disabled until name + content are non-empty
  - Cancel returns to list
- **Edit modal:**
  - Pre-populated with current template values
  - Same fields and live variable preview as create form
  - Save triggers PUT endpoint; success updates list in place
- **Delete confirmation:**
  - "Delete [template name]?" modal
  - Cancel + Confirm buttons
  - On confirm: calls DELETE endpoint, removes from list, shows success toast
  - On error: shows error toast with message
- Create `app/tools/wa-sender/templates/[id]/edit/page.tsx` or implement edit as a modal within the list page (modal preferred per spec)

**DO NOT:**
- Implement variable substitution (that is in todo 32)
- Build the template selection modal used in Dashboard (todo 32)
- Show other users' templates (RLS ensures this, but do not add application-level user_id checks — trust RLS)

## Deliverables

**Modify:**
- `app/tools/wa-sender/templates/page.tsx` — full CRUD page (replace "coming soon" content)

**Create:**
- `app/tools/wa-sender/templates/[id]/edit/page.tsx` (optional if implementing edit as in-page modal)

**Tests:**
- `__tests__/wa-sender-templates-ui.test.ts` — component tests

## Testing

**Unit tests (Tier 1, React Testing Library):**
- `test_template_list_renders_empty_state` — no templates from API; shows "No templates yet" message
- `test_template_list_renders_template_rows` — mock API returning 2 templates; both appear in table
- `test_create_form_extracts_variables_live` — type `"Hi {name}"` in content textarea; variable badge `{name}` appears below within 200ms debounce
- `test_create_form_shows_invalid_variable_warning` — type `"Hi {123}"` in content; warning shown
- `test_create_form_disabled_save_when_empty` — save button disabled when name is empty
- `test_delete_opens_confirmation_modal` — click delete on a template; confirmation modal appears with template name
- `test_delete_calls_api_on_confirm` — confirm delete; DELETE API call made; template removed from list
- `test_category_filter_shows_only_matching_templates` — select "promotional" filter; only promotional templates visible
- `test_1000_char_counter_updates` — type 50 chars in content; counter shows "50/1000"

**Manual checks:**
- Create a template with `{name}` and `{company}` variables — variables appear as badges live
- Create a template with name "Test"; try to create another with name "Test" — 409 error shown as toast
- Edit a template — form pre-populated with current values
- Delete a template with confirmation — disappears from list

## Implementation Notes

- Live variable extraction in the form: use `useEffect` watching the content value with a 200ms debounce. Call `extractVariables(content)` and display the result as `<Badge>` components. Do NOT call the API for this — it is entirely client-side.
- Invalid variable detection (e.g., `{123}`): use the same two-pass approach from the API: find all `{...}` patterns, flag those that don't match the valid regex. Show a warning below the textarea with the invalid patterns listed.
- Toast notifications: use the existing toast component from Phase 1 (check what component library is already installed before adding a new one).
- Category filter: fetch templates from `GET /api/wa-sender/templates?category=promotional`. Use a `useState` for the selected category and re-fetch when it changes. Debounce is not needed here since it is a dropdown.
- The edit experience as modal vs page: the spec says "Edit modal". Implement as a modal overlaid on the list page. The `app/tools/wa-sender/templates/[id]/edit/page.tsx` is listed in the plan but the spec prefers a modal. Use the modal approach; the edit page is unnecessary. If the edit page file was created in the "coming soon" pass, it can be left as a redirect to the templates list page.
