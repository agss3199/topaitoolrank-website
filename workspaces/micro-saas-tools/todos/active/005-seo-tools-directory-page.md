# Todo 005: Create `/tools` Directory Page

**Implements**: `specs/tool-pages-cross-linking.md` § Tools discovery page  
**Priority**: 🔴 HIGH  
**Dependency**: None  
**Effort**: 2 hours  
**Session**: 2

## Description

Create a `/tools` listing page that displays all 10 tools with descriptions and links. Currently, tools are only discoverable through the header dropdown, homepage cards, and footer. A dedicated directory page improves SEO and user discoverability.

## Acceptance Criteria

- [ ] `app/tools/page.tsx` created as server component
- [ ] Page lists all 9 main tools + wa-sender (verify wa-sender is functional per spec)
- [ ] Each tool entry includes: name, description (1-2 sentences), icon/image, link to tool page
- [ ] Page has SEO metadata: title, description, Open Graph tags
- [ ] Page has BreadcrumbList schema (Home > Tools) — separate from tool-level breadcrumbs
- [ ] Responsive design (works on mobile, grid layout adjusts)
- [ ] Added to sitemap at priority 0.8
- [ ] "View all tools" link added to Footer (near existing Privacy Policy link)
- [ ] Build succeeds, no TypeScript errors

## Implementation

### Page Structure

```typescript
// app/tools/page.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Free AI Tools Directory | All Tools',
  description: 'Explore our complete collection of 10 free AI tools for writing, coding, design, analysis, and more. No sign-up required.',
};

export default function ToolsPage() {
  const tools = [
    {
      slug: 'json-formatter',
      name: 'JSON Formatter',
      description: 'Format, validate, and beautify JSON. Check syntax, minify, or prettify with one click.',
      category: 'Development'
    },
    // ... 9 more tools
  ];

  return (
    <div className="tools-directory">
      <h1>All Free AI Tools</h1>
      <p>Explore our complete collection of free tools for every task.</p>
      
      <div className="tools-grid">
        {tools.map(tool => (
          <ToolCard key={tool.slug} tool={tool} />
        ))}
      </div>

      {/* BreadcrumbList schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": DOMAIN },
            { "@type": "ListItem", "position": 2, "name": "Tools", "item": `${DOMAIN}/tools` }
          ]
        })}}
      />
    </div>
  );
}
```

### Styling

- Grid layout: 3 columns on desktop, 1-2 on mobile
- Card for each tool with hover effects
- Category badges
- **Search/filter functionality**: NOT included in this todo. If needed, create a separate future todo.

## Sitemap Update

Add to `app/sitemap.ts`:

```typescript
{
  url: `${DOMAIN}/tools`,
  lastModified: new Date(),
  priority: 0.8,
  changeFrequency: 'weekly' as const,
}
```

## Footer Update

Update `app/tools/lib/Footer.tsx` to add "View all tools" link:

```typescript
<Link href="/tools">View all tools</Link>
```

**Note**: Todo 006 also modifies Footer (fixes /privacy link). Either:
1. Implement Todo 006 first, then add this link, OR
2. Combine both changes in one Footer.tsx edit (recommended for efficiency)

## Expected Impact

- **New keyword rankings**: "free AI tools", "AI tools directory", "best online tools"
- **Traffic gain**: +10-20% from new directory page
- **User discovery**: Tools now discoverable from single page
- **Timeline**: 4 weeks to see rankings

---

**Status**: Ready to implement  
**Estimated Traffic Impact**: +10-20% (new keywords)  
**Related Finding**: F-05 in seo-audit-comprehensive.md

