# Styling Architecture Specification

**Domain:** CSS organization, isolation, context-specific overrides  
**Authority:** Single source of truth for CSS strategy, preventing style leakage, component contracts  
**Last Updated:** 2026-05-02  

## 1. Current State

**Status: Hybrid system with critical leakage.**

- Design tokens defined in `app/globals.css` (CSS custom properties)
- Tailwind CSS available globally via `globals.css` @tailwind directives
- Two parallel styling systems:
  - Design tokens + base resets in `globals.css`
  - Legacy homepage styles in `public/css/style.css` (1100+ lines)
- **CRITICAL ISSUE:** `public/css/style.css` is loaded on EVERY page via script injection in `app/layout.tsx` (lines 38-43)
- No CSS isolation mechanism (no CSS Modules, no scoped styles, no shadow DOM)
- Isolation is purely by class name convention (fragile, easy to break)

**Leakage problems:**
- `.navbar`, `.hero`, `.services`, `.footer` classes from `public/css/style.css` are available on blog and tool pages
- Any class name collision between contexts causes unpredictable overrides
- `* { margin: 0; padding: 0; box-sizing: border-box; }` is duplicated (once in `globals.css`, once in `public/css/style.css`)

---

## 2. Target Architecture (Post-Implementation)

### Layer 1: Design Tokens (Semantic, Shared)

**File:** `app/globals.css`  
**Scope:** Global cascade (available everywhere)  
**Mutability:** Immutable (shared by all contexts)

Semantic tokens remain unchanged (colors, shadows, typography scale, spacing):

```css
:root {
  /* Colors */
  --color-primary: #3b82f6;
  --color-secondary: #8b5cf6;
  --color-accent: #f59e0b;
  --color-success: #10b981;
  --color-error: #ef4444;
  --color-info: #06b6d4;

  /* Neutrals */
  --color-bg-light: #fafafa;
  --color-bg-default: #ffffff;
  --color-bg-dark: #1f2937;
  --color-text-primary: #111827;
  --color-text-secondary: #6b7280;
  --color-border: #e5e7eb;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
  --shadow-xl: 0 20px 25px rgba(0,0,0,0.1);

  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-2xl: 3rem;
  --spacing-4xl: 6rem;

  /* Border radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-full: 9999px;

  /* Typography */
  --font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-serif: Georgia, serif;
  --font-mono: 'Fira Code', monospace;
  --line-height-tight: 1.2;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;
  --line-height-prose: 1.8;
}
```

### Layer 2: Context-Specific Overrides (Via Route Groups)

**Route Groups:** `(marketing)`, `(blog)`, `(tools)`  
**Scope:** CSS custom properties with context-specific values  
**Mechanism:** Context root element gets a CSS class that overrides tokens via cascade

**Structure:**
```
app/
  (marketing)/
    layout.tsx          ← wraps children in <div className="marketing-context">
    page.tsx
    styles.css          ← only marketing styles, imports globals
  (blog)/
    layout.tsx          ← wraps children in <div className="blog-context">
    page.tsx
    [slug]/
      page.tsx
    styles.css          ← only blog styles
  (tools)/
    layout.tsx          ← wraps children in <div className="tools-context">
    wa-sender/
      page.tsx
    styles.css          ← only tools styles
  components/
    Button.css          ← shared, uses semantic tokens only
    Modal.css           ← shared, uses semantic tokens only
    ...
```

**Marketing context override (`(marketing)/styles.css`):**

```css
.marketing-context {
  /* Override tokens for marketing pages */
  --preferred-font-family: var(--font-sans);
  --body-line-height: var(--line-height-normal);
  --section-spacing: var(--spacing-4xl);
  --hero-min-height: 100vh;
  --accent-color-aggressive: var(--color-primary);
}

.marketing-context .hero {
  height: var(--hero-min-height);
  background: linear-gradient(...);
  color: white;
  padding: var(--section-spacing);
}
```

**Blog context override (`(blog)/styles.css`):**

```css
.blog-context {
  /* Override tokens for blog pages */
  --preferred-font-family: var(--font-serif);
  --body-line-height: var(--line-height-prose);
  --content-max-width: 72ch;
  --section-spacing: var(--spacing-2xl);
  --text-color: var(--color-text-primary);
  --background-color: var(--color-bg-light);
}

.blog-context .article-prose {
  font-family: var(--preferred-font-family);
  line-height: var(--body-line-height);
  max-width: var(--content-max-width);
  background: var(--background-color);
  color: var(--text-color);
  padding: var(--spacing-lg);
}
```

**Tools context override (`(tools)/styles.css`):**

```css
.tools-context {
  /* Override tokens for tool pages */
  --preferred-font-family: var(--font-sans);
  --body-line-height: var(--line-height-normal);
  --content-max-width: 100%;
  --section-spacing: var(--spacing-lg);
  --compact-mode: true;
}

.tools-context .tool-container {
  display: flex;
  gap: var(--spacing-md);
  line-height: var(--body-line-height);
}
```

### Layer 3: Component-Level CSS (CSS Modules Per Component)

**Files:** `app/components/*.module.css` (not `*.css`)  
**Scope:** Component only (module-scoped, no cascade)  
**Rule:** Component tokens MUST reference Layer 1 (semantic tokens), never raw hex

**Example: `app/components/Button.module.css`**

```css
.button {
  background-color: var(--color-primary);
  color: white;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  border: none;
  cursor: pointer;
  font-family: var(--preferred-font-family, var(--font-sans));
  transition: background-color 200ms ease;
}

.button:hover {
  background-color: var(--color-primary-dark, #2563eb);
}

.button:disabled {
  background-color: var(--color-text-secondary);
  cursor: not-allowed;
}

.button--secondary {
  background-color: var(--color-secondary);
}

.button--small {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: 0.875rem;
}
```

**Usage in component:**

```typescript
import styles from './Button.module.css';

export function Button({ children, variant, ...props }) {
  const className = [
    styles.button,
    variant === 'secondary' ? styles['button--secondary'] : null,
  ].filter(Boolean).join(' ');
  
  return <button className={className} {...props}>{children}</button>;
}
```

**Why CSS Modules?** Scope prevents class name collisions. `.button` in WA Sender doesn't collide with `.button` in a different tool.

---

## 3. Fix: Remove Global CSS Leakage

### Action 1: Retire `public/css/style.css`

- Move all necessary homepage styles into `app/(marketing)/styles.css`
- Delete the script injection from `app/layout.tsx` (lines 38-43)
- Update `app/(marketing)/layout.tsx` to import `./styles.css` only (not globally)

**Before:**
```typescript
// app/layout.tsx
<script src="/css/style.css" />  // WRONG — loads on every page
```

**After:**
```typescript
// app/(marketing)/layout.tsx
import './styles.css';  // RIGHT — loads only for marketing routes

export default function MarketingLayout({ children }) {
  return <div className="marketing-context">{children}</div>;
}
```

### Action 2: Delete `public/css/animations.css` global injection

- Move animation keyframes into route group–specific CSS files
- `app/(marketing)/styles.css` includes marketing-only animations
- Shared animations (if any) move to `app/globals.css`

### Action 3: Verify Article Pages Are Clean

After removal:
- Article pages should show no green screen artifact
- Article background should be `var(--color-bg-light)` (from design-system)
- No unexpected navbar, footer, or homepage styles

---

## 4. Component-Level Token Contract

Every component MUST declare its tokens. Example:

```typescript
// app/components/Modal.tsx
import styles from './Modal.module.css';

export function Modal({ children, open, onClose }) {
  return (
    <dialog className={styles.dialog} open={open}>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.content}>{children}</div>
    </dialog>
  );
}
```

```css
/* app/components/Modal.module.css */
/* Token declarations: what this component needs from the design system */

.dialog {
  --modal-bg: var(--color-bg-default);
  --modal-border: var(--color-border);
  --modal-shadow: var(--shadow-lg);
  --modal-padding: var(--spacing-lg);
  
  background: var(--modal-bg);
  border: 1px solid var(--modal-border);
  box-shadow: var(--modal-shadow);
  padding: var(--modal-padding);
  border-radius: var(--radius-lg);
  /* Never use raw colors: #ffffff, #000, etc. */
}

.overlay {
  background: rgba(0, 0, 0, 0.5);
  /* Only rgba for overlays is acceptable (opacity-based) */
}

.content {
  color: var(--color-text-primary);
}
```

**Rule:** Components MUST use CSS variables. Raw hex colors are BLOCKED.

---

## 5. Context-Specific Rules (Summary)

### Blog Context (`(blog)` route group)

- **Font:** Georgia serif for body, Inter sans for headings
- **Line-height:** 1.8 (generous for prose)
- **Max-width:** 72 characters (optimal prose column width)
- **Spacing:** 4rem between sections (airy feel)
- **Colors:** Light backgrounds (#fafafa), dark text (#1a202c), blue links (#06b6d4)
- **Components:** No modals (page-based dialogs only), minimal styling for share buttons, TOC in sidebar

### Tools Context (`(tools)` route group)

- **Font:** Inter sans-serif for all text (dense, scannable)
- **Line-height:** 1.5 (compact)
- **Max-width:** 100% (fill available space)
- **Spacing:** 2rem between sections (compact)
- **Colors:** White backgrounds, accent orange for CTAs (#f59e0b), red for errors
- **Components:** Modals allowed, forms with real-time validation, tables for data, no serif fonts

### Marketing Context (`(marketing)` route group)

- **Font:** Large bold sans-serif (48-64px hero text)
- **Line-height:** 1.4 (tight, impactful)
- **Max-width:** Full viewport (sections full-bleed)
- **Spacing:** 6-8rem between sections (generous whitespace)
- **Colors:** Brand primary color aggressively used, full-bleed colored sections
- **Components:** Large hero section required, prominent CTA buttons, feature cards, full-width layout

---

## 6. CSS Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                  app/globals.css                         │
│         (Semantic tokens: colors, spacing, etc.)        │
│         Tailwind directives, base resets                │
└────────────────┬──────────────────────────────────────┬─┘
                 │                                        │
        ┌────────▼──────────┐                   ┌────────▼──────────┐
        │ (marketing)/      │                   │ (blog)/           │
        │ layout.tsx        │                   │ layout.tsx        │
        │ styles.css        │                   │ styles.css        │
        │ (overrides)       │                   │ (overrides)       │
        └────────┬──────────┘                   └────────┬──────────┘
                 │                                        │
        ┌────────▼──────────────────────────────────────▼────────┐
        │         Shared Components (CSS Modules)                 │
        │         Button.module.css, Modal.module.css, etc.       │
        │         (Use semantic tokens, no context overrides)     │
        └────────────────────────────────────────────────────────┘
                 │
        ┌────────▼──────────┐          ┌────────────────────────┐
        │ (tools)/          │          │ (tools)/wa-sender/     │
        │ layout.tsx        │          │ wa-sender.module.css   │
        │ styles.css        │          │ (tool-specific only)   │
        │ (overrides)       │          │                        │
        └───────────────────┘          └────────────────────────┘
```

---

## 7. Validation Checklist

Before shipping any page:

- [ ] No global CSS loaded via script injection (only imports in route group layouts)
- [ ] All colors use CSS variables (not raw hex)
- [ ] Typography follows context rules (serif for blog, sans for tools)
- [ ] Spacing uses `--spacing-*` tokens (no magic numbers)
- [ ] Shadows use `--shadow-*` tokens (4 levels only)
- [ ] Components use CSS Modules (`.module.css`)
- [ ] Component CSS references semantic tokens (no raw colors)
- [ ] Context-specific overrides documented in route group CSS files
- [ ] No inline `style=` attributes on elements
- [ ] No Tailwind utility classes in component JSX (use CSS Modules instead)
- [ ] Article pages show no styles from homepage/marketing context
- [ ] Tool pages show no styles from blog/marketing context
- [ ] Marketing pages only load their own styles

---

## 8. Extension for New Tools

When Tool B is added:

1. Create `app/(tools)/tool-b/` directory
2. Create `app/(tools)/tool-b/tool-b.module.css` with tool-specific styles
3. Tool B components import `tool-b.module.css` (not global styles)
4. `app/(tools)/layout.tsx` applies `.tools-context` class to the entire tools subtree (shared)
5. No changes to `globals.css`, shared components, or blog/marketing contexts

---

## 9. Preventing Style Leakage (Defense-in-Depth)

### Strategy 1: CSS Modules (Scope)

- Component CSS is module-scoped, no cascade outside
- Class name collision is impossible (`Button` in WA Sender ≠ `Button` in Tool B)

### Strategy 2: Route Groups (Layout Isolation)

- Each context gets its own layout and styles file
- Importing styles in layout (not globally) ensures context-specific styles only load when needed

### Strategy 3: CSS Variables (Semantic Naming)

- Tokens are named by purpose, not context (e.g., `--color-primary`, not `--marketing-button-color`)
- Overrides happen via CSS custom properties, not class-level mutations
- No class name conflicts possible

### Strategy 4: BEM / Explicit Scoping

- All component classes prefixed with component name (BEM): `.button__text`, `.modal__overlay`
- Reduces accidental name collisions even further

### Strategy 5: Automated Validation

- Lint rule checks for raw hex/rgb colors in CSS files
- Pre-commit hook rejects CSS without variables
- CI blocks merges with global CSS injection

---

## 10. Migration Path

**Phase 1 (Immediate — this session):**
- Delete script injection from `app/layout.tsx`
- Move homepage styles to `app/(marketing)/styles.css`
- Verify article pages have no green screen

**Phase 2 (Implementation):**
- Convert all component CSS files to CSS Modules
- Replace Tailwind utilities with CSS Module classes
- Document component token contracts

**Phase 3 (Validation):**
- Red team verifies no style leakage
- Audit all CSS files for raw colors
- Test each context independently

