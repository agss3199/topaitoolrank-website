# Todo 008: Convert Header Navigation `<a>` Tags to Next.js `<Link>`

**Implements**: `specs/tool-pages-header-footer.md` § Navigation structure  
**Priority**: ⚠️ MEDIUM  
**Dependency**: None  
**Effort**: 30 minutes  
**Session**: 2

## Description

Header uses plain `<a href=...>` tags for internal navigation instead of Next.js `<Link>`. This causes full page reloads instead of client-side navigation, hurting Core Web Vitals and user experience.

## Acceptance Criteria

- [ ] All internal links in Header converted to `<Link>` from `next/link`
- [ ] External links (social, blog external) remain as `<a>` tags
- [ ] No full page reloads on navigation
- [ ] Core Web Vitals metrics don't degrade
- [ ] Build succeeds

## Implementation

**File**: `app/components/Header.tsx`

**Change all**:
```typescript
// Before
<a href="/tools/json-formatter">JSON Formatter</a>

// After
import Link from 'next/link';
<Link href="/tools/json-formatter">JSON Formatter</Link>
```

**Keep as `<a>` only for**:
- External links (social media, external blogs)
- Hash links (`#home`, `#services`) — these should use `<a href="#...">`
- File downloads

## Testing

### Manual Navigation Test

```bash
npm run build && npm run dev

# Open DevTools → Network tab
# Click a tool link in header
# Should NOT show full-page reload (no HTML document request for next page)
# Should see client-side navigation (no top-level request, only data fetch)
```

### Core Web Vitals Measurement

```bash
# Before conversion: run Lighthouse and record metrics
npx lighthouse https://localhost:3000/tools/json-formatter --output=json --output-path=before.json

# After conversion: run Lighthouse again
npx lighthouse https://localhost:3000/tools/json-formatter --output=json --output-path=after.json

# Compare:
# - LCP (Largest Contentful Paint): Should stay same or improve
# - FID (First Input Delay): Should improve (faster navigation response)
# - CLS (Cumulative Layout Shift): Should stay stable
# - Total Blocking Time: Should improve
```

### Acceptance Check

- [ ] No full-page reload on header link click
- [ ] Lighthouse score maintained or improved
- [ ] LCP metric doesn't degrade

## Expected Impact

- Better Core Web Vitals (LCP doesn't reset)
- Faster perceived navigation
- Improved user experience
- Potential ranking factor improvement

---

**Status**: Ready to implement  
**Related Finding**: F-07 in seo-audit-comprehensive.md

