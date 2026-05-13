# Component CSS Module Safety Pattern

**Codified from:** BMC Generator CSS Module fixes (May 2026)  
**Problem:** Dynamic client components with `export const dynamic = 'force-dynamic'` experience undefined CSS Modules at runtime  
**Solution:** Safe accessor helper with fallback pattern

---

## The Problem

When using `export const dynamic = 'force-dynamic'` in Next.js client components, CSS Module imports may return `undefined` at runtime:

```typescript
// ❌ CRASHES: styles is sometimes undefined
import styles from './component.module.css';

export default function MyComponent() {
  return <div className={styles.container} />;
  // TypeError: Cannot read properties of undefined (reading 'container')
}
```

This happens because:
1. CSS Modules are bundled statically
2. `force-dynamic` prevents prerendering
3. Module loading timing differs between build-time type inference and runtime evaluation

---

## Solution: Safe Accessor Helper

### Step 1: Create `cls()` Helper

```typescript
// lib/css-module-safe.ts

export function cls(
  styles: Record<string, string> | undefined,
  className: string
): string {
  if (!styles || !className) {
    return className || '';
  }
  return styles[className] || className;
}
```

**How it works:**
- If `styles` is undefined → return plain `className` (fallback to HTML class)
- If `className` doesn't exist in styles → return plain `className`
- Otherwise → return the mapped CSS Module class

### Step 2: Apply Helper in Component

```typescript
// ✅ SAFE: uses cls() helper
import { cls } from '../lib/css-module-safe';
import styles from './component.module.css';

export const dynamic = 'force-dynamic';

export default function MyComponent() {
  return (
    <div className={cls(styles, 'container')}>
      <header className={cls(styles, 'header')} />
      <button className={cls(styles, 'submitButton')} />
    </div>
  );
}
```

### Step 3: Apply Everywhere

Every CSS Module access must use `cls()`:

```typescript
// ✅ DO — all uses go through cls()
className={cls(styles, 'container')}
className={cls(styles, 'header')}
className={cls(styles, 'active')}
className={cls(styles, 'hidden')}

// ❌ DON'T — direct access
className={styles.container}  // if styles is undefined → crash
className={styles['header']}  // same problem
```

### Step 4: Child Components Also Use Helper

```typescript
// components/Preview.tsx
'use client';

import { cls } from '../../lib/css-module-safe';
import styles from '../styles.css';

export default function Preview() {
  return <div className={cls(styles, 'previewPanel')} />;
  //                    ^^^
  //                    Must use cls() helper
}
```

**Why:** Child components have the same CSS Module loading risk as parent pages. A single child without `cls()` causes the entire parent tool to fail with a 500 error.

---

## Complete Example

```typescript
// app/tools/my-tool/page.tsx
'use client';

import { useState } from 'react';
import IdeaInputForm from './components/IdeaInputForm';
import StatusPanel from './components/StatusPanel';
import { cls } from './lib/css-module-safe';
import styles from './styles.css';

export const dynamic = 'force-dynamic';

export default function MyToolPage() {
  const [step, setStep] = useState('input');

  return (
    <main className={cls(styles, 'container')}>
      <header className={cls(styles, 'header')}>
        <h1 className={cls(styles, 'title')}>My Tool</h1>
      </header>

      {step === 'input' && (
        <IdeaInputForm
          onSubmit={(data) => {
            // ... logic ...
            setStep('generating');
          }}
        />
      )}

      {step === 'generating' && (
        <StatusPanel />
      )}

      <footer className={cls(styles, 'footer')} />
    </main>
  );
}
```

```typescript
// app/tools/my-tool/components/IdeaInputForm.tsx
'use client';

import { cls } from '../../lib/css-module-safe';
import styles from '../styles.css';

interface Props {
  onSubmit: (idea: string) => void;
}

export default function IdeaInputForm({ onSubmit }: Props) {
  return (
    <form className={cls(styles, 'form')}>
      <label className={cls(styles, 'label')} htmlFor="idea">
        Your idea:
      </label>
      <textarea
        id="idea"
        className={cls(styles, 'textarea')}
        placeholder="Describe your idea..."
      />
      <button
        type="submit"
        className={cls(styles, 'submitButton')}
      >
        Submit
      </button>
    </form>
  );
}
```

---

## Testing

### Structural Verification (Tier 1)

```typescript
// tests/components/ComponentName.test.ts

import { readFileSync } from 'fs';

const componentSource = readFileSync('./path/to/Component.tsx', 'utf-8');
const stylesSource = readFileSync('./path/to/styles.css', 'utf-8');

describe('ComponentName', () => {
  it('imports cls helper', () => {
    expect(componentSource).toContain("import { cls }");
    expect(componentSource).toContain("'../lib/css-module-safe'");
  });

  it('imports CSS module', () => {
    expect(componentSource).toContain("import styles from");
    expect(componentSource).toContain(".module.css");
  });

  it('uses cls() for all class assignments', () => {
    // Verify no direct styles.className access
    expect(componentSource).not.toMatch(/className=\{styles\[/);
    expect(componentSource).not.toMatch(/className={styles\./);
    
    // Verify cls() usage
    expect(componentSource).toContain("cls(styles,");
  });

  it('exports dynamic = force-dynamic', () => {
    expect(componentSource).toContain("export const dynamic = 'force-dynamic'");
  });
});
```

### Integration Test (Tier 2)

```typescript
// tests/integration/ComponentName.test.ts

import { render } from '@testing-library/react';
import ComponentName from '@/app/tools/my-tool/page';

describe('ComponentName (integration)', () => {
  it('renders without crashing', () => {
    const { container } = render(<ComponentName />);
    expect(container).toBeTruthy();
  });

  it('applies CSS classes correctly', () => {
    const { container } = render(<ComponentName />);
    const mainElement = container.querySelector('main');
    expect(mainElement).toHaveClass('container'); // or fallback class
  });
});
```

---

## Verification Checklist

For every tool/component using CSS Modules:

- [ ] `page.tsx` imports `cls` helper
- [ ] `page.tsx` uses `cls(styles, "className")` for all CSS Module accesses
- [ ] All child components in `components/` also import and use `cls()`
- [ ] All child components import styles from parent's `styles.css` (not separate imports)
- [ ] `dynamic = 'force-dynamic'` declared on `page.tsx`
- [ ] No direct `styles[""]` or `styles.` access in tool or any child component
- [ ] Structural verification tests pass
- [ ] Build completes without errors
- [ ] Tool loads in browser without 500 errors

### Automated Verification

```bash
# Find all CSS Module accesses that aren't using cls()
grep -rn 'className={styles' app/tools/my-tool --include="*.tsx" | grep -v 'cls(styles'

# Should return ZERO results
```

---

## Why This Works

### Fallback Strategy

```
1. styles is defined  →  use CSS Module class
2. styles is undefined but className is provided  →  use plain class as fallback
3. className is empty  →  return empty string
```

### Example Flow

```typescript
// Scenario 1: Styles loaded normally
styles = { container: 'my-tool_container__a1b2c' }
className = 'container'
result = styles['container'] = 'my-tool_container__a1b2c' ✓

// Scenario 2: Styles undefined (fallback)
styles = undefined
className = 'container'
result = 'container' (plain HTML class) ✓

// Scenario 3: Class doesn't exist in styles
styles = { container: '...' }
className = 'unknown'
result = 'unknown' (falls back to plain class) ✓
```

---

## Common Mistakes

❌ **Mistake:** Direct styles access on some components only  
```typescript
// Parent uses cls(), child doesn't
export default function Parent() {
  return <div className={cls(styles, 'container')} />;
}

export default function Child() {
  return <div className={styles.child} />;  // ❌ One child breaks parent
}
```

✅ **Fix:** Consistent usage across all components

❌ **Mistake:** Separate CSS Module imports per child component  
```typescript
// Parent
import styles from './styles.css';

// Child
import styles from './child-styles.css';  // Different import = different object
```

✅ **Fix:** All components import from parent's styles.css

❌ **Mistake:** Forgetting `force-dynamic` export  
```typescript
// Without force-dynamic, styles might be prerendered
export default function MyComponent() {
  return <div className={cls(styles, 'container')} />;
}
// ❌ TypeScript thinks styles is always defined (prerendered assumption)
```

✅ **Fix:** Always add `export const dynamic = 'force-dynamic'` at the top

---

## When to Use This Pattern

✅ **Use this pattern when:**
- Component exports `dynamic = 'force-dynamic'`
- Component imports CSS Modules
- Component renders conditionally based on client-side state
- Child components render CSS Module classes

❌ **Skip this pattern when:**
- Using static CSS files (not CSS Modules)
- Component is fully static (no `dynamic = 'force-dynamic'`)
- Using Tailwind or inline styles (no CSS Module import risk)

---

## Related Patterns

- **Session Debounce Safety:** `.claude/skills/project/session-debounce-safety.md`
- **CSS Module Safety Rules:** `.claude/rules/project/css-module-safety.md`

---

## References

- Incident (2026-05-07): All 9 micro-SaaS tools failed with 500 errors due to undefined CSS Modules in dynamic components
- Fix: Created `cls()` helper and converted 43 direct accesses across 12 files
- Test coverage: 62 structural tests + 55 integration tests
- Verification: All 685 tests passing post-fix
