# Component Library Specification

**Domain:** Shared components, tool-specific components, component organization  
**Authority:** Single source of truth for what components are shared vs isolated  
**Last Updated:** 2026-05-02  

## 1. Current State

**Status: Good separation between shared and blog components; tool is monolithic.**

### Shared Components (`app/components/`)

| Component      | File                    | CSS              | Usage                |
|---|---|---|---|
| Button         | Button.tsx              | Button.module.css    | Buttons across site  |
| Input          | Input.tsx               | Input.module.css     | Form inputs          |
| Label          | Label.tsx               | Label.module.css     | Form labels          |
| FormField      | FormField.tsx           | FormField.module.css | Form field wrapper   |
| Card           | Card.tsx                | Card.module.css      | Content cards        |
| Modal          | Modal.tsx               | Modal.module.css     | Dialog/overlay       |
| Badge          | Badge.tsx               | Badge.module.css     | Status/tag display   |
| Avatar         | Avatar.tsx              | Avatar.module.css    | User avatars         |

**Barrel export:** `app/components/index.ts`

**Assessment:** Good — components are truly shared (neutral styling, no domain logic).

### Blog-Specific Components (`app/components/blog/`)

| Component        | File              | Purpose                    |
|---|---|---|
| ArticleCard      | ArticleCard.tsx   | Blog listing card          |
| ArticleHeader    | ArticleHeader.tsx | Article hero + metadata    |
| ArticleBody      | ArticleBody.tsx   | MDX content renderer       |
| TableOfContents  | TOC.tsx           | Sticky sidebar TOC         |
| ShareButtons     | ShareButtons.tsx  | Social share buttons       |
| ScrollProgressBar | ScrollProgressBar.tsx | Reading progress indicator |
| RelatedArticles  | RelatedArticles.tsx | Related post links         |

**Barrel export:** `app/components/blog/index.ts`

**Assessment:** Good — blog components are domain-specific, not importable by tools.

### Tool-Specific Components (WA Sender — PROBLEM)

**Status: Monolithic single-file component**

- `app/tools/wa-sender/page.tsx` — ~500+ lines, all UI + logic in one place
- Uses shared components: Button, Modal, Badge
- No decomposition into smaller components
- Difficult to test individual features
- Difficult to reuse parts in a future UI redesign

---

## 2. Target Architecture (Post-Implementation)

### Tier 1: Shared Components (Truly Reusable)

**Path:** `app/components/`  
**Rule:** No domain logic, no tool-specific styling, neutral design  
**Usage:** Every context (marketing, blog, tools) can use these

**Components:**
- Button, Input, Label, FormField (form primitives)
- Card, Modal, Badge, Avatar (content containers)
- Loading, Toast, Tooltip (feedback)
- Navigation, Tabs, Dropdown (navigation patterns)

**Constraint:** No dependency on tool-specific types, APIs, or features.

### Tier 2: Context-Specific Components

**Path:** `app/components/{context}/` where context ∈ {blog, marketing}  
**Rule:** Domain logic specific to that context  
**Usage:** Only available to routes in that context

**Blog Components:**
- ArticleCard, ArticleHeader, ArticleBody, TableOfContents, ShareButtons, ScrollProgressBar, RelatedArticles

**Marketing Components (new):**
- HeroSection, FeatureCard, CTA, Testimonial, PricingTable
- (These are marketing-specific, not reusable in tools)

### Tier 3: Tool-Specific Components

**Path:** `app/tools/{tool-name}/components/`  
**Rule:** Tool's internal component hierarchy  
**Usage:** Only available within that tool  
**Constraint:** Can use Tier 1 + Tier 2 components, but NOT share with other tools

**WA Sender Components (decomposed from monolith):**

```
app/tools/wa-sender/
  page.tsx                          ← root page, composes tool UI
  components/
    WASenderShell.tsx               ← ToolShell wrapper (auth gating)
    WASenderDashboard.tsx           ← main dashboard layout
    MessageComposer.tsx             ← message drafting
    ConversationList.tsx            ← conversations sidebar
    ConversationDetail.tsx          ← active conversation view
    TemplateManager.tsx             ← template CRUD
    SettingsPanel.tsx               ← tool settings
    AnalyticsChart.tsx              ← WA-Sender-specific chart
    wa-sender.module.css            ← all WA Sender styles
```

**Tool B Components (future, shows pattern):**

```
app/tools/tool-b/
  page.tsx
  components/
    ToolBShell.tsx
    ToolBFeatureA.tsx
    ToolBFeatureB.tsx
    tool-b.module.css
```

---

## 3. Shared Component Contract

Every Tier 1 (shared) component MUST:

1. **Accept polymorphic content** — use React.ReactNode or children prop
2. **Be unstyled** — appearance determined by context via CSS variables
3. **Have no hardcoded strings** — labels and text passed as props
4. **Have no API calls** — callbacks passed as props
5. **Be accessible** — proper ARIA attributes, semantic HTML

**Example: Modal Component**

```typescript
// GOOD — truly shared, no domain assumptions
export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  closeButton?: boolean;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeButton = true,
}: ModalProps) {
  if (!open) return null;
  
  return (
    <div className={styles.modal} data-size={size}>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.content}>
        {closeButton && (
          <button className={styles.close} onClick={onClose}>×</button>
        )}
        {title && <h2 className={styles.title}>{title}</h2>}
        <div className={styles.body}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  );
}

// BAD — makes assumptions about domain
export function Modal({
  open,
  onClose,
}: ModalProps) {
  return (
    <div>
      <button onClick={onClose}>Close WA Sender Dialog</button>
      {/* hardcoded text, specific to WA Sender */}
      <p>Type your message below:</p>
    </div>
  );
}
```

---

## 4. ToolShell Pattern (Auth Gating + Chrome)

New tools don't need custom auth middleware or shell layout code. Instead, they use the `ToolShell` wrapper which handles:
- Auth validation (middleware already ran, but shell double-checks)
- Consistent header/footer/navigation chrome
- Tool-scoped session hook
- Loading and error states

**Structure:**

```typescript
// app/tools/wa-sender/components/WASenderShell.tsx
import { useWASenderSession } from '../hooks/useWASenderSession';
import { ToolShell } from '@/app/components/ToolShell';

export function WASenderShell({ children }: { children: React.ReactNode }) {
  const session = useWASenderSession();
  
  if (!session) {
    return <ToolShell.Error message="Authentication required" />;
  }
  
  return (
    <ToolShell
      toolName="WA Sender"
      toolId="wa-sender"
      session={session}
      navigation={[
        { label: 'Dashboard', href: '/tools/wa-sender' },
        { label: 'Templates', href: '/tools/wa-sender/templates' },
        { label: 'Settings', href: '/tools/wa-sender/settings' },
      ]}
    >
      {children}
    </ToolShell>
  );
}
```

```typescript
// app/tools/wa-sender/page.tsx
import { WASenderShell } from './components/WASenderShell';
import { WASenderDashboard } from './components/WASenderDashboard';

export default function WASenderPage() {
  return (
    <WASenderShell>
      <WASenderDashboard />
    </WASenderShell>
  );
}
```

**ToolShell provides:**

```typescript
// app/components/ToolShell.tsx
export interface ToolShellProps {
  toolName: string;
  toolId: string;
  session: AuthSession;
  navigation: NavigationItem[];
  children: React.ReactNode;
}

export function ToolShell({
  toolName,
  toolId,
  session,
  navigation,
  children,
}: ToolShellProps) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <h1>{toolName}</h1>
        <nav>
          {navigation.map(item => (
            <a key={item.href} href={item.href}>{item.label}</a>
          ))}
        </nav>
        <UserMenu session={session} toolId={toolId} />
      </header>
      <main className={styles.main}>
        {children}
      </main>
      <footer className={styles.footer}>
        {/* Tool-agnostic footer */}
      </footer>
    </div>
  );
}
```

**When Tool B is added:**

1. Tool B imports `ToolShell` (no new code needed)
2. Tool B creates `ToolBShell.tsx` wrapper with Tool B–specific navigation
3. Tool B's page renders `<ToolBShell><ToolBDashboard /></ToolBShell>`
4. Zero changes to shared components or auth system

---

## 5. Component Import Rules

### Allowed Imports

| From                                | To                           | Allowed? | Why                          |
|---|---|---|---|
| Shared components (`Button`)        | Any tool component           | ✅ YES   | Neutral, reusable            |
| Shared components (`Button`)        | Blog component               | ✅ YES   | Neutral, reusable            |
| Blog components (`ArticleCard`)     | Another blog component       | ✅ YES   | Same context                 |
| Blog components (`ArticleCard`)     | WA Sender component          | ❌ NO    | Blog-specific, not portable  |
| WA Sender components (`MessageComposer`) | Blog component       | ❌ NO    | Tool-specific, not portable  |
| WA Sender components (`MessageComposer`) | Tool B component      | ❌ NO    | Tool-specific, isolated      |
| Tool B components                   | WA Sender component          | ❌ NO    | Different tools, isolated    |

**Enforcement:** Linting rule `no-cross-tool-imports` blocks violations at commit time.

---

## 6. Component Folder Structure (Expanded)

```
app/
  components/
    index.ts                          ← barrel export (shared only)
    Button.tsx
    Button.module.css
    Input.tsx
    Input.module.css
    Modal.tsx
    Modal.module.css
    ToolShell.tsx                     ← NEW: tool wrapper pattern
    ToolShell.module.css
    blog/
      index.ts
      ArticleCard.tsx
      ArticleCard.module.css
      ArticleHeader.tsx
      ArticleHeader.module.css
      ...
    marketing/                        ← NEW: marketing context components
      index.ts
      HeroSection.tsx
      HeroSection.module.css
      FeatureCard.tsx
      FeatureCard.module.css
      ...
  tools/
    wa-sender/
      page.tsx
      components/
        WASenderShell.tsx             ← wraps the page in auth + chrome
        WASenderDashboard.tsx
        MessageComposer.tsx
        ConversationList.tsx
        wa-sender.module.css
      hooks/
        useWASenderSession.ts
      api/
        [route].ts
    tool-b/
      page.tsx
      components/
        ToolBShell.tsx
        ToolBDashboard.tsx
        tool-b.module.css
      hooks/
        useToolBSession.ts
      api/
        [route].ts
```

---

## 7. Navigation Component (Shared, But Context-Aware)

The navigation bar is context-aware:
- Marketing pages: shows logo + main nav + CTA button
- Blog pages: shows logo + breadcrumb + search
- Tool pages: shows tool name + tool-specific nav (via ToolShell)

**Implementation (NOT hardcoded in one place):**

```typescript
// app/(marketing)/components/MarketingNav.tsx
// Only loaded in marketing context
export function MarketingNav() {
  return (
    <nav className={styles.nav}>
      <Logo />
      <NavLinks links={MARKETING_NAV_ITEMS} />
      <CTAButton>Get Started</CTAButton>
    </nav>
  );
}

// app/(blog)/components/BlogNav.tsx
// Only loaded in blog context
export function BlogNav() {
  return (
    <nav className={styles.nav}>
      <Logo />
      <BlogSearch />
      <NavBreadcrumb />
    </nav>
  );
}

// app/components/ToolShell.tsx includes nav via props
// Passed by each tool
export function ToolShell({
  navigation,
  ...props
}: ToolShellProps) {
  return (
    <nav>
      {navigation.map(item => (
        <NavLink key={item.href} href={item.href}>{item.label}</NavLink>
      ))}
    </nav>
  );
}
```

**Why not one global Navigation component?** Each context has different navigation needs. A global component would need so many conditional branches it becomes unmaintainable.

---

## 8. Validation Checklist

Before shipping any component:

- [ ] Shared components have no domain logic
- [ ] Shared components accept content as props (children or children-like)
- [ ] Shared components have no hardcoded strings (except common labels: "Close", "OK")
- [ ] Tool-specific components live in `app/tools/{tool}/components/`
- [ ] Tool components import ToolShell for auth gating
- [ ] No cross-tool imports (Tool A component ≠ Tool B component)
- [ ] Components use CSS Modules, not global Tailwind classes
- [ ] Every context (blog, marketing, tools) has its own navigation variant
- [ ] No shared auth hook imported by shared components (auth is tool-scoped)
- [ ] Tool pages are wrapped in ToolShell (not left bare)
- [ ] Blog components not imported by tool components

---

## 9. Extension for New Tools (Without Code Changes)

When Tool B is added:

1. Create `app/tools/tool-b/components/` directory
2. Create `ToolBShell.tsx` that imports shared `ToolShell` component
3. Decompose tool UI into smaller components within `components/`
4. Each component uses shared components (`Button`, `Modal`, etc.)
5. Tool B's `page.tsx` renders `<ToolBShell><ToolBDashboard /></ToolBShell>`

**Zero changes to:**
- Shared components
- Blog components
- WA Sender components
- Design system
- Authentication

---

## 10. Component Quality Standards

Every component MUST have:

1. **TypeScript Props Interface** — full type safety
2. **JSDoc Comment** — one-line description and example
3. **Accessibility** — ARIA labels, semantic HTML, keyboard navigation
4. **Error Boundary** — graceful fallback for unexpected props

**Example:**

```typescript
/**
 * Renders a dismissible alert banner.
 * 
 * @example
 * <Alert level="info" onClose={() => setShowAlert(false)}>
 *   Feature released!
 * </Alert>
 */
export interface AlertProps {
  level: 'info' | 'success' | 'warning' | 'error';
  children: React.ReactNode;
  onClose?: () => void;
  dismissible?: boolean;
}

export function Alert({
  level,
  children,
  onClose,
  dismissible = true,
}: AlertProps) {
  return (
    <div 
      className={styles.alert} 
      data-level={level}
      role="alert"
      aria-live="polite"
    >
      <div className={styles.content}>{children}</div>
      {dismissible && onClose && (
        <button 
          onClick={onClose}
          aria-label="Dismiss alert"
          className={styles.close}
        >
          ×
        </button>
      )}
    </div>
  );
}
```

