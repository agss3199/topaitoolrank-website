# Implementation Plan: Header Unification

**Phase**: Page Modernization  
**Objective**: Replace custom tool page header with single homepage header across all pages  
**Status**: Awaiting user approval

---

## Overview

Move from **two divergent header implementations** (homepage navbar + tool page header) to **one unified header component** used on all pages. The homepage header will be the canonical implementation.

**Scope**:
- Extract homepage header → shared component
- Update 9 tool pages to use shared header
- Delete custom tool header component
- Test navigation on all page types

---

## Step-By-Step Implementation Plan

### Step 1: Create Shared Header Component

**File**: `app/components/Header.tsx`

**Action**:
- Extract the `<nav>` block from `app/page.tsx` lines 50–152
- Create a new React component that is the header
- Keep all JavaScript logic (hamburger toggle, scroll animations, etc.)
- Use relative imports for styles

**Input** (from `app/page.tsx`):
```jsx
<nav className="navbar" aria-label="Main navigation">
  <div className="container nav-container">
    <div className="logo">
      <a href="#home">Top AI Tool Rank</a>
    </div>
    <ul className="nav-menu" id="navMenu" ref={navMenuRef}>
      {/* Home, Services, Tools dropdown, Blogs, Contact */}
    </ul>
    <button className="hamburger"> {/* hamburger icon */}
</nav>
```

**Output**: `Header.tsx` component with:
- `useRef` hooks for hamburger and nav menu elements
- `useEffect` for menu toggle and animation observer
- Full navbar navigation structure
- Proper ARIA labels and accessibility

**Why**: Extracting to a component eliminates duplication and makes maintenance centralized.

---

### Step 2: Create Shared Header Styles

**File**: `app/components/Header.module.css`

**Action**:
- Extract navbar, hamburger, dropdown styles from `app/(marketing)/styles.css`
- Migrate to CSS module scoped to the Header component
- Ensure responsive breakpoints work (mobile, tablet, desktop)
- Verify no duplicate class names with other component styles

**Styles to Extract**:
- `.navbar`, `.nav-container`, `.logo`
- `.nav-menu`, `.nav-item-dropdown`, `.dropdown`
- `.nav-link`, `.nav-pill`
- `.hamburger`, `.hamburger.active`, `.hamburger span`
- Media queries for responsive behavior

**Why**: CSS modules scope styles and prevent naming conflicts when the header is used in different contexts (homepage, tools, blogs).

---

### Step 3: Update Homepage

**File**: `app/page.tsx`

**Action**:
1. Import the new Header component: `import Header from "@/app/components/Header"`
2. Remove the inline `<nav>` block (lines 50–152)
3. Replace with `<Header />`
4. Keep all other page content unchanged (sections below the nav)
5. Remove the hamburger and nav ref hooks (they move to the Header component)
6. Verify the page still renders correctly

**Before**:
```jsx
export default function HomePage() {
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const navMenuRef = useRef<HTMLUListElement>(null);
  
  useEffect(() => {
    // hamburger menu logic
  }, []);
  
  return (
    <div className="marketing-context">
      <nav className="navbar"> {/* 103 lines of nav code */}
      <main> {/* rest of homepage content */}
```

**After**:
```jsx
import Header from "@/app/components/Header";

export default function HomePage() {
  return (
    <div className="marketing-context">
      <Header />
      <main> {/* rest of homepage content */}
```

**Why**: Consolidates navigation logic into one component, simplifying the homepage and reducing duplication.

---

### Step 4: Update All Tool Pages

**Files**: 
- `app/tools/word-counter/page.tsx`
- `app/tools/whatsapp-message-formatter/page.tsx`
- `app/tools/whatsapp-link-generator/page.tsx`
- `app/tools/ai-prompt-generator/page.tsx`
- `app/tools/email-subject-tester/page.tsx`
- `app/tools/utm-link-builder/page.tsx`
- `app/tools/json-formatter/page.tsx`
- `app/tools/invoice-generator/page.tsx`
- `app/tools/seo-analyzer/page.tsx`
- `app/tools/wa-sender/page.tsx`

**Action** (for each file):
1. Change: `import Header from "../lib/Header"` → `import Header from "@/app/components/Header"`
2. Keep: The `<Header />` component call (no change)
3. Everything else stays the same (article loading, form logic, local storage, etc.)

**Pattern** (for each tool page):
```jsx
// Before
import Header from "../lib/Header";

// After
import Header from "@/app/components/Header";

// Usage remains the same
export default function ToolPage() {
  return (
    <>
      <Header />
      {/* tool-specific content */}
```

**Why**: All tool pages continue to render the header without code duplication. They now use the centralized, tested component.

---

### Step 5: Delete Custom Tool Header

**Files to delete**:
- `app/tools/lib/Header.tsx` — old custom header component
- `app/tools/lib/Header.module.css` — old custom header styles (optional if not referenced elsewhere)

**Verification before delete**:
- Run grep to confirm no other files import from `app/tools/lib/Header`
  ```bash
  grep -r "from.*Header" app/tools --include="*.tsx"
  ```
- Expected result: zero matches (all imports updated in Step 4)

**Why**: Removes dead code and eliminates the source of divergence. If new developers see `app/tools/lib/Header.tsx`, they might use it instead of the canonical version.

---

### Step 6: Test Navigation and Responsive Behavior

**Test Cases**:

1. **Homepage Navigation**
   - Click "Home" → stays on homepage ✓
   - Click "Services" → scrolls to services section ✓
   - Click "Tools" dropdown → shows all 10 tools ✓
   - Click a tool → navigates to that tool page ✓
   - Click "Blogs" → navigates to `/blogs/` ✓
   - Click "Contact" → scrolls to contact section ✓

2. **Tool Page Navigation**
   - Click logo → navigates to homepage ✓
   - Click "Tools" dropdown → shows all 10 tools ✓
   - Click a different tool → navigates correctly ✓
   - Click "Blogs" → navigates to `/blogs/` ✓
   - Click "Contact" → navigates to homepage #contact section ✓

3. **Mobile Behavior**
   - At 320px width: hamburger menu visible, nav menu hidden ✓
   - Hamburger click: menu opens/closes with animation ✓
   - Click a menu link: menu closes automatically ✓
   - Dropdown items visible in mobile menu ✓

4. **No JavaScript Errors**
   - Open browser console on homepage — no errors ✓
   - Open browser console on tool page — no errors ✓
   - Open mobile view — no layout shifts ✓

**Tools**: Playwright or manual testing on localhost:3000

**Why**: Ensures the unified header behaves identically across all page contexts (homepage scroll targets, tool links, mobile interactions).

---

## Dependency Analysis

### What Depends on Current State
- All 9 tool pages import `Header from "../lib/Header"`
- Tool pages render `<Header />`
- Homepage has inline header code (will be extracted)

### What Changes
- Header component location and import paths
- Header styles scoping
- No changes to page layouts, content, or functionality

### Low Risk Factors
- Header is purely presentational
- No state is shared with tool components
- CSS scoping prevents conflicts
- All pages continue to render in same structure (Header + Content + Footer)

---

## Success Criteria

✓ Single `Header.tsx` component at `app/components/Header.tsx`  
✓ All 9 tool pages use the shared header  
✓ Homepage uses the shared header  
✓ Custom tool header files deleted  
✓ Navigation works from all page types  
✓ Mobile menu works on all pages  
✓ No duplicate headers on any page  
✓ No JavaScript/console errors  
✓ Responsive layout intact (mobile, tablet, desktop)  

---

## Rollback Plan

If deployment fails:
1. Revert the commits
2. Tool pages fall back to `app/tools/lib/Header.tsx` (requires no code changes)
3. Homepage falls back to inline header (requires restoring the nav block)

**Likelihood**: Very low (header is UI-only, no API or data changes)

---

## Deployment Gate

This plan is ready for implementation. No blocking dependencies. Estimated effort: **1 todo for extraction + 1 todo for testing**.

