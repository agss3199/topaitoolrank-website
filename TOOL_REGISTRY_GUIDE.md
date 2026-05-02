# Tool Registry & Auto-Discovery System

This document explains how the tool registry auto-discovery system works and how to add new tools.

## Overview

The tool registry is a dynamic, zero-configuration system for discovering and managing tools in the application. Tools are self-contained modules that are automatically discovered from their `tool.manifest.json` files. No hardcoded registry is required.

## Architecture

### Components

1. **Type Definitions** (`app/lib/types.ts`)
   - `ToolManifest` — the complete metadata structure for a tool
   - `ToolNavigation` — navigation menu item definition
   - `ToolDeployment` — deployment configuration
   - `ToolDeprecation` — optional deprecation metadata

2. **Tool Registry** (`app/lib/tool-registry.ts`)
   - `loadAllTools()` — scans `app/tools/` for manifests and returns all valid tools
   - `getToolById(id)` — finds a tool by its ID
   - `getToolByRoute(route)` — finds a tool by its route
   - `validateManifest(manifest)` — validates a manifest against the schema

3. **API Endpoint** (`app/api/tools/list/route.ts`)
   - `GET /api/tools/list` — returns JSON array of all discovered tools
   - Results cached for 1 hour
   - Revalidates on file changes

### Directory Structure

```
app/
├── lib/
│   ├── tool-registry.ts      ← Discovery and validation
│   └── types.ts              ← TypeScript interfaces
├── api/
│   └── tools/
│       └── list/
│           └── route.ts       ← API endpoint
└── tools/
    ├── wa-sender/
    │   ├── tool.manifest.json ← Tool metadata
    │   ├── page.tsx           ← Main page
    │   ├── layout.tsx         ← Layout wrapper
    │   └── ...other files
    └── [other-tool]/
```

## Tool Manifest Format

Every tool in `app/tools/{tool-id}/` MUST have a `tool.manifest.json` file:

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
    }
  ],
  "database_tables": [
    "wa_sender_messages",
    "wa_sender_templates"
  ],
  "api_endpoints": [
    "/api/wa-sender/messages",
    "/api/wa-sender/templates"
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

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique tool identifier (used in JWT `tool_id` claims) |
| `name` | string | Display name for UI and navigation |
| `version` | string | Semantic version (independent from main site) |
| `description` | string | One-line description |
| `icon` | string | Path to tool icon |
| `route` | string | Base route where tool is accessible |
| `auth_required` | boolean | Whether authentication is required |
| `scope` | string[] | JWT scopes required (e.g., ["tool:read", "tool:write"]) |
| `navigation` | object[] | Navigation menu items specific to tool |
| `database_tables` | string[] | Database tables owned by this tool |
| `api_endpoints` | string[] | API routes provided by this tool |
| `environment_variables` | string[] | Env vars required for this tool |
| `deployment.independent` | boolean | Can be deployed independently |
| `deployment.can_deploy_without_core` | boolean | Deployment doesn't require main site changes |
| `deployment.requires_migration` | boolean | Database schema changes needed |
| `deprecated` | boolean (optional) | Whether this tool is deprecated |
| `deprecation` | object (optional) | Deprecation details if deprecated |

## Usage

### In TypeScript Code

```typescript
import { loadAllTools, getToolById } from '@/app/lib/tool-registry';
import type { ToolManifest } from '@/app/lib/types';

// Load all tools
const allTools: ToolManifest[] = await loadAllTools();

// Get specific tool
const waSender = await getToolById('wa-sender');
if (waSender) {
  console.log(`${waSender.name} v${waSender.version}`);
}
```

### In Client Components

```typescript
'use client';

import { useEffect, useState } from 'react';
import type { ToolManifest } from '@/app/lib/types';

export function ToolNavigation() {
  const [tools, setTools] = useState<ToolManifest[]>([]);

  useEffect(() => {
    async function loadTools() {
      const res = await fetch('/api/tools/list');
      const data: ToolManifest[] = await res.json();
      setTools(data);
    }
    loadTools();
  }, []);

  return (
    <nav>
      {tools.map(tool => (
        <a key={tool.id} href={tool.route}>
          {tool.name}
        </a>
      ))}
    </nav>
  );
}
```

### API Endpoint

```bash
# Get all tools as JSON
curl http://localhost:3000/api/tools/list

# Response (example)
[
  {
    "id": "wa-sender",
    "name": "WhatsApp Sender",
    "version": "1.0.0",
    "route": "/tools/wa-sender",
    ...
  }
]
```

## Adding a New Tool

### Step 1: Create Tool Directory

```bash
mkdir -p app/tools/my-tool
mkdir app/tools/my-tool/components
mkdir app/tools/my-tool/hooks
mkdir app/tools/my-tool/api
```

### Step 2: Create Tool Manifest

Create `app/tools/my-tool/tool.manifest.json`:

```json
{
  "id": "my-tool",
  "name": "My Tool",
  "version": "1.0.0",
  "description": "Description of what my tool does",
  "icon": "/tools/my-tool/icon.svg",
  "route": "/tools/my-tool",
  "auth_required": true,
  "scope": ["my-tool:read", "my-tool:write"],
  "navigation": [
    {
      "label": "Dashboard",
      "href": "/tools/my-tool",
      "icon": "dashboard"
    }
  ],
  "database_tables": ["my_tool_data"],
  "api_endpoints": ["/api/my-tool/data"],
  "environment_variables": ["MY_TOOL_API_KEY"],
  "deployment": {
    "independent": true,
    "can_deploy_without_core": true,
    "requires_migration": false
  }
}
```

### Step 3: Create Page

Create `app/tools/my-tool/page.tsx`:

```typescript
export default function MyToolPage() {
  return (
    <div>
      <h1>My Tool</h1>
      {/* Tool content */}
    </div>
  );
}
```

### Step 4: Deploy

```bash
git add app/tools/my-tool/
git commit -m "feat(tools): add My Tool"
git push
# Vercel auto-deploys; tool is live and auto-discovered
```

The tool will be automatically:
- ✓ Discovered by the registry
- ✓ Available via `/api/tools/list`
- ✓ Accessible at `/tools/my-tool`
- ✓ Included in navigation (if navigation system uses the registry)

## Error Handling

The registry gracefully handles errors:

1. **Missing manifest file** — Tool directory is skipped (no error)
2. **Invalid JSON** — Logged as warning, tool skipped, discovery continues
3. **Missing required fields** — Logged as warning, tool skipped, discovery continues
4. **Malformed field types** — Logged as warning, tool skipped, discovery continues

Example logs:

```
Invalid tool manifest in my-tool: Missing required field: name
Failed to load tool manifest for broken-tool: Unexpected token '{' is not valid JSON
```

## Testing

The tool registry has comprehensive unit and integration tests:

```bash
# Run all tool registry tests
npm test -- tool-registry

# Run integration test against real manifests
npm test -- tool-discovery

# Run API endpoint tests
npm test -- api-tools-list
```

### Test Files

- `tests/unit/tool-registry.test.ts` — Unit tests for discovery and validation
- `tests/unit/api-tools-list.test.ts` — API endpoint tests
- `tests/integration/tool-discovery.test.ts` — Integration test with real manifests

## Manifest Validation Rules

The registry validates every manifest against these rules:

| Field | Validation |
|-------|-----------|
| `id` | Non-empty string |
| `name` | Non-empty string |
| `version` | Non-empty string (semantic version recommended) |
| `description` | Non-empty string |
| `icon` | Non-empty string (URL or relative path) |
| `route` | Non-empty string (must start with /tools/...) |
| `auth_required` | Boolean |
| `scope` | Non-empty array of strings |
| `navigation` | Array (can be empty, but field must exist) |
| `database_tables` | Array (can be empty, but field must exist) |
| `api_endpoints` | Array (can be empty, but field must exist) |
| `environment_variables` | Array (can be empty, but field must exist) |
| `deployment.independent` | Boolean |
| `deployment.can_deploy_without_core` | Boolean |
| `deployment.requires_migration` | Boolean |

Any missing or invalid field causes the manifest validation to fail and the tool to be skipped.

## FAQ

**Q: Can I update a tool's manifest without redeploying the whole site?**
A: Yes. The registry is dynamic and scans files at runtime. Update the manifest, redeploy, and the changes take effect immediately.

**Q: What if two tools have the same ID?**
A: `getToolById()` will return the first match. This is a configuration error and should be fixed immediately.

**Q: Can tools access each other's data?**
A: No. Each tool owns its own `database_tables` and `api_endpoints`. Cross-tool data access requires explicit API bridges (not implemented yet).

**Q: How do I deprecate a tool?**
A: Add `deprecated: true` and `deprecation` object to the manifest. The tool remains accessible but can be marked for removal.

**Q: Can I use tool manifests for something other than navigation?**
A: Yes. The manifest is just metadata. You can use it for:
- Permission checks (JWT scope validation)
- Feature flags
- Billing tier restrictions
- A/B testing
- Audit logging

## Performance

- **Discovery**: O(n) directory scan, happens at runtime
- **Caching**: API endpoint cached for 1 hour (configurable via `revalidate` in route.ts)
- **Validation**: Per-manifest, happens once at discovery
- **Lookup**: O(n) linear search; use indexing if >100 tools

## Security

1. **No automatic permission grant** — Having a tool in the manifest doesn't grant access. JWT scopes still enforced.
2. **No code execution** — Manifests are data only. No eval() or dynamic imports.
3. **File-based trust** — Manifests must be in the repo. No remote manifest loading.
4. **Schema validation** — All manifests validated against strict schema.

## See Also

- `specs/tool-architecture.md` — Complete tool architecture specification
- `app/tools/wa-sender/tool.manifest.json` — Example manifest (WA Sender)
- `app/lib/types.ts` — TypeScript type definitions
