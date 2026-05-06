# 32-templates-dashboard-wire

**Implements**: specs/wa-sender-templates.md § Template Selection in Dashboard, § Variable Substitution  
**Depends On**: 31-templates-ui-build (templates API fully functional), 12-wa-sender-subroutes (Dashboard uses context), 10-wa-sender-context (selectedTemplate state declared)  
**Capacity**: ~150 LOC load-bearing logic / 4 invariants (template selection populates Dashboard message field, variable substitution is case-sensitive, missing variables left as-is, selectedTemplate stored in context) / 3 call-graph hops (Dashboard button → modal → fetch templates → select → context update → Dashboard field update) / Wires the template selection modal into the Dashboard send workflow: "Select Template" button, template list modal, selection populates message content, and variable substitution during send.  
**Status**: ACTIVE

## Context

The Templates feature (todo 31) allows managing templates in isolation. This todo connects it to the send workflow: the user is in the Dashboard, clicks "Select Template," picks from a modal, and the selected template's content populates the message textarea. Variables like `{name}` are then substituted per-recipient at send time.

This is the BUILD+WIRE pattern: todo 31 built the Templates UI; this todo wires it to the Dashboard.

## Scope

**DO:**
- Add "Select Template" button to the Dashboard message compose section
- Create `app/components/TemplateModal.tsx` — a lazily-loaded modal showing a simplified template list (name, category, first 100 chars of content) with click-to-select
- On template selection: populate the Dashboard's message textarea with the template content; store the selected template in `context.selectedTemplate`
- Implement `substituteVariables(template: string, contactData: Record<string, string>): string` in `app/lib/templates.ts`
  - Case-sensitive replacement: `{Name}` ≠ `{name}`
  - Missing variable: leave placeholder as-is (`{promo_code}` stays if contact has no `promo_code`)
  - Source: both standard fields (name, phone, email, company) and `custom_fields` JSONB
- Call `substituteVariables` during the send loop in Dashboard (per recipient, before generating the WhatsApp/Gmail link)
- Show which template is currently selected below the message textarea ("Using template: [name]" with an X to deselect)

**DO NOT:**
- Re-implement the full template list (reuse the templates API — `GET /api/wa-sender/templates`)
- Do substitution server-side — it is explicitly client-side per the spec ("Substitution is done client-side before sending (no secrets passed to API)")
- Add template editing to the modal — selection only; full editing stays at `/tools/wa-sender/templates`

## Deliverables

**Create:**
- `app/components/TemplateModal.tsx` — simplified template selector modal

**Modify:**
- `app/tools/wa-sender/page.tsx` (Dashboard) — add "Select Template" button, selected template indicator, wire substitution into send loop
- `app/lib/templates.ts` — add `substituteVariables()` function
- `app/tools/wa-sender/context.ts` — ensure `selectedTemplate` and `setSelectedTemplate` are properly typed (was placeholder in todo 10)

**Tests:**
- `__tests__/wa-sender-templates-dashboard-wire.test.ts`

## Testing

**Unit tests (Tier 1):**
- `test_substitute_variables_replaces_known_variables` — `substituteVariables("Hi {name}", { name: "Alice" })` returns `"Hi Alice"`
- `test_substitute_variables_is_case_sensitive` — `substituteVariables("Hi {Name}", { name: "Alice" })` returns `"Hi {Name}"` (no replacement — `Name` ≠ `name`)
- `test_substitute_variables_leaves_unknown_placeholder` — `substituteVariables("Code: {promo_code}", { name: "Alice" })` returns `"Code: {promo_code}"`
- `test_substitute_variables_uses_custom_fields` — contact with `custom_fields: { tier: "Premium" }`; `substituteVariables("{tier}", contact)` returns `"Premium"`
- `test_select_template_populates_message_field` — click "Select Template", select a template from modal; Dashboard message textarea contains template content
- `test_selected_template_shown_below_textarea` — after selection, "Using template: [name]" text visible
- `test_deselect_template_clears_indicator` — click X on selected template indicator; indicator disappears; context.selectedTemplate is null
- `test_send_calls_substitute_variables_per_recipient` — mock 2 contacts; verify substituteVariables called twice during send, with different contact data each time

**Manual checks:**
- Click "Select Template" in Dashboard; template modal appears with template list
- Click a template; modal closes, message textarea populated with template content
- Have contacts with `{name}` variable; send — verify each WhatsApp link has the name substituted
- Template with `{promo_code}` on contacts without that field — placeholder stays in message

## Implementation Notes

- `TemplateModal` must lazy-load with `React.lazy()` or use `dynamic()` from Next.js — it is only needed when user clicks the button, so it should not be in the initial bundle.
- The modal fetches from `GET /api/wa-sender/templates` on open — not pre-fetched. Show a loading spinner inside the modal while fetching.
- `substituteVariables` must handle `custom_fields` JSONB by flattening the object: `{ name: contact.name, phone: contact.phone, email: contact.email, company: contact.company, ...contact.custom_fields }`. This gives template access to all fields without distinguishing standard from custom.
- The "Using template: [name]" indicator must survive sub-route navigation and return — it reads from `context.selectedTemplate` which is preserved in the context provider.
