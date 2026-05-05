# 05-blog-search-component

**Implements**: specs/blog-indexing.md § 4. Search Index (Client-Side Search), § 4. Search UX  
**Depends On**: 04-blog-search-index-build (requires `public/search-index.json` to exist)  
**Capacity**: ~150 LOC load-bearing logic / 4 invariants (lazy load index, 300ms debounce, published-only results, top-10 cap) / 2 call-graph hops (fetch index → Fuse.js search → render results) / Client-side React component that lazily fetches the search index and performs fuzzy search with debounce, rendering top-10 results with links.  
**Status**: ACTIVE

## Context

`public/search-index.json` is built by todo 04. This todo builds the React component that uses it. The component sits in the blog layout so it is available on all blog pages without re-mounting.

The search must be fast and non-blocking. The index file is only fetched after the user interacts with the search box (lazy load), and queries are debounced at 300ms to prevent result flicker.

## Scope

**DO:**
- Create `app/components/BlogSearch.tsx` as a client component (`"use client"`)
- Install `fuse.js` via `npm install fuse.js` (add to `package.json` dependencies)
- Lazy load: fetch `/search-index.json` only when user first clicks/focuses the search input
- 300ms debounce on the query value before triggering Fuse.js search
- Show top 10 results sorted by Fuse.js relevance score
- Each result renders as a link to `/blogs/[slug]` showing title and description
- Search keys: `title`, `description`, `author`, `tags` (per spec; do NOT search `content` — it is not in the index)
- Fuse.js threshold: `0.3` (per spec)
- Mount the component in `app/(blog)/layout.tsx` as a search bar above/in the blog header
- Show a loading state while index is being fetched
- Show "No results found" when query returns 0 matches

**DO NOT:**
- Fetch the index on page load — only fetch on first user focus
- Show more than 10 results at once
- Implement server-side search
- Use any search library other than `fuse.js`

## Deliverables

**Create:**
- `app/components/BlogSearch.tsx` — client-side search component

**Modify:**
- `app/(blog)/layout.tsx` — mount `<BlogSearch />` in the blog header area
- `package.json` — add `fuse.js` dependency

**Tests:**
- `__tests__/blog-search-component.test.ts` — unit and interaction tests

## Testing

**Unit tests (Tier 1, with React Testing Library):**
- `test_search_does_not_fetch_index_on_initial_render` — `fetch` is not called before user focuses input
- `test_search_fetches_index_on_first_focus` — focusing the input triggers one `fetch('/search-index.json')` call
- `test_search_does_not_fetch_index_twice_on_second_focus` — index fetched once; re-focusing does not re-fetch
- `test_search_shows_loading_state_while_fetching` — loading indicator visible during fetch
- `test_search_shows_no_results_on_no_match` — query that matches nothing shows "No results found"
- `test_search_shows_at_most_10_results` — mock index with 20 entries; results list has at most 10 items
- `test_search_result_links_to_correct_slug` — result item href is `/blogs/[slug]`

**Manual checks:**
- Open `/blogs` in browser — search box visible in header
- Click search box — no network request yet (check DevTools Network)
- Focus search box — `GET /search-index.json` appears in Network (once)
- Type "AI" — results appear after ~300ms debounce delay
- Results show post titles and descriptions with correct links

## Implementation Notes

- Use `useRef` to track whether the index has been loaded — prevents duplicate fetch calls across re-renders.
- Debounce implementation: use `useEffect` with `setTimeout` cleanup. Do NOT use a debounce library — the implementation is 5 lines.
- Fuse.js instance creation is expensive; create it once after index loads and store in a `useRef` or a `useMemo` keyed on the index. Do NOT re-create Fuse instance on every keystroke.
- `"use client"` directive is required. This component uses `useState`, `useEffect`, and browser APIs (`fetch`). It cannot be a server component.
- Accessibility: the search input needs `role="search"`, `aria-label="Search articles"`. Results list needs `role="listbox"` or `role="list"`.
- When the query is cleared (empty string), close/hide the results dropdown immediately without running Fuse.
