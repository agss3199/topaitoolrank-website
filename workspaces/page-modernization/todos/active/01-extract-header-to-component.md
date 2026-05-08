# Task 01: Extract Homepage Header to Shared Component

**Objective**: Create a new shared Header component by extracting the navbar from homepage  
**Scope**: Create `app/components/Header.tsx` with navbar code from `app/page.tsx` lines 50–152  
**Status**: Not started  
**Estimate**: 15 minutes

---

## Description

Extract the `<nav>` block (and all its logic) from the homepage into a reusable React component. This becomes the canonical header component used on all pages.

---

## Acceptance Criteria

- [ ] `app/components/Header.tsx` created with 150+ lines of code
- [ ] Component exports `Header` as default export
- [ ] Contains `useRef` hooks for hamburger and nav menu
- [ ] Contains `useEffect` for menu toggle and reveal animations
- [ ] All ARIA labels preserved (aria-label, aria-expanded, aria-controls)
- [ ] Component imports styles from local CSS module
- [ ] No console errors when component imported
- [ ] Component can be rendered standalone (no dependency on page context)

---

## Steps

### Step 1: Create the file

Create `app/components/Header.tsx`

### Step 2: Extract navbar code

Copy lines 50–152 from `app/page.tsx`:

```jsx
"use client";

import { useEffect, useRef } from "react";
import styles from "./Header.module.css";  // Will be created in next task

export default function Header() {
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const navMenuRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    // hamburger menu toggle (copy from app/page.tsx useEffect)
    const hamburger = hamburgerRef.current;
    const navMenu = navMenuRef.current;

    if (hamburger && navMenu) {
      hamburger.addEventListener("click", () => {
        hamburger.classList.toggle("active");
        navMenu.classList.toggle("active");
        const isExpanded = hamburger.classList.contains("active");
        hamburger.setAttribute("aria-expanded", String(isExpanded));
        hamburger.setAttribute("aria-label", isExpanded ? "Close menu" : "Open menu");
      });

      document.querySelectorAll(".nav-link").forEach((link) => {
        link.addEventListener("click", () => {
          hamburger.classList.remove("active");
          navMenu.classList.remove("active");
        });
      });
    }

    // Reveal scroll animations (copy from app/page.tsx useEffect)
    const revealItems = document.querySelectorAll(".reveal");
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.12 }
    );

    revealItems.forEach((item) => revealObserver.observe(item));
  }, []);

  return (
    <nav className={styles.navbar} aria-label="Main navigation">
      <div className={styles.navContainer}>
        <div className={styles.logo}>
          <a href="#home">Top AI Tool Rank</a>
        </div>

        <ul className={styles.navMenu} id="navMenu" ref={navMenuRef}>
          <li>
            <a href="#home" className={styles.navLink}>
              Home
            </a>
          </li>
          <li>
            <a href="#services" className={styles.navLink}>
              Services
            </a>
          </li>

          <li className={styles.navItemDropdown}>
            <a href="#tools" className={styles.navLink}>
              Tools
            </a>
            <ul className={styles.dropdown}>
              <li>
                <a href="/tools/whatsapp-message-formatter" rel="noopener">
                  WhatsApp Message Formatter
                </a>
              </li>
              {/* ... rest of tools list ... */}
            </ul>
          </li>

          <li>
            <a href="/blogs/" className={styles.navLink}>
              Blogs
            </a>
          </li>
          <li>
            <a href="#contact" className={styles.navLink + " " + styles.navPill}>
              Contact
            </a>
          </li>
        </ul>

        <button
          type="button"
          className={styles.hamburger}
          id="hamburger"
          ref={hamburgerRef}
          aria-label="Open menu"
          aria-expanded="false"
          aria-controls="navMenu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </nav>
  );
}
```

### Step 3: Update imports

- Change `import styles from "./Header.module.css"` (created in next task)
- Verify all class names map to styles object (will validate in next task)

### Step 4: Verify structure

Run in Node REPL or type-check:
```bash
npx tsc --noEmit app/components/Header.tsx
```

Expected: Zero TypeScript errors

---

## Testing

### Quick Test
```bash
cd app/components
# Open Header.tsx in editor, verify:
# - useRef called for hamburgerRef and navMenuRef
# - useEffect present with menu toggle logic
# - className attributes use styles.xxx pattern
# - All nav links preserved from homepage
```

### Manual Test (next task will validate with styles)
- File should be syntactically valid TSX
- No TypeScript errors
- Exports default Header component

---

## Notes

- This is a **pure extraction**, zero functional changes
- All className references currently point to `styles` object (will be CSS module)
- The component is self-contained and has no external dependencies beyond React hooks
- useEffect cleanup will be added in a future optimization (not blocking)

---

## Next Task

→ **02-consolidate-header-styles.md** — Create Header.module.css with navbar styles

