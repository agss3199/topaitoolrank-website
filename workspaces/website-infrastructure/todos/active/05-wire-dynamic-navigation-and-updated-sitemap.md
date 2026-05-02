# Todo: Wire Dynamic Navigation & Update Sitemap for Tools + All Pages

**Status:** Pending  
**Implements:** specs/tool-architecture.md, specs/styling-architecture.md  
**Dependencies:** Item 04 (tool registry)  
**Blocks:** Deployment (item 11)  
**Capacity:** Single session (~250 LOC)  

## Description

Update navigation component to fetch tools from `/api/tools/list` and render them dynamically (no hardcoded tool list). Update `app/sitemap.ts` to include all pages: core pages, blog articles, tools (from registry), legal pages, and auth pages. Verify sitemap is comprehensive.

## Implementation

1. **Update navigation component** (`app/components/Navigation.tsx` or header):
   - Fetch tools from `/api/tools/list` on mount
   - Render tools in navigation menu (or submenu)
   - Use tool's icon and name from manifest
   - Link to tool's route from manifest
   - Handle loading/error states gracefully

2. **Update sitemap generator** (`app/sitemap.ts`):
   - Keep existing: core pages (homepage), blog pages (listing + articles), legal pages (privacy, terms), auth pages
   - Add: dynamic tools from `loadAllTools()`
   - Tools have lower priority than core (0.7 vs 1.0)
   - Order: core → blog → articles → tools → legal → auth
   - Verify no duplicates

3. **Verify sitemap completeness:**
   - Homepage: `/` (priority 1.0)
   - Blog listing: `/blogs` (priority 0.9)
   - Blog articles: `/blogs/{slug}` (priority 0.8)
   - Tools: `/tools/{id}` (priority 0.7)
   - Legal: `/privacy-policy`, `/terms` (priority 0.5)
   - Auth: `/auth/login`, `/auth/signup` (priority 0.3)

## Acceptance Criteria

- [ ] Navigation fetches tools from `/api/tools/list`
- [ ] Navigation renders tool names + links from manifest
- [ ] Tools appear in navigation menu dynamically (no hardcoding)
- [ ] Sitemap includes all page types (core, blog, articles, tools, legal, auth)
- [ ] Sitemap includes all blog articles (from `getAllPosts()`)
- [ ] Sitemap includes all tools (from `loadAllTools()`)
- [ ] No duplicate URLs in sitemap
- [ ] Sitemap priorities are correct (1.0 for homepage, 0.8 for articles, 0.7 for tools)
- [ ] Sitemap validates with XML schema
- [ ] Sitemap is less than 50KB (no compression needed)

## Testing

```bash
# Verify sitemap includes all pages
curl http://localhost:3000/sitemap.xml | grep -c "<url>"
# Should be: 1 (home) + 1 (blog listing) + 3 (articles) + 1 (wa-sender) + 2 (legal) + 2 (auth) = 10+

# Verify article URLs are included
curl http://localhost:3000/sitemap.xml | grep "/blogs/"
# Should include all 3 published articles

# Verify tool URLs are included
curl http://localhost:3000/sitemap.xml | grep "/tools/"
# Should include /tools/wa-sender

# Test navigation loads tools
# Visit http://localhost:3000 in browser
# Tools menu should show "WA Sender" dynamically
```

