# Task 03: Update Homepage to Use New Header Component

**Objective**: Replace inline navbar in homepage with new shared Header component  
**Scope**: Update `app/page.tsx` — remove lines 50–152, add Header import and usage  
**Status**: Not started  
**Estimate**: 10 minutes  
**Depends on**: Tasks 01 & 02 (Header.tsx and Header.module.css created)

---

## Description

Update the homepage to import and use the new Header component instead of having navbar code inline.

---

## Acceptance Criteria

- [ ] `app/page.tsx` imports Header component: `import Header from "@/app/components/Header"`
- [ ] Lines 50–152 (navbar block) removed from page
- [ ] `<Header />` component rendered in place of removed nav block
- [ ] All useRef and useEffect hooks for hamburger removed from page
- [ ] Rest of homepage content unchanged (hero, services, tools, etc.)
- [ ] Homepage renders without console errors
- [ ] Navigation works (links to Services, Tools, Blogs, Contact)
- [ ] Mobile hamburger menu appears on mobile view

---

## Steps

### Step 1: Open app/page.tsx

Start at line 1 of the file.

### Step 2: Add import

After other imports, add:
```typescript
import Header from "@/app/components/Header";
```

Location: After line 3 (`import "./(marketing)/styles.css"`)

### Step 3: Remove useRef hooks

Delete lines that define hamburgerRef and navMenuRef:
```typescript
// DELETE these lines:
const hamburgerRef = useRef<HTMLButtonElement>(null);
const navMenuRef = useRef<HTMLUListElement>(null);
```

### Step 4: Remove useEffect

Delete the entire useEffect block (lines ~10–45 in original):
```typescript
// DELETE this entire block:
useEffect(() => {
  // hamburger menu toggle
  const hamburger = hamburgerRef.current;
  const navMenu = navMenuRef.current;
  
  if (hamburger && navMenu) {
    // ... menu logic ...
  }
  
  // Reveal scroll animations
  const revealItems = document.querySelectorAll(".reveal");
  // ... observer logic ...
}, []);
```

### Step 5: Replace navbar with Header component

Find the navbar block (starts at `<nav className="navbar"`):
```jsx
// DELETE this entire <nav> block (lines ~50–152):
<nav className="navbar" aria-label="Main navigation">
  <div className="container nav-container">
    {/* ... entire navbar structure ... */}
  </div>
</nav>
```

Replace with:
```jsx
<Header />
```

### Step 6: Verify structure

After changes, the page should look like:

```jsx
"use client";

import { useEffect, useRef } from "react";  // REMOVE useEffect and useRef imports if no longer used
import "./(marketing)/styles.css";
import Header from "@/app/components/Header";  // ADD this

export default function HomePage() {
  // NO useRef or useEffect for hamburger
  
  return (
    <div className="marketing-context">
      <Header />  {/* ADD this */}
      {/* Rest of page unchanged: hero, services, tools sections, etc. */}
    </div>
  );
}
```

### Step 7: Clean up unused imports

If `useRef` or `useEffect` are no longer used in the file:
- Remove from import statement: `import { useEffect, useRef } from "react"`
- Keep other imports

If the page doesn't use any React hooks, you can remove the import entirely.

### Step 8: Verify file

Check the final structure:
```bash
grep -n "import\|export\|<Header\|<main\|<section" app/page.tsx | head -20
```

Expected output shows:
- Header import present
- `<Header />` component rendered
- `<main>` and sections follow the header

---

## Code Diff Summary

```diff
"use client";

import { useEffect, useRef } from "react";
import "./(marketing)/styles.css";
+ import Header from "@/app/components/Header";

export default function HomePage() {
-  const hamburgerRef = useRef<HTMLButtonElement>(null);
-  const navMenuRef = useRef<HTMLUListElement>(null);
-
-  useEffect(() => {
-    // hamburger menu toggle
-    const hamburger = hamburgerRef.current;
-    const navMenu = navMenuRef.current;
-    // ... 40+ lines of menu logic ...
-  }, []);

  return (
    <div className="marketing-context">
-      <nav className="navbar" aria-label="Main navigation">
-        <div className="container nav-container">
-          {/* ... 100+ lines of navbar ... */}
-        </div>
-      </nav>
+      <Header />
       
       <main id="main">
         <section id="home" className="hero">
```

---

## Testing

### Quick Validation
```bash
# Check file has Header import
grep "import Header" app/page.tsx

# Check file has <Header /> usage
grep "<Header" app/page.tsx

# Check old nav block is gone
grep -c "<nav className=\"navbar\"" app/page.tsx
# Expected output: 0
```

### Manual Test
1. `npm run dev` to start dev server
2. Visit `http://localhost:3000`
3. Verify:
   - Header appears at top of page
   - Logo, Services, Tools, Blogs, Contact links visible
   - No console errors
   - On mobile (resize to 320px), hamburger menu appears

---

## Notes

- This is a **pure refactoring**: all homepage functionality is preserved
- The header component is imported from `@/app/components/Header`, using path alias
- Rest of the homepage (hero, services, tools, etc.) sections remain unchanged
- CSS and styling all handled by Header component and Header.module.css

---

## Next Task

→ **04-update-tool-pages-imports.md** — Update 9 tool pages to import new Header

