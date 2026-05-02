# Todo: Build Tool Registry & Auto-Discovery System

**Status:** Pending  
**Implements:** specs/tool-architecture.md §Tool Manifest Format, §Tool Loader  
**Dependencies:** None (independent)  
**Blocks:** Dynamic navigation (item 05), updated sitemap (item 05)  
**Capacity:** Single session (~250 LOC)  

## Description

Create `lib/tool-registry.ts` with functions to auto-discover tools from their manifest files. Implement `/api/tools/list` endpoint that returns all discovered tools. Tools are discovered by scanning `app/tools/` directory for `tool.manifest.json` files (no hardcoded registry).

## Implementation

1. **Create tool registry** (`app/lib/tool-registry.ts`):
   - `loadAllTools()` — reads `app/tools/*/tool.manifest.json`, returns array of ToolManifest objects
   - `getToolById(id)` — finds tool by ID
   - `validateManifest(manifest)` — checks required fields (id, name, route, auth_required, etc.)
   - Error handling: log warnings if manifest is invalid, continue with next tool

2. **Create API endpoint** (`app/api/tools/list/route.ts`):
   - GET request handler
   - Calls `loadAllTools()`
   - Returns JSON array of manifests
   - Caches result with 1-hour TTL (revalidate on file changes)

3. **Document ToolManifest interface** (`app/lib/types.ts`):
   - TypeScript interface with all fields (id, name, version, description, route, auth_required, scope, navigation, database_tables, api_endpoints, environment_variables, deployment)
   - JSDoc comments for each field

## Acceptance Criteria

- [ ] `lib/tool-registry.ts` exports `loadAllTools()` and `getToolById()`
- [ ] Tool discovery scans `app/tools/` directory for `tool.manifest.json`
- [ ] Invalid manifests are logged as warnings, don't block discovery
- [ ] `/api/tools/list` returns all discovered tools
- [ ] API response includes all manifest fields
- [ ] WA Sender tool is discovered (once manifest is created in item 06)
- [ ] Tool B is discovered (once manifest is created in item 08)
- [ ] No hardcoded tool registry (all discovery is dynamic)

## Testing

```bash
# Test endpoint returns tools
curl http://localhost:3000/api/tools/list
# Returns: [{ id: "wa-sender", name: "WA Sender", ... }]

# Test invalid manifest is logged
# Add invalid JSON to app/tools/test-tool/tool.manifest.json
# npm run dev logs warning, does not crash
# curl still returns valid tools
```

