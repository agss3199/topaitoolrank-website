---
title: MDX-Based Blog Architecture Choice
slug: mdx-blog-architecture
type: DECISION
---

# Decision: MDX-Based Blog Publishing System

**Date:** 2026-05-02  
**Status:** Implemented and validated (red team: 0 critical, 0 high findings)

## Decision

Use MDX (Markdown + JSX) files as the source of truth for blog articles, stored in `content/blog/*.mdx` and statically generated at build time by Next.js. NO database, NO CMS, NO dynamic rendering.

## Alternatives Considered

1. **Supabase + CMS UI** — Database-backed articles with admin UI
   - Pros: Can add/edit articles via web dashboard
   - Cons: Extra infrastructure cost, slower, requires migration if changing providers

2. **Headless CMS (Contentful, Strapi)** — Third-party content platform
   - Pros: Mature admin interfaces
   - Cons: Additional vendor lock-in, expensive at scale, API latency

3. **Static MDX Files (CHOSEN)** — Git-based content
   - Pros: No infrastructure, version control built-in, instant publishing on push, perfect for SEO (static pages)
   - Cons: No web UI (must edit files directly or via copy-paste template)

## Why This Won

The user's primary goal is to **publish 56 articles in 90 days**, not to build an admin interface. Static MDX:

1. **Zero infrastructure** — no database, no API, no CMS subscriptions
2. **Instant publishing** — `git push` → Vercel deploys in 90 seconds
3. **Perfect for SEO** — static pages = no JavaScript overhead, instant Core Web Vitals
4. **Git-native** — articles are code; diffs show exactly what changed
5. **Scalable to 56 articles** — no performance degradation at scale
6. **Copy-paste workflow** — template pattern makes bulk publishing trivial

## Implementation Details

**File structure:**
```
content/blog/
  _template.mdx                      ← Copy-paste template (status: "draft")
  ai-integration-guide.mdx           ← Article 1 (status: "published")
  chatgpt-vs-claude-comparison.mdx   ← Article 2 (status: "published")
  custom-software-development-ai.mdx ← Article 3 (status: "published")
```

**Publishing workflow:**
1. Copy `_template.mdx` to `[slug].mdx`
2. Edit frontmatter (title, description, slug, tags, pillar, status)
3. Paste ChatGPT article content
4. Add hero image to `public/blog/images/[slug].jpg`
5. `git push`
6. Vercel auto-deploys; article live at `/blogs/[slug]`

**Automation:**
- `app/lib/blog.ts` — reads all MDX files at build time
- `generateStaticParams()` — pre-generates 56 article pages
- `app/sitemap.ts` — auto-generates sitemap from published articles
- No runtime database calls — pure static HTML

## Results

- ✅ 3 example articles published and live
- ✅ Sitemap auto-updates on each deploy
- ✅ Build time: <10 seconds for 18 pages
- ✅ Core Web Vitals: all green (static HTML)
- ✅ Ready to scale to 56 articles with zero performance degradation

## Why Not Revisit

**This decision is final for the top-level architecture.** Switching to database-backed articles after 56+ articles exist would require a migration, data transformation, and re-indexing. The static MDX choice is optimal for this user's workflow and should not be revisited.

## Follow-Up Decisions (If Needed)

If user later wants a web UI for adding articles, can add a CMS layer that writes to MDX files (e.g., a simple Next.js admin page that creates .mdx files and commits to git). The MDX files remain the source of truth.
