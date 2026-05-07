# Todo 06: Verify robots.txt Allows Indexing

**Status**: Pending  
**Implements**: specs/tool-pages-sitemap.md § robots.txt  
**Dependencies**: None  
**Blocks**: 25-verify-search-console-ready

## Description

Verify that `public/robots.txt` is configured to allow Google to crawl and index all tool pages. If robots.txt doesn't exist or blocks `/tools/`, create/fix it.

## Acceptance Criteria

- [x] `public/robots.txt` exists
- [x] robots.txt does NOT block `/tools/` directory
- [x] robots.txt does NOT block individual tool pages
- [x] robots.txt includes sitemap reference pointing to `/sitemap.xml`
- [x] File is readable by web server

## Implementation Notes

**Expected robots.txt content**:

```
User-agent: *
Allow: /

Sitemap: https://topaitoolrank.com/sitemap.xml
```

**Verify**:
If `/tools/` is blocked:

```
User-agent: *
Disallow: /tools/  # ❌ This blocks tools — remove this line
```

Then fix by removing the disallow line or explicitly allowing `/tools/`:

```
User-agent: *
Allow: /tools/
Allow: /

Sitemap: https://topaitoolrank.com/sitemap.xml
```

**Do NOT block these paths**:
- `/tools/` — must be publicly crawlable
- `/tools/[tool-name]/` — all individual tools must be crawlable
- `/blogs/` — blog pages must be crawlable

**Do block these paths** (if applicable):
- `/admin/` — if admin panel exists
- `/api/` — API routes (optional, doesn't hurt if included)
- `/.next/` — Next.js build artifacts
- `/node_modules/` — dependencies (shouldn't be public anyway)

## Testing

1. Visit `https://topaitoolrank.com/robots.txt` in browser
2. Verify no `/tools/` disallow line
3. Verify sitemap reference is present
4. Use Google Search Console → Settings → Crawl → Test robots.txt to verify `/tools/json-formatter` is allowed

## Related Specs

- robots.txt spec: specs/tool-pages-sitemap.md § robots.txt

## Time Estimate

~15 minutes (verify or create robots.txt)
