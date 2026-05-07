# Todo 04: Configure Per-Tool SEO Metadata

**Status**: Pending  
**Implements**: specs/tool-pages-seo-metadata.md  
**Dependencies**: 03-create-og-images (for OG image paths)  
**Blocks**: None (can run in parallel)

## Description

Configure SEO metadata (titles, descriptions, Open Graph, structured data) for all 9 tool pages. Each tool page must export Next.js metadata with:
- Page title (50-60 chars, includes keyword + brand)
- Meta description (150-160 chars, includes keyword + benefit)
- Canonical URL
- Open Graph tags (title, description, image, URL)
- Twitter Card tags
- Structured data (WebApplication or FAQPage schema)

## Acceptance Criteria

- [x] All 9 tool pages export Next.js `metadata` object
- [x] Page titles are 50-60 characters and keyword-optimized
- [x] Meta descriptions are 150-160 characters and benefit-focused
- [x] Canonical tags point to correct tool URLs
- [x] Open Graph images reference correct OG image files
- [x] Open Graph tags configured for all 9 tools
- [x] Twitter Card tags configured for all 9 tools
- [x] Structured data (JSON-LD) included in all pages
- [x] No hardcoded URLs (use environment variable for domain)

## Implementation Notes

**Metadata configuration location**:
Each tool page (`app/tools/[tool]/page.tsx`) needs this pattern:

```typescript
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'JSON Formatter: Beautify & Validate JSON | AI Tool Rank',
  description: 'Free JSON formatter tool. Beautify, validate, and minify JSON with syntax highlighting.',
  keywords: ['JSON formatter', 'JSON beautifier', 'JSON validator'],
  openGraph: {
    title: 'JSON Formatter: Beautify & Validate JSON | AI Tool Rank',
    description: 'Free JSON formatter tool...',
    url: 'https://www.topaitoolrank.com/tools/json-formatter',
    type: 'website',
    images: [
      {
        url: 'https://www.topaitoolrank.com/og-images/json-formatter.jpg',
        width: 1200,
        height: 630,
        alt: 'JSON Formatter Tool',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JSON Formatter: Beautify & Validate JSON | AI Tool Rank',
    description: 'Free JSON formatter tool...',
    images: ['https://www.topaitoolrank.com/og-images/json-formatter.jpg'],
  },
  canonical: 'https://www.topaitoolrank.com/tools/json-formatter',
};
```

**Per-tool metadata values**:
See specs/tool-pages-seo-metadata.md § Per-Tool Metadata Summary for exact titles/descriptions.

**Structured data (JSON-LD)**:
Add to page body as script tag:

```typescript
<script type="application/ld+json">
  {JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "JSON Formatter",
    "description": "Free online JSON formatter and validator with syntax highlighting.",
    "url": "https://www.topaitoolrank.com/tools/json-formatter",
    "applicationCategory": "Utility",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
  })}
</script>
```

## Testing

- Use Next.js dev server to render each page
- Inspect `<head>` to verify `<title>`, `<meta name="description">`, `<meta property="og:*">`
- Test with Facebook OG Image Debugger (https://developers.facebook.com/tools/debug/og/object)
- Test with Twitter Card Validator (https://cards-dev.twitter.com/validator)
- Verify structured data with Google Rich Results Test (https://search.google.com/test/rich-results)

## Related Specs

- Metadata spec: specs/tool-pages-seo-metadata.md
- Client component limitation: Note that these are client components (`'use client'`), so metadata export may need server component wrapper

## Files to Modify

All 9 tool pages:
- `app/tools/json-formatter/page.tsx`
- `app/tools/word-counter/page.tsx`
- `app/tools/email-subject-tester/page.tsx`
- `app/tools/ai-prompt-generator/page.tsx`
- `app/tools/utm-link-builder/page.tsx`
- `app/tools/invoice-generator/page.tsx`
- `app/tools/seo-analyzer/page.tsx`
- `app/tools/whatsapp-link-generator/page.tsx`
- `app/tools/whatsapp-message-formatter/page.tsx`

## Time Estimate

~1-2 hours (configure 9 pages, mostly copy-paste with variations)
