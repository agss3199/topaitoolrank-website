# Todo 006: Fix Broken Footer Privacy Policy Link

**Implements**: `specs/tool-pages-header-footer.md` § Footer structure  
**Priority**: 🔴 HIGH  
**Dependency**: None (but consider combining with Todo 005 Footer update for efficiency)  
**Effort**: 2 minutes  
**Session**: 2 or 3 (quick win, can be combined with Todo 005)

## Description

The footer on every tool page links to `/privacy` but the actual page is at `/privacy-policy`. This creates a 404 error on every tool page, wasting crawl budget and hurting user experience.

## Acceptance Criteria

- [ ] Footer link changed from `href="/privacy"` to `href="/privacy-policy"`
- [ ] Verify the `/privacy-policy` page exists and loads
- [ ] No 404 errors when clicking the footer link
- [ ] Build succeeds

## Implementation

**File**: `app/tools/lib/Footer.tsx` (line ~51)

**Change**:
```typescript
// Before
<Link href="/privacy">Privacy Policy</Link>

// After
<Link href="/privacy-policy">Privacy Policy</Link>
```

## Testing

```bash
# Build and start dev server
npm run build && npm run dev

# Visit a tool page
# http://localhost:3000/tools/json-formatter

# Click "Privacy Policy" link in footer
# Should navigate to /privacy-policy (no 404)
```

## Verification

```bash
# Check that /privacy-policy page exists
ls app/privacy-policy/
# Should exist

# Ensure /privacy doesn't exist (or redirects to /privacy-policy)
curl -I http://localhost:3000/privacy
# Should return 404 or 301 redirect
```

---

**Status**: Ready to implement (2-minute fix)  
**Impact**: Eliminates 404 errors on every tool page footer, improves crawl efficiency  
**Related Finding**: F-06 in seo-audit-comprehensive.md

