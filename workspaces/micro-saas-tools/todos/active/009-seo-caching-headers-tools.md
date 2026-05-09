# Todo 009: Add Caching Headers for Tool Pages

**Implements**: `specs/tool-pages-seo-metadata.md` § Performance  
**Priority**: ⚠️ MEDIUM  
**Dependency**: None  
**Effort**: 5 minutes  
**Session**: 3

## Description

Add `Cache-Control` headers for `/tools/*` routes so pages can be cached by Vercel's CDN, improving TTFB and Core Web Vitals.

## Acceptance Criteria

- [ ] `/tools/*` routes have `Cache-Control: public, s-maxage=3600`
- [ ] Tool metadata/shell cached while dynamic content loads
- [ ] Build succeeds

## Implementation

**File**: `next.config.ts`

**Add to headers array**:
```typescript
{
  source: '/tools/:path*',
  headers: [
    {
      key: 'Cache-Control',
      value: 'public, max-age=60, s-maxage=3600'
    }
  ]
}
```

This tells the browser to cache for 60 seconds, CDN for 1 hour.

## Testing

```bash
npm run build

# Check response headers
curl -I https://topaitoolrank.com/tools/json-formatter | grep Cache-Control
# Should show: Cache-Control: public, max-age=60, s-maxage=3600
```

---

**Status**: Ready to implement (5-minute change)  
**Impact**: Faster TTFB, better CWV

