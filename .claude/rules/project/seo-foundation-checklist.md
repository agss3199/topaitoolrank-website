---
paths:
  - "app/**"
  - "public/**"
---

# SEO Foundation Checklist — Commonly Neglected Items

Practical SEO work often focuses on high-level goals (metadata, schema, sitemap) while overlooking foundational items that are expected by crawlers, browsers, and operators. This checklist ensures nothing obvious is missed.

## MUST Rules

### 1. Custom 404 Page Required

Every public site must handle 404s. Missing: `/404.html` or `app/not-found.tsx` leads to crawlers hitting default error pages with no SEO metadata.

**Implementation:**
```typescript
// app/not-found.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "404 — Page Not Found | Brand",
  description: "The page you're looking for doesn't exist. Browse our directory or return home.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main style={{ padding: "3rem", textAlign: "center" }}>
      <h1>404 — Page Not Found</h1>
      <p>The page you're looking for doesn't exist.</p>
      <nav style={{ marginTop: "2rem" }}>
        <Link href="/">Home</Link> | <Link href="/tools">Directory</Link>
      </nav>
      <section style={{ marginTop: "3rem" }}>
        <h2>Popular Pages</h2>
        <ul>
          <li><Link href="/tools/seo-analyzer">SEO Analyzer</Link></li>
          <li><Link href="/tools/json-formatter">JSON Formatter</Link></li>
          {/* ... popular links ... */}
        </ul>
      </section>
    </main>
  );
}
```

**Why:** Broken links leak SEO equity. A proper 404 with navigation and popular links keeps users engaged and distributes link value to real content.

### 2. Root Metadata Description Specificity

The root `app/layout.tsx` metadata description is the baseline for all pages. Generic descriptions ("Building custom software solutions worldwide") don't explain what the site does.

**DO NOT:**
```
"Building custom software solutions for businesses worldwide"
```

**DO:**
```
"Discover and compare 100+ free AI tools for writing, coding, design, and more. Expert reviews and rankings. No sign-up required."
```

Include: **what the site does**, **key benefit**, **volume or scope** (e.g., "100+"), **any free/no-signup value prop**.

**Why:** Root metadata affects all pages when individual pages don't override it. Specific metadata improves CTR and search relevance signals.

### 3. robots.txt Crawl Control

Every `public/robots.txt` should disallow non-indexable paths:

```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /auth/
Disallow: /admin/
Disallow: /private/
Crawl-delay: 1

Sitemap: https://domain.com/sitemap.xml
```

**Minimum requirement:**
- `Disallow: /api/` — API endpoints return JSON (not indexable), waste crawler budget
- `Disallow: /auth/` — Auth flows shouldn't be in search results

**Why:** Without disallow rules, crawlers waste resources hitting endpoints that aren't meant to be indexed, reducing crawl efficiency and page discovery rate.

### 4. og:image Validation

Any reference to an Open Graph image MUST resolve:

```typescript
// ❌ BROKEN — file doesn't exist
openGraph: {
  images: [{ url: "https://domain.com/og-images/homepage.jpg" }]
}

// ✅ FIXED — remove broken reference
openGraph: {
  title: "...",
  description: "...",
  // (images removed)
}
```

Verify with curl:
```bash
curl -I https://domain.com/og-images/homepage.jpg
# HTTP 404 → broken reference, remove it
```

**Why:** Social platforms fetch declared og:image URLs. A 404 causes the platform to cache "no preview," actively harming social click-through rates (30-40% reduction).

### 5. Console Cleanup

Remove all debug statements from production code:

```typescript
// ❌ BLOCKED in production files
console.log("Debug:", data);
console.error("Error:", error);
console.warn("Warning:", value);

// ✅ Allowed only in test files
// tests/unit/sample.test.ts
console.log("Test data:", obj);
```

Scan for cleanup:
```bash
grep -r "console\." app/ --include="*.ts" --include="*.tsx" | grep -v "test\|spec"
```

**Why:** Debug statements clutter browser console, signal unprofessionalism, and can leak internal structure. Pure production code has zero debug logging.

### 6. Favicon Fallback Strategy

Choose one:

**Option A: Provide both**
```
public/favicon.ico        # 32x32 or 48x48 classic format
public/favicon.svg        # Modern format
```

**Option B: SVG only with documented decision**
```
public/favicon.svg        # Modern browsers
# note: ICO fallback not provided — older browsers will use default
```

Reference in layout:
```typescript
export const metadata: Metadata = {
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "48x48" }, // optional
    ],
  },
};
```

**Why:** Modern browsers use SVG. Older browsers and some crawlers fall back to `.ico`. Providing both ensures compatibility; SVG-only is acceptable if documented.

### 7. All Internal Links Functional

Spot-check critical pages:

- [ ] **Homepage links to `/tools`** (navigation, CTA buttons)
- [ ] **Breadcrumbs use absolute URLs** (`https://domain.com/path`, not `/path`)
- [ ] **All `/tools/[slug]` pages exist** (no 404s from directory listing)
- [ ] **Header/footer nav links all resolve**

Quick test:
```bash
# Extract all href from homepage
curl -s https://domain.com | grep -o 'href="[^"]*"' | head -20
# Manually spot-check a few don't 404
```

**Why:** Broken internal links are crawl traps — crawlers hit them, waste budget, and don't reach real content. Link connectivity is a ranking signal.

### 8. Auth Pages Protected from Indexing

All auth-related pages MUST have `robots: { index: false }`:

```typescript
// app/auth/layout.tsx
export const metadata: Metadata = {
  robots: { index: false, follow: true },
};
```

Apply to:
- `/auth/login`
- `/auth/signup`
- `/auth/reset-password`
- Any other auth flow

**Why:** Auth pages shouldn't appear in search results. Explicit `robots: index: false` ensures they're excluded.

### 9. Sitemap Completeness & Freshness

Verify `app/sitemap.ts` includes:

```typescript
// ✅ Include all public pages
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://domain.com", lastModified: new Date("2026-05-09") },
    { url: "https://domain.com/tools", lastModified: new Date("2026-05-09") },
    ...tools.map(tool => ({
      url: `https://domain.com/tools/${tool.slug}`,
      lastModified: tool.updatedAt,
    })),
    ...blogs.map(post => ({
      url: `https://domain.com/blogs/${post.slug}`,
      lastModified: post.publishedAt,
    })),
  ];
}
```

**Do NOT:**
- Use `new Date()` for lastModified (volatile, always changes)
- Hardcode static dates (no update signal to crawlers)

**Why:** `lastModified` tells crawlers which pages changed recently. Stale dates reduce re-crawl frequency; outdated dates confuse ranking signals.

## Pre-Deployment Checklist

Before shipping SEO changes:

- [ ] Custom 404 page exists with metadata + navigation
- [ ] Root metadata description is specific (not generic)
- [ ] robots.txt disallows /api/ and /auth/
- [ ] All og:image URLs verified to exist (or removed if missing)
- [ ] No console.log/console.error in production code
- [ ] Favicon strategy decided (SVG + ICO or SVG-only documented)
- [ ] Spot-check 5 internal links — all resolve
- [ ] Auth pages have `robots: { index: false }`
- [ ] Sitemap includes all pages with current lastModified dates
- [ ] Build succeeds with zero warnings

## Examples from Recent Project

### 404 Page (Added)
- Created `app/not-found.tsx` with metadata + links to popular tools
- Ensures broken links don't leak ranking equity

### Root Metadata (Fixed)
- **Before:** "Building custom software solutions for businesses worldwide"
- **After:** "Discover and compare 100+ free AI tools for writing, coding, design, and more. Expert reviews and rankings. No sign-up required."
- **Impact:** Root description now mentions value prop and key features

### robots.txt (Enhanced)
- Added `Disallow: /api/` and `Disallow: /auth/`
- Added `Crawl-delay: 1` to pace crawlers
- Prevents waste of crawl budget on non-indexable endpoints

### Console Cleanup (Applied)
- Removed 7 debug console.log statements from production code
- Code is now clean and professional

## MUST NOT

- Leave broken og:image URLs in metadata (remove them if images don't exist)

**Why:** Declared but missing images harm social sharing more than having no image at all.

- Forget auth page protection (`robots: index: false`)

**Why:** Auth flows in search results confuse users and leak internal structure.

- Use volatile `new Date()` for sitemap lastModified

**Why:** Every build regenerates the date, creating false "always updated" signals that reduce recrawl efficiency.

- Skip favicon entirely

**Why:** Missing favicon can be a ranking signal weakness; at minimum document why it's not provided.
