# 04-blog-search-index-build

**Implements**: specs/blog-indexing.md § 4. Search Index (Build-Time Generation)  
**Depends On**: 01-blog-tag-pages (for async `getAllPosts()`)  
**Capacity**: ~100 LOC load-bearing logic / 2 invariants (published-only, index written to `public/` at build time) / 2 call-graph hops (`getAllPosts` → filter/map → write JSON) / Creates a build-time script that generates `public/search-index.json` containing all published posts' searchable fields for client-side fuzzy search.  
**Status**: ACTIVE

## Context

Client-side search requires a pre-built index file served statically. This index is generated at build time from all published posts and written to `public/search-index.json`. The client-side search component (todo 05) fetches this file on demand.

This todo covers only the build-time generation. The UI component that uses this index is todo 05.

## Scope

**DO:**
- Create `app/lib/search-index.ts` exporting `generateSearchIndex()` function
- Each index entry includes: `slug`, `title`, `description`, `author`, `category`, `tags`, `publishedAt`, and `excerpt` (first 200 chars of content stripped of MDX syntax)
- Filter: only `status === 'published'` posts
- Integrate index generation into the Next.js build pipeline by calling it from `next.config.ts` or via a custom build script that Next.js invokes. The output must be written to `public/search-index.json` before `next build` completes.
- Add `public/search-index.json` to `.gitignore` (generated artifact, not committed)

**DO NOT:**
- Implement the client-side UI component (that is todo 05)
- Include draft posts in the index
- Include full MDX content in the index — excerpt only (200 chars), strip MDX tags/JSX
- Write to `src/` or `app/` — the output file must be `public/search-index.json` to be served statically

## Deliverables

**Create:**
- `app/lib/search-index.ts` — `generateSearchIndex()` function and `SearchIndexEntry` type

**Modify:**
- `next.config.ts` (or add `scripts/build-search-index.ts` + package.json `prebuild` hook) — invoke `generateSearchIndex()` and write output to `public/search-index.json` at build time
- `.gitignore` — add `public/search-index.json`

**Tests:**
- `__tests__/blog-search-index.test.ts` — unit tests for index generation

## Testing

**Unit tests (Tier 1):**
- `test_search_index_excludes_draft_posts` — two posts (one published, one draft); index array contains only published post
- `test_search_index_excerpt_truncates_at_200_chars` — post with 500-char content produces entry with 200-char excerpt
- `test_search_index_excerpt_strips_mdx_syntax` — post content `## Heading\n\nParagraph` produces excerpt `"Paragraph"` (heading stripped)
- `test_search_index_includes_all_required_fields` — each entry has slug, title, description, author, category, tags, publishedAt, excerpt
- `test_search_index_tags_is_array` — post with no tags produces `tags: []` (not null/undefined)

**Integration check:**
- Run `next build` locally — verify `public/search-index.json` exists after build
- Verify the JSON is valid: `node -e "JSON.parse(require('fs').readFileSync('public/search-index.json', 'utf8'))"`
- Verify file is not committed to git: `git status public/search-index.json` shows it is untracked/ignored

## Implementation Notes

- MDX content stripping for excerpts: remove frontmatter (between `---`), JSX tags (`<...>`), markdown headings (`## ...`), markdown links (`[text](url)` → `text`), bold/italic markers. A simple regex pass is sufficient — this is for search excerpt display, not rendering.
- Build-time integration: Next.js does not have a native `prebuild` hook, but `package.json` scripts support it: `"prebuild": "ts-node scripts/build-search-index.ts"`. Alternatively, use `next.config.ts` webpack plugin or a custom Next.js plugin. Simplest approach: `prebuild` npm script.
- The `generateSearchIndex()` function returns the array; the calling script is responsible for writing to disk with `fs.writeFileSync`. Keep concerns separate.
- TypeScript type for an index entry:
  ```typescript
  interface SearchIndexEntry {
    slug: string;
    title: string;
    description: string;
    author?: string;
    category: string;
    tags: string[];
    publishedAt: string;
    excerpt: string;
  }
  ```
