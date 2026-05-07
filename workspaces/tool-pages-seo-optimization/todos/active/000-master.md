# Master Todo List - Tool Pages SEO Optimization

All tasks required to complete the SEO optimization project. Organized by milestone with dependencies noted.

## Milestone 1: Foundation Components (Header/Footer)

**Status**: Pending

These tasks must complete before content can be integrated.

- [01-implement-header-footer-components](#)
- [02-integrate-header-footer-to-tool-pages](#)
- [03-create-open-graph-images](#)

## Milestone 2: Metadata & Sitemap Configuration

**Status**: Pending

Can run in parallel with content creation.

- [04-configure-per-tool-seo-metadata](#)
- [05-update-sitemap-add-8-missing-tools](#)
- [06-verify-robots-txt](#)

## Milestone 3: Content Articles (9 × 2000 words)

**Status**: ChatGPT prompts ready, awaiting user to generate content

User will use provided prompts to generate articles via ChatGPT, then provide content for integration.

- [07-15 - Generate articles via ChatGPT prompts](#) (User uses prompts in `/articles/` folder)
  - Master prompt: `articles/00-MASTER-PROMPT.md`
  - Tool prompts: `articles/01-prompt-json-formatter.txt` through `articles/02-09-prompts.txt`

## Milestone 4: Cross-Linking & Integration

**Status**: Pending

Depends on articles being written. Can start once Milestone 3 is complete.

- [16-add-internal-links-to-articles](#)
- [17-add-cross-links-in-blog-posts](#)

## Milestone 5: Google Analytics (✅ COMPLETED)

**Status**: GA4 is now LIVE on all pages

GA4 implementation complete. Property ID G-D98KCREKZC is active on homepage, tool pages, and blog posts.

- [18-update-ga4-blocking-tests](#) → ✅ Updated test assertions
- [19-implement-ga4-script-in-layout](#) → ✅ GA4 added to root layout (async, non-blocking)
- [20-verify-ga4-implementation](#) → ✅ GA4 tracking confirmed on all pages

## Milestone 6: Testing & Validation

**Status**: Pending

Final verification tasks. Runs after all other milestones complete.

- [21-e2e-test-all-tool-pages](#)
- [22-verify-sitemap-completeness](#)
- [23-verify-metadata-renders](#)
- [24-verify-cross-links-function](#)
- [25-verify-search-console-ready](#)

---

## Summary

**Total Todos**: 25
**Content Writing**: 9 articles × 2000 words = 18,000 words
**Code Tasks**: 16 (components, metadata, sitemap, GA4, tests, cross-linking)
**Timeline**: All tasks can complete in parallel where dependencies allow.

**Critical Path**:
1. ✅ Update GA4 tests (done — blocking gate removed)
2. ✅ Implement GA4 on all pages (done — G-D98KCREKZC active)
3. Create ChatGPT prompts for 9 articles (done — prompts in `/articles/`)
4. Implement Header/Footer components (next)
5. Create OG images (can be done in parallel)
6. Configure metadata (can be done in parallel)
7. Update sitemap (can be done in parallel)
8. User generates 9 articles via ChatGPT (user runs prompts)
9. Integrate articles into tool pages
10. Add cross-links (depends on articles being written)
11. Final testing and validation

**Capacity**: 25 todos fit within 1 session capacity using parallel execution (9 articles can write in parallel, metadata configs can apply in parallel, etc.)
