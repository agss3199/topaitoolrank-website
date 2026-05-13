# Decision: Complete Isolation Strategy (No Shared Components)

**Date:** 2026-05-11  
**Phase:** 01-Analysis  
**Type:** Architecture Decision

## Context

User requirement: "This tool needs to be separate from everything else on the website... in case later I need to remove this, I just have to delete a folder without breaking anything else."

This is a strong **deletability requirement** — if the tool is removed, nothing else should break.

## Decision

**Implement complete isolation:**
- All code in dedicated folder: `/app/tools/bmc-generator/`
- No imports from `/app/tools/`, `/app/components/`, or `/app/lib/`
- No shared CSS/Tailwind utilities
- No shared API layer
- No shared types or interfaces
- Self-contained styling (CSS modules in same folder)
- Self-contained utilities (all helpers duplicated locally)
- Self-contained hooks (all custom hooks defined in tool folder)

**Deletion safety:** User should be able to delete `/app/tools/bmc-generator/` and `/pages/tools/bmc-generator/` (route) with zero broken imports, zero broken CSS, zero broken types.

## Rationale

### Benefits
1. **True deletability** — no hidden dependencies
2. **No cross-tool pollution** — changes to invoice generator don't affect BMC generator
3. **Independent deployability** — could move to separate domain/subdomain later
4. **Independent versioning** — BMC tool updates don't depend on other tools' schedules
5. **Easy to reason about** — all code visible in one folder

### Trade-offs
1. **Code duplication** — utility functions, hooks, types duplicated across tools
2. **Maintenance burden** — fixes/improvements to shared patterns must be applied in multiple places
3. **Larger bundle** — each tool brings its full set of utilities (no tree-shaking across tools)

## Implementation Strategy

### Folder Structure

```
app/tools/bmc-generator/
├── page.tsx                    # Route: /tools/bmc-generator
├── layout.tsx                  # Tool-specific layout (if needed)
├── styles/
│   ├── bmc-generator.module.css
│   ├── components.module.css
│   └── ui.module.css           # All styling local, no imports from app/styles
├── components/
│   ├── IdeaInput.tsx           # Component for initial idea input
│   ├── QuestionFlow.tsx        # Clarifying questions UI
│   ├── StatusDisplay.tsx       # Real-time agent status
│   ├── BMCCanvas.tsx           # Final BMC rendering
│   ├── ErrorState.tsx
│   └── LoadingState.tsx
├── hooks/
│   ├── useBMCGeneration.ts     # Main orchestration hook
│   ├── useStatusStream.ts      # SSE stream management
│   ├── useCostTracker.ts       # Cost calculation
│   └── useSessionLogging.ts    # Session logging/debugging
├── lib/
│   ├── types.ts                # ALL types/interfaces
│   ├── schemas.ts              # Zod schemas
│   ├── api-client.ts           # API calls
│   ├── cost-calculator.ts      # Cost math
│   ├── logger.ts               # Logging utility
│   └── formatting.ts           # String/markdown formatting
├── api/
│   ├── route.ts                # /api/bmc-generator/...
│   ├── orchestrate.ts          # Phase 1 logic
│   ├── generate.ts             # Phase 2 logic
│   ├── critique.ts             # Phase 3 logic
│   ├── synthesize.ts           # Phase 4 logic
│   ├── stream.ts               # SSE status stream
│   └── agents.ts               # Agent execution
└── constants/
    ├── prompts.ts              # System prompts for all agents
    ├── config.ts               # Tool config (timeouts, limits)
    └── messages.ts             # UI copy/messages
```

### What NOT to Import

```typescript
// ❌ DO NOT IMPORT these (shared components)
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { cn } from "@/app/lib/utils";

// ✅ DO IMPORT/COPY these (local utilities)
// Copy utility functions into lib/formatting.ts, lib/utils.ts locally
// Create local Button component if needed
// Define local types in lib/types.ts
```

### Shared Component Replacement Strategy

For commonly used components (Button, Input, Card, etc.):

**Option A: Copy from shadcn/ui directly**
```bash
# In bmc-generator folder, run:
npx shadcn-ui@latest add button --path ./components/ui
```
Creates `/app/tools/bmc-generator/components/ui/button.tsx` (copy of shadcn component)

**Option B: Minimal custom implementations**
If only simple HTML elements needed, write minimal custom wrappers

**Recommendation:** Option A (use shadcn directly in tool folder)
- Shadcn is designed for duplication (each project/tool has its own copy)
- Easier than maintaining custom wrappers

### Utility Functions

For commonly used utilities (cn, formatDate, etc.):
1. Copy existing implementations from `/app/lib/utils` → `/app/tools/bmc-generator/lib/utils.ts`
2. Add tool-specific utilities to same file
3. Import only from local lib/

### Styling Strategy

- **Tailwind OK** (Tailwind utilities are global CSS, not imported)
- **CSS Modules** for tool-specific styles (avoid shared CSS module files)
- **No @/app/styles imports** (copy any shared utility classes into tool's own CSS modules)

Example:
```css
/* ❌ app/styles/utility.module.css (do not import) */
/* ✅ app/tools/bmc-generator/styles/utility.module.css (create local copy) */
```

### API Route Isolation

All API calls for BMC generator live under `/api/bmc-generator/`:
- `POST /api/bmc-generator/start` — initiate generation
- `POST /api/bmc-generator/questions` — generate clarifying questions
- `POST /api/bmc-generator/answers` — normalize answers to context
- `POST /api/bmc-generator/generate` — Phase 2 (BMC generation)
- `POST /api/bmc-generator/critique` — Phase 3 (red team)
- `POST /api/bmc-generator/synthesize` — Phase 4 (final synthesis)
- `GET /api/bmc-generator/stream/status` — SSE real-time status

No shared API layer, no reuse of handlers from other tools.

## Verification Checklist

Before launch, verify:

```bash
# 1. No shared component imports
grep -r "from.*@/app/components" app/tools/bmc-generator/
# Should return: 0 matches

# 2. No shared lib imports (except @/app/lib/types if must-have)
grep -r "from.*@/app/lib" app/tools/bmc-generator/ | grep -v "types"
# Should return: 0 matches

# 3. All types defined locally
grep "import.*from.*@" app/tools/bmc-generator/lib/types.ts | wc -l
# Should return: <5 (only standard lib imports like zod)

# 4. Deletion safety test
rm -rf app/tools/bmc-generator
# Build/tests should pass with zero import errors
npm run build
```

## Trade-off: Code Duplication

This approach will duplicate code across tools:
- Common utilities (formatDate, cn, logger, etc.) — ~100-200 LOC duplicated
- UI components (Button, Input, Card if copied) — ~500-800 LOC duplicated
- Types/schemas (APIResponse, Error types, etc.) — ~50-100 LOC duplicated

**Total duplication:** ~700-1100 LOC per tool

**Rationale:**
- Small cost for large benefit (true deletability, independence)
- Can live with duplication for 2-3 tools
- If duplicating >5 tools, reconsider strategy (maybe tool-specific npm package)

## Future Consideration

If more tools added and duplication becomes burden, refactor to:
- Shared `@kailash-saas/tools-common` npm package (internal)
- Or: monorepo with shared packages per tool

For now: isolation + duplication is preferred over fragile coupling.

---

## Implementation Checkpoint

- [ ] Confirm isolation approach with user
- [ ] Create tool folder structure
- [ ] Use shadcn/ui directly in tool folder for UI components
- [ ] Copy shared utilities to tool's lib/ directory
- [ ] Implement deletion verification test
