# TODO-602: Add Header and Footer to Blogs Layout

**Status**: ACTIVE  
**Severity**: CRITICAL  
**Effort**: 1 implementation cycle (~20 min)  
**Implements**: specs/layout-system-responsive-design.md § Header Visibility Across Pages; specs/tool-pages-header-footer.md  
**Depends on**: TODO-601 (scroll-padding-top must be in globals.css before adding the header to more pages, otherwise blogs will also have content hidden behind the header)  
**Blocks**: nothing

---

## Description

`app/blogs/layout.tsx` renders child content with no `<Header />` or `<Footer />`. The blog section is effectively a navigation dead-end: users who land on a blog post from search have no way to navigate to the homepage, tools, or contact section. Crawlers treat the blog as a separate disconnected site, breaking internal linking for SEO.

The fix is small — import and render the two components — but it must come after TODO-601 so the fixed header compensation is already in place.

---

## Acceptance Criteria

- [ ] `app/blogs/layout.tsx` imports `Header` from `@/app/components/Header`
- [ ] `app/blogs/layout.tsx` imports `Footer` from `@/app/lib/Footer`
- [ ] `<Header />` is rendered before the blog content wrapper
- [ ] `<Footer />` is rendered after the blog content wrapper
- [ ] Blog pages load without console errors related to the Header or Footer
- [ ] Navigation links in the Header work from blog pages (clicking "Home" goes to `/`)
- [ ] Blog content is not visually obscured by the fixed header (relies on scroll-padding-top from TODO-601)
- [ ] Footer appears at the bottom of blog pages

---

## Subtasks

- [ ] Confirm Header component path by checking an existing page that imports it (Est: 2 min) — Verification: `grep -r "import Header" app/` returns the correct path
- [ ] Confirm Footer component path (Est: 2 min) — Verification: `grep -r "import Footer" app/` returns the correct path
- [ ] Update `app/blogs/layout.tsx` with Header and Footer imports and renders (Est: 10 min) — Verification: file diff shows both imports and both components rendered
- [ ] Load a blog page in browser and verify nav + footer appear (Est: 5 min) — Verification: screenshot shows header at top, footer at bottom, content between

---

## Files to Change

| File | Change |
|------|--------|
| `app/blogs/layout.tsx` | Add Header import, Footer import, render both around children |

No new files required.

---

## Expected Result

```tsx
import Header from "@/app/components/Header";
import Footer from "@/app/lib/Footer";

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <div className="blog-content-wrapper">
        {children}
      </div>
      <Footer />
    </>
  );
}
```

The existing `className` on the wrapper (if any) should be preserved. The only additions are the two imports and the two component renders.

---

## Dependency Note

This todo MUST be implemented after TODO-601. If the scroll-padding-top fix is not in place, adding the fixed header to blog pages will hide the top of every blog post behind the nav bar. The dependency is not optional — implement in order.

---

## Definition of Done

- [ ] All acceptance criteria verified in browser
- [ ] No TypeScript errors (`npx tsc --noEmit` passes)
- [ ] Header and Footer render correctly on at least one blog post page
- [ ] Commit message: `fix(blogs): add Header and Footer to blog layout`
