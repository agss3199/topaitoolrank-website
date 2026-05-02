# Tool Architecture Specification

**Domain:** Tool registration, manifest format, deployment independence, data isolation  
**Authority:** Single source of truth for adding tools, ensuring plug-and-play scalability  
**Last Updated:** 2026-05-02  

## 1. Current State

**Status: Single tool (WA Sender) hardcoded; no registration system.**

- WA Sender is the only tool
- Routes are hardcoded: `/tools/wa-sender`
- Navigation to tools is hardcoded in `app/layout.tsx` or marketing page
- No concept of "tool registration" or metadata

**Problems when adding Tool B:**
- Must manually add routes to `app/tools/tool-b/page.tsx`
- Must update navigation links everywhere
- Must update sitemap manually
- Must coordinate deployment with other tools
- WA Sender and Tool B code are tightly coupled (share the same repo)

---

## 2. Plug-and-Play Tool Architecture

### Principle: Tools Are First-Class Citizens

A tool is a self-contained, independently deployable module that:
- Has its own authentication scope (tool-scoped JWT)
- Has its own database schema and data isolation
- Has its own components and styling
- Has its own API endpoints
- Has a manifest file that declares its metadata

Adding a new tool requires:
1. Creating a tool directory (`app/tools/tool-name/`)
2. Writing a tool manifest (`app/tools/tool-name/tool.manifest.json`)
3. No changes to core website code

### Tool Manifest Format

**File:** `app/tools/{tool-name}/tool.manifest.json`

```json
{
  "id": "wa-sender",
  "name": "WhatsApp Sender",
  "version": "1.0.0",
  "description": "Send bulk WhatsApp messages with templates and automation.",
  "icon": "/tools/wa-sender/icon.svg",
  "route": "/tools/wa-sender",
  "auth_required": true,
  "scope": ["wa-sender:read", "wa-sender:write"],
  "navigation": [
    {
      "label": "Dashboard",
      "href": "/tools/wa-sender",
      "icon": "dashboard"
    },
    {
      "label": "Messages",
      "href": "/tools/wa-sender/messages",
      "icon": "mail"
    },
    {
      "label": "Templates",
      "href": "/tools/wa-sender/templates",
      "icon": "template"
    },
    {
      "label": "Settings",
      "href": "/tools/wa-sender/settings",
      "icon": "settings"
    }
  ],
  "database_tables": [
    "wa_sender_messages",
    "wa_sender_templates",
    "wa_sender_conversations",
    "wa_sender_contacts"
  ],
  "api_endpoints": [
    "/api/wa-sender/messages",
    "/api/wa-sender/templates",
    "/api/wa-sender/conversations"
  ],
  "environment_variables": [
    "WHATSAPP_API_KEY",
    "WHATSAPP_BUSINESS_ACCOUNT_ID"
  ],
  "deployment": {
    "independent": true,
    "can_deploy_without_core": true,
    "requires_migration": true
  }
}
```

**Field Descriptions:**

| Field | Purpose | Example |
|---|---|---|
| `id` | Unique tool identifier (used in JWT `tool_id` claim) | `"wa-sender"` |
| `name` | Display name for UI | `"WhatsApp Sender"` |
| `version` | Tool version (for deployment versioning) | `"1.0.0"` |
| `description` | One-line description | `"Send bulk WhatsApp messages..."` |
| `icon` | Path to tool icon for navigation | `"/tools/wa-sender/icon.svg"` |
| `route` | Base route where tool lives | `"/tools/wa-sender"` |
| `auth_required` | Whether tool requires authentication | `true` |
| `scope` | JWT scopes required for this tool | `["wa-sender:read", "wa-sender:write"]` |
| `navigation` | Navigation menu items specific to tool | Array of `{label, href, icon}` |
| `database_tables` | Tables owned by this tool | Array of table names |
| `api_endpoints` | API routes provided by this tool | Array of endpoint paths |
| `environment_variables` | Env vars required for this tool | Array of var names |
| `deployment.independent` | Can be deployed independently | `true` |
| `deployment.can_deploy_without_core` | Deployment doesn't require main site changes | `true` |
| `deployment.requires_migration` | Database schema changes needed | `true` |

### Tool Loader (Auto-Discovery)

**File:** `app/lib/tool-registry.ts`

```typescript
import { readdirSync } from 'fs';
import path from 'path';

export interface ToolManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  icon: string;
  route: string;
  auth_required: boolean;
  scope: string[];
  navigation: Array<{ label: string; href: string; icon?: string }>;
  database_tables: string[];
  api_endpoints: string[];
  environment_variables: string[];
  deployment: {
    independent: boolean;
    can_deploy_without_core: boolean;
    requires_migration: boolean;
  };
}

export async function loadAllTools(): Promise<ToolManifest[]> {
  const toolsDir = path.join(process.cwd(), 'app', 'tools');
  const toolNames = readdirSync(toolsDir);
  
  const tools: ToolManifest[] = [];
  
  for (const toolName of toolNames) {
    const manifestPath = path.join(toolsDir, toolName, 'tool.manifest.json');
    try {
      const manifest = await import(manifestPath);
      tools.push(manifest);
    } catch (err) {
      console.warn(`Failed to load tool manifest for ${toolName}:`, err);
    }
  }
  
  return tools;
}

export async function getToolById(id: string): Promise<ToolManifest | null> {
  const tools = await loadAllTools();
  return tools.find(t => t.id === id) || null;
}
```

---

## 3. Dynamic Tool Navigation

Instead of hardcoding tool links, load them from manifests.

**File:** `app/components/ToolNavigation.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { ToolManifest } from '@/app/lib/tool-registry';

export function ToolNavigation() {
  const [tools, setTools] = useState<ToolManifest[]>([]);
  
  useEffect(() => {
    async function loadTools() {
      const res = await fetch('/api/tools/list');
      const data = await res.json();
      setTools(data);
    }
    loadTools();
  }, []);
  
  return (
    <nav className="tool-nav">
      <h3>Tools</h3>
      {tools.map(tool => (
        <div key={tool.id} className="tool-group">
          <a href={tool.route} className="tool-link">
            {tool.icon && <img src={tool.icon} alt={tool.name} />}
            {tool.name}
          </a>
          <ul className="tool-submenu">
            {tool.navigation.map(item => (
              <li key={item.href}>
                <a href={item.href}>{item.icon && <span className="icon">{item.icon}</span>} {item.label}</a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
```

**API endpoint to serve tools:**

```typescript
// app/api/tools/list/route.ts
import { loadAllTools } from '@/app/lib/tool-registry';

export async function GET() {
  const tools = await loadAllTools();
  
  // Filter for current user's accessible tools (could be based on subscription/permissions)
  const accessible = tools.filter(tool => {
    // For now, return all tools; later: check user permissions
    return true;
  });
  
  return Response.json(accessible);
}
```

---

## 4. Tool-Scoped Routes & API

### File Structure

Each tool owns its routes and API:

```
app/tools/{tool-id}/
  page.tsx                           ← tool root page
  components/
    {ToolName}Shell.tsx              ← auth wrapper
    {ToolName}Dashboard.tsx
    ...
  hooks/
    use{ToolName}Session.ts
  api/
    [route].ts                       ← tool API endpoints
  tool.manifest.json                 ← tool metadata
```

### Route Protection (Middleware)

Middleware automatically enforces tool scope:

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Extract tool_id from route (e.g., /tools/wa-sender/... → wa-sender)
  const toolMatch = pathname.match(/^\/tools\/([^/]+)/);
  if (toolMatch) {
    const toolId = toolMatch[1];
    
    // Verify access token has matching tool_id claim
    const accessToken = getAccessToken(request);
    const payload = await verifyJWT(accessToken);
    
    if (payload.tool_id !== toolId) {
      return redirectToLogin();
    }
  }
  
  return NextResponse.next();
}
```

### API Endpoint Example

```typescript
// app/tools/wa-sender/api/messages/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Middleware already validated tool_id == 'wa-sender'
  const accessToken = request.headers.get('Authorization')?.split(' ')[1];
  const payload = await verifyJWT(accessToken);
  const userId = payload.sub;
  const toolId = payload.tool_id;  // guaranteed to be 'wa-sender'
  
  const body = await request.json();
  
  // Query includes tool_id for data isolation
  const result = await db.query(
    'INSERT INTO wa_sender_messages (user_id, tool_id, content) VALUES (?, ?, ?)',
    [userId, toolId, body.content]
  );
  
  return NextResponse.json({ message_id: result.id });
}
```

---

## 5. Tool Data Isolation

### Database Schema Pattern

Every tool's tables MUST include:
- `user_id` (which user owns this data)
- `tool_id` (which tool owns this data)
- Composite unique key or index on (user_id, tool_id)

```sql
CREATE TABLE wa_sender_messages (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  tool_id TEXT NOT NULL DEFAULT 'wa-sender',  -- always 'wa-sender'
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, tool_id, id)  -- user+tool scoped
);

CREATE INDEX idx_wa_messages_user_tool ON wa_sender_messages(user_id, tool_id);
```

```sql
-- Future tool (Tool B)
CREATE TABLE tool_b_data (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  tool_id TEXT NOT NULL DEFAULT 'tool-b',  -- always 'tool-b'
  data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, tool_id, id)
);

CREATE INDEX idx_tool_b_user_tool ON tool_b_data(user_id, tool_id);
```

### Query Pattern (Defense-in-Depth)

Always filter by both user_id AND tool_id:

```typescript
// CORRECT
const messages = await db.query(
  'SELECT * FROM wa_sender_messages WHERE user_id = ? AND tool_id = ?',
  [userId, 'wa-sender']
);

// WRONG — leaks other users' data if there's a bug
const messages = await db.query(
  'SELECT * FROM wa_sender_messages WHERE user_id = ?',
  [userId]
);
```

---

## 6. Tool Deployment Independence

### Per-Tool Versioning

```json
{
  "id": "wa-sender",
  "version": "1.0.5",           // tool version, independent
  "deployment": {
    "independent": true,
    "can_deploy_without_core": true,
    "requires_migration": true
  }
}
```

### Deployment Scenarios

**Scenario A: Deploy WA Sender without core website changes**

```bash
# Only wa-sender code changed
git diff main... -- app/tools/wa-sender/
  # Output: components/, hooks/, api/, tool.manifest.json

# Can deploy independently
vercel deploy --target wa-sender
# OR just push to main; Vercel deploys entire app (next.js handles all routes)
```

**Scenario B: Deploy Tool B while WA Sender is running**

```bash
# Add Tool B in new PR
git diff main... -- app/tools/tool-b/
  # Output: brand new tool directory

# Middleware automatically supports tool-b routes (no middleware change needed)
# Navigation auto-discovers tool-b from manifest (no nav change needed)
# Can deploy without affecting WA Sender's users
```

**Scenario C: Update core website + WA Sender together**

```bash
# Changes to both core (design system, auth) and tool (wa-sender components)
git diff main... -- app/globals.css app/tools/wa-sender/
  # Output: shared + tool changes

# Deploy as one atomic change
vercel deploy
```

---

## 7. Adding a New Tool (Step-by-Step)

### Step 1: Create Tool Directory

```bash
mkdir -p app/tools/tool-b/components
mkdir -p app/tools/tool-b/hooks
mkdir -p app/tools/tool-b/api
```

### Step 2: Write Tool Manifest

```json
{
  "id": "tool-b",
  "name": "Tool B",
  "version": "1.0.0",
  "description": "...",
  "route": "/tools/tool-b",
  "auth_required": true,
  ...
}
```

### Step 3: Create Page

```typescript
// app/tools/tool-b/page.tsx
import { ToolBShell } from './components/ToolBShell';
import { ToolBDashboard } from './components/ToolBDashboard';

export default function ToolBPage() {
  return (
    <ToolBShell>
      <ToolBDashboard />
    </ToolBShell>
  );
}
```

### Step 4: Create Components

```typescript
// app/tools/tool-b/components/ToolBShell.tsx
import { useToolBSession } from '../hooks/useToolBSession';
import { ToolShell } from '@/app/components/ToolShell';

export function ToolBShell({ children }: { children: React.ReactNode }) {
  const session = useToolBSession();
  
  return (
    <ToolShell
      toolName="Tool B"
      toolId="tool-b"
      session={session}
      navigation={[
        { label: 'Dashboard', href: '/tools/tool-b' },
        { label: 'Features', href: '/tools/tool-b/features' },
        { label: 'Settings', href: '/tools/tool-b/settings' },
      ]}
    >
      {children}
    </ToolShell>
  );
}
```

### Step 5: Create Hooks

```typescript
// app/tools/tool-b/hooks/useToolBSession.ts
import { useAuth } from '@/app/lib/useAuth';

export function useToolBSession() {
  const session = useAuth();
  
  if (session?.tool_id !== 'tool-b') {
    throw new AuthenticationError('Token is not for tool-b');
  }
  
  return session;
}
```

### Step 6: Create API Routes

```typescript
// app/tools/tool-b/api/data/route.ts
export async function GET(request: NextRequest) {
  const accessToken = request.headers.get('Authorization')?.split(' ')[1];
  const payload = await verifyJWT(accessToken);
  const userId = payload.sub;
  
  // Query includes tool_id for isolation
  const data = await db.query(
    'SELECT * FROM tool_b_data WHERE user_id = ? AND tool_id = ?',
    [userId, 'tool-b']
  );
  
  return Response.json(data);
}
```

### Step 7: Run DB Migration (If Needed)

```sql
CREATE TABLE tool_b_data (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  tool_id TEXT NOT NULL DEFAULT 'tool-b',
  data JSONB,
  UNIQUE(user_id, tool_id, id)
);
CREATE INDEX idx_tool_b_user_tool ON tool_b_data(user_id, tool_id);
```

### Step 8: Deploy

```bash
git add app/tools/tool-b/
git add migrations/
git commit -m "feat(tools): add Tool B"
git push
# Vercel auto-deploys; tool is live
```

**No changes required to:**
- Core website navigation
- Authentication system
- Design system
- WA Sender code
- Middleware
- Sitemap (auto-discovered from manifest)

---

## 8. Validation Checklist

Before shipping a tool:

- [ ] Tool has a `tool.manifest.json` with all required fields
- [ ] Tool manifest has unique `id` (not conflicting with existing tools)
- [ ] Tool owns all routes under `/tools/{id}/`
- [ ] Tool owns all API routes under `/api/{id}/`
- [ ] Tool has a `ToolShell` wrapper component
- [ ] Tool has scoped session hook (`use{Tool}Session`)
- [ ] All database tables include `user_id` and `tool_id` columns
- [ ] All database queries filter by both `user_id` and `tool_id`
- [ ] Tool database tables documented in manifest
- [ ] Tool API endpoints documented in manifest
- [ ] Tool environment variables documented in manifest
- [ ] No cross-tool imports (tool components isolated)
- [ ] Middleware config includes tool routes (if custom)
- [ ] Sitemap includes tool routes (auto-discovery via manifest)
- [ ] Navigation loads tools from manifests (not hardcoded)

---

## 9. Tool Lifecycle

### Tool Versioning

Each tool has independent versioning:

```
wa-sender 1.0.0
tool-b 1.1.2
tool-c 2.0.0-beta
```

Version is defined in `tool.manifest.json` and is separate from the main site version.

### Tool Deprecation

To deprecate a tool:

1. Set `deprecated: true` in manifest
2. Keep the tool accessible (don't delete)
3. Navigation can show deprecation badge
4. Users can still access it for data retrieval
5. Set a sunset date, migrate users to replacement

```json
{
  "id": "old-tool",
  "deprecated": true,
  "deprecation": {
    "reason": "Replaced by New Tool",
    "sunset_date": "2026-12-31",
    "replacement_tool_id": "new-tool"
  }
}
```

### Tool Removal

Only remove a tool after:
- Users have been migrated/notified
- Sunset date has passed
- Data retention period is complete

---

## 10. Security & Isolation Guarantees

### Guarantee 1: Tool Cannot Access Another Tool's Data

- JWT `tool_id` claim enforces scope
- API queries filter by `tool_id`
- Middleware validates `tool_id` before route handler runs

### Guarantee 2: Tool Cannot Access Another User's Data

- API queries filter by `user_id`
- Database unique keys enforce user+tool scope
- Server-side validation prevents cross-user access

### Guarantee 3: Tool Cannot Modify Core Website

- Tool code lives in `app/tools/{id}/`
- Core website code lives in `app/`, `app/(marketing)/`, `app/(blog)`
- No cross-directory imports (enforced by linting)
- Tool cannot modify design system, auth, or shared components

### Guarantee 4: New Tool Doesn't Break Existing Tools

- Tools are discovered from manifests (not by imports)
- Navigation auto-discovers tools (not hardcoded)
- Middleware is tool-agnostic (doesn't need updates)
- Sitemap auto-discovers tools (doesn't need updates)

