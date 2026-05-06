# Micro-SaaS Tools Specification

**Domain**: Standalone utility tools for organic traffic generation  
**Scope**: 10 self-contained frontend tools with zero dependency on shared website infrastructure

---

## 1. Architecture Principle: Complete Tool Isolation

### 1.1 Folder Structure

Each tool lives in a completely isolated folder with zero dependency on shared website resources:

```
app/tools/[tool-name]/
├── page.tsx              # Entry point (required, single page)
├── layout.tsx            # Optional: tool-specific layout (NOT shared)
├── styles.css            # Tool-specific styles (NOT global)
├── assets/               # Tool-specific images, fonts, icons
├── lib/                  # Tool-specific utilities (NOT shared)
├── components/           # Tool-specific components (NOT shared)
└── README.md             # Tool documentation
```

**MUST**: No imports from `lib/` (project root), `components/` (project root), or shared styling.

**MUST**: No shared CSS variables, design tokens, or Tailwind configuration.

**MUST**: Each tool is completely functional in isolation — could be extracted to a standalone domain without modification.

### 1.2 CSS Isolation Strategy

Each tool MUST have its own `styles.css` that:

1. **Scopes all selectors** to the tool's root container via BEM or namespace
2. **Contains ALL styling** needed for the tool — no external CSS imports
3. **Uses only inline CSS custom properties** (no shared `globals.css` or design tokens)
4. **Declares brand colors inline** using the tool-specific palette

Example:

```css
/* app/tools/word-counter/styles.css */
.word-counter {
  --color-bg: #f5f5f5;
  --color-text: #333;
  --color-accent: #3b82f6;
  /* tool-specific palette */
}

.word-counter__input {
  background-color: var(--color-bg);
  color: var(--color-text);
}
```

**MUST NOT**: Import from `app/globals.css`.  
**MUST NOT**: Use `@layer` or Tailwind directives.  
**MUST NOT**: Reference CSS variables defined elsewhere.

### 1.3 JavaScript Dependencies

Each tool may use:

- **Browser APIs only** (native fetch, localStorage, DOM APIs)
- **Lightweight libraries** (<50KB uncompressed) at tool level only
- **No shared npm packages** from project `node_modules` (except universally available like React)

**MUST**: Declare all dependencies in `package.json` under the tool folder (optional, for documentation).

**MUST NOT**: Import utilities from `lib/` or `utils/` at project root.  
**MUST NOT**: Reference project-level constants, helpers, or services.

---

## 2. Tool Contracts

### 2.1 Page Structure

Every tool must export a single page component:

```typescript
// app/tools/[tool-name]/page.tsx

export default function ToolPage() {
  return (
    <div className="tool-root">
      {/* Tool UI entirely self-contained */}
    </div>
  );
}

// Optional: head metadata for SEO
export const metadata = {
  title: "[Tool Name] - Free Online Tool",
  description: "[Tool description for SEO]",
};
```

**MUST**: No authentication, login, or user session state.  
**MUST**: No redirects or navigation to other website sections.  
**MUST**: No cookies or external API calls (except optional LLM APIs for Wave 3 tools).

### 2.2 Styling Delivery

- **CSS file**: `styles.css` imported at top of `page.tsx`
- **Inline styles**: Allowed for dynamic styling
- **Tailwind**: BLOCKED — no `className="..."` Tailwind syntax

Example:

```typescript
import styles from "./styles.css";

export default function ToolPage() {
  return (
    <div className={styles.container}>
      {/* Tool UI */}
    </div>
  );
}
```

Or use raw HTML + `<style>` tag:

```typescript
export default function ToolPage() {
  return (
    <>
      <style>{`
        .tool-root { background: #fff; }
      `}</style>
      <div className="tool-root">
        {/* Tool UI */}
      </div>
    </>
  );
}
```

### 2.3 Data Handling

- **Input**: Form fields, file uploads, text areas — no database
- **Storage**: `localStorage` only (tool data persists across sessions)
- **Output**: Download as file, display on page, copy to clipboard

**MUST**: No server-side data storage.  
**MUST NOT**: Write to any database or API endpoint.

---

## 3. Wave-Specific Contracts

### 3.1 Wave 1: Frontend-Only (No APIs)

**Tools**: WhatsApp Message Formatter, WhatsApp Link Generator + QR, Word Counter

- **Complexity**: 2–3 hours per tool
- **Stack**: React page component + CSS file, zero backend
- **Features**: Input validation, real-time output, download/copy functionality
- **Dependencies**: None (or minimal like `qrcode.js` for QR)

### 3.2 Wave 2: Frontend-Only (Optional Lightweight APIs)

**Tools**: AI Prompt Generator, Email Subject Line Tester, UTM Link Builder

- **Complexity**: 3–4 hours per tool
- **Stack**: React page component + CSS file, optional simple utility APIs
- **Features**: Form inputs, processing, results display
- **Dependencies**: None

### 3.3 Wave 3: Backend Optional (LLM/PDF/Fetching APIs)

**Tools**: JSON Formatter, Business Name Generator, Invoice Generator, SEO Analyzer

- **Complexity**: 4–6 hours per tool
- **Stack**: React page component + CSS file, optional backend APIs for compute-heavy tasks
- **Features**: Advanced processing, file I/O, external API calls
- **Dependencies**: Allowed if tool-specific and isolated

---

## 4. Build Verification Checklist

For each tool, before marking complete:

1. **Folder is isolated**: No imports from project `lib/`, `components/`, `utils/`
2. **CSS is self-contained**: All styles in tool's `styles.css` or inline, no `globals.css`
3. **Brand colors are inline**: Tool has its own color palette, not shared tokens
4. **Page is functional standalone**: Tool works if extracted to separate domain
5. **No authentication**: No login flows, no user context, no cookies
6. **No database writes**: All data local to browser (`localStorage`)
7. **SEO metadata present**: Unique title and description in `metadata` export
8. **Mobile responsive**: Tool works on 320px–2560px viewport widths

---

## 5. Tool List (By Wave)

### Wave 1 (7–9 hours total)

1. **WhatsApp Message Formatter** — Markdown to WhatsApp syntax transformation
2. **WhatsApp Link Generator + QR** — URL + QR code generation
3. **Word Counter & Text Analyzer** — Real-time text statistics

### Wave 2 (8–11 hours total)

4. **AI Prompt Generator for Business** — Structured business prompt templates
5. **Email Subject Line Tester** — A/B testing suggestions
6. **UTM Link Builder** — Campaign tracking URL generator

### Wave 3 (16–21 hours total)

7. **JSON Formatter & Validator** — Format and validate JSON with error reporting
8. **Business Name Generator (AI)** — Generate startup names via LLM
9. **Invoice Generator (PDF)** — Create and download invoice PDFs
10. **Meta Tag / SEO Analyzer** — Fetch and analyze webpage meta tags

---

## 6. Monetization Funnel

Each tool's footer or sidebar includes:

- **"Powered by [Brand]"** link back to homepage
- **Optional CTA**: "Need bulk WhatsApp messaging? Try [WA Sender]"
- **Privacy notice**: No data collection, no tracking

**MUST**: CTA is non-intrusive (footer link, not modal popup).  
**MUST**: Tool functions identically with or without CTA.

---

## 7. Deployment & SEO

### 7.1 URL Structure

```
https://topaitoolrank.com/tools/[tool-slug]/

Examples:
  /tools/whatsapp-message-formatter/
  /tools/word-counter/
  /tools/json-formatter/
```

### 7.2 Meta Tags

Each tool MUST have:

```html
<meta name="description" content="[Tool description, <160 chars]">
<meta property="og:title" content="[Tool Name] - Free Online Tool">
<meta property="og:description" content="[Tool description]">
<meta property="og:image" content="/tools/[tool-slug]/preview.png">
<link rel="canonical" href="https://topaitoolrank.com/tools/[tool-slug]/">
```

### 7.3 Indexing

- **robots.txt**: Allow `/tools/*` for search engine crawling
- **Sitemap**: Include all tool URLs with lastmod date
- **Speed**: Tool MUST load and become interactive in <3 seconds on 4G

---

## 8. Code Quality Requirements

### 8.1 Accessibility

- **Keyboard navigation**: All inputs and buttons keyboard-accessible
- **ARIA labels**: Form inputs have associated labels
- **Color contrast**: Text meets WCAG AA (4.5:1 for normal text)
- **Mobile**: Touch targets ≥44px minimum

### 8.2 Error Handling

- **Input validation**: Invalid input shows helpful error message (not blank)
- **Graceful degradation**: Tool still works if optional features fail
- **Clear messaging**: Error text in plain language, not technical jargon

### 8.3 Performance

- **Bundle size**: Tool JS/CSS combined <100KB
- **Load time**: Interactive in <3 seconds on 4G
- **Memory**: No memory leaks in localStorage usage

---

## 9. Testing Contracts

Each tool MUST have:

- **Unit tests**: Core logic (formatting, calculation, parsing)
- **Component tests**: UI renders correctly, handles input/output
- **E2E tests**: Full user flow (input → process → output)

**MUST NOT**: Rely on shared test utilities or fixtures.

---

## Related Documents

- Analysis: `workspaces/micro-saas-tools/01-analysis/02-tool-deep-dives.md`
- Build order: `workspaces/micro-saas-tools/01-analysis/01-tool-opportunity-analysis.md`
