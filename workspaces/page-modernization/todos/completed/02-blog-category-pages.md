# 02-blog-category-pages

**Implements**: specs/blog-indexing.md § 2. Category Index Pages, § 6. Content Pipeline Updates  
**Depends On**: 01-blog-tag-pages (for async `getAllPosts()` change)  
**Capacity**: ~120 LOC load-bearing logic / 3 invariants (static generation, CATEGORIES allowlist validation, draft filtering) / 2 call-graph hops (`getAllPosts` → filter → render) / Generates static category index pages at build time with build-time frontmatter validation against the approved CATEGORIES list.  
**Status**: ACTIVE

## Context

Posts have a `category` field in frontmatter but there is no way to browse by category. This todo implements `/blogs/category/[category]` static pages. It also introduces build-time frontmatter validation so that posts with invalid categories fail the build rather than silently missing from index pages.

Depends on todo 01 because `getAllPosts()` must be async first. Can be implemented in the same session immediately after 01.

## Scope

**DO:**
- Create `app/(blog)/category/[category]/page.tsx` with `generateStaticParams` and `generateMetadata`
- Export a `CATEGORIES` constant from `app/lib/blog.ts` — the authoritative list per spec:
  ```
  "AI Tools", "Development", "Tutorial", "Tool Review", "Case Study",
  "News & Updates", "How-To Guide", "Comparison", "Opinion"
  ```
- Add `validateFrontmatter(post)` function in `app/lib/blog.ts` that throws a descriptive error if `category` is not in `CATEGORIES`, `title` is empty, `slug` is invalid, `description` exceeds 160 chars, `status` is not "published" or "draft", or `publishedAt` is not a valid ISO date
- Call `validateFrontmatter` inside `getAllPosts()` so build fails on invalid posts
- Filter: only `status === 'published'`; category match is exact (no slug normalization needed — categories are stored as exact strings, not slug-form)
- Render filtered posts using existing `ArticleCard` component
- Add canonical link, OpenGraph metadata, and JSON-LD CollectionPage schema

**DO NOT:**
- Modify the CATEGORIES list beyond what the spec defines (9 entries including the 2 existing ones)
- Add tag pages (todo 01)
- Add search (todo 05)
- Implement slug normalization for categories — they use exact frontmatter values as URL segments

## Deliverables

**Create:**
- `app/(blog)/category/[category]/page.tsx` — static category index page

**Modify:**
- `app/lib/blog.ts` — add `CATEGORIES` constant; add `validateFrontmatter()` function; call validation in `getAllPosts()`

**Tests:**
- `__tests__/blog-category-pages.test.ts` — unit tests for validation logic and page filtering

## Testing

**Unit tests (Tier 1):**
- `test_validate_frontmatter_rejects_unknown_category` — post with `category: "Podcasts"` throws build error
- `test_validate_frontmatter_accepts_existing_categories` — `"AI Tools"` and `"Development"` pass validation
- `test_validate_frontmatter_rejects_description_over_160_chars` — throws with post where description is 161 chars
- `test_validate_frontmatter_rejects_empty_title` — throws with empty string title
- `test_validate_frontmatter_rejects_invalid_date` — throws with `publishedAt: "not-a-date"`
- `test_category_page_excludes_draft_posts` — draft post does not appear in filtered list
- `test_generate_static_params_returns_only_categories_with_posts` — category with no published posts is not in `generateStaticParams` output (avoids 404 on `/blogs/category/Comparison` if no comparison posts yet)

**Manual checks:**
- Run `next build` with an intentionally broken post (bad category) — verify build fails with clear error message naming the file
- Visit `/blogs/category/AI Tools` in dev server — see correct post list
- View source: canonical URL is correct; JSON-LD type is "CollectionPage"

## Implementation Notes

- Category values in the URL are the raw frontmatter category string (e.g., `"AI Tools"` → URL `/blogs/category/AI%20Tools`). This differs from tags which use slugified forms. The spec is explicit: categories are exact-match filtered.
- Build failure on invalid frontmatter is intentional per spec §6 — this prevents silent data loss where miscategorized posts simply disappear.
- The error thrown in `validateFrontmatter` MUST include the post's file path, e.g., `"Post at content/blogs/my-post.mdx has invalid category 'Podcasts'. Must be one of: AI Tools, Development, ..."`. This makes the build error actionable.
- `generateStaticParams` derives categories dynamically from published posts — do NOT hardcode the CATEGORIES list as static params. That would generate empty pages for categories with no posts.
