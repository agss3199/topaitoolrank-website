# Todo 004: Add Organization Schema to Homepage/Root Layout

**Implements**: `specs/tool-pages-seo-metadata.md` § Organization schema  
**Priority**: 🔴 HIGH  
**Dependency**: None (root layout is always server-renderable)  
**Effort**: 30 minutes  
**Session**: 2

## Description

Add Organization JSON-LD schema to the root or homepage layout. This enables Knowledge Panel eligibility and trust signals for the brand.

## Acceptance Criteria

- [ ] Organization schema added to `app/layout.tsx` or homepage layout
- [ ] Schema includes: name, url, logo, description, contactPoint, sameAs (social)
- [ ] Schema validates with 0 errors in Rich Results Test
- [ ] Build succeeds

## Implementation

Add to `app/layout.tsx` (root level) or homepage layout:

```typescript
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Top AI Tool Rank",
  "url": DOMAIN,
  "logo": `${DOMAIN}/logo.png`,
  "description": "Discover, compare, and use the best free AI tools for every task.",
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "Customer Support",
    "email": "support@topaitoolrank.com"  // Or actual support email
  },
  "sameAs": [
    "https://twitter.com/topaitoolrank",  // Update with actual social URLs
    "https://linkedin.com/company/topaitoolrank"
  ]
};

<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
/>
```

## Expected Impact

- Knowledge Panel eligibility (will appear for branded searches)
- Better trust signals for Google
- Timeline: 2-4 weeks to see in Knowledge Panel

---

**Status**: Ready to implement  
**Related Finding**: F-04 in seo-audit-comprehensive.md

