# Task 05: Delete Custom Tool Header Files

**Objective**: Remove the old custom Header component that is no longer needed  
**Scope**: Delete 2 files: `app/tools/lib/Header.tsx` and `app/tools/lib/Header.module.css`  
**Status**: Not started  
**Estimate**: 5 minutes  
**Depends on**: Task 04 (All tool pages updated to use new header)

---

## Description

Delete the custom header files that are now replaced by the new shared Header component.

---

## Acceptance Criteria

- [ ] `app/tools/lib/Header.tsx` deleted
- [ ] `app/tools/lib/Header.module.css` deleted
- [ ] No imports of old Header remain in codebase
- [ ] All tool pages use new Header successfully
- [ ] No console errors from missing imports

---

## Steps

### Step 1: Verify no imports remain

Before deleting, check no file imports from the old location:

```bash
grep -r "from.*lib/Header" app --include="*.tsx" --include="*.ts"
```

**Expected**: Zero matches (all imports updated in Task 04)

If any matches found, update those imports before proceeding.

### Step 2: Delete Header.tsx

Remove file: `app/tools/lib/Header.tsx`

```bash
rm app/tools/lib/Header.tsx
```

### Step 3: Delete Header.module.css

Remove file: `app/tools/lib/Header.module.css`

```bash
rm app/tools/lib/Header.module.css
```

### Step 4: Verify deletion

```bash
ls -la app/tools/lib/Header.*
```

**Expected**: `No such file or directory` (both files gone)

### Step 5: Final verification

Grep to ensure no remaining references:

```bash
grep -r "tools/lib/Header\|app/tools/Header" app --include="*.tsx" --include="*.ts" --include="*.css"
```

**Expected**: Zero matches

```bash
# Also check that new Header path is correct
grep -r "@/app/components/Header" app/tools --include="*.tsx" | wc -l
```

**Expected**: 10 matches (one per tool page + homepage)

---

## Testing

### Verify Imports
```bash
# Should find no old imports
grep -r "../lib/Header" app/tools

# Should find all new imports
grep -r "@/app/components/Header" app/tools | wc -l
# Expected: 9 or 10
```

### Visual Test
1. Start dev server: `npm run dev`
2. Visit a tool page: `http://localhost:3000/tools/word-counter`
3. Verify header renders and works
4. Check browser console for errors (should be none)

---

## Safety Notes

- **Backup**: Git preserves file history, no data loss
- **Reversible**: If needed, `git checkout -- app/tools/lib/` restores files
- **Verify before delete**: Grep check (Step 1) ensures nothing imports these files
- **No functional changes**: Only removing duplicate code, zero feature impact

---

## What Gets Deleted

### app/tools/lib/Header.tsx
- React component with navbar logic
- Custom styling for tool pages
- ~168 lines of code

### app/tools/lib/Header.module.css
- Styles for tool header
- Navigation, hamburger, dropdown styles
- ~150 lines of CSS

Both are now replaced by:
- `app/components/Header.tsx` (shared, used by all pages)
- `app/components/Header.module.css` (shared styles)

---

## Next Task

→ **06-test-navigation-desktop.md** — Test header and navigation on desktop

