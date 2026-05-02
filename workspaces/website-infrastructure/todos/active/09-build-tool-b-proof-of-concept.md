# Todo: Build Tool B (Proof of Concept) — Verify Plug-and-Play Pattern Works

**Status:** Pending  
**Implements:** specs/tool-architecture.md §Adding a New Tool, specs/component-library.md §Component Import Rules  
**Dependencies:** Item 03 (ToolShell), Item 04 (registry), Item 05 (dynamic nav)  
**Blocks:** Item 10 (integration tests)  
**Capacity:** Single session (~300 LOC)  

## Description

Create Tool B (e.g., WhatsApp Templates Manager) as a proof-of-concept to verify the plug-and-play architecture works. Tool B should be completely independent: own components, own API routes, own database tables, own manifest. It demonstrates that adding a tool requires ZERO changes to WA Sender, homepage, navigation, sitemap, or auth system.

## Implementation

1. **Create Tool B directory structure:**
   ```
   app/tools/tool-b/
     page.tsx
     components/
       ToolBShell.tsx
       ToolBDashboard.tsx
       tool-b.module.css
     hooks/
       useToolBSession.ts
     api/
       templates/route.ts
       suggestions/route.ts
     tool.manifest.json
     __tests__/
       api.test.ts
       components.test.tsx
   ```

2. **Implement Tool B components:**
   - Copy `WASenderShell.tsx` as template, rename to `ToolBShell.tsx`, change tool-b references
   - Create `ToolBDashboard.tsx` with simple template management UI
   - Create `useToolBSession.ts` hook (copy from wa-sender, rename)
   - Use shared components (Button, Modal, Card) — NO imports from wa-sender

3. **Implement Tool B API routes:**
   - `GET /api/tool-b/templates` — list templates (filtered by user_id + tool_id)
   - `POST /api/tool-b/templates` — create template
   - Each route validates JWT `tool_id === 'tool-b'`

4. **Create Tool B database tables:**
   - `tool_b_templates` (id, user_id, tool_id, name, content, created_at)
   - `tool_b_suggestions` (id, user_id, tool_id, template_id, suggestion, created_at)
   - Both tables: `user_id` + `tool_id` for isolation, indexes on (user_id, tool_id)

5. **Create Tool B manifest:**
   - `app/tools/tool-b/tool.manifest.json`
   - Declare id, name, route, navigation, database_tables, api_endpoints

## Acceptance Criteria

- [ ] Tool B directory exists with all required files
- [ ] Tool B components render without errors
- [ ] Tool B API routes work (return mock/test data)
- [ ] Tool B manifest is valid JSON
- [ ] Tool B is auto-discovered by registry (`/api/tools/list` includes tool-b)
- [ ] Navigation auto-includes Tool B (no manual nav updates)
- [ ] Sitemap auto-includes `/tools/tool-b` (no manual sitemap updates)
- [ ] Tool B routes are protected by middleware (token validation)
- [ ] Tool B cannot import WA Sender components (isolation verified)
- [ ] WA Sender code is UNCHANGED (zero modifications)
- [ ] Homepage is UNCHANGED (zero modifications)
- [ ] Deployment process is UNCHANGED (standard `git push`)

## Testing

```bash
# Verify Tool B is auto-discovered
curl http://localhost:3000/api/tools/list | grep -A3 '"id":"tool-b"'
# Should show Tool B metadata

# Verify navigation includes Tool B
# Visit http://localhost:3000, check for "WhatsApp Templates" (or Tool B name)

# Verify sitemap includes Tool B
curl http://localhost:3000/sitemap.xml | grep /tools/tool-b
# Should include /tools/tool-b route(s)

# Verify Tool B is independent
# Check: does app/tools/wa-sender/ import anything from app/tools/tool-b/?
grep -r "from.*tool-b" app/tools/wa-sender/
# Should return NOTHING (zero cross-tool imports)

# Check: were any files outside app/tools/tool-b/ modified?
# (other than shared components, middleware, registry, nav)
git diff --name-only app/
# Should show only: app/tools/tool-b/*, app/components/ToolShell*, app/api/tools/list/*
# NOT: app/layout.tsx, app/(marketing)/, app/tools/wa-sender/
```

