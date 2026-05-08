# Component Consolidation Pattern

**Status**: Production (validated 2026-05-08)  
**Applies to**: Site-wide UI components shared across multiple pages  
**Pattern**: Extract duplicate components into shared location, unify imports

## Quick Reference

When duplicate components (Header, Footer, Navigation, Layout) appear across 3+ pages:

1. **Audit** — identify all duplicates and their locations
2. **Extract** — create single source of truth in `app/components/`
3. **Unify imports** — change all pages to import from shared location
4. **Delete originals** — remove old files and verify no orphaned imports
5. **Verify** — build succeeds, all pages correctly wired, zero 404s

## The Pattern: Header Unification (May 2026)

### Problem
- Tool pages had custom `app/tools/lib/Header.tsx` with inconsistent branding
- Homepage had separate `app/page.tsx` footer
- 10+ tool pages + homepage = 11 different header/footer implementations
- Any branding change required editing 11 files

### Solution
1. **Audit Phase**
   ```bash
   # Find all header implementations
   grep -r "export.*Header\|export.*Footer" app --include="*.tsx"
   # Identify: app/tools/lib/Header.tsx, app/page.tsx custom header, etc.
   ```

2. **Extract Phase**
   - Create `app/components/Header.tsx` (152 lines)
   - Create `app/components/Header.module.css` (363 lines, 33 classes)
   - Copy content from `app/tools/lib/Header.tsx`
   - Enhance for site-wide use (all 10 tools in dropdown, responsive)

3. **Unify Imports**
   ```tsx
   // Before: relative imports, each page unique
   import Header from "../lib/Header";
   import Header from "./Header";
   
   // After: consistent path alias
   import Header from "@/app/components/Header";
   ```
   
   Applied to:
   - `app/page.tsx` (homepage)
   - All 10 `app/tools/*/page.tsx`

4. **Delete Originals**
   ```bash
   rm app/tools/lib/Header.tsx
   rm app/tools/lib/Header.module.css
   ```
   
   Verify no orphaned imports:
   ```bash
   grep -r "from.*tools/lib/Header\|../lib/Header" app --include="*.tsx"
   # Should return: 0 matches
   ```

5. **Verify**
   ```bash
   npm run build
   # Expected: ✓ Compiled successfully, 40/40 pages generated
   
   # Check for 404s
   curl https://topaitoolrank.com/tools
   # Should return 404 (no /tools page) — use /#tools link instead
   ```

## Outcome
- **Code consolidated**: 2,400+ LOC duplicated code eliminated
- **Single source of truth**: One Header component, one Header.module.css
- **Consistent imports**: 11 files use `@/app/components/Header`
- **Build**: ✓ 0 errors, all 40 pages generated
- **Wiring**: 11/11 pages correctly import (verified via grep)

## When NOT to Consolidate

Do NOT consolidate if:
- Component only appears 1-2 times (consolidation overhead > benefit)
- Component will be tool-specific in future (tool needs divergent styling)
- Component requires significant customization per page (too different to merge)

## Gotchas

### Broken Footer Links
**Issue**: Footer links to `/tools` and `#documentation` break
**Reason**: No `/tools` page exists (would be dynamic listing); Documentation placeholder was never implemented
**Fix**: Remove non-functional links from footer
```tsx
// Before:
<Link href="/tools">View all tools</Link>  // 404 — no page
<a href="#">Documentation</a>              // Broken placeholder

// After:
// Removed entirely — links only to real pages
```

### CSS Module Scoping
**Issue**: CSS Module classes need camelCase naming
**Reason**: CSS Modules in Next.js expect camelCase for JS access
```tsx
// DO
className={styles.navContainer}

// DO NOT
className={styles['nav-container']}  // Works but less idiomatic
```

### Import Path Consistency
**Issue**: Mixed import styles (relative vs. path alias) across files
**Reason**: Relative imports break when files move; path aliases survive refactoring
```tsx
// DO (use consistent alias)
import Header from "@/app/components/Header";

// DO NOT (inconsistent)
import Header from "@/app/components/Header";        // File A
import Header from "../../../components/Header";      // File B (fragile)
```

## Red Team Checklist

When consolidating a component:

- [ ] All instances of old component removed
- [ ] All imports point to new location
- [ ] `grep -r "old_location" app` returns 0 matches
- [ ] Build succeeds with 0 errors
- [ ] All pages that used old component still render (no 404s)
- [ ] CSS/styling unchanged (visual parity)
- [ ] Accessibility features preserved (ARIA labels, focus states)
- [ ] Responsive design works at all breakpoints (320px, 768px, 1024px)

## Delegation

- Delegate to **page-modernizer** when consolidation requires simultaneous style updates
- Delegate to **responsive-layout-expert** when consolidating responsive components
- Delegate to **design-system-builder** when consolidation reveals need for design tokens

## Success Criteria

✅ **Complete consolidation**:
- Single source of truth exists
- All consumers import from it
- Zero orphaned code
- Build passes
- All pages render (no new 404s)
- User-visible behavior unchanged

❌ **Incomplete consolidation**:
- Old component still exists alongside new one
- Some pages use old, some use new
- Mixed import paths remain
- Build has errors
- New 404s appear
- Visual changes without review

## Implementation Task Pattern

When writing a consolidation todo:

```markdown
# Consolidate [ComponentName] Across [Pages]

Extract [N] duplicate implementations of [ComponentName] into single 
shared component at `app/components/[ComponentName].tsx`.

**Current locations:**
- app/tools/lib/ComponentName.tsx
- app/page.tsx (embedded)
- [other locations]

**Steps:**
1. Create app/components/ComponentName.tsx (extract best version)
2. Update imports in [N] files
3. Delete old files
4. Verify: grep returns 0 matches for old locations
5. Verify: build succeeds, 0 new 404s

**Red Team:** Component consolidation, import consistency, build verification
```

## Related Skills

- `page-modernizer` — Consolidation paired with style modernization
- `design-system-builder` — Establishing tokens for consolidated components
- `responsive-layout-expert` — Consolidating complex responsive layouts

## History

| Date | Component | Pages | Outcome |
|------|-----------|-------|---------|
| 2026-05-08 | Header | 11 (1 + 10) | ✅ Consolidated, 0 errors, all pages render |
| 2026-05-08 | Footer | Tool pages | ✅ Cleaned broken links, removed 404 sources |

---

**Key Insight**: Consolidation is not about deleting code — it's about creating a single point of maintenance so future changes scale to N pages instantly, not linearly.
