# Micro-SaaS Tool Development

## Overview

This skill guides the development of isolated, discoverable micro-SaaS tools following the architecture proven across 9 tools (WhatsApp Message Formatter, Word Counter, JSON Formatter, Email Subject Tester, AI Prompt Generator, UTM Link Builder, Invoice Generator, SEO Analyzer, WhatsApp Link Generator).

Each tool is:
- **Completely isolated** (no shared imports, self-contained styles)
- **Browser-based** (zero backend API requirements)
- **Discoverable** (homepage grid + dropdown navigation)
- **Tested** (Vitest integration tests)
- **Accessible** (ARIA labels on form inputs)

---

## Tool Architecture

### Folder Structure

```
app/tools/[tool-name]/
├── page.tsx              # React component (required)
├── styles.css            # Tool-specific CSS (required)
├── lib/                  # Tool utilities (optional, isolated)
├── components/           # Tool-specific React components (optional)
└── assets/              # Icons, images (optional)
```

### page.tsx Template

```typescript
"use client";

import { useState } from "react";
import styles from "./styles.css";  // MUST import own styles

export default function ToolPage() {
  // Tool implementation
  return (
    <div className={styles["tool-container"]}>
      {/* UI */}
    </div>
  );
}

// MUST include metadata for SEO
export const metadata = {
  title: "[Tool Name] - Free Online Tool",
  description: "[Unique description, <160 chars]",
  keywords: ["keyword1", "keyword2"],
};
```

### styles.css Template

```css
:root {
  --tool-color-bg: #f3f4f6;
  --tool-color-text: #111827;
  --tool-color-accent: #3b82f6;
}

.tool-container {
  background-color: var(--tool-color-bg);
  padding: 24px;
  max-width: 1000px;
  margin: 0 auto;
}

.tool__input {
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
}

.tool__button {
  background-color: var(--tool-color-accent);
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
```

**Key Rules:**
- NO `@tailwind`, NO `className="flex bg-blue"` (Tailwind BLOCKED)
- NO imports from `app/globals.css` or shared styling
- NO shared CSS variables — define all inline
- Use BEM namespace: `.tool__element` not `.element`

---

## Data Persistence Pattern

### localStorage Isolation

Each tool gets a unique key prefix to prevent collisions:

```typescript
// json-formatter/page.tsx
const STORAGE_KEY_PREFIX = "jf-"; // UNIQUE per tool

// Save
localStorage.setItem(`${STORAGE_KEY_PREFIX}formatted`, jsonString);

// Load with try/catch
function loadFromStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error("localStorage load failed:", error);
    return null;
  }
}
```

**Key Prefixes (Established):**
- `jf-` → JSON Formatter
- `wc-` → Word Counter
- `est-` → Email Subject Tester
- `apg-` → AI Prompt Generator
- `ulb-` → UTM Link Builder
- `ig-` → Invoice Generator
- `sa-` → SEO Analyzer
- `wlg-` → WhatsApp Link Generator
- `wam-` → WhatsApp Message Formatter

If adding new tool: **CHOOSE UNIQUE 2-3 LETTER PREFIX, NOT USED ABOVE**

---

## Homepage Integration Checklist

When a tool is ready for launch:

1. **Add to Tools dropdown** (`app/page.tsx` line ~74):
   ```tsx
   <li>
     <a href="/tools/your-tool-slug" rel="noopener">
       Tool Display Name
     </a>
   </li>
   ```

2. **Add to tools grid** (`app/page.tsx` line ~280):
   ```tsx
   <article className="tool-card reveal delay-N">
     <div>
       <span className="tool-badge">Live</span>
       <h3>Tool Display Name</h3>
       <p>One-line description of tool value.</p>
     </div>
     <a href="/tools/your-tool-slug" className="tool-link">
       Try Tool →
     </a>
   </article>
   ```

3. **Verify links work** (click from homepage, check tool loads)

---

## Testing Pattern

### Integration Test Structure

```typescript
// tests/tools/[tool-name]/[tool-name].integration.test.ts

import { expect, describe, it } from 'vitest';

describe('[Tool Name] Integration', () => {
  describe('Core Functionality', () => {
    it('should [core behavior]', () => {
      // Test main feature
      expect(result).toBeTruthy();
    });
  });

  describe('Data Persistence', () => {
    it('should save to localStorage', () => {
      // Test localStorage
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid input gracefully', () => {
      // Test error case
    });
  });
});
```

### Test Checklist Per Tool

- [ ] ≥1 integration test file exists
- [ ] Tests pass (`npm test -- --run`)
- [ ] Core functionality covered (not just "renders")
- [ ] Error cases tested (invalid input, edge cases)
- [ ] localStorage operations tested (if applicable)

---

## Accessibility Baseline

**REQUIRED for WCAG AA compliance:**

```typescript
// Form inputs MUST have labels
<label htmlFor="input-id">Field Label</label>
<input id="input-id" type="text" />

// OR use aria-label
<input aria-label="Search term" type="text" />

// Buttons MUST have descriptive text
<button>Download Report</button>  // ✓ Good
<button>OK</button>               // ✗ Vague

// Links MUST indicate destination
<a href="/page">Learn more about pricing</a>  // ✓ Clear
<a href="/page">Click here</a>                 // ✗ Vague
```

**Performance Baseline:**
- Load time: <3s on 4G (check Lighthouse)
- Bundle size: <100KB per tool (CSS + JS)
- Responsive: 320px–2560px viewport

---

## Common Patterns Across Tools

### Input Processing

```typescript
// Capture + Validate
const [input, setInput] = useState('');
const [error, setError] = useState('');

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value;
  setInput(value);
  
  // Validate
  if (!value.trim()) {
    setError('Input required');
  } else {
    setError('');
  }
};

// Process with debounce for expensive operations
const debouncedProcess = useMemo(
  () => debounce((text: string) => {
    try {
      const result = processInput(text);
      setOutput(result);
    } catch (err) {
      setError(err.message);
    }
  }, 500),
  []
);
```

### Output Display + Export

```typescript
// Copy to clipboard
async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    setCopyMessage('✓ Copied!');
    setTimeout(() => setCopyMessage(''), 2000);
  } catch (error) {
    console.error('Copy failed:', error);
  }
}

// Download as file
function downloadAsFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
```

---

## Deployment & SEO

### URL Structure

```
https://topaitoolrank.com/tools/[tool-slug]/

Examples:
/tools/json-formatter/
/tools/word-counter/
/tools/email-subject-tester/
```

### robots.txt & Sitemap

Tools are automatically discoverable via Google if:
- `robots.txt` allows `/tools/*` (check `public/robots.txt`)
- Sitemap includes tool URLs (check deployment docs)

### Google Indexing

Each tool gets organic traffic from:
- Direct search ("JSON formatter online", "word counter free", etc.)
- Google Discover (trending tools)
- Featured Snippets (if tool solves a common question)

**To maximize indexing:**
- Unique, descriptive metadata (title + description)
- Tool solves a real, high-volume search query
- Page loads in <3s (Core Web Vitals)

---

## Quality Checklist (Red Team Audit)

| Criterion | Check |
|-----------|-------|
| **Isolation** | No `import from '@/'` or shared CSS ✓ |
| **Homepage** | Tool visible in dropdown + grid ✓ |
| **Metadata** | Unique title + description ✓ |
| **Styling** | BEM namespaced, no Tailwind ✓ |
| **localStorage** | Unique prefix, try/catch wrapped ✓ |
| **Tests** | ≥1 integration test, passing ✓ |
| **Accessibility** | Form inputs labeled ✓ |
| **Performance** | <3s load, <100KB bundle ✓ |

---

## Reference

- **Spec**: `specs/micro-saas-tools.md` — Detailed contracts and requirements
- **Homepage**: `app/page.tsx` — Where tools are listed
- **Test Example**: `tests/tools/json-formatter/json-utils.test.ts`
- **Validator Agent**: `.claude/agents/project/micro-saas-tools-validator.md`

---

**Last Updated**: 2026-05-06  
**Tools Live**: 9 (WhatsApp Message Formatter, Word Counter, JSON Formatter, Email Subject Tester, AI Prompt Generator, UTM Link Builder, Invoice Generator, SEO Analyzer, WhatsApp Link Generator)  
**Test Coverage**: 8/9 tools (89%)  

