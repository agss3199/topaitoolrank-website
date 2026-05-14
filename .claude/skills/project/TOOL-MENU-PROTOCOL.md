# Tool Menu Protocol — Adding New Tools to Navigation

**Status**: Mandatory  
**Version**: 1.0  
**Last Updated**: 2026-05-13  

When building a new tool for the Top AI Tool Rank platform, the tool must be discoverable through the main navigation menu. This skill documents the required steps and common patterns for adding tools to the menu system.

---

## Overview

Every tool on the platform should appear in the **Tools dropdown** in the main Header navigation. This is the primary discovery mechanism for users. The protocol ensures consistency, prevents the "invisible tool" bug (tool built but not menu-discoverable), and provides a checklist for completeness.

---

## MUST: The Tool Addition Checklist

When implementing a new tool, complete these steps IN ORDER:

### 1. Tool Route Must Exist

The tool must have a working Next.js App Router page:

```
app/tools/[tool-slug]/page.tsx   ← Must exist, must export default component
```

**Verify:**
```bash
# Tool route must be accessible
ls -la app/tools/[your-tool]/page.tsx

# Build must include the route
npm run build 2>&1 | grep "/tools/\[your-tool\]"
```

### 2. Add Menu Entry to Header.tsx

File: `app/components/Header.tsx`

**Location**: Inside the `.dropdown` `<ul>` list under `Tools` (lines 70-126)

**Pattern**:
```typescript
<li>
  <a href="/tools/[your-tool-slug]" rel="noopener">
    [Display Name As Users Know It]
  </a>
</li>
```

**Example** (Palm Reader):
```typescript
<li>
  <a href="/tools/palm-reader" rel="noopener">
    Palm Reader
  </a>
</li>
```

**Rules**:
- `href` MUST match the actual route (e.g., `/tools/palm-reader` → `app/tools/palm-reader/page.tsx`)
- `rel="noopener"` MUST be present (security best practice)
- Display name MUST be user-friendly (capitalized, match tool branding)
- Items SHOULD be added in the position that makes sense thematically or alphabetically within the list
- Position matters: tools related by domain should be grouped (e.g., messaging tools together, data tools together)

### 3. Verify CSS Renders Correctly

**Visual Checklist**:
- [ ] Dropdown displays on desktop (hover over Tools)
- [ ] New tool link is visible in the dropdown (not cut off)
- [ ] Link styling matches other items (hover, focus, color)
- [ ] Link is clickable (no `pointer-events: none`)

**Responsive Check**:
- [ ] Desktop (1200px+): dropdown appears on hover
- [ ] Tablet (768-1199px): hamburger menu opens, Tools submenu visible
- [ ] Mobile (<768px): hamburger menu, Tools section expanded, link visible

**CSS File**: `app/components/Header.module.css` (no changes needed — dropdown styles are universal)

### 4. Verify Route Is Built

**Command**:
```bash
npm run build
```

**Expected Output**:
```
├ ƒ /tools/your-tool-slug
```

If NOT present: route definition issue, not a menu issue.

### 5. Test End-to-End

1. **Local**: Start dev server (`npm run dev`)
2. **Browser**: 
   - Navigate to `http://localhost:3000`
   - Hover over **Tools** in header
   - Verify tool appears in dropdown
   - Click link → should navigate to `/tools/your-tool-slug`
   - Verify page loads (no 404)

3. **Production**: After deployment:
   - Visit the live site
   - Repeat desktop/mobile/tablet checks
   - Verify no 404 errors in console

---

## Common Issues & Fixes

### Issue: Tool Link Added But Not Visible

**Diagnosis**:
```bash
# 1. Check if link is in the code
grep -n "your-tool" app/components/Header.tsx

# 2. Check if route is built
npm run build 2>&1 | grep "your-tool"

# 3. Check for CSS overflow issues (dropdown might have height limit)
# Look for max-height, overflow: hidden on .dropdown in Header.module.css
```

**Fixes**:
1. **Link missing**: Add to `app/components/Header.tsx` in the `.dropdown` ul (lines 70-126)
2. **Route not built**: Verify `app/tools/[slug]/page.tsx` exists and exports a default component
3. **CSS cut-off**: No max-height limits exist on `.dropdown` — spacing should be automatic

### Issue: Tool Page Exists But Returns 404

**Diagnosis**:
```bash
# Check file exists
ls -la app/tools/palm-reader/page.tsx

# Check Next.js routing
npm run build 2>&1 | grep "palm-reader"
```

**Fixes**:
1. Ensure `app/tools/[slug]/page.tsx` exists (not `app/tools/[slug]/index.tsx`)
2. Ensure file exports a default component: `export default function ToolPage() { ... }`
3. Clear Next.js cache: `rm -rf .next && npm run build`

### Issue: Menu Appears But Tool Is Grayed Out

**Diagnosis**:
```bash
# Check for comingSoon class
grep -n "comingSoon" app/components/Header.tsx | grep "your-tool"
```

**Fix**:
```typescript
// Verify link does NOT have comingSoon class
<li>
  <a href="/tools/your-tool" rel="noopener">  ← No className
    Your Tool
  </a>
</li>

// If accidental, remove the class
// WRONG:
<a href="..." className={styles.comingSoon}>  ← This grays it out
```

---

## Tool Branding & Naming

**Menu Display Name Format**:
- Tool name users know it as (e.g., "Palm Reader", not "palm-reader")
- Capitalize each word: "Word Counter", "UTM Link Builder", "JSON Formatter"
- Avoid abbreviations unless users expect them (e.g., "JSON" is expected, "JS" is not)
- Maximum ~25 characters (dropdown widths)

**Route Slug Format** (`/tools/[slug]`):
- Lowercase, hyphenated: `/tools/palm-reader`, `/tools/word-counter`
- Match the directory name: `app/tools/palm-reader/page.tsx`
- Match the menu href: `<a href="/tools/palm-reader">`

---

## Testing Checklist (Before Deployment)

Complete before every tool launch:

- [ ] Route exists: `app/tools/[slug]/page.tsx`
- [ ] Route exports default component
- [ ] Menu entry added to Header.tsx (correct href)
- [ ] Build succeeds: `npm run build` shows route
- [ ] Local test: Tool link works in dev server
- [ ] Responsive test: Desktop, tablet, mobile all show link
- [ ] No 404 on tool page load
- [ ] Link styling matches other menu items
- [ ] Deployed and live URL verified

---

## Implementation Workflow

### Scenario 1: Adding a New Tool

**Steps**:

1. **Create tool route**: `app/tools/[new-tool]/page.tsx` with page content
2. **Build & verify**: `npm run build` confirms route is present
3. **Add menu entry**: Edit `app/components/Header.tsx`, add `<li>` with link
4. **Local test**: `npm run dev`, hover Tools, click link, verify page loads
5. **Commit**: Single commit with route + menu entry together
6. **Deploy**: `vercel deploy --prod` (or your deployment method)
7. **Post-deploy test**: Visit live site, verify link and page work

### Scenario 2: Fixing an "Invisible" Tool (Tool Exists But Not in Menu)

**Steps**:

1. **Verify route exists**: `ls app/tools/[slug]/page.tsx`
2. **Check menu**: `grep -n "[slug]" app/components/Header.tsx`
3. **If missing from menu**: Add entry to Header.tsx
4. **Commit & deploy**: Same as above
5. **Verify live**: Tool now discoverable from menu

---

## API & Programmatic Access

The tool is ALWAYS accessible via direct URL:
- `https://topaitoolrank.com/tools/palm-reader` ← Works regardless of menu

The menu is a **discovery mechanism**, not a gating mechanism. Users can:
- Link to tools directly
- Share tool URLs
- Access tools by typing URL directly

The menu just makes tools easier to find.

---

## File Reference

| File | Purpose |
|------|---------|
| `app/components/Header.tsx` | Main navigation component (menu structure) |
| `app/components/Header.module.css` | Dropdown styling (no changes needed for new tools) |
| `app/tools/[slug]/page.tsx` | Tool route definition |

---

## Codification Rules

**This protocol MUST be followed for any new tool:**

1. ✅ Tool route exists before menu entry added
2. ✅ Menu entry href matches tool route path
3. ✅ Both route and menu entry in same commit
4. ✅ Build passes with route present
5. ✅ Local/live test confirms link and page work

**BLOCKED anti-patterns:**

- ❌ Menu entry added without working route
- ❌ Tool route exists but menu entry forgotten (invisible tool)
- ❌ Menu href doesn't match route path (broken link)
- ❌ Tool added as "Coming Soon" then forgotten
- ❌ Route deleted but menu entry remains (dead link)

---

## Examples: Full Workflow

### Example: Adding "Color Picker" Tool

**Commit 1: Add Route & Menu Entry**

```bash
# 1. Create tool component
# app/tools/color-picker/page.tsx
export default function ColorPicker() {
  return <main>Color Picker Tool...</main>;
}

# 2. Edit Header.tsx
# Add before closing </ul> in .dropdown:
<li>
  <a href="/tools/color-picker" rel="noopener">
    Color Picker
  </a>
</li>

# 3. Verify build
npm run build  # ✓ ├ ƒ /tools/color-picker

# 4. Commit together
git add app/tools/color-picker/page.tsx app/components/Header.tsx
git commit -m "feat(tools): add Color Picker to menu and routes"
```

**Verification**:
```bash
npm run dev
# Open http://localhost:3000
# Hover "Tools" → see "Color Picker"
# Click → /tools/color-picker loads
```

---

## Version History

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-05-13 | Initial protocol documentation |

---

## Related Documentation

- `app/components/Header.tsx` — Component source code
- `app/components/Header.module.css` — Component styles
- `.claude/rules/project/` — Project-specific rules
- `CLAUDE.md` → "Tool Making Protocol" section (if exists)
