# Discovery: CSS Global Leakage Root Cause Identified

**Date:** 2026-05-02  
**Type:** DISCOVERY  
**Impact:** Critical (affects article pages, tool pages)  
**Severity:** HIGH  

## Finding

The "green screen artifact" on article pages is caused by **global CSS injection of homepage-specific styles**. The file `public/css/style.css` (1100+ lines of `.navbar`, `.hero`, `.services`, `.footer` classes) is loaded on EVERY page via script injection in `app/layout.tsx` (lines 38-43).

**Current state:**
```typescript
// app/layout.tsx line 38-43 (PROBLEM)
<script src="/css/style.css" />  // Loads on every page, including /blogs/*
```

**Result:**
- Homepage `.hero` background color may bleed into article headers
- `.navbar` styles available to blog and tool pages (unexpected cascade)
- Two identical `* { reset }` rules (one in `globals.css`, one in `public/css/style.css`)
- Class name collisions possible between contexts

## Root Cause

The architecture treats the website as a single CSS namespace. There is no isolation between:
- Marketing pages (homepage, landing pages)
- Blog pages (article listing, individual articles)
- Tool pages (WA Sender, future tools)

CSS is either:
1. **Global** (loaded on every page via script injection)
2. **Per-component** (no isolation between components)
3. **Per-tool** (tool-specific CSS loaded alongside global CSS)

No mechanism to scope styles by route group.

## Solution

Use **Next.js route groups** as CSS boundaries:

```
app/
  (marketing)/
    layout.tsx                 ← wraps children in <div className="marketing-context">
    styles.css                 ← marketing-only styles (imported here, not globally)
  (blog)/
    layout.tsx                 ← wraps children in <div className="blog-context">
    styles.css                 ← blog-only styles
  (tools)/
    layout.tsx                 ← wraps children in <div className="tools-context">
    styles.css                 ← tools-only styles (shared by all tools)
  components/
    Button.module.css          ← CSS Modules (component-scoped)
    Modal.module.css
    ...
  globals.css                  ← Semantic tokens only (no context-specific rules)
```

**Key changes:**
1. Delete `public/css/style.css` script injection from root `app/layout.tsx`
2. Move homepage styles to `app/(marketing)/styles.css`
3. Move animation keyframes to route group CSS files
4. Context-specific CSS variables override semantic tokens via cascade
5. Component CSS uses CSS Modules (scoped, not global)

## Impact

**Before fix:**
- Article pages may show unintended homepage styles
- Blog headings inherit marketing typography overrides
- Tool pages polluted with marketing context styles

**After fix:**
- Article pages are clean (blog context only)
- Tool pages are clean (tools context only)
- Marketing pages have their own context
- No cross-context style leakage

## Validation

The fix is documented in **styling-architecture.md** with:
- Detailed layer architecture (tokens → overrides → components)
- Route group file structure
- CSS variable cascade mechanism
- Component token contract
- Validation checklist (7 concrete checks)

## Next Steps

1. **Implementation**: Move styles to route group layouts (`app/(marketing)/styles.css`, etc.)
2. **Conversion**: Convert component `.css` files to `.module.css` (CSS Modules)
3. **Validation**: Red team verifies no style leakage across contexts
4. **Deployment**: Deploy with confidence that styles are isolated by design

