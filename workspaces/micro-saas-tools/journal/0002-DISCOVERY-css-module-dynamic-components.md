---
type: DISCOVERY
date: 2026-05-07
created_at: 2026-05-07T16:45:00Z
author: agent
session_id: claude-code-2026-05-07
phase: deploy
project: micro-saas-tools
topic: CSS Module undefined errors in dynamic Next.js components
tags: [next-js, css-modules, dynamic-rendering, deployment, bug-fix]
---

# DISCOVERY: CSS Module Undefined in Dynamic Client Components

## Finding

When deploying Next.js 16.2.4 (Turbopack) applications with `export const dynamic = 'force-dynamic'` in client components, CSS Modules can be undefined at runtime. Direct access to `styles["className"]` results in **"Cannot read properties of undefined"** errors causing 500 responses.

### Root Cause

- `dynamic = 'force-dynamic'` prevents static prerendering and enforces client-side rendering
- CSS Module loading timing is different in dynamic vs static mode
- Nested components inherit the undefined styles object from parent
- Direct dictionary access `styles["className"]` throws when `styles` is undefined

### Manifestation

All 9 micro-SaaS tools loaded successfully on build but failed with 500 errors on Vercel:
- Main pages (`page.tsx`): CSS Module undefined error
- Child components (`components/Preview.tsx`, `components/UseCaseSelector.tsx`, etc.): CSS Module undefined error
- The errors cascaded — fixing parent pages without fixing child components still resulted in 500 errors

### Solution

Created a safe accessor helper that provides a fallback:

```typescript
// app/tools/lib/css-module-safe.ts
export function cls(
  styles: Record<string, string> | undefined,
  className: string
): string {
  if (!styles || !className) return className || '';
  return styles[className] || className;
}
```

**Key insight**: When CSS Modules are undefined, returning the plain className as a fallback is better than crashing. The CSS won't apply, but the page loads and degrades gracefully.

### Applied Fix

Converted all 12 component files (9 pages + 3 child components) from:
```typescript
// WRONG
<div className={styles["my-tool__container"]} />
```

To:
```typescript
// CORRECT
import { cls } from "../lib/css-module-safe";
<div className={cls(styles, "my-tool__container")} />
```

**Critical discovery**: Child components were the primary failure point. Even if the parent page used `cls()`, a single child component using direct access caused the entire tool to fail with 500 error.

## Impact

- **Reliability**: All 9 tools now load without errors on Vercel production
- **Pattern**: Established reusable pattern for dynamic client components in Next.js
- **Scope**: Pattern applies to any Next.js app using `dynamic = 'force-dynamic'` with CSS Modules

## Knowledge Captured

1. **New rule**: `.claude/rules/project/css-module-safety.md` — detailed pattern, detection protocol, verification checklist
2. **Updated skill**: `.claude/skills/project/micro-saas-tools-development/` — added CSS Module safety section and template
3. **Library**: `app/tools/lib/css-module-safe.ts` — reusable helper for all tools

## For Discussion

1. **Should this pattern be applied to other Next.js projects using dynamic components?** Is CSS Module loading timing a consistent issue across all Next.js versions, or is it specific to 16.2.4 + Turbopack?

2. **Could the helper function be added to a shared utilities library instead of duplicated?** Current implementation duplicates `css-module-safe.ts` across scopes. Should tools import from `app/lib/css-module-safe.ts` instead of `../lib/css-module-safe.ts`, or should this remain isolated per the "complete tool isolation" constraint?

3. **Are there other framework patterns where runtime values differ from type-inferred values?** This discovery suggests dynamic components have other timing/loading quirks beyond CSS Modules. Should we audit for similar patterns (font loading, images, async data)?

## Related Decisions

- **DECISION: Complete Tool Isolation** (0001) — each tool is self-contained. This CSS Module fix maintains isolation by implementing the helper per tool, not shared.
- **DECISION: Next.js Version Lock** — 16.2.4 chosen for Turbopack stability. CSS Module loading is specific to this version + dynamic mode combination.

## References

- **Rule**: `rules/project/css-module-safety.md`
- **Skill**: `skills/project/micro-saas-tools-development/SKILL.md` § CSS Module Safety
- **Affected files**: 12 component files across 9 tools
- **Verification**: All tools loaded successfully on Vercel after fix (tested 2026-05-07 16:45 UTC)
