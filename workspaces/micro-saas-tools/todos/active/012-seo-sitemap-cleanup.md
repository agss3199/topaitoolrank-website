# Todo 012: Fix Sitemap: lastModified & Remove Auth Pages

**Implements**: `specs/tool-pages-sitemap.md` § Sitemap accuracy  
**Priority**: ℹ️ LOW  
**Dependency**: None  
**Effort**: 15 minutes  
**Session**: 3

## Description

Two sitemap issues: (1) lastModified uses `new Date()` on every generation (should use fixed dates), (2) auth pages are included (should be removed or marked noindex).

## Acceptance Criteria

- [ ] Tool pages use fixed `lastModified` dates (article publish dates)
- [ ] Auth pages (`/auth/login`, `/auth/signup`) removed from sitemap
- [ ] Sitemap validates (XML well-formed)
- [ ] Build succeeds

## Implementation

**File**: `app/sitemap.ts`

**Change 1 — Fix lastModified**:
```typescript
// Before
{ url: `${DOMAIN}/tools/json-formatter`, lastModified: new Date(), priority: 0.8 }

// After
{ url: `${DOMAIN}/tools/json-formatter`, lastModified: new Date('2026-05-07'), priority: 0.8 }
```

**Change 2 — Remove auth pages**:
```typescript
// Remove or comment out these lines:
// { url: `${DOMAIN}/auth/login`, priority: 0.3 },
// { url: `${DOMAIN}/auth/signup`, priority: 0.3 },
```

## Testing

```bash
npm run build

# Test locally
npm run dev

# Verify sitemap is valid XML (option 1: use xmllint if installed)
curl http://localhost:3000/sitemap.xml | xmllint --noout -
# Should output: valid

# OR verify sitemap structure manually (option 2: check for required elements)
curl http://localhost:3000/sitemap.xml | grep -q '<urlset' && \
curl http://localhost:3000/sitemap.xml | grep -q '</urlset>' && \
echo "✓ Sitemap structure valid"

# Verify auth pages not present
curl http://localhost:3000/sitemap.xml | grep -c "auth/login"
# Should return 0

curl http://localhost:3000/sitemap.xml | grep -c "auth/signup"
# Should return 0

# Verify lastModified dates are consistent (not changing on each build)
curl http://localhost:3000/sitemap.xml | grep "<lastmod>2026-05-07" | wc -l
# Should match the number of tool pages (9)
```

---

**Status**: Ready to implement (15-minute fix)  
**Related Finding**: F-13, F-14 in seo-audit-comprehensive.md

