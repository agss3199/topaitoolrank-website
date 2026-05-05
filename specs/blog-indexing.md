# Blog Indexing & Discovery

## Overview

Phase 2 adds structural support for blog discovery via tags, categories, RSS feed, and search index. These features leverage the existing MDX file pipeline while adding new static-generated pages for SEO and discoverability.

## 1. Tag Index Pages

### Page Structure

New route: `app/blogs/tag/[tag]/page.tsx`

Uses `generateStaticParams` to create static pages for all unique tags at build time:

```typescript
export async function generateStaticParams() {
  const posts = await getAllPosts();
  const tags = new Set<string>();
  
  posts.forEach(post => {
    post.frontmatter.tags?.forEach(tag => tags.add(tag));
  });
  
  return Array.from(tags).map(tag => ({ tag }));
}

export default function TagPage({ params }: { params: { tag: string } }) {
  const posts = await getAllPosts();
  const filtered = posts.filter(post => 
    post.frontmatter.tags?.includes(decodeURIComponent(params.tag))
  );
  
  return (
    <div>
      <h1>Posts tagged: {decodeURIComponent(params.tag)}</h1>
      <div className="posts-grid">
        {filtered.map(post => <ArticleCard key={post.slug} post={post} />)}
      </div>
    </div>
  );
}
```

### Behavior

- **URL**: `/blogs/tag/ai-agents` (hyphenated, URL-safe tag names)
- **Content**: All posts with that tag
- **Canonical link**: `<link rel="canonical" href="https://topaitoolrank.com/blogs/tag/ai-agents">`
- **OpenGraph**: Title, description, image (first post's hero image)
- **JSON-LD**: CollectionPage schema with hasPart references to all articles
- **Sitemap**: Included with lastmod = max(post.updated_at) for that tag

### Tag Slugification

Tags in frontmatter are human-readable: `"AI Agents"`, `"Code Generation"`, `"Web3"`

Tag index routes use URL-safe slugs: `ai-agents`, `code-generation`, `web3`

Conversion: lowercase + replace spaces with hyphens + remove punctuation

Example frontmatter:
```yaml
tags:
  - "AI Agents"
  - "Code Generation"
  - "Web3 & Blockchain"
```

Generated routes:
- `/blogs/tag/ai-agents`
- `/blogs/tag/code-generation`
- `/blogs/tag/web3-blockchain`

## 2. Category Index Pages

### Page Structure

New route: `app/blogs/category/[category]/page.tsx`

Similar to tag pages but filtered by frontmatter `category` field:

```typescript
export async function generateStaticParams() {
  const posts = await getAllPosts();
  const categories = new Set<string>();
  
  posts.forEach(post => {
    if (post.frontmatter.category) {
      categories.add(post.frontmatter.category);
    }
  });
  
  return Array.from(categories).map(category => ({ category }));
}

export default function CategoryPage({ params }: { params: { category: string } }) {
  const posts = await getAllPosts();
  const filtered = posts.filter(post => 
    post.frontmatter.category === decodeURIComponent(params.category)
  );
  
  return (
    <div>
      <h1>Category: {decodeURIComponent(params.category)}</h1>
      <div className="posts-grid">
        {filtered.map(post => <ArticleCard key={post.slug} post={post} />)}
      </div>
    </div>
  );
}
```

### Categories

Predefined in code (single-select per post). The list includes existing published categories plus new Phase 2 categories:

```typescript
const CATEGORIES = [
  "AI Tools",           // Existing (from published content)
  "Development",        // Existing (from published content)
  "Tutorial",           // Phase 2+
  "Tool Review",        // Phase 2+
  "Case Study",         // Phase 2+
  "News & Updates",     // Phase 2+
  "How-To Guide",       // Phase 2+
  "Comparison",         // Phase 2+
  "Opinion"             // Phase 2+
];
```

Each post must have exactly one category in frontmatter. The build validates that all posts use a category from this list.

**Migration Note**: Existing posts with "AI Tools" and "Development" categories will continue to work. New posts should prefer the expanded list. This ensures backwards compatibility with Phase 1 content.

## 3. RSS Feed

### Route

New route: `app/feed.xml/route.ts`

Returns valid RSS 2.0 feed with all published articles:

```typescript
export async function GET() {
  const posts = await getAllPosts();
  const publishedPosts = posts.filter(p => p.frontmatter.status === 'published');
  
  const feedXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Top AI Tool Rank - Blog</title>
    <link>https://topaitoolrank.com/blogs</link>
    <description>Latest news, reviews, and guides on AI tools and code generation</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${publishedPosts.map(post => `
      <item>
        <title>${escapeXml(post.frontmatter.title)}</title>
        <link>https://topaitoolrank.com/blogs/${post.slug}</link>
        <guid>https://topaitoolrank.com/blogs/${post.slug}</guid>
        <pubDate>${new Date(post.frontmatter.publishedAt).toUTCString()}</pubDate>
        <description>${escapeXml(post.frontmatter.description)}</description>
        <content:encoded><![CDATA[${post.content}]]></content:encoded>
        ${post.frontmatter.author ? `<author>${escapeXml(post.frontmatter.author)}</author>` : ''}
      </item>
    `).join('')}
  </channel>
</rss>`;
  
  return new Response(feedXml, {
    headers: { 'Content-Type': 'application/rss+xml' },
  });
}
```

### Feed URL

- **Primary**: `https://topaitoolrank.com/feed.xml`
- **Alternate**: `https://topaitoolrank.com/feeds/blog.xml` (if user preference)

Add to `app/layout.tsx` head:
```html
<link rel="alternate" type="application/rss+xml" title="Top AI Tool Rank Blog" href="https://topaitoolrank.com/feed.xml" />
```

## 4. Search Index

### Build-Time Generation

New file: `app/lib/search-index.ts`

At build time, generates a JSON index of all posts for client-side fuzzy search:

```typescript
export async function generateSearchIndex() {
  const posts = await getAllPosts();
  const index = posts
    .filter(p => p.frontmatter.status === 'published')
    .map(post => ({
      slug: post.slug,
      title: post.frontmatter.title,
      description: post.frontmatter.description,
      author: post.frontmatter.author,
      category: post.frontmatter.category,
      tags: post.frontmatter.tags || [],
      publishedAt: post.frontmatter.publishedAt,
      excerpt: post.content.substring(0, 200), // First 200 chars
    }));
  
  // Write to public/search-index.json at build time
  // This file is served statically
  return index;
}
```

Index file location: `public/search-index.json`

Generated at build time, not committed to git.

### Client-Side Search

New component: `app/components/BlogSearch.tsx`

Implements fuzzy search using `fuse.js` library:

```typescript
import Fuse from 'fuse.js';

export default function BlogSearch() {
  const [index, setIndex] = useState<SearchIndex[] | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  
  useEffect(() => {
    fetch('/search-index.json')
      .then(r => r.json())
      .then(data => setIndex(data));
  }, []);
  
  useEffect(() => {
    if (!index || !query) {
      setResults([]);
      return;
    }
    
    const fuse = new Fuse(index, {
      keys: ['title', 'description', 'author', 'tags'],
      threshold: 0.3,
    });
    
    const hits = fuse.search(query);
    setResults(hits.map(hit => hit.item));
  }, [query, index]);
  
  return (
    <div className="blog-search">
      <input
        type="text"
        placeholder="Search articles..."
        value={query}
        onChange={e => setQuery(e.target.value)}
      />
      <div className="results">
        {results.map(result => (
          <Link key={result.slug} href={`/blogs/${result.slug}`}>
            <h3>{result.title}</h3>
            <p>{result.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

Add `fuse.js` to dependencies: `npm install fuse.js`

### Search UX

- **Location**: `app/(blog)/layout.tsx` search bar
- **Lazy load**: Don't fetch search-index.json until user clicks search box
- **Debounce**: Search input with 300ms debounce to prevent flashing results
- **Display**: Show top 10 results, sorted by Fuse relevance score

## 5. SEO & Canonical Links

### Existing Structure (Phase 1)

Already implemented:
- JSON-LD Article schema on individual post pages
- OpenGraph meta tags
- Twitter Card meta tags
- Sitemap generation

### Phase 2 Additions

**Tag pages**:
- Canonical: `https://topaitoolrank.com/blogs/tag/[tag]`
- OpenGraph: Collection title + first post's image
- JSON-LD: CollectionPage schema

**Category pages**:
- Canonical: `https://topaitoolrank.com/blogs/category/[category]`
- OpenGraph: Collection title + first post's image
- JSON-LD: CollectionPage schema

**RSS feed**:
- Linked in `<head>` with `rel="alternate"`
- Registered with major feed aggregators (optional, Phase 3)

**Sitemap updates**:
- Add tag index pages: `/blogs/tag/*`
- Add category index pages: `/blogs/category/*`
- Priority: tag/category pages = 0.8, individual posts = 0.9

## 6. Content Pipeline Updates

### Frontmatter Requirements (Existing + New)

All posts MUST have:
```yaml
title: "Post Title"
slug: "unique-slug"
description: "One sentence summary"
category: "One of: Tutorial, Tool Review, Case Study, News & Updates, How-To Guide, Comparison, Opinion"
tags:
  - "AI Agents"
  - "Code Generation"
  - "Web3 & Blockchain"
pillar: "Optional pillar/series"
status: "published | draft"
publishedAt: "2026-05-04"
author: "Author Name"
featured: false
hero: "images/post-hero.jpg"
```

### Validation (at build time)

`app/lib/blog.ts` validates frontmatter:
- `title`: required, non-empty
- `slug`: required, unique, URL-safe
- `description`: required, max 160 chars (for SEO preview)
- `category`: required, must be in CATEGORIES list
- `tags`: optional, array of strings
- `status`: required, must be "published" or "draft"
- `publishedAt`: required, valid ISO date

Build fails if any post has invalid frontmatter.

## Implementation Notes

- Tag/category pages are generated at build time (same as individual posts)
- Search index is generated at build time, not runtime
- No database needed — all data from file system + frontmatter
- Tag/category pages are cached indefinitely (static)
- Rebuilds are fast (~10-30s) because build script is optimized
- "Draft" posts are never included in tag/category/RSS (status-checked)
