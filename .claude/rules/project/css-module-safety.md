---
name: CSS Module Safety in Dynamic Client Components
description: Safe access pattern for CSS Modules in Next.js dynamic components with force-dynamic rendering
type: project
paths:
  - "app/tools/**/*.tsx"
  - "app/tools/**/components/*.tsx"
---

# CSS Module Safety Rules — Dynamic Client Components

When using `export const dynamic = 'force-dynamic'` in Next.js client components with CSS Modules, the styles object can be undefined at runtime. This rule mandates a safe access pattern to prevent "Cannot read properties of undefined" errors.

## Root Cause

Next.js with Turbopack and `dynamic = 'force-dynamic'`:
- Prevents static prerendering
- Allows client-side rendering with forced dynamic mode
- CSS Module types are inferred from import, but runtime value may be `undefined` due to module loading timing

When CSS Modules fail to load at runtime (especially in nested components), accessing `styles["className"]` throws:
```
TypeError: Cannot read properties of undefined (reading 'className')
```

## MUST Rules

### 1. Create Safe CSS Module Accessor

Create `app/tools/lib/css-module-safe.ts` with a `cls()` helper function:

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

**Why:** A single, centralized helper ensures consistent fallback behavior. If `styles` is undefined or the className doesn't exist, return the plain className as fallback (still valid CSS).

### 2. Every Tool Page Uses `cls()` Helper

All direct CSS Module accesses in `page.tsx` MUST route through `cls()`:

```typescript
// DO
import { cls } from "../lib/css-module-safe";
import styles from "./styles.css";

export default function MyTool() {
  return <div className={cls(styles, "my-tool__container")} />;
}

// DO NOT
import styles from "./styles.css";

export default function MyTool() {
  return <div className={styles["my-tool__container"]} />;  // undefined error
}
```

**Why:** Direct access bypasses the fallback, causing runtime errors when `styles` is undefined.

### 3. Child Components Also Use `cls()` Helper

Components in `components/` subdirectories MUST also import and use the `cls()` helper:

```typescript
// DO — child component
// app/tools/my-tool/components/Preview.tsx
import { cls } from "../../lib/css-module-safe";
import styles from "../styles.css";

export default function Preview() {
  return <div className={cls(styles, "my-tool__preview")} />;
}

// DO NOT — direct access
export default function Preview() {
  return <div className={styles["my-tool__preview"]} />;  // can fail
}
```

**Why:** Child components have the same CSS Module loading risk as parent pages. A single missing `cls()` call in a deeply nested component causes a 500 error that bubbles up.

### 4. Dynamic Rendering Requires Force-Dynamic Export

Every tool page MUST export `dynamic = 'force-dynamic'`:

```typescript
"use client";

export const dynamic = 'force-dynamic';
export const dynamicParams = false;

import styles from "./styles.css";
import { cls } from "../lib/css-module-safe";

// ... component code
```

**Why:** Without `dynamic = 'force-dynamic'`, Next.js attempts static prerendering, which tries to evaluate all paths at build time. This causes different CSS Module loading issues at build time vs runtime.

### 5. Test Child Components for CSS Module Access

When adding a new child component that uses CSS Module classes, verify it:
1. Imports the `cls` helper
2. Uses `cls(styles, "className")` for all accesses
3. Imports styles from parent's `styles.css`

```typescript
// VERIFY: child component structure
import { cls } from "../../lib/css-module-safe";  // ✓
import styles from "../styles.css";                // ✓

export default function Child() {
  return <div className={cls(styles, "child__class")} />;  // ✓
}
```

**Why:** Missing the helper in even one child component causes the entire parent tool to fail with a 500 error on load.

## MUST NOT

- **Direct `styles["className"]` access without `cls()` guard**

**Why:** Bypasses the undefined check, causing "Cannot read properties" errors.

- **Omit `dynamic = 'force-dynamic'` in dynamic client components**

**Why:** Without it, CSS Module loading timing is different, manifesting as undefined or missing classes.

- **Forget `cls()` in child components**

**Why:** A single child without the guard fails the entire parent tool.

## Detection Protocol

Before deploying, scan all tool files for unsafe CSS Module access:

```bash
# Find all styles accesses — should return ZERO results
grep -rn 'styles\[' app/tools --include="*.tsx" | grep -v 'cls(styles'

# Find all CSS imports — verify each file has cls imported
grep -l 'import styles from' app/tools/**/*.tsx | while read f; do
  grep -q "import { cls }" "$(dirname $f)/../lib/css-module-safe.ts" && echo "✓ $f" || echo "✗ $f MISSING"
done
```

## Verification Checklist

For every tool:
- [ ] `page.tsx` imports `cls` helper
- [ ] `page.tsx` uses `cls(styles, "className")` for all CSS Module accesses
- [ ] All child components in `components/` also use `cls()` helper
- [ ] All child components import from parent's `styles.css` (not separate imports)
- [ ] `dynamic = 'force-dynamic'` declared on `page.tsx`
- [ ] No direct `styles[""]` access in tool or any child component
- [ ] Build succeeds with no errors
- [ ] Tool loads in browser without 500 error

## Related Rules

- `.claude/rules/project/session-debounce-safety.md` — client component safety patterns
- `.claude/skills/project/micro-saas-tools-development/` — tool architecture and structure

## Origin

Incident (2026-05-07): All 9 micro-SaaS tools loaded with 500 errors on Vercel deployment. Root cause: CSS Module undefined at runtime in `dynamic = 'force-dynamic'` components. Affected pages and child components. Fixed by creating `cls()` helper and converting all `styles["className"]` → `cls(styles, "className")` across 12 component files. All tools verified live after fix. See commit `[deployment fix]`.
