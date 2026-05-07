# Todo 05: Update Sitemap - Add 8 Missing Tools

**Status**: Pending  
**Implements**: specs/tool-pages-sitemap.md  
**Dependencies**: None (can run in parallel)  
**Blocks**: 22-verify-sitemap-completeness

## Description

Update `app/sitemap.ts` to add the 8 missing tool pages to the sitemap. The sitemap currently includes only WA-Sender tool; all other 9 tools must be added.

## Acceptance Criteria

- [x] All 8 missing tools added to `toolPages` array in `app/sitemap.ts`
- [x] WA-Sender tool remains unchanged
- [x] Tier 1 tools (JSON Formatter, Word Counter, Email Subject Tester) set to priority 0.8
- [x] Tier 2 tools (AI Prompt Generator, UTM Link Builder, Invoice Generator, SEO Analyzer, WhatsApp Link Generator, WhatsApp Message Formatter) set to priority 0.7
- [x] All tools set to `changeFrequency: 'weekly'`
- [x] `lastModified` set to current date (date articles go live)
- [x] Sitemap generates valid XML at `/sitemap.xml`
- [x] No syntax errors in TypeScript

## Implementation Notes

**File to modify**: `app/sitemap.ts` (lines 87-95)

**Current code** (existing):
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

**Change to** (add 8 new entries):
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
  // ... (etc, 6 more entries)
];
```

**Priority tiers**:
- **Tier 1** (0.8): json-formatter, word-counter, email-subject-tester
- **Tier 2** (0.7): ai-prompt-generator, utm-link-builder, invoice-generator, seo-analyzer, whatsapp-link-generator, whatsapp-message-formatter
- **WA-Sender** (0.7): Keep as-is

**Date handling**:
Use `new Date()` for all entries (automatically updated daily when app runs).

## Testing

- Build the application (`npm run build`)
- Verify no TypeScript errors
- Visit `http://localhost:3000/sitemap.xml` (in dev) or `https://topaitoolrank.com/sitemap.xml` (in production)
- Verify XML contains all 9 tools (+ existing pages)
- Verify all tools have `<priority>` and `<changefreq>` tags
- Use XML sitemap validator to ensure well-formed XML

## Related Specs

- Sitemap spec: specs/tool-pages-sitemap.md
- Priority tiers: specs/tool-pages-sitemap.md § Priority Tiers
- Other missing pages (if any): Audit as part of 22-verify-sitemap-completeness

## Time Estimate

~30 minutes (copy-paste 8 entries, test)
