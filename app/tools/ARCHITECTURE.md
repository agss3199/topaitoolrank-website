# Micro-SaaS Tools Architecture — Complete Isolation Design

**Version**: 1.0  
**Last Updated**: 2026-05-06  
**Owner**: topaitoolrank.com tools team

---

## Overview

Each tool in `app/tools/` is a **completely isolated single-page application** with zero dependency on shared website infrastructure. This means:

1. **Each tool has its own folder** containing everything it needs
2. **Each tool has its own CSS** with no reference to shared styling
3. **Each tool can be extracted and deployed independently** without modification
4. **Each tool manages its own data** (no backend, localStorage only)

This design enables:
- **Easy extraction** — Move `app/tools/[tool-name]/` to a separate domain as-is
- **Independent deployment** — Deploy one tool without affecting others
- **Brand flexibility** — Each tool can have its own color palette and styling
- **Team scalability** — Multiple teams can work on different tools without conflicts

---

## Folder Structure

```
app/tools/
├── _template/                    # Copy this to create new tools
│   ├── page.tsx                  # Main page component
│   ├── styles.css                # All CSS (isolated, no imports)
│   ├── lib/
│   │   └── _utils.ts             # Utility functions
│   ├── components/
│   │   └── _Example.tsx          # Example component
│   └── README.md                 # Tool documentation
│
├── whatsapp-message-formatter/   # Example: Tool 1
│   ├── page.tsx
│   ├── styles.css
│   ├── lib/
│   │   ├── markdown-to-whatsapp.ts
│   │   └── utils.ts
│   ├── components/
│   │   └── Preview.tsx
│   └── README.md
│
├── [tool-2-slug]/
│   ├── ... (same structure)
│
└── [tool-N-slug]/
    └── ... (same structure)

tests/tools/
├── template/                     # Test templates
│   └── template.test.ts
├── [tool-1-slug]/
│   ├── [tool-1].unit.test.ts
│   ├── [tool-1].component.test.ts
│   └── [tool-1].e2e.test.ts
└── [tool-N-slug]/
    └── ... (same test structure)
```

---

## CSS Isolation Pattern

### Principle: Namespace Scoping

All CSS selectors are scoped to a single namespace (the tool slug):

```css
/* ✓ CORRECT: All selectors scoped to .word-counter */
.word-counter { /* root */ }
.word-counter__header { /* BEM element */ }
.word-counter__input { /* BEM element */ }
.word-counter__button { /* BEM element */ }
.word-counter__button--secondary { /* BEM modifier */ }

/* ❌ WRONG: Global selectors that could conflict */
body { /* ❌ Global */ }
.button { /* ❌ Not namespaced */ }
.header { /* ❌ Conflicts with other tools */ }
```

### CSS Custom Properties Pattern

Each tool defines its own color palette using CSS custom properties:

```css
:root {
  /* Tool-specific prefix: --wc- for word-counter */
  --wc-color-bg: #f5f5f5;
  --wc-color-text: #333;
  --wc-color-accent: #3b82f6;
  --wc-spacing: 4px;
}

.word-counter {
  background: var(--wc-color-bg);
  color: var(--wc-color-text);
}
```

**NEVER** reference:
- Shared CSS variables from `globals.css`
- Design tokens from a shared system
- Colors defined in other files
- Spacing constants from shared utilities

### No @import Statements

```css
/* ❌ WRONG */
@import "../../globals.css";
@import "../other-tool/styles.css";

/* ✓ CORRECT: Define everything locally */
:root {
  --wc-color-bg: #f5f5f5;
  /* ... all variables defined here ... */
}
```

---

## JavaScript/TypeScript Isolation

### Import Rules

```typescript
/* ✓ CORRECT: Local imports only */
import styles from "./styles.css";
import { myUtility } from "./lib/utils";
import MyComponent from "./components/MyComponent";

/* ❌ WRONG: Imports from shared resources */
import { Button } from "@/components/Button";     // ❌ shared component
import { formatDate } from "@/lib/utils";         // ❌ shared utility
import { colors } from "@/lib/design-tokens";     // ❌ shared tokens
```

### localStorage Key Naming

All tools that use localStorage must use tool-specific key prefixes:

```typescript
/* ✓ CORRECT: Tool-specific key prefixes */
localStorage.setItem("word-counter-text", text);
localStorage.setItem("word-counter-stats", JSON.stringify(stats));

const draft = localStorage.getItem("word-counter-text");

/* ❌ WRONG: Generic keys that could conflict */
localStorage.setItem("text", text);              // ❌ Conflicts with other tools
localStorage.setItem("input-data", data);        // ❌ Could clash
localStorage.setItem("current-state", state);    // ❌ Non-specific
```

### Utility Functions: Copy-Paste Allowed

Some utilities (download, copy to clipboard, localStorage helpers) can be **identically duplicated** across tools:

```typescript
// app/tools/word-counter/lib/utils.ts
export function downloadAsFile(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// app/tools/json-formatter/lib/utils.ts
// Same function, copied. This is OK for isolated tools.
export function downloadAsFile(content: string, filename: string) {
  // identical implementation
}
```

**Why duplication is OK**:
- Each tool is independently extractable
- No shared code means no hidden dependencies
- Updates to one tool's utilities don't affect others
- Code is isolated and testable per-tool

---

## Page Component Structure

### Metadata Export (Required for SEO)

Every tool's `page.tsx` must export metadata:

```typescript
export const metadata = {
  title: "Word Counter - Free Online Tool",
  description: "Count words, characters, sentences in your text. Free, no signup required.",
  keywords: ["word counter", "character counter", "text analyzer"],
};
```

### Page Layout Pattern

```typescript
export default function ToolPage() {
  return (
    <div className={styles["tool-slug"]}>
      {/* HEADER: Tool name + description */}
      <header className={styles["tool-slug__header"]}>
        <h1>Tool Name</h1>
        <p>One-sentence description</p>
      </header>

      {/* MAIN: Tool UI and content */}
      <main className={styles["tool-slug__main"]}>
        {/* Input section */}
        {/* Processing section */}
        {/* Output section */}
        {/* Action buttons (copy, download, etc.) */}
      </main>

      {/* FOOTER: Brand attribution */}
      <footer className={styles["tool-slug__footer"]}>
        <p><small>Powered by <a href="/">topaitoolrank.com</a></small></p>
      </footer>
    </div>
  );
}
```

### NO Shared Components

```typescript
/* ❌ WRONG: Uses shared Button component */
import { Button } from "@/components/Button";

export default function ToolPage() {
  return <Button onClick={...}>Click me</Button>;
}

/* ✓ CORRECT: Uses tool-specific button styles */
export default function ToolPage() {
  return (
    <button className={styles["tool-slug__button"]} onClick={...}>
      Click me
    </button>
  );
}
```

---

## BUILD → WIRE → TEST Pattern

Each tool is implemented in 3 phases:

### Phase 1: BUILD (2–4 hours)
**Goal**: Core logic + UI working, no I/O

- Implement all business logic
- Create React components
- Add input/output UI
- Write styles
- NO localStorage, no download buttons, no API calls

**Acceptance**: Logic correct, UI renders, component tests passing

### Phase 2: WIRE (1 hour)
**Goal**: Connect all I/O operations

- Add localStorage persistence
- Wire copy-to-clipboard button
- Wire download button
- Add API calls (if applicable)
- Connect all user interactions

**Acceptance**: User can save, download, and retrieve data

### Phase 3: TEST (1 hour)
**Goal**: Comprehensive test coverage

- Unit tests for core logic (BUILD phase)
- Component tests for UI and interactions
- E2E tests for full user workflows
- localStorage integration tests
- Edge case and regression tests

**Acceptance**: All tests passing, ≥80% coverage, no warnings

---

## Data Model: localStorage Only

### Storage Principle

All tool data is stored in `localStorage` with the pattern:

```typescript
// Key format: [tool-slug]-[data-type]
localStorage.setItem("[tool-slug]-draft", userInput);
localStorage.setItem("[tool-slug]-settings", JSON.stringify(settings));
localStorage.setItem("[tool-slug]-history", JSON.stringify(history));
```

### Why localStorage?

- ✓ No backend database needed (simple deployment)
- ✓ Data persists across page refreshes
- ✓ Works offline
- ✓ User data stays on user's browser (privacy)
- ✓ No server costs

### What to Store

- ✓ User input (drafts, form data)
- ✓ Settings and preferences
- ✓ History (recent inputs/outputs)
- ✓ Temporary calculations

### What NOT to Store

- ❌ Passwords or secrets (will leak)
- ❌ PII (personal identifiable information)
- ❌ Authentication tokens
- ❌ Large files (localStorage has size limits)

### Cleanup on Page Unload

If tool generates temporary data, clean up before unload:

```typescript
"use client"; // Required for React hooks in Next.js

import { useEffect } from "react";

export default function ToolComponent() {
  useEffect(() => {
    window.addEventListener("beforeunload", () => {
      localStorage.removeItem("[tool-slug]-temporary-data");
    });
    return () => window.removeEventListener("beforeunload", () => {});
  }, []);

  return <div>Tool UI</div>;
}
```

---

## Testing Strategy

### Tier 1: Unit Tests (Core Logic)

Test utility functions in isolation:

```typescript
import { analyzeText } from "./lib/analyzer";

test("analyzeText counts words correctly", () => {
  const stats = analyzeText("hello world");
  expect(stats.wordCount).toBe(2);
});
```

### Tier 2: Component Tests (UI)

Test React components with real interactions:

```typescript
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ToolPage from "./page";

test("renders and accepts user input", async () => {
  render(<ToolPage />);
  const input = screen.getByRole("textbox");
  await userEvent.type(input, "test");
  expect(input.value).toBe("test");
});
```

### Tier 3: E2E Tests (Full Flow)

Test complete user workflows (with Playwright or similar):

```typescript
test("user inputs text, downloads file", async () => {
  await page.goto("/tools/word-counter");
  await page.fill("textarea", "hello world");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.click("button:has-text('Download')")
  ]);
  const path = await download.path();
  // Verify file content
});
```

### localStorage Integration Tests

Verify data persistence:

```typescript
test("localStorage persists across page refresh", async () => {
  // 1. Set localStorage
  localStorage.setItem("word-counter-text", "hello");
  
  // 2. Reload page (simulated)
  location.reload();
  
  // 3. Verify retrieval
  expect(localStorage.getItem("word-counter-text")).toBe("hello");
});
```

---

## Deployment Model

### Per-Tool Deployment

Since each tool is isolated, it can be deployed independently:

```bash
# Deploy only one tool
npm run deploy -- app/tools/word-counter/

# Deploy multiple tools
npm run deploy -- app/tools/word-counter/ app/tools/json-formatter/

# Deploy all tools
npm run deploy
```

### SEO Considerations

Each tool needs:

1. **Unique meta tags** — Different title + description per tool
2. **Canonical URL** — `<link rel="canonical" href="..."/>`
3. **Structured data** — JSON-LD schema (optional, nice to have)
4. **Sitemap entry** — Include in `sitemap.xml`
5. **robots.txt** — Allow `/tools/*` indexing

### Analytics Tracking

Each tool should track separately:

```typescript
// Google Analytics per-tool
gtag('event', 'tool_usage', {
  tool_name: 'word-counter',
  action: 'text_submitted',
  text_length: text.length,
});
```

---

## Migration Path: From Isolated to Package

If a tool becomes very popular, it can be migrated to a separate NPM package:

```bash
# Current state (isolated)
app/tools/word-counter/

# Future state (published package)
npm install @topaitoolrank/word-counter
```

The isolated architecture makes this migration seamless — no code changes needed.

---

## Checklist: Before Marking Tool Complete

Run the **ISOLATION_CHECKLIST.md** before marking any tool todo done:

- [ ] No imports from shared `lib/`, `components/`, `utils/`
- [ ] All CSS in tool's own `styles.css` with namespace scoping
- [ ] All localStorage keys prefixed with tool slug
- [ ] Tests passing (Unit + Component + E2E)
- [ ] Responsive on 320px–2560px
- [ ] SEO metadata exported
- [ ] Accessibility requirements met
- [ ] Performance targets met (<100KB bundle, <3s load)

---

## FAQ

**Q: Can tools share a utility function?**  
A: Technically yes, but not recommended. Copy-paste the function into each tool's `lib/`. This keeps tools completely independent.

**Q: Can two tools use the same localStorage key?**  
A: No. Keys must be tool-specific. Use pattern: `[tool-slug]-[data-type]`.

**Q: Can tools import React or other npm packages?**  
A: Yes, global npm packages are fine. Just don't create tool-specific dependencies.

**Q: Can tools make API calls?**  
A: Yes, but keep them tool-specific. If multiple tools need the same API, replicate the fetch call in each tool's `lib/`.

**Q: How do I extract a tool to a separate domain?**  
A: Copy the `app/tools/[tool-slug]/` folder to a new Next.js app. No code changes needed.

**Q: What about code duplication across tools?**  
A: Embrace it. Duplication keeps tools independent and extractable. Shared code creates hidden dependencies.

---

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2026-05-06 | 1.0 | Initial architecture documentation |

