# 005 — Integrate Tool into Website Layout (Header/Footer/Breadcrumb/Attribution)

**Status**: completed  
**Owner**: react-specialist  
**Phase**: implement  
**Effort**: 15 min (add imports + layout wrapper)  
**Depends on**: 004 (styling complete)  
**Blocks**: 006 (directory listing)

---

## Overview

Wrap the palm reader tool with the website's standard layout components (Header, Footer), add SEO breadcrumb schema, and place the attribution text ("made by Abhishek Gupta for MGMT6095") in the results view footer. Ensure tool follows the same layout pattern as other tools on the website.

**Scope**: ~50 LOC — imports, wrapper elements, breadcrumb JSON-LD, attribution placement.

---

## Specification References

- **R5: Tool Integration** — spec §R5 routing, header/footer imports, breadcrumb schema
- **Brief**: Attribution requirement (visible to users)

---

## Acceptance Criteria

### Layout Components
- [ ] Import Header component from website layout
- [ ] Import Footer component from website layout
- [ ] Verify Header imports work (no TypeScript errors)
- [ ] Verify Footer imports work (no TypeScript errors)
- [ ] Header renders above tool content
- [ ] Footer renders below tool content
- [ ] Proper spacing between Header, tool content, and Footer

### Breadcrumb Schema (SEO)
- [ ] Add BreadcrumbSchema JSON-LD to page `<head>`
- [ ] Path: Home → Tools → Palm Reader
- [ ] URLs: `/` → `/tools` → `/tools/palm-reader`
- [ ] Use canonical URL: `https://[domain]/tools/palm-reader`
- [ ] Schema renders without errors (validate with Schema.org validator)

### Attribution Text
- [ ] Place attribution in results view footer: "made by Abhishek Gupta for MGMT6095"
- [ ] Styling: small text (12px), gray color, right-aligned or centered
- [ ] Visible on ResultsView component (appears on results display)
- [ ] Also add to page footer or tool header (secondary placement)

### Container & Spacing
- [ ] Tool content wrapped in container with consistent max-width
- [ ] Proper padding around tool (matches other tools on website)
- [ ] Tool doesn't extend to full viewport width (respects layout grid)
- [ ] Mobile spacing: 16px padding on sides
- [ ] Tablet spacing: 24px padding on sides
- [ ] Desktop spacing: centered with max-width 900px

### Page Metadata
- [ ] Update page title via metadata: `title: "Palm Reader"`
- [ ] Update page description via metadata: "AI-powered palm reading entertainment tool"
- [ ] Canonical URL set correctly
- [ ] OG tags for social sharing (optional but good practice)

---

## Files to Modify

```
app/tools/palm-reader/
└── page.tsx (modify: add layout imports, wrapper, breadcrumb, attribution)

app/tools/palm-reader/components/
└── ResultsView.tsx (modify: add attribution in footer)
```

---

## Code Changes to page.tsx

### Imports
```typescript
import Header from "@/app/components/header"; // or correct path
import Footer from "@/app/components/footer"; // or correct path
import { Metadata } from "next";
```

### Metadata Export
```typescript
export const metadata: Metadata = {
  title: "Palm Reader - Top AI Tool Rank",
  description:
    "AI-powered palm reading entertainment tool. Discover insights about your life, destiny, and future through palm analysis powered by AI vision.",
  canonical: "https://[domain]/tools/palm-reader",
  openGraph: {
    title: "Palm Reader",
    description: "AI-powered palm reading entertainment",
    url: "https://[domain]/tools/palm-reader",
    type: "website",
  },
};
```

### Page Layout Structure
```typescript
export default function PalmReaderPage() {
  return (
    <>
      <Header />
      
      <BreadcrumbSchema />
      
      <main className={styles.page}>
        <div className={styles.container}>
          {/* CameraView or ResultsView here */}
        </div>
      </main>
      
      <Footer />
    </>
  );
}
```

### BreadcrumbSchema Component
Create `components/BreadcrumbSchema.tsx`:

```typescript
import { JsonLd } from "next-seo"; // or similar

export default function BreadcrumbSchema() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: "https://[domain]",
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Tools",
              item: "https://[domain]/tools",
            },
            {
              "@type": "ListItem",
              position: 3,
              name: "Palm Reader",
              item: "https://[domain]/tools/palm-reader",
            },
          ],
        }),
      }}
    />
  );
}
```

### ResultsView Attribution
Add attribution in footer of ResultsView:

```typescript
// In ResultsView.tsx
export default function ResultsView({
  results,
  onRetry,
  onHome,
}: ResultsViewProps) {
  return (
    <div className={styles.container}>
      {/* Results sections here */}
      
      <div className={styles.attribution}>
        <p>made by Abhishek Gupta for MGMT6095</p>
      </div>
    </div>
  );
}
```

---

## CSS for Attribution (results.module.css)
```css
.attribution {
  text-align: center;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
  font-size: 12px;
  color: #6b7280;
}
```

---

## Container & Spacing (page.module.css)
```css
.page {
  min-height: 100vh;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.container {
  flex: 1;
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
  padding: 32px 16px;
}

@media (min-width: 768px) {
  .container {
    padding: 32px 24px;
  }
}

@media (min-width: 1024px) {
  .container {
    padding: 32px 32px;
  }
}
```

---

## Header/Footer Integration Notes

### Finding Import Paths
- Check existing tool pages (e.g., `app/tools/invoice-generator/page.tsx`) to see where Header/Footer are imported from
- Likely: `@/app/components/header`, `@/app/components/footer`, or similar
- Verify no TypeScript path errors after importing

### Layout Verification
- Render page locally and inspect
- Header should appear above tool content
- Footer should appear below tool content
- No layout shifts or margin collapse
- Tool content respects max-width container

### Breadcrumb Testing
- Use Google's Schema.org Rich Results Test: https://search.google.com/test/rich-results
- Paste page URL, verify breadcrumb renders correctly
- Breadcrumb items link to correct URLs

---

## Verification Checklist

- [ ] Header component imports without errors
- [ ] Footer component imports without errors
- [ ] Header renders above tool on page
- [ ] Footer renders below tool on page
- [ ] Tool content properly contained (respects max-width)
- [ ] Spacing looks consistent with other tools
- [ ] Attribution text visible on results view
- [ ] Attribution styled per spec (small, gray, subtle)
- [ ] BreadcrumbSchema JSON-LD renders (check page source)
- [ ] Schema validates at https://search.google.com/test/rich-results
- [ ] Page metadata exported correctly
- [ ] Title shows as "Palm Reader" in browser tab
- [ ] Mobile layout (375px): responsive spacing maintained
- [ ] Tablet layout (768px): proper max-width
- [ ] Desktop layout (1920px): tool centered, not stretched
- [ ] No console errors in DevTools

---

## Related Todos

- **Depends on**: 004 (styling complete)
- **Blocks**: 006 (directory listing needs layout finalized)
- **Parallelize with**: none

---

## Session Context

- Header/Footer location: Check existing tools for import pattern
- Layout reference: `app/tools/invoice-generator/page.tsx`, `app/tools/seo-analyzer/page.tsx`
- Breadcrumb schema docs: https://schema.org/BreadcrumbList

