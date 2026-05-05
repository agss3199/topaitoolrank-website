# 01-blog-tag-pages

**Implements**: specs/blog-indexing.md § 1. Tag Index Pages  
**Depends On**: None  
**Capacity**: ~150 LOC load-bearing logic / 3 invariants (static generation, URL-safe slugs, draft filtering) / 2 call-graph hops (`getAllPosts` → filter → render) / Generates static tag index pages at build time, filtering published posts by URL-safe tag slugs, with SEO metadata.  
**Status**: ACTIVE

## Context

The blog currently has no way to browse posts by tag. Users and search engines have no aggregation surface for topics like "AI Agents" or "Code Generation." This todo implements `/blogs/tag/[tag]` static pages that list all published posts for a given tag, generated at build time so there is no runtime database cost.

This is the first piece of the blog scalability track (Phase 2A). It has no dependencies on WA Sender work and can run in parallel.

## Scope

**DO:**
- Create `app/(blog)/tag/[tag]/page.tsx` with `generateStaticParams` and `generateMetadata`
- Implement tag slugification: `"AI Agents"` → `ai-agents` (lowercase, spaces to hyphens, remove non-alphanumeric except hyphens)
- Filter posts: only `status === 'published'` included; draft posts excluded
- Render filtered post list using existing `ArticleCard` component
- Add canonical link, OpenGraph metadata, and JSON-LD CollectionPage schema per post collection
- Make `getAllPosts()` in `app/lib/blog.ts` async (deliberate breaking change documented in plan and journal entry 0001)
- Add `slugifyTag(tag: string): string` utility to `app/lib/blog.ts`

**DO NOT:**
- Add database queries — all data from MDX frontmatter
- Implement search on this page (that is todo 05)
- Implement category pages (that is todo 02)
- Modify the existing `app/(blog)/[slug]/page.tsx` article pages
- Create new CSS files — reuse existing blog grid layout classes

## Deliverables

**Create:**
- `app/(blog)/tag/[tag]/page.tsx` — static tag index page

**Modify:**
- `app/lib/blog.ts` — make `getAllPosts()` async; add `slugifyTag()` utility function

**Tests:**
- `__tests__/blog-tag-pages.test.ts` — unit tests for slug generation and page filtering

## Testing

**Unit tests (Tier 1):**
- `test_slugify_tag_converts_spaces_to_hyphens` — `slugifyTag("AI Agents")` returns `"ai-agents"`
- `test_slugify_tag_removes_punctuation` — `slugifyTag("Web3 & Blockchain")` returns `"web3-blockchain"`
- `test_slugify_tag_lowercases` — `slugifyTag("Code Generation")` returns `"code-generation"`
- `test_tag_page_excludes_draft_posts` — page with `status: draft` post does not appear in filtered list
- `test_tag_page_includes_only_matching_tag` — post tagged `["AI", "Agents"]` does NOT appear on `/blogs/tag/ai`
- `test_generate_static_params_returns_unique_tags` — duplicate tags across posts result in single static route entry

**Manual checks:**
- Run `next build` and verify `/blogs/tag/ai-tools` is in the output (check `.next/server/app/(blog)/tag/`)
- Visit `/blogs/tag/ai-tools` in dev server — renders ArticleCard list with correct posts
- View source: canonical link points to absolute URL; JSON-LD type is "CollectionPage"
- Verify 404 on `/blogs/tag/nonexistent-tag` (Next.js default for missing static param)

## Implementation Notes

- Tag slugification MUST be consistent: the same slug is used in both `generateStaticParams` (producer) and the filter in the page component (consumer). Use the same `slugifyTag()` function in both places.
- `getAllPosts()` going async is intentional per the plan's critical fix list (journal 0001 §7). Callers in existing article pages will need `await` added. Verify all call sites.
- The spec shows `decodeURIComponent(params.tag)` before filtering — the tag from the URL is slug-form (`ai-agents`), but posts store human-readable tags (`"AI Agents"`). The filter must slug-normalize the post's tags before comparing, not decode to human-readable.
- OpenGraph image: use first post's `hero` image, fallback to site default if no posts or no hero.
- JSON-LD CollectionPage: `hasPart` references each article's URL and name.
- Do not hard-code the base URL — read from `NEXT_PUBLIC_SITE_URL` env var or fallback `https://topaitoolrank.com`.
