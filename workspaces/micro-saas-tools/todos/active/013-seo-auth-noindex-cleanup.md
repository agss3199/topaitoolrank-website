# Todo 013: Add `noindex` to Auth Pages

**Implements**: `specs/tool-pages-seo-metadata.md` § Page indexing control  
**Priority**: ℹ️ LOW  
**Dependency**: None  
**Effort**: 10 minutes  
**Session**: 3

## Description

Auth pages (`/auth/login`, `/auth/signup`) should not be indexed by search engines. Add `robots: { index: false }` to their metadata.

## Acceptance Criteria

- [ ] Auth page layouts export `robots: { index: false, follow: true }`
- [ ] Pages still render normally (just not indexed)
- [ ] Build succeeds

## Implementation

**Files**: `app/auth/login/layout.tsx`, `app/auth/signup/layout.tsx`

**Add to metadata**:
```typescript
export const metadata: Metadata = {
  // ... other metadata ...
  robots: {
    index: false,
    follow: true  // Allow following links even if not indexed
  }
};
```

## Testing

```bash
npm run build && npm run dev

# Check page source for robots meta tag
curl http://localhost:3000/auth/login | grep -o '<meta name="robots"[^>]*>'
# Should show: <meta name="robots" content="noindex, follow">

# Verify auth/signup also has noindex
curl http://localhost:3000/auth/signup | grep -o '<meta name="robots"[^>]*>'
# Should show: <meta name="robots" content="noindex, follow">

# Verify other pages don't have noindex
curl http://localhost:3000/tools/json-formatter | grep -c 'name="robots"'
# Should return 0 (tool pages should not have robots meta tag, they're indexed)
```

---

**Status**: Ready to implement (10-minute fix)  
**Related Finding**: F-10 in seo-audit-comprehensive.md

