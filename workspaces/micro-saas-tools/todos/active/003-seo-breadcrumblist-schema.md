# Todo 003: Add BreadcrumbList Schema to All 9 Tool Pages

**Implements**: `specs/tool-pages-seo-metadata.md` § BreadcrumbList (recommended)  
**Priority**: 🔴 HIGH  
**Dependency**: None  
**Effort**: 1 hour  
**Session**: 2

## Description

Add BreadcrumbList structured data to all 9 tool page layouts. Breadcrumbs in search results show "topaitoolrank.com > Tools > JSON Formatter" instead of raw URL, improving CTR by 5-15%.

## Acceptance Criteria

- [ ] All 9 tool layouts export BreadcrumbList schema
- [ ] Schema follows schema.org BreadcrumbList spec
- [ ] Breadcrumb path is: Home > Tools > [Tool Name]
- [ ] Schema validates in Google Rich Results Test (0 errors)
- [ ] Build succeeds

## Implementation

Add to each `app/tools/[tool-name]/layout.tsx`:

```typescript
const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": DOMAIN
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Tools",
      "item": `${DOMAIN}/tools`
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "JSON Formatter",  // Replace with tool name
      "item": `${DOMAIN}/tools/json-formatter`  // Replace with tool slug
    }
  ]
};

<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
/>
```

## Validation

- Build: `npm run build` (0 errors)
- For each tool, validate at: https://search.google.com/test/rich-results
- Verify: BreadcrumbList appears with 0 errors

## Expected Impact

- **CTR improvement**: +5-15% on tool page SERPs
- **Timeline**: Changes visible in SERP within 1-2 weeks

---

**Status**: Ready to implement  
**Estimated Traffic Impact**: +5-15% CTR on tool pages  
**Related Finding**: F-03 in seo-audit-comprehensive.md

