# Todo 001: Refactor Homepage to Server Component for SEO Metadata

**Implements**: `specs/tool-pages-seo-metadata.md` § Homepage metadata  
**Priority**: 🚨 CRITICAL  
**Dependency**: None  
**Effort**: 2-3 hours  
**Session**: 1

## Description

The homepage (`app/page.tsx`) is a full client component (`"use client"`), which prevents exporting a `metadata` object. This causes Google to index the homepage with generic fallback metadata from the root layout instead of SEO-optimized, keyword-targeted metadata.

Refactor the homepage to be server-renderable while maintaining interactive features.

## Acceptance Criteria

- [ ] `app/page.tsx` or a new server layout exports a `metadata` object with:
  - Title targeting "free AI tools" / "AI tools directory" / "2026" keywords (under 60 chars)
  - Description with "free", "online", "no sign-up" (150-160 chars)
  - Keywords array with 5-10 relevant terms
  - Open Graph tags (title, description, image, url, type: "website")
  - Twitter Card tags
- [ ] Interactive components (animated rings, floating chips, text transitions) remain functional
- [ ] `app/page.tsx` no longer contains `"use client"` at the top (or moved to child components only)
- [ ] Build succeeds with `npm run build` (40/40 pages generated)
- [ ] TypeScript type checking passes (`tsc --noEmit`)
- [ ] No console errors on homepage load
- [ ] Metadata renders correctly (visible in page source `<head>`)

## Implementation Notes

**Option 1**: Create wrapper layout
- Create `app/(marketing)/layout.tsx` as server component
- Move homepage under `app/(marketing)/page.tsx`
- Export metadata from the layout
- Move interactive components to child client components

**Option 2**: Convert to server component + client children
- Refactor `app/page.tsx` to be server component
- Extract animated sections to separate client components (`<HeroAnimation />`, `<ToolCards />`, etc.)
- Export metadata at page level

**Option 3**: Use Dynamic imports with Suspense
- Keep page as server component
- Use `next/dynamic` to lazy-load interactive components
- Export metadata at page level

Choose Option 1 (recommended for clean separation of concerns).

## Metadata Template

```typescript
export const metadata: Metadata = {
  title: "Free AI Tools Directory | Top Rated AI Tools 2026",
  description: "Discover and compare 100+ free AI tools for writing, coding, design, and more. No sign-up required. Reviewed and ranked by AI experts.",
  keywords: ["free AI tools", "online AI tools", "AI tools directory", "best AI tools 2026", "free online tools"],
  openGraph: {
    title: "Free AI Tools Directory | Top Rated 2026",
    description: "Discover 100+ free AI tools for every task. No sign-up required.",
    url: DOMAIN,
    type: "website",
    images: [{ url: `${DOMAIN}/og-images/homepage.jpg`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free AI Tools Directory | Top Rated 2026",
    description: "100+ free AI tools for writing, coding, design, and more.",
    images: [`${DOMAIN}/og-images/homepage.jpg`],
  },
};
```

## Related Todos

- **Todo 004**: Add Organization schema to homepage (depends on this)
- **Todo 012**: Add hero image to homepage (optional, can be parallel)

## Testing

```bash
npm run build
# Verify: 40/40 pages generated, no TypeScript errors

curl https://localhost:3000 | grep -A5 "<head>"
# Verify: <title>, <meta name="description">, <meta property="og:*"> tags present

npx tsc --noEmit
# Verify: no type errors
```

## Rollback Plan

Keep the original `app/page.tsx` logic in a backup file. If refactor causes issues, can revert by restoring original logic to a properly-scoped server component.

---

**Status**: Ready to implement  
**Estimated Traffic Impact**: +15-25% CTR on homepage searches  
**Related Finding**: F-01 in seo-audit-comprehensive.md

