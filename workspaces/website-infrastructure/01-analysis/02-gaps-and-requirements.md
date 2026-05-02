# Gaps and Requirements Report

**Date:** 2026-05-02  
**Source:** Current state analysis + infrastructure brief  
**Complexity:** Moderate (score: 16 — Governance 4 + Legal 2 + Strategic 5 + Technical 5)

---

## 1. Design System Requirements

### What Exists (Good)
- CSS custom properties in `globals.css` with semantic tokens
- Typography scale using `clamp()` for responsive sizing
- Spacing system (8px base), shadow/elevation, border radius tokens
- Legacy aliases bridging old variable names to new tokens

### What's Missing (Gaps)

| Gap | Impact | Priority |
|-----|--------|----------|
| No context-specific token subsets (blog/tools/marketing) | All contexts look the same or diverge without guidance | HIGH |
| No usage documentation or branding kit | Developers guess which tokens to use | MEDIUM |
| Homepage uses `public/css/style.css` instead of design system | Two parallel systems, drift guaranteed | HIGH |
| No component usage guidelines (when to use Card vs raw div) | Inconsistent UI across tools | MEDIUM |

### Context-Specific Rules Required

**Blog context:**
- Typography-first: body text at 18px/1.7 line-height, max-width 720px prose column
- Muted UI chrome — no competing visual elements against content
- Tokens: `--blog-prose-width`, `--blog-line-height`, `--blog-heading-scale`
- Components allowed: ArticleCard, ArticleHeader, TOC, ShareButtons (no tool components)

**Tools context:**
- Dense, interactive UI: smaller type (14-16px), tighter spacing, more visual weight on controls
- High-contrast action states (hover, active, disabled clearly distinct)
- Tokens: `--tool-panel-bg`, `--tool-input-height`, `--tool-density`
- Each tool MAY override tool-context tokens within its own scope

**Marketing context:**
- Brand-forward: large type, generous whitespace, hero imagery, animation
- Tokens: `--marketing-hero-height`, `--marketing-section-gap`
- Full-bleed sections, background treatments, CTAs

### Success Criteria
- [ ] Shared token layer serves all 3 contexts without modification
- [ ] Each context has a documented subset defining which tokens + components apply
- [ ] New article renders correctly with zero CSS additions
- [ ] New tool inherits tool-context defaults without importing blog styles

---

## 2. Auth Architecture Requirements

### What Exists (Good)
- Basic auth hook (`lib/useAuth.ts`) with localStorage persistence
- Key prefix pattern (`wa-sender-`) shows intent for scoping

### What's Missing (Gaps)

| Gap | Impact | Priority |
|-----|--------|----------|
| Client-side only, no server validation | Any API route accessible without auth | CRITICAL |
| No token expiry/refresh logic | Stale tokens never invalidated | HIGH |
| Single namespace — adding Tool B requires new hook or refactor | Blocks tool scaling | HIGH |
| No middleware.ts for route protection | Zero server-side enforcement | CRITICAL |
| No concept of tool-scoped permissions | Tool A token grants Tool B access | HIGH |
| No user identity model (just localStorage strings) | Cannot audit, revoke, or scope | MEDIUM |

### Required Architecture

```
                    ┌─────────────────────────────────┐
                    │     Shared Auth Layer            │
                    │  middleware.ts (route-level)     │
                    │  /api/auth/* (token mint/verify) │
                    └────────┬────────────┬───────────┘
                             │            │
                   ┌─────────▼──┐   ┌─────▼──────────┐
                   │  Tool A     │   │  Tool B         │
                   │  Scope:     │   │  Scope:         │
                   │  wa-sender  │   │  tool-b         │
                   │  Own tokens │   │  Own tokens     │
                   └─────────────┘   └─────────────────┘
```

**Key design decisions:**
1. `middleware.ts` at project root — validates JWT on all `/tools/*` routes
2. JWT payload includes `scope: "wa-sender"` claim — tool-scoped access
3. Each tool registers its scope in a tool manifest (`app/tools/[tool]/manifest.ts`)
4. Shared identity (email/userId) but scoped authorization (tool access is per-tool)
5. Token stored in HttpOnly cookie (not localStorage) for server-side access

### What MUST Change
- Move from localStorage to HttpOnly cookies with server-side JWT validation
- Add `middleware.ts` protecting `/tools/*` and `/api/tools/*` routes
- JWT must include `tool_scope` claim; API routes reject mismatched scopes
- Add token refresh endpoint with rotation

### What Can Stay
- Supabase as identity provider (if already configured)
- Email/password as auth method
- Blog pages remain fully public (no auth)

### Success Criteria
- [ ] Tool A's token cannot call Tool B's API routes (scope rejection returns 403)
- [ ] Expired tokens return 401, client redirects to login
- [ ] No credentials in localStorage (HttpOnly cookies only)
- [ ] Adding Tool B requires zero changes to Tool A's auth code

---

## 3. CSS Architecture Requirements

### What Exists (Good)
- Design tokens in `globals.css` (well-structured)
- Per-component CSS files co-located with components
- Tool-specific CSS in tool directory (`wa-sender.css`)
- Blog-specific CSS in blog component directory

### What's Missing (Gaps)

| Gap | Impact | Priority |
|-----|--------|----------|
| `public/css/style.css` loaded on ALL pages (1100+ lines) | Style leakage to blog/tools | CRITICAL |
| No CSS isolation mechanism (no modules, no scoping) | Class name collisions inevitable | HIGH |
| Duplicate global reset in `style.css` | Specificity conflicts | MEDIUM |
| Homepage uses raw class names not in design system | Two parallel systems | HIGH |
| No strategy for tool CSS independence | New tools inherit unwanted styles | HIGH |

### Required Architecture

```
Layer 1: globals.css          (tokens + Tailwind + reset — loads everywhere)
Layer 2: context CSS          (blog.css / tools.css / marketing.css — loads per route group)
Layer 3: component CSS        (Button.css, Modal.css — co-located, no global selectors)
Layer 4: tool-scoped CSS      (wa-sender.css — CSS modules or [data-tool] scoping)
```

**Isolation strategy:** CSS Modules for tool components. Each tool's `page.tsx` imports `styles from './tool.module.css'`. Class names are hashed, cannot collide.

### What MUST Change
1. Move `public/css/style.css` content into route-group-scoped CSS (only loads on homepage)
2. Convert tool CSS to CSS Modules (`wa-sender.module.css`)
3. Remove `public/css/style.css` and `public/css/animations.css` from root layout
4. Add route group layouts: `app/(marketing)/layout.tsx`, `app/(blog)/layout.tsx`, `app/tools/layout.tsx`

### What Can Stay
- `globals.css` token layer (already well-structured)
- Per-component CSS files for shared components (already isolated by convention)
- Tailwind utility usage

### Success Criteria
- [ ] Removing `public/css/style.css` from root layout causes zero visual regression on blog/tool pages
- [ ] New tool added with its own `.module.css` cannot affect other tools
- [ ] Blog article renders identically before and after CSS restructure
- [ ] No `*` reset outside `globals.css`

---

## 4. Component Library Requirements

### What Exists (Good)
- Clear separation: `app/components/` (shared) vs `app/components/blog/` (blog-specific)
- Barrel exports for both shared and blog components
- Tool components live in tool directory

### What's Missing (Gaps)

| Gap | Impact | Priority |
|-----|--------|----------|
| No shared navigation component | Homepage nav is inline HTML, blog/tools have none or use JS | HIGH |
| No shared footer component | Duplicated or missing across contexts | MEDIUM |
| WA Sender is monolithic (~500 LOC single file) | Cannot reuse sub-components, hard to maintain | MEDIUM |
| No tool component interface/contract | Each tool reinvents layout, headers, error states | HIGH |
| No tool shell (common tool wrapper: sidebar, header, auth gate) | Every tool builds its own chrome | HIGH |

### Truly Shared Components (use across all contexts)
- Button, Input, Label, FormField (form primitives)
- Card, Modal, Badge, Avatar (display primitives)
- **NEW NEEDED:** Navbar, Footer, ToolShell, ErrorBoundary, LoadingState

### Context-Isolated Components
- **Blog:** ArticleCard, ArticleHeader, ArticleBody, TOC, ShareButtons, ScrollProgress, RelatedArticles
- **Tool (per-tool):** All internal tool UI lives in `app/tools/[tool-name]/components/`
- **Marketing:** Hero, ServiceGrid, CredibilityStrip, CTASection

### Tool Shell Pattern (new requirement)
```
app/tools/layout.tsx          → ToolShell (auth gate + tool nav + common chrome)
app/tools/[tool]/page.tsx     → Tool content
app/tools/[tool]/components/  → Tool-specific components
app/tools/[tool]/manifest.ts  → { name, scope, description, icon }
```

### Success Criteria
- [ ] Adding a new tool requires: directory + page.tsx + manifest.ts (no shared code changes)
- [ ] ToolShell provides auth gate, consistent header, error handling automatically
- [ ] Blog components never imported by tools; tool components never imported by blog
- [ ] Shared component changes tested against all 3 contexts

---

## 5. Scalability Gaps — "What Happens When Tool B Is Added?"

### Current State: Tool B Cannot Be Added Cleanly

| Question | Current Answer | Required Answer |
|----------|---------------|-----------------|
| Can Tool B deploy independently? | No — monolithic Next.js app | No (acceptable for now) — but zero-touch addition within the monolith |
| Can Tool B share auth? | Only by duplicating useAuth.ts with different prefix | Yes — shared auth layer with tool-scoped tokens |
| Can Tool B use different styling? | Yes, but inherits 1100 lines of homepage CSS leakage | Yes — CSS Modules, no leakage |
| Does Tool B affect Tool A? | Risk: shared localStorage, global CSS, no isolation | No interference possible |
| Can Tool B have its own API routes? | Yes (`app/api/tools/tool-b/`) | Yes — with middleware enforcing scope |

### Interference Vectors (Risks)

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| CSS class collision between tools | High | Medium — visual bugs | CSS Modules per tool |
| Auth token shared between tools | High | High — data leakage | Tool-scoped JWT claims |
| Global state pollution (localStorage) | Medium | High — session confusion | Namespace enforcement in auth layer |
| Shared component breaking change | Medium | High — multiple tools break | Versioned component API, visual regression tests |
| `public/css/style.css` breaking tool layout | High | Medium — visual bugs | Remove from root layout, scope to marketing |
| API route without auth check | High | Critical — unauthorized access | middleware.ts enforces auth on all `/api/tools/*` |

### What Prevents Interference (Required Boundaries)

1. **Route group isolation:** `(marketing)`, `(blog)`, `tools` — each with own layout
2. **CSS Modules:** Tool CSS cannot leak (hashed class names)
3. **Auth middleware:** Rejects cross-tool token usage at server level
4. **Tool manifest:** Declares tool's scope, required permissions, route prefix
5. **No shared mutable state:** No global localStorage keys without tool prefix

---

## Risk Register

| Risk | Likelihood | Impact | Level | Mitigation |
|------|-----------|--------|-------|------------|
| Auth bypass (no server validation) | High | Critical | **Critical** | Add middleware.ts immediately |
| Cross-tool data access via shared token | High | High | **Critical** | JWT scope claim + server enforcement |
| Style leakage from `public/css/style.css` | High | Medium | **Major** | Move to route-group-scoped loading |
| Green screen artifact eroding trust | Medium | Medium | **Significant** | Diagnose in implementation phase |
| Component coupling preventing tool addition | Medium | High | **Major** | ToolShell pattern + manifest contract |
| No token expiry enabling stale sessions | High | Medium | **Major** | JWT expiry + refresh rotation |

---

## Implementation Priority

**Phase 1 (Critical — blocks all else):**
1. Add `middleware.ts` with JWT validation on `/tools/*`
2. Move `public/css/style.css` out of root layout into `(marketing)` route group
3. Create route groups: `(marketing)`, `(blog)`, `tools`

**Phase 2 (Required — enables scaling):**
4. Implement tool-scoped JWT with `scope` claim
5. Convert tool CSS to CSS Modules
6. Create ToolShell layout component with auth gate
7. Define tool manifest contract

**Phase 3 (Quality — completes architecture):**
8. Document design system with context-specific guidelines
9. Decompose WA Sender monolith into components
10. Add shared Navbar/Footer components
11. Fix green screen artifact
12. Add visual regression tests for cross-context isolation
