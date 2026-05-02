# Current State Analysis

**Date:** 2026-05-02  
**Scope:** Design system, green screen artifact, auth, components, CSS, data model

---

## 1. Design System

**Status: Partially exists, recently introduced.**

A CSS custom properties design system is defined in `app/globals.css` (lines 10-114):

- **Color palette** with semantic tokens (`--color-accent`, `--color-success`, `--color-error`, etc.)
- **Typography scale** using `clamp()` for responsive sizing
- **Spacing system** (8px base: `--spacing-xs` through `--spacing-4xl`)
- **Shadow/elevation system** (4 levels)
- **Border radius tokens**
- **Legacy aliases** mapping old variable names to new tokens (e.g., `--primary-color: var(--color-accent)`)

**Weaknesses:**
- No documented branding kit (colors, usage guidelines, do/don't)
- No context-specific subsystems (blog vs tools vs marketing use the same tokens without guidance)
- The homepage (`app/page.tsx`) uses raw HTML class names (`.hero`, `.credibility-strip`, `.services`) styled entirely from `public/css/style.css` — NOT using the design system components
- Two parallel styling systems coexist: the design system in `globals.css` and the legacy homepage styles in `public/css/style.css`

**Key files:**
- `app/globals.css` — design system tokens + base resets
- `public/css/style.css` — legacy homepage-specific styles (navbar, hero, services, footer)
- `public/css/animations.css` — homepage animation keyframes

---

## 2. Green Screen Artifact

**Root cause hypothesis (requires visual confirmation):**

No literal green color is applied to article page elements via CSS. The `.article-header-hero` container uses `background: var(--color-bg-light)` (`#fafafa`, light grey) as a fallback while the hero image loads.

**Most likely causes (in order of probability):**

1. **Hero image placeholder/loading state** — The `<Image>` component in `ArticleHeader.tsx` (line 25-33) renders inside a container with `aspect-ratio: 16/9` and `background: var(--color-bg-light)`. If the hero image path in frontmatter points to a missing/broken file, or if the image has a green/teal dominant color used by Next.js blur placeholder, this would appear as a "green screen."

2. **Global CSS bleeding** — `public/css/style.css` and `public/css/animations.css` are loaded on EVERY page via the root layout's script injection (`app/layout.tsx` lines 38-43). The homepage `.hero` section styles (including the `.pulse-dot` with green `#22c55e` background and green box-shadow glow) are globally available. If any article page accidentally includes markup matching `.hero` or `.pulse-dot` class names, green would appear.

3. **WebGL fallback** — `public/js/scene.js` creates a Three.js scene with dark navy background (`0x0a0e27`). On GPUs where WebGL fails, canvas elements can render as green rectangles (known browser behavior). However, `scene.js` appears to only load on the homepage where `#canvas-3d` exists.

**Recommended investigation:** Open an article page in browser DevTools, inspect the top section for unexpected background colors or failed image loads.

---

## 3. Auth Architecture

**Status: Tool-specific, localStorage-based, NO isolation.**

The entire auth system is a single file: `lib/useAuth.ts`

**Architecture:**
- Client-side only (no middleware, no server-side session validation)
- Stores credentials in `localStorage` with `wa-sender-` prefix keys:
  - `wa-sender-user-id`
  - `wa-sender-user-email`
  - `wa-sender-access-token`
  - `wa-sender-refresh-token`
- Returns `session` object with `{ userId, email, accessToken, refreshToken }`
- No token validation, no expiry checks, no refresh logic
- No middleware.ts exists at project root (no server-side route protection)

**Isolation problems:**
- Auth is nominally WA-Sender-scoped (key prefix `wa-sender-`) but the hook is in a shared `lib/` directory, importable by any tool
- No concept of "tool-scoped tokens" — a single user identity is shared
- No server-side auth enforcement — any API route can be accessed without auth
- Adding a second tool would require either duplicating the hook with different key prefixes or building a multi-tool auth system from scratch

**Blog/article pages have zero auth** — they are fully public.

---

## 4. Component Organization

**Shared components** (`app/components/`):
| Component | File | CSS |
|-----------|------|-----|
| Button | Button.tsx | Button.css |
| Input | Input.tsx | Input.css |
| Label | Label.tsx | Label.css |
| FormField | FormField.tsx | FormField.css |
| Card | Card.tsx | Card.css |
| Modal | Modal.tsx | Modal.css |
| Badge | Badge.tsx | Badge.css |
| Avatar | Avatar.tsx | Avatar.css |

Barrel export: `app/components/index.ts`

**Blog-specific components** (`app/components/blog/`):
| Component | Purpose |
|-----------|---------|
| ArticleCard | Blog listing card |
| ArticleHeader | Article hero + metadata |
| ArticleBody | MDX content renderer |
| TableOfContents | Sidebar TOC |
| ShareButtons | Social share |
| ScrollProgressBar | Reading progress |
| RelatedArticles | Related post links |

Barrel export: `app/components/blog/index.ts`

**Tool-specific** (`app/tools/wa-sender/`):
- Everything in a single `page.tsx` (monolithic ~500+ line client component)
- Imports shared components: `Button`, `Modal`, `Badge`
- Tool-specific CSS: `wa-sender.css`

**Assessment:** Good separation between shared and blog components. WA Sender is a monolith that needs decomposition. No shared navigation component — homepage has inline nav markup.

---

## 5. CSS Architecture

**Strategy: Hybrid (Tailwind + CSS custom properties + per-component CSS files + legacy global CSS)**

| Layer | Files | Scope |
|-------|-------|-------|
| Tailwind | `globals.css` (@tailwind directives) | Available everywhere |
| Design tokens | `globals.css` (:root variables) | Global cascade |
| Component CSS | `app/components/*.css` | Per-component, co-located |
| Blog CSS | `app/components/blog/*.css` + `app/blogs/*.css` | Blog-specific |
| Tool CSS | `app/tools/wa-sender/wa-sender.css` | Tool-specific |
| Legacy global | `public/css/style.css` + `public/css/animations.css` | Loaded on ALL pages |
| Shared keyframes | `app/components/components.css` | Imported in layout |

**Critical problem: Style leakage**

`public/css/style.css` (1100+ lines of homepage styles) is loaded on EVERY page via the root layout's script injection. This means:
- `.navbar`, `.hero`, `.services`, `.footer` styles are available on blog and tool pages
- Any class name collision between homepage CSS and tool/blog CSS would cause conflicts
- The file contains a second `* { margin: 0; padding: 0; box-sizing: border-box; }` reset that duplicates `globals.css`

**No CSS isolation mechanism** — no CSS modules, no scoped styles, no shadow DOM. Isolation is purely by class name convention.

---

## 6. Data Model

**Blog/Articles:**
- File-based (MDX files in `content/blog/`)
- Parsed at build time via `gray-matter`
- Schema defined in `app/lib/blog-types.ts`:
  - `BlogFrontmatter`: title, slug, description, excerpt, dates, category, tags, pillar, heroImage, author (name/role/avatar), featured, status, readingTime
  - `BlogPost`: extends frontmatter with content + headings + wordCount
- No database for articles — pure static generation

**Users (WA Sender):**
- Auth tokens stored in client localStorage
- Backend (Supabase implied by `next-auth` in node_modules) — but no visible Supabase client configuration in the app code audited
- No visible user table schema or database client code in `app/lib/`

**No shared user model** — articles are anonymous/public, WA Sender has its own isolated user concept.

---

## Summary of Gaps

| Area | Current State | Gap |
|------|--------------|-----|
| Design system | CSS tokens exist | No documentation, no context rules, no component guidelines |
| Green screen | Unknown CSS cause | Needs visual debugging — likely image load or global CSS bleed |
| Auth | Client-only, WA-Sender-specific | No isolation, no server enforcement, no multi-tool design |
| Components | Good shared library | No navigation component, WA Sender is monolithic |
| CSS | Hybrid with leakage | `public/css/style.css` loaded globally, no isolation |
| Data model | File-based blog, client-side auth | No unified user model, no database schema visible |
| Navigation | Inline in homepage only | Blog/tool pages have no nav (or rely on `public/js/main.js`) |
