# 03-blog-rss-feed

**Implements**: specs/blog-indexing.md § 3. RSS Feed  
**Depends On**: 01-blog-tag-pages (for async `getAllPosts()`)  
**Capacity**: ~80 LOC load-bearing logic / 2 invariants (published-only filter, valid XML escaping) / 2 call-graph hops (`getAllPosts` → filter → generate XML) / Creates a valid RSS 2.0 route at `/feed.xml` that includes all published posts, with proper XML escaping and discovery link in the global layout.  
**Status**: ACTIVE

## Context

RSS feeds are a standard distribution channel for blog content. Without one, content aggregators, RSS readers, and SEO tools cannot subscribe to the blog. This is a low-complexity, high-discoverability feature.

The feed must only include published posts (not drafts) and must produce valid RSS 2.0 XML that passes W3C validation.

## Scope

**DO:**
- Create `app/feed.xml/route.ts` as a Next.js Route Handler returning `Content-Type: application/rss+xml`
- Include all posts where `frontmatter.status === 'published'` sorted by `publishedAt` descending
- XML-escape all user content (title, description, author) — prevent malformed XML if content contains `<`, `>`, `&`, `"`, `'`
- Implement `escapeXml(str: string): string` helper function in the route file or `app/lib/blog.ts`
- Add `<link rel="alternate" type="application/rss+xml">` to `app/layout.tsx` `<head>` section
- Set correct `Content-Type` header with charset: `application/rss+xml; charset=utf-8`
- Include `<content:encoded>` with post content wrapped in CDATA

**DO NOT:**
- Add authentication to the RSS feed — it must be publicly accessible
- Cache the feed at the route level (Next.js default caching is acceptable for a static site)
- Create an `/api/rss` route — the spec specifies `app/feed.xml/route.ts`
- Include draft posts in the feed

## Deliverables

**Create:**
- `app/feed.xml/route.ts` — RSS 2.0 route handler

**Modify:**
- `app/layout.tsx` — add `<link rel="alternate" ...>` in `<head>`

**Tests:**
- `__tests__/blog-rss-feed.test.ts` — unit tests for XML generation and escaping

## Testing

**Unit tests (Tier 1):**
- `test_rss_feed_excludes_draft_posts` — mock two posts (one published, one draft); feed XML contains only the published one
- `test_rss_feed_escapes_xml_in_title` — post title containing `<b>Bold</b>` is escaped to `&lt;b&gt;Bold&lt;/b&gt;` in feed
- `test_rss_feed_escapes_ampersands` — post title "News & Updates" appears as `News &amp; Updates` in feed
- `test_rss_feed_sorts_newest_first` — two published posts with different `publishedAt` dates; newer post appears first in `<item>` list
- `test_rss_feed_includes_all_required_fields` — each `<item>` has `<title>`, `<link>`, `<guid>`, `<pubDate>`, `<description>`
- `test_rss_feed_returns_correct_content_type` — response `Content-Type` header is `application/rss+xml`

**Manual checks:**
- Visit `/feed.xml` in dev server — raw XML visible, no rendering errors
- Paste the URL into W3C Feed Validator (https://validator.w3.org/feed/) — must show no errors
- Check `<head>` in page source for the alternate link tag

## Implementation Notes

- `escapeXml` must handle: `&` → `&amp;`, `<` → `&lt;`, `>` → `&gt;`, `"` → `&quot;`, `'` → `&apos;`
- The `&` escape MUST come first (before others) to avoid double-escaping: `&lt;` → `&amp;lt;` if order is wrong.
- `<guid>` should use the full absolute post URL as the permalink guid (isPermaLink="true").
- `<pubDate>` format: RSS 2.0 expects RFC 822 format — use `new Date(post.frontmatter.publishedAt).toUTCString()`.
- The `<content:encoded>` namespace `xmlns:content="http://purl.org/rss/1.0/modules/content/"` must be declared on the root `<rss>` element.
- The base URL for links must come from `process.env.NEXT_PUBLIC_SITE_URL` — do not hardcode the domain.
