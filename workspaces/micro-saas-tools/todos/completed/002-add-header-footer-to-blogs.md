# Todo 002: Add Header and Footer to Blogs Layout

**Priority**: 🔴 CRITICAL (Blocking blog navigation)  
**Effort**: ~10 minutes (1 focus block)  
**Depends on**: Todo 001 (scroll-padding-top must be in place first)  
**Implements**: `specs/layout-system-responsive-design.md` § Header Visibility Across Pages

## Description

The blogs section (`app/blogs/`) currently renders without header or footer, leaving users with no navigation. The layout file only imports styles and renders children. Users cannot navigate to other sections (home, tools, contact) from blog pages.

## Acceptance Criteria

- [ ] `app/blogs/layout.tsx` imports Header component from `@/app/components/Header`
- [ ] `app/blogs/layout.tsx` imports Footer component from `@/app/tools/lib/Footer`
- [ ] Header renders as first child (before `.blog-context`)
- [ ] Footer renders as last child (after `.blog-context`)
- [ ] Visual test: Load `/blogs/` → Header visible at top with navigation menu
- [ ] Visual test: Scroll to bottom → Footer visible
- [ ] Navigation test: Click "Home" in header → navigates to `/#home`
- [ ] Navigation test: Click "Tools" dropdown → tool links visible
- [ ] No console errors

## Changes Required

### File: `app/blogs/layout.tsx`

Replace entire file:

```tsx
import Header from "@/app/components/Header";
import Footer from "@/app/tools/lib/Footer";
import React from "react";
import "../(blog)/styles.css";

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <div className="blog-context">{children}</div>
      <Footer />
    </>
  );
}
```

## Implementation Notes

- **Header import**: `@/app/components/Header` (global path, not relative)
- **Footer import**: `@/app/tools/lib/Footer` (global path)
- **Fragment wrapper**: Use `<>` to avoid extra DOM nesting
- **Order**: Header → blog-context → Footer (matches all other page layouts)
- **No style changes needed**: Existing `.blog-context` styles remain unchanged

## Testing Plan

1. Load `http://localhost:3000/blogs/`
2. Verify Header appears at top with "Top AI Tool Rank" logo
3. Verify navigation menu items visible (Home, Services, Tools, Blogs, Contact)
4. Verify Footer appears at bottom with links and copyright
5. Click a navigation link (e.g., "Tools") → dropdown appears with tool list
6. Click "Home" → page scrolls to `/#home` (homepage hero)

## Dependencies

- **Depends on**: Todo 001 (scroll-padding-top must be set so header doesn't cover blog content)

## Next

→ Todo 003: Implement Invoice PDF Export (can run in parallel with this)
