# Setup: Tool Infrastructure & CSS Isolation

**ID**: 001  
**Effort**: 1 hour  
**Implements**: specs/micro-saas-tools.md § 1 (Architecture Principle: Complete Tool Isolation)  
**Blocks**: All other todos (101–502)

## Description

Create the folder structure, templates, and documentation needed to build 10 isolated tools. Each tool will be completely self-contained with its own CSS, components, and utilities — zero dependency on shared website resources.

### What to Build

1. **Folder structure** — `app/tools/[tool-name]/` with required files
2. **CSS template** — Isolated namespace pattern for tool styling
3. **Page template** — Minimal React page component boilerplate
4. **README template** — Documentation structure for each tool
5. **Test folder** — `tests/tools/[tool-name]/` with test setup
6. **Build checklist** — Verification steps for isolation compliance

### Acceptance Criteria

- [ ] `app/tools/` directory created with `.gitkeep`
- [ ] CSS isolation template documented with example namespace
- [ ] Page component template created (`app/tools/_template/page.tsx`)
- [ ] Test folder template created (`tests/tools/_template/`)
- [ ] `app/tools/ISOLATION_CHECKLIST.md` written with verification steps
- [ ] No shared CSS variables or design tokens referenced
- [ ] No shared components imported in template
- [ ] Documentation explains tool independence principle

## Technical Approach

### Folder Structure

```
app/tools/
├── _template/
│   ├── page.tsx
│   ├── styles.css
│   ├── lib/
│   │   └── [tool-utilities].ts
│   ├── components/
│   │   └── [tool-specific-components].tsx
│   └── README.md
├── whatsapp-message-formatter/
├── whatsapp-link-generator/
├── word-counter/
└── [other tools...]

tests/tools/
├── _template/
│   ├── [tool-name].test.ts
│   ├── [tool-name].integration.test.ts
│   └── [tool-name].e2e.test.ts
```

### CSS Isolation Pattern

Each tool uses a **namespace-scoped CSS** pattern:

```css
/* app/tools/[tool-name]/styles.css */

:root {
  --wc-color-bg: #f5f5f5;
  --wc-color-text: #333;
  --wc-color-accent: #3b82f6;
  --wc-spacing-base: 4px;
}

.word-counter {
  /* BEM-style namespace */
  background-color: var(--wc-color-bg);
  color: var(--wc-color-text);
}

.word-counter__input {
  padding: calc(4 * var(--wc-spacing-base));
}

.word-counter__button {
  background-color: var(--wc-color-accent);
}

/* etc. — all selectors start with .word-counter */
```

**Key rules**:
- All selectors start with `.tool-slug-name` namespace
- All colors defined in tool's `:root`
- No `@import` or references to `globals.css`
- No Tailwind `className` directives
- CSS custom properties scoped to tool (prefix: `--tool-slug`)

### Page Template

```typescript
// app/tools/_template/page.tsx

import styles from "./styles.css";

export default function ToolPage() {
  return (
    <div className={styles["tool-slug"]}>
      {/* Tool UI here */}
    </div>
  );
}

export const metadata = {
  title: "[Tool Name] - Free Online Tool",
  description: "[1-sentence tool description for SEO]",
};
```

### Test Template

```typescript
// tests/tools/_template/[tool-name].test.ts

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ToolPage from "@/app/tools/[tool-name]/page";

describe("[Tool Name]", () => {
  it("renders without errors", () => {
    render(<ToolPage />);
    // Assertions
  });

  it("handles user input correctly", async () => {
    // Test core logic
  });
});
```

## Files to Create

1. `app/tools/_template/page.tsx` — Empty page template
2. `app/tools/_template/styles.css` — Empty CSS template with namespace pattern
3. `app/tools/_template/lib/_utils.ts` — Empty utilities file
4. `app/tools/_template/components/_Example.tsx` — Empty component template
5. `app/tools/_template/README.md` — Template documentation
6. `tests/tools/_template/[tool-name].test.ts` — Test template
7. `app/tools/ISOLATION_CHECKLIST.md` — Verification steps
8. `app/tools/ARCHITECTURE.md` — Detailed isolation principles

## Verification Checklist

- [ ] Can copy `_template/` to new tool folder without modification
- [ ] No imports from project `lib/`, `components/`, `utils/`
- [ ] CSS namespace pattern documented with examples
- [ ] Test template imports only from test utilities and tool components
- [ ] README explains CSS isolation, folder structure, how to build
- [ ] Isolation checklist is clear and verifiable (grep-able)

## Deviation Log

_None yet_
