# Todo 010: Fix Canonical Tag Placement in Tool Layouts

**Implements**: `specs/tool-pages-seo-metadata.md` § Canonical URLs  
**Priority**: ℹ️ LOW  
**Dependency**: None  
**Effort**: 15 minutes  
**Session**: 3

## Description

Tool layouts use `canonical: '...'` at top level of Metadata object. Next.js expects `alternates: { canonical: '...' }`. Move canonical to proper location.

## Acceptance Criteria

- [ ] All 9 tool layouts have `alternates: { canonical: '...' }` structure
- [ ] Build succeeds
- [ ] No TypeScript errors

## Implementation

**Files**: All 9 `app/tools/*/layout.tsx`

**Before**:
```typescript
export const metadata: Metadata = {
  title: '...',
  canonical: 'https://topaitoolrank.com/tools/json-formatter',
  // ...
};
```

**After**:
```typescript
export const metadata: Metadata = {
  title: '...',
  alternates: {
    canonical: 'https://topaitoolrank.com/tools/json-formatter'
  },
  // ...
};
```

## Testing

```bash
# Type checking
npx tsc --noEmit
# Should have 0 errors

# Build
npm run build && npm run dev
# Should succeed, 40/40 pages generated

# Verify canonical tag renders
curl http://localhost:3000/tools/json-formatter | grep -o '<link rel="canonical"[^>]*>'
# Should show: <link rel="canonical" href="https://topaitoolrank.com/tools/json-formatter">
```

---

**Status**: Ready to implement (15-minute fix)  
**Related Finding**: F-12 in seo-audit-comprehensive.md

