# Tool Pages Sitemap Specification

## Scope

Audit existing sitemap and add any missed pages (both tools and non-tools). Ensures Google Search Console can crawl and index all public pages properly. Updates to `app/sitemap.ts`.

## Sitemap Purpose

A sitemap is an XML file that lists all pages on a website to help search engines discover and index them. It's not required for Google to find your pages, but it helps Google understand priority, freshness, and importance.

## Current Sitemap Status

**File**: `app/sitemap.ts` (Next.js 14+ dynamic sitemap generation)

**Already in sitemap**:
- Homepage (`/`) — priority 1.0, weekly
- Blog index (`/blogs`) — priority 0.9, daily
- Individual blog posts (`/blogs/[slug]`) — dynamic from getAllPosts(), priority 0.9, weekly
- Blog tags (`/blogs/tag/[tag]`) — dynamic from posts, priority 0.8, weekly
- Blog categories (`/blogs/category/[category]`) — dynamic from posts, priority 0.8, weekly
- Legal pages: `/privacy-policy`, `/terms` — priority 0.5, monthly
- Auth pages: `/auth/login`, `/auth/signup` — priority 0.3, monthly
- WA-Sender tool (`/tools/wa-sender`) — priority 0.7, weekly

**Audit findings — Missing tool pages**:
- `/tools/json-formatter` — NOT in sitemap
- `/tools/word-counter` — NOT in sitemap
- `/tools/email-subject-tester` — NOT in sitemap
- `/tools/ai-prompt-generator` — NOT in sitemap
- `/tools/utm-link-builder` — NOT in sitemap
- `/tools/invoice-generator` — NOT in sitemap
- `/tools/seo-analyzer` — NOT in sitemap
- `/tools/whatsapp-link-generator` — NOT in sitemap
- `/tools/whatsapp-message-formatter` — NOT in sitemap

**Other pages to verify**:
- Contact page (if exists: `/contact`)
- About page (if exists: `/about`)
- Tools listing page (if exists: `/tools`)
- Any other public routes not yet indexed

## Tool Pages to Add

Update the existing `toolPages` array in `app/sitemap.ts` to include all 9 in-scope tools. The array currently contains only WA-Sender; add the 8 missing tools.

**Location in file**: Lines 87-95 of `app/sitemap.ts`

**Current code**:
```typescript
const toolPages: MetadataRoute.Sitemap = [
  {
    url: `${baseUrl}/tools/wa-sender`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  },
  // Future tools will be added here automatically via tool registration pattern
];
```

**Updated code** — Add these 8 tools to the array (keep WA-Sender unchanged):

```typescript
const toolPages: MetadataRoute.Sitemap = [
  {
    url: `${baseUrl}/tools/wa-sender`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  },
  // ADD THESE 8 MISSING TOOLS:
  {
    url: `${baseUrl}/tools/json-formatter`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  },
  {
    url: `${baseUrl}/tools/word-counter`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  },
  {
    url: `${baseUrl}/tools/email-subject-tester`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  },
  {
    url: `${baseUrl}/tools/ai-prompt-generator`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  },
  {
    url: `${baseUrl}/tools/utm-link-builder`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  },
  {
    url: `${baseUrl}/tools/invoice-generator`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  },
  {
    url: `${baseUrl}/tools/seo-analyzer`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  },
  {
    url: `${baseUrl}/tools/whatsapp-link-generator`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  },
  {
    url: `${baseUrl}/tools/whatsapp-message-formatter`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  },
];
```

## Priority Tiers

SEO value and search demand inform priority scores:

### Tier 1 (Priority 0.8) — High Search Demand

Tools with broad appeal and high search volume:

- JSON Formatter — `0.8`
- Word Counter — `0.8`
- Email Subject Tester — `0.8`

**Rationale**: These tools solve fundamental problems with high search volume. JSON formatting is a core developer task. Word counting is needed by writers, students, marketers. Email subject testing is essential for email marketing.

### Tier 2 (Priority 0.7) — Medium Search Demand

Tools with moderate appeal and growing search volume:

- AI Prompt Generator — `0.7`
- UTM Link Builder — `0.7`
- Invoice Generator — `0.7`
- SEO Analyzer — `0.7`
- WhatsApp Link Generator — `0.7`
- WhatsApp Message Formatter — `0.7`

**Rationale**: These tools address specific use cases (marketers, freelancers, small businesses). Search demand is high within their niches but lower overall than Tier 1.

### Tier 3 (Priority 0.5-0.6) — Lower Priority

Pages to keep but not emphasize:

- Blog pages: `0.6`
- Blog archive/category pages: `0.5`
- Legal pages: `0.3` (must be included for compliance, not for traffic)
- Homepage: `1.0` (highest priority)

**Rationale**: Blog content builds authority over time. Legal pages are necessary but not traffic drivers.

## Change Frequency

Indicates to search engines how often the page content changes:

| Page Type | Frequency | Rationale |
|-----------|-----------|-----------|
| Tool pages | `weekly` | Content rarely changes, but footer/header may update |
| Blog posts | `monthly` | Original article stays same; may get updates/fixes |
| Blog index | `daily` | New posts added; category/tag pages change |
| Homepage | `weekly` | Featured content may rotate |
| Legal pages | `yearly` | Changed infrequently |

**Note**: This is a hint to search engines, not a hard directive. Google may crawl less or more frequently based on its own assessment.

## Last Modified (lastModified)

Set to the date the page content was last updated:

**For initial launch**: Use today's date (day the articles go live).

**For ongoing updates**: Update `lastModified` whenever the content changes (e.g., article updated, new feature added, bug fixed).

```typescript
{
  url: `${baseUrl}/tools/json-formatter`,
  lastModified: new Date('2026-05-07'),  // Date articles were published
  changeFrequency: 'weekly' as const,
  priority: 0.8,
}
```

## Audit Other Pages

Before finalizing, verify the following pages exist and are correctly prioritized in the sitemap:

### Pages Likely Present but Verify

```bash
# Check for these routes in the codebase:
grep -r "app/.*page.tsx\|export.*const.*Page\|Route.*='/'" app/ | grep -v "tools\|blogs\|auth"
```

**Common missing pages** (if they exist, add them):

| Route | Purpose | Priority | Change Freq | Status |
|-------|---------|----------|-------------|--------|
| `/` | Homepage | 1.0 | weekly | ✅ In sitemap |
| `/contact` | Contact page | 0.6 | monthly | ❓ Verify |
| `/about` | About page | 0.6 | monthly | ❓ Verify |
| `/tools` | Tools listing | 0.8 | weekly | ❓ Verify |
| `/api/*` | API routes | — | N/A | Don't include |
| `/dashboard/*` | User dashboard | — | N/A | Don't include (requires auth) |

### Pages to NOT Include

- **API routes** (`/api/*`) — Not meant for human browsing
- **Authenticated pages** (`/dashboard`, `/settings`) — Search engines can't access them
- **Admin pages** — If any exist
- **Duplicate routes** — If a page has multiple URLs, pick one and use canonical tags on others

## XML Sitemap Output

After updating `app/sitemap.ts`, the file generates XML at `[domain]/sitemap.xml`:

Example entry for a tool page (auto-generated from the array):
```xml
<url>
  <loc>https://topaitoolrank.com/tools/json-formatter</loc>
  <lastmod>2026-05-07T00:00:00.000Z</lastmod>
  <changefreq>weekly</changefreq>
  <priority>0.8</priority>
</url>
```

**Verify sitemap is valid**:
1. Visit `https://topaitoolrank.com/sitemap.xml` in your browser
2. Should see XML with `<urlset>` root and `<url>` entries
3. Should include all 9 tools + existing pages

## robots.txt

Ensure `public/robots.txt` allows all pages:

```
User-agent: *
Allow: /

Sitemap: https://www.topaitoolrank.com/sitemap.xml
```

**Constraint**: Do NOT disallow `/tools/` or any tool pages.

## Google Search Console Submission

After deployment:

1. Open [Google Search Console](https://search.google.com/search-console)
2. Select the property `https://www.topaitoolrank.com`
3. Submit the updated sitemap: `https://www.topaitoolrank.com/sitemap.xml`
4. Wait for Google to crawl and index (typically 1-7 days)
5. Monitor "Coverage" report for errors (should show 0 errors)

## Monitoring & Maintenance

### Monthly Checks

- Verify all 9 tool URLs appear in Search Console "Coverage" report with status "Indexed"
- Check for any crawl errors or warnings
- Confirm lastModified dates are recent if content was updated

### When Adding New Pages

Always update the sitemap when:
- New tool page is added
- New blog post is published
- Significant content update occurs
- URL structure changes

## Implementation Steps

1. **Read `app/sitemap.ts`** — Understand current structure
2. **Add 8 missing tool URLs** — To the existing `toolPages` array (keep WA-Sender unchanged)
3. **Verify no other pages missing** — Grep for routes not in sitemap
4. **Test sitemap generation** — Visit `/sitemap.xml` in browser
5. **Update in Google Search Console** — Resubmit sitemap
6. **Monitor indexing** — Check Coverage report after 24 hours

## Success Criteria

- All 9 tools appear in `app/sitemap.ts` (8 newly added, 1 existing)
- Sitemap generates valid XML (test at `[domain]/sitemap.xml`)
- All 9 tools show as "Indexed" in Google Search Console within 7 days
- No crawl errors reported in Search Console
- `robots.txt` allows indexing of all tool pages
- Priority tiers are set correctly (Tier 1 = 0.8, Tier 2 = 0.7)
- No other public pages are missing from the sitemap
- Change frequency is set to `weekly` for tool pages
