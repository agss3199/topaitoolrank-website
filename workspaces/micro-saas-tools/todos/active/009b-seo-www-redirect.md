# Todo 009b: Configure www Redirect for Consistent Domain

**Implements**: `specs/tool-pages-seo-metadata.md` § Domain consistency  
**Priority**: ℹ️ LOW  
**Dependency**: None  
**Effort**: 10 minutes  
**Session**: 3

## Description

Ensure consistent www vs non-www domain handling. All site code uses `topaitoolrank.com` (non-www). Verify that Vercel domain config redirects `www.topaitoolrank.com` → `topaitoolrank.com` to prevent duplicate indexing and preserve link equity.

## Acceptance Criteria

- [ ] Verify Vercel domain config has 301 redirect: `www.topaitoolrank.com` → `topaitoolrank.com`
- [ ] Test both URLs resolve and redirect correctly:
  ```bash
  curl -I https://www.topaitoolrank.com  # Should 301 redirect
  curl -I https://topaitoolrank.com      # Should 200 OK
  ```
- [ ] No canonical tag conflicts (all canonicals point to non-www version)
- [ ] Google Search Console shows single canonical domain

## Implementation

**Check Vercel domain settings**:
1. Go to Vercel project dashboard → Settings → Domains
2. Verify `www.topaitoolrank.com` has redirect rule to `topaitoolrank.com`
3. If not present, add redirect rule with HTTP status code 301 (permanent)

**Alternative: Add middleware.ts redirect**:
```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host');
  
  if (host?.startsWith('www.')) {
    const url = request.nextUrl.clone();
    url.host = host.substring(4);  // Remove 'www.'
    return NextResponse.redirect(url, { status: 301 });
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next|public).*)'],
};
```

## Testing

```bash
# Test www redirect
curl -I https://www.topaitoolrank.com
# Expected: HTTP 301 Moved Permanently, Location: https://topaitoolrank.com

# Test non-www direct access
curl -I https://topaitoolrank.com
# Expected: HTTP 200 OK

# Verify canonical URLs in sitemap (all should be non-www)
curl https://topaitoolrank.com/sitemap.xml | grep -o '<loc>[^<]*</loc>' | head -5
# All entries should be topaitoolrank.com (no www)
```

## Impact

- Prevents duplicate content issues
- Preserves link equity (all backlinks consolidate to single domain)
- Cleaner Google Search Console reporting

---

**Status**: Ready to implement (10-minute fix)  
**Related Finding**: F-09 in seo-audit-comprehensive.md
