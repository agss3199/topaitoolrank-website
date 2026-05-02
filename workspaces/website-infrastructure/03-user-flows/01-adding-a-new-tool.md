# User Flow: Adding a New Tool (Without Touching Core Website)

**Scope:** End-to-end flow for adding Tool B (e.g., WhatsApp Templates Manager) without any changes to the homepage, blog, WA Sender code, or authentication system.

**Preconditions:**
- Tool developer has implemented Tool B feature (components, API, hooks)
- Infrastructure (design system, auth, shared components) is in place
- Database is ready for migrations

---

## Flow Overview

```
1. Developer writes tool code               (30 min)
   └─ No changes to core website
2. Developer adds tool.manifest.json        (5 min)
3. Developer creates database migration     (10 min)
4. Developer runs tests                     (5 min)
5. Commit & push to git                     (2 min)
6. Vercel auto-deploys                      (2 min)
7. Tool is live                             (instant)
   └─ Navigation auto-discovers tool
   └─ Sitemap auto-includes tool
   └─ No manual nav updates needed
```

---

## Detailed Steps

### 1. Developer Implements Tool B

**Directory structure:**
```
app/tools/tool-b/
  page.tsx
  components/
    ToolBShell.tsx
    ToolBDashboard.tsx
    ToolBFeature.tsx
    tool-b.module.css
  hooks/
    useToolBSession.ts
  api/
    [route].ts
```

**Key constraints:**
- ✅ Imports shared components (Button, Modal, Input from `app/components/`)
- ✅ Uses `ToolShell` wrapper for auth gating
- ✅ Has scoped session hook (`useToolBSession`)
- ❌ Does NOT import WA Sender components
- ❌ Does NOT modify app/globals.css
- ❌ Does NOT change middleware

**What the developer does:**
1. Write `ToolBDashboard.tsx` component
2. Write `ToolBShell.tsx` wrapper (copy from `WASenderShell.tsx` as template, rename)
3. Write `useToolBSession.ts` hook (copy from `useWASenderSession.ts` as template, rename)
4. Write API routes in `api/[route].ts`
5. Test locally with `npm run dev`

**What the developer does NOT do:**
- Update `app/layout.tsx`
- Update `app/(marketing)/page.tsx` navigation
- Modify `app/globals.css`
- Touch `middleware.ts`
- Manually update sitemap
- Create authentication system

---

### 2. Developer Creates Tool Manifest

**File:** `app/tools/tool-b/tool.manifest.json`

```json
{
  "id": "tool-b",
  "name": "WhatsApp Templates",
  "version": "1.0.0",
  "description": "Manage and organize WhatsApp message templates with AI suggestions.",
  "icon": "/tools/tool-b/icon.svg",
  "route": "/tools/tool-b",
  "auth_required": true,
  "scope": ["tool-b:read", "tool-b:write"],
  "navigation": [
    {
      "label": "Dashboard",
      "href": "/tools/tool-b",
      "icon": "dashboard"
    },
    {
      "label": "Templates",
      "href": "/tools/tool-b/templates",
      "icon": "template"
    },
    {
      "label": "AI Suggestions",
      "href": "/tools/tool-b/suggestions",
      "icon": "lightbulb"
    },
    {
      "label": "Settings",
      "href": "/tools/tool-b/settings",
      "icon": "settings"
    }
  ],
  "database_tables": [
    "tool_b_templates",
    "tool_b_suggestions",
    "tool_b_usage"
  ],
  "api_endpoints": [
    "/api/tool-b/templates",
    "/api/tool-b/suggestions",
    "/api/tool-b/usage"
  ],
  "environment_variables": [
    "OPENAI_API_KEY"
  ],
  "deployment": {
    "independent": true,
    "can_deploy_without_core": true,
    "requires_migration": true
  }
}
```

**What happens:**
- Navigation component reads manifest
- Sitemap generator reads manifest
- Auth system reads `id` and `scope` fields
- No hardcoding needed anywhere

---

### 3. Developer Creates Database Migration

**File:** `migrations/002_create_tool_b_tables.sql`

```sql
-- Tool B data isolation: user_id + tool_id
CREATE TABLE tool_b_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  tool_id TEXT NOT NULL DEFAULT 'tool-b',
  name VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, tool_id, id)
);

CREATE INDEX idx_tool_b_templates_user_tool ON tool_b_templates(user_id, tool_id);

CREATE TABLE tool_b_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  tool_id TEXT NOT NULL DEFAULT 'tool-b',
  template_id UUID REFERENCES tool_b_templates(id),
  suggestion TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, tool_id, id)
);

CREATE INDEX idx_tool_b_suggestions_user_tool ON tool_b_suggestions(user_id, tool_id);
```

**Key rules:**
- Every table has `user_id` and `tool_id`
- Unique key is `(user_id, tool_id, id)` — enforces isolation
- Indexes on `(user_id, tool_id)` for fast queries

---

### 4. Developer Runs Tests

**Tests include:**

1. **Unit tests** — Component rendering, hooks
2. **Integration tests** — API routes, database queries
3. **Auth tests** — Token scope validation, cross-tool rejection

**Example test:**

```typescript
// app/tools/tool-b/__tests__/api.test.ts
import { POST } from '../api/templates/route';

describe('Tool B API', () => {
  it('rejects requests from WA Sender token', async () => {
    const waToken = createJWT({ tool_id: 'wa-sender' });
    const request = new NextRequest('/api/tool-b/templates', {
      headers: { Authorization: `Bearer ${waToken}` },
    });
    
    const response = await POST(request);
    expect(response.status).toBe(401);
  });
  
  it('allows requests from Tool B token', async () => {
    const toolBToken = createJWT({ tool_id: 'tool-b', sub: 'user-123' });
    const request = new NextRequest('/api/tool-b/templates', {
      method: 'POST',
      headers: { Authorization: `Bearer ${toolBToken}` },
      body: JSON.stringify({ name: 'Test Template' }),
    });
    
    const response = await POST(request);
    expect(response.status).toBe(200);
  });
});
```

---

### 5. Commit and Push

```bash
git add app/tools/tool-b/
git add migrations/002_create_tool_b_tables.sql
git commit -m "feat(tools): add Tool B with manifest"
git push origin feature/add-tool-b
```

**What's in the commit:**
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
    [route].ts
  tool.manifest.json
  __tests__/
    api.test.ts
    components.test.tsx
migrations/002_create_tool_b_tables.sql
```

**What's NOT in the commit:**
- app/layout.tsx (unchanged)
- app/(marketing)/page.tsx (unchanged)
- app/globals.css (unchanged)
- middleware.ts (unchanged)
- app/sitemap.ts (unchanged)

---

### 6. Vercel Deploys

**Deployment process:**
1. GitHub webhook triggers Vercel build
2. Next.js builds entire app (including Tool B routes)
3. Database migration runs (creates `tool_b_templates`, etc.)
4. Deployment succeeds
5. `https://topaitoolrank.com/tools/tool-b` is live

**What happens automatically:**
- Navigation component fetches `/api/tools/list` → discovers Tool B from manifest
- Sitemap generator reads `app/tools/tool-b/tool.manifest.json` → includes `/tools/tool-b/*` in sitemap
- Middleware sees `/tools/tool-b/*` requests → validates `tool_id` claim
- Database has `tool_b_templates` table → Tool B API queries succeed

---

### 7. Tool B is Live

**User experience:**
1. User logs in (existing login, works for all tools)
2. User sees Tool B in the tools navigation menu
3. User clicks "WhatsApp Templates"
4. Middleware validates their token includes `tool_id: "tool-b"`
5. User is taken to `/tools/tool-b` (Tool B dashboard)
6. Tool B can read/write `tool_b_templates` table (scoped by user_id + tool_id)
7. If user logs out, tool-b token is invalidated (cannot access WA Sender's data)

---

## Validation Checklist

✅ Before developers can add a tool, verify:

- [ ] Tool directory exists at `app/tools/{id}/`
- [ ] Tool manifest exists and is valid JSON
- [ ] Tool implements ToolShell wrapper
- [ ] Tool implements scoped session hook
- [ ] Tool API routes validate JWT `tool_id` claim
- [ ] Tool database tables include `user_id` and `tool_id`
- [ ] Tool database queries filter by both columns
- [ ] Tool has at least 2 integration tests
- [ ] All tests pass
- [ ] No imports from other tools
- [ ] Navigation auto-discovers tool (manifest-driven)
- [ ] Sitemap auto-includes tool routes (manifest-driven)
- [ ] Middleware automatically supports tool routes (no changes needed)

---

## What Changed vs What Didn't

### Changed (minimal)
- Added `app/tools/tool-b/` directory with complete tool implementation
- Added `migrations/002_create_tool_b_tables.sql`

### Unchanged (zero friction)
- Homepage layout (`app/(marketing)/`)
- Blog system (`app/(blog)/`)
- WA Sender (`app/tools/wa-sender/`)
- Design system (`app/globals.css`)
- Authentication system (`lib/useAuth.ts`, `middleware.ts`)
- Shared components (`app/components/`)
- Navigation (auto-discovers from manifests)
- Sitemap (auto-generated from manifests)
- Deployment process (standard `git push` to Vercel)

---

## Key Principles

1. **Tool is self-contained** — all code lives in `app/tools/tool-b/`
2. **Manifest drives discovery** — navigation and sitemap read manifests, not hardcoded lists
3. **Database schema enforces isolation** — `(user_id, tool_id)` unique key prevents cross-tool leakage
4. **Middleware is tool-agnostic** — works for any tool without configuration changes
5. **Deployment is atomic** — entire app deploys; Tool B is available immediately

---

## Troubleshooting

| Issue | Cause | Fix |
|---|---|---|
| Tool doesn't appear in navigation | Manifest not valid JSON | Validate manifest with `npm run validate:manifests` |
| API returns 401 Unauthorized | Token doesn't have correct `tool_id` claim | Check JWT token's `tool_id` field matches tool's `id` |
| Data leaks to other tools | Query doesn't filter by `tool_id` | Add `AND tool_id = 'tool-b'` to all queries |
| Routes return 404 | Tool manifest `route` field doesn't match file path | Ensure `route: "/tools/tool-b"` matches `app/tools/tool-b/page.tsx` |
| Database migration fails | Migration syntax error | Test locally: `npm run migrate:dev` |

