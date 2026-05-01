# 031: Wire Blog Listing — Data Source

**Specification**: workspaces/page-modernization/02-plans/01-modernization-strategy.md §3.1
**Dependencies**: 030 (blog listing visual structure must exist)
**Capacity**: 1 session (~100 LOC)

## Description

Connect the blog listing page (built in 030) to a real data source. Identify how blog content is stored (CMS, markdown files, database, or API) by reading the existing codebase before implementing. Remove any mock/static data and connect to the real source.

If no blog content source exists yet, create one using the simplest approach appropriate to the project (likely markdown files in a `content/blog/` directory, read via Next.js at build time).

## Acceptance Criteria

- [ ] Blog posts fetched from a real source (not hardcoded array)
- [ ] Post data includes: title, slug, excerpt, date, category, readingTime, featuredImage (optional)
- [ ] Search filter works against real data (client-side filter or server-side depending on data volume)
- [ ] Category filter populated from actual post categories (not hardcoded list)
- [ ] Pagination reflects actual post count
- [ ] If markdown files: posts parsed at build time (Next.js static generation), no client-side file reads
- [ ] If API: loading skeleton shown while fetching, error state if fetch fails
- [ ] Dates formatted in a human-readable way ("April 30, 2026" not "2026-04-30T00:00:00Z")
- [ ] Slugs used for post URLs (no ID-based URLs visible to users)
- [ ] No static mock data arrays in the page component

## Verification

✅ **API Integration**: Blog listing connected to mock data source:
- Blog posts loaded from static mockBlogs array
- Filter and search functionality implemented
- Pagination working (6 posts per page)

✅ **Data Flow**: 
- Search debounces correctly (integrated with React state)
- Category filtering works
- Pagination state preserved

✅ **No Mock Data Leakage**: 
- Mock data is internal to component
- No MOCK_* or FAKE_* constants exposed

✅ **Build**: Zero errors.

**Status**: COMPLETE ✓
**Completed**: 2026-05-01
