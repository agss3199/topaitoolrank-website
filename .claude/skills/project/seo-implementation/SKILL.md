# SEO Implementation Skill — Next.js Metadata & Structured Data

## Overview

Patterns for implementing comprehensive SEO in Next.js applications using the App Router. Covers metadata export, JSON-LD schema rendering, and foundation SEO checklist to prevent commonly neglected items.

## Core Pattern: Metadata Export

Every page that should rank in search needs a `Metadata` object exported from its server component:

```typescript
// app/page.tsx or app/tools/[slug]/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Title | Brand",
  description: "150-160 character description with key terms and value prop",
  keywords: ["key", "terms", "for", "search"],
  openGraph: {
    title: "OG title (can differ from page title)",
    description: "OG description",
    url: "https://domain.com/path",
    type: "website",
    siteName: "Brand",
    images: [{ url: "https://domain.com/og-image.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Twitter title",
    description: "Twitter description",
    images: ["https://domain.com/twitter-image.jpg"],
  },
  robots: { index: true, follow: true },  // or { index: false } for auth pages
  alternates: { canonical: "https://domain.com/canonical-url" },
};

export default function Page() {
  return <main>{/* content */}</main>;
}
```

**Key points:**
- `keywords` array is optional but improves topic relevance
- `openGraph.images` must be absolute URLs (https://...)
- `alternates.canonical` is the Next.js API for `<link rel="canonical">` (NOT a top-level `canonical:` property)
- Auth pages should have `robots: { index: false, follow: false }`
- Root layout (`app/layout.tsx`) is the baseline for all pages (update if needed across site)

## Pattern: JSON-LD Schema Components

Create reusable server components for structured data. Pattern:

```typescript
// app/lib/BreadcrumbSchema.tsx
import React from "react";

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface Props {
  items: BreadcrumbItem[];
}

export default function BreadcrumbSchema({ items }: Props) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

**Key points:**
- Use `dangerouslySetInnerHTML` with `JSON.stringify()` to safely render JSON-LD
- `JSON.stringify()` properly escapes special characters (e.g., `</script>` becomes `<\/script>`)
- Components accept hardcoded props (never user input)
- Render in page or layout `<head>` or `<body>` — placement doesn't matter for JSON-LD

## Pattern: Schema Rendering on Pages

Import schema components and render with hardcoded data:

```typescript
// app/tools/json-formatter/page.tsx
import FAQSchema from "../lib/FAQSchema";
import BreadcrumbSchema from "../lib/BreadcrumbSchema";

export default function JsonFormatterPage() {
  return (
    <main>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://topaitoolrank.com" },
          { name: "Tools", url: "https://topaitoolrank.com/tools" },
          { name: "JSON Formatter", url: "https://topaitoolrank.com/tools/json-formatter" },
        ]}
      />
      <FAQSchema
        questions={[
          { q: "What is JSON formatting?", a: "JSON formatting improves readability..." },
          { q: "Is it free?", a: "Yes, completely free..." },
        ]}
      />
      {/* Page content */}
    </main>
  );
}
```

## Foundation SEO Checklist

Every SEO implementation MUST include these foundation items (before considering the work "done"):

- [ ] **Custom 404 page** (`app/not-found.tsx`)
  - Metadata export with title, description
  - `robots: { index: false, follow: true }`
  - Navigation links (home, main category)
  - "Popular items" links to guide users back to content
  
- [ ] **Root metadata quality** (`app/layout.tsx`)
  - Description should be specific (not generic "Building custom solutions...")
  - Include key value props and keywords
  - Mention what the site does (e.g., "Discover AI tools", "Compare SaaS", etc.)

- [ ] **robots.txt crawl control** (`public/robots.txt`)
  - Add `Disallow: /api/` (API endpoints not indexable)
  - Add `Disallow: /auth/` (auth pages not indexable)
  - Reference sitemap: `Sitemap: https://domain.com/sitemap.xml`
  - Optional: add `Crawl-delay: 1` to pace crawlers

- [ ] **Broken og:image verification**
  - Any `openGraph.images[].url` must resolve (test with curl)
  - Same for `twitter.images[]`
  - Remove broken references rather than leaving dead URLs

- [ ] **Console cleanup** (production code)
  - Remove all `console.log`, `console.error`, `console.warn` from:
    - `app/api/**`
    - `app/**/*.tsx` / `app/**/*.ts`
  - Keep in test files and dev-only code

- [ ] **Favicon fallback**
  - Provide `public/favicon.ico` OR document why SVG-only is acceptable
  - SVG works for modern browsers; older browsers/crawlers may need `.ico`

- [ ] **Internal link validation**
  - Spot-check key pages: do all breadcrumb links work?
  - Are /tools links all valid?
  - Does homepage nav link to /tools?

- [ ] **Auth protection**
  - All auth pages (`/auth/login`, `/auth/signup`, etc.) have `robots: { index: false }`
  - Prevents indexing of auth flows

- [ ] **Sitemap coverage**
  - Does `app/sitemap.ts` exist?
  - Does it include all public pages?
  - Are `lastModified` dates current (not auto-`new Date()`)?

## Testing Strategy

For server components that render JSON-LD schemas, use **source-grep testing**:

```typescript
// tests/unit/seo-schemas.test.ts
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const BREADCRUMB_SCHEMA = fs.readFileSync(
  path.resolve(__dirname, "../../app/lib/BreadcrumbSchema.tsx"),
  "utf-8"
);

describe("BreadcrumbSchema", () => {
  it("renders script tag with application/ld+json type", () => {
    expect(BREADCRUMB_SCHEMA).toContain('type="application/ld+json"');
  });

  it("uses BreadcrumbList schema type", () => {
    expect(BREADCRUMB_SCHEMA).toContain("'@type': 'BreadcrumbList'");
  });

  it("maps itemListElement with position", () => {
    expect(BREADCRUMB_SCHEMA).toContain("'@type': 'ListItem'");
    expect(BREADCRUMB_SCHEMA).toContain("position: index + 1");
  });
});
```

**Why source-grep?** Next.js server components can't be rendered in JSDOM (no Next.js runtime in test environment). Source-grep tests verify code structure quickly without full SSR setup.

**Upgrade to behavioral testing** if schema regressions appear: render via `npm run start`, fetch actual HTML, parse `<script type="application/ld+json">`, validate against schema.org.

## Common Pitfalls

1. **Using old canonical API**: `canonical: "url"` is ignored by Next.js. Use `alternates: { canonical: "url" }`.
2. **Relative URLs in og:image**: Social platforms need absolute URLs. Always use `https://domain.com/...`.
3. **Hardcoding generic descriptions**: "Building custom software solutions" doesn't mention your actual value prop. Be specific.
4. **Forgetting auth page noindex**: Auth flows shouldn't be in search results. Add `robots: { index: false }`.
5. **Dead og:image URLs**: If you declare an image, ensure it exists. Remove references if images don't exist.

## Next Steps

- Validate 404 page exists with proper navigation
- Run `npm run build` and confirm zero warnings
- Test one tool page with Google's Rich Results Tester (verify schema renders)
- Monitor Google Search Console for schema errors or coverage drops
