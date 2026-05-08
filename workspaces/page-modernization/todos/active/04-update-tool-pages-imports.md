# Task 04: Update 9 Tool Pages to Use New Shared Header

**Objective**: Change import path for Header component in all tool pages  
**Scope**: Update 9 files — change `import Header from "../lib/Header"` to `import Header from "@/app/components/Header"`  
**Status**: Not started  
**Estimate**: 15 minutes  
**Depends on**: Tasks 01–03 (Header component and CSS module created, homepage updated)

---

## Description

Update the import statement in all 9 tool pages to reference the new shared Header component instead of the custom tool-specific header.

---

## Files to Update

1. `app/tools/word-counter/page.tsx`
2. `app/tools/whatsapp-message-formatter/page.tsx`
3. `app/tools/whatsapp-link-generator/page.tsx`
4. `app/tools/ai-prompt-generator/page.tsx`
5. `app/tools/email-subject-tester/page.tsx`
6. `app/tools/utm-link-builder/page.tsx`
7. `app/tools/json-formatter/page.tsx`
8. `app/tools/invoice-generator/page.tsx`
9. `app/tools/seo-analyzer/page.tsx`
10. `app/tools/wa-sender/page.tsx`

**Total**: 9 files (10 including wa-sender)

---

## Acceptance Criteria

- [ ] All 9 tool page files updated
- [ ] Old import path `../lib/Header` removed
- [ ] New import path `@/app/components/Header` added
- [ ] `<Header />` component usage unchanged (no other edits needed)
- [ ] No console errors when visiting any tool page
- [ ] All tool pages render correctly with new header
- [ ] Navigation works on each tool page (logo, Tools dropdown, Blogs, Contact)

---

## Steps

### Step 1: Update word-counter page

File: `app/tools/word-counter/page.tsx`

Find line with:
```typescript
import Header from "../lib/Header";
```

Replace with:
```typescript
import Header from "@/app/components/Header";
```

That's it. Don't change anything else in the file.

### Step 2–10: Repeat for other 8 tool pages

Use the same pattern for each file:

**Find**: `import Header from "../lib/Header";`  
**Replace**: `import Header from "@/app/components/Header";`

Files:
2. `app/tools/whatsapp-message-formatter/page.tsx`
3. `app/tools/whatsapp-link-generator/page.tsx`
4. `app/tools/ai-prompt-generator/page.tsx`
5. `app/tools/email-subject-tester/page.tsx`
6. `app/tools/utm-link-builder/page.tsx`
7. `app/tools/json-formatter/page.tsx`
8. `app/tools/invoice-generator/page.tsx`
9. `app/tools/seo-analyzer/page.tsx`
10. `app/tools/wa-sender/page.tsx`

### Step 3: Verify all files updated

Run grep to confirm change applied everywhere:

```bash
grep -r "import Header from" app/tools --include="*.tsx" | grep -v node_modules
```

Expected output:
```
app/tools/word-counter/page.tsx:import Header from "@/app/components/Header";
app/tools/whatsapp-message-formatter/page.tsx:import Header from "@/app/components/Header";
app/tools/whatsapp-link-generator/page.tsx:import Header from "@/app/components/Header";
app/tools/ai-prompt-generator/page.tsx:import Header from "@/app/components/Header";
app/tools/email-subject-tester/page.tsx:import Header from "@/app/components/Header";
app/tools/utm-link-builder/page.tsx:import Header from "@/app/components/Header";
app/tools/json-formatter/page.tsx:import Header from "@/app/components/Header";
app/tools/invoice-generator/page.tsx:import Header from "@/app/components/Header";
app/tools/seo-analyzer/page.tsx:import Header from "@/app/components/Header";
app/tools/wa-sender/page.tsx:import Header from "@/app/components/Header";
```

**Check**: Exactly 10 matches, all pointing to `@/app/components/Header`

```bash
grep -r "import Header from \"../lib/Header\"" app/tools --include="*.tsx"
```

**Check**: Zero matches (old import completely removed)

---

## Code Diff Example

```diff
# app/tools/word-counter/page.tsx

import { useState, useEffect } from "react";
- import Header from "../lib/Header";
+ import Header from "@/app/components/Header";
import Footer from "../lib/Footer";
import styles from "./styles.css";
```

---

## Testing

### Syntax Check
```bash
# Verify all tool pages have valid imports
for file in app/tools/*/page.tsx; do
  grep -q "import Header from \"@/app/components/Header\"" "$file" && echo "✓ $file" || echo "✗ $file"
done
```

### Runtime Check
1. Start dev server: `npm run dev`
2. Visit each tool page:
   - `http://localhost:3000/tools/word-counter`
   - `http://localhost:3000/tools/whatsapp-message-formatter`
   - (etc. for all 9 tools)
3. Verify:
   - Header renders
   - Logo, Tools dropdown, Blog, Contact links visible
   - No console errors
   - Tool content below header works correctly

---

## Notes

- This is a **mechanical change**: import path only
- No functional changes, no logic changes
- All tool page functionality (text analysis, form handling, local storage, etc.) unchanged
- Header component is identical across all pages
- Path alias `@/` points to project root (configured in `tsconfig.json` or `next.config.js`)

---

## Common Issues

| Issue | Solution |
|-------|----------|
| Import resolution error | Check path alias `@/` is configured in `tsconfig.json` |
| Component not found | Verify `app/components/Header.tsx` exists (from Task 01) |
| Type errors | Verify Header.tsx exports default component |
| Styling missing | Verify Header.module.css exists (from Task 02) |

---

## Next Task

→ **05-cleanup-old-header.md** — Delete custom Header files no longer needed

