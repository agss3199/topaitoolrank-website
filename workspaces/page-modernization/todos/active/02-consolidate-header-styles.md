# Task 02: Consolidate Header Styles to CSS Module

**Objective**: Extract navbar styles from `app/(marketing)/styles.css` into `app/components/Header.module.css`  
**Scope**: Create CSS module with all navbar, hamburger, dropdown styling  
**Status**: Not started  
**Estimate**: 20 minutes  
**Depends on**: Task 01 (Header.tsx component created)

---

## Description

Create a new CSS module for the Header component by extracting navbar-related styles from the marketing styles file. Consolidate all navbar, hamburger, dropdown, and responsive styles.

---

## Acceptance Criteria

- [ ] `app/components/Header.module.css` created
- [ ] All navbar styles extracted (navbar, nav-container, logo, nav-menu)
- [ ] All hamburger styles extracted (hamburger, hamburger.active, hamburger span)
- [ ] All dropdown styles extracted (dropdown, dropdown items, hover states)
- [ ] All responsive media queries preserved (mobile, tablet, desktop)
- [ ] Class names match those used in Header.tsx (e.g., `navbar` → `.navbar`)
- [ ] No hardcoded colors (use CSS variables if available)
- [ ] File is syntactically valid CSS with no errors
- [ ] Hamburger menu animation preserved (toggle active state)
- [ ] Dropdown appears on hover/click on desktop, toggles on mobile

---

## Steps

### Step 1: Identify styles to extract

From `app/(marketing)/styles.css`, grep for navbar-related rules:

```bash
grep -n "\.navbar\|\.nav-\|\.hamburger\|\.dropdown" app/\(marketing\)/styles.css
```

Expected matches: `.navbar`, `.nav-container`, `.logo`, `.nav-menu`, `.nav-item-dropdown`, `.dropdown`, `.nav-link`, `.nav-pill`, `.hamburger`, `.hamburger.active`, `.hamburger span`

### Step 2: Create Header.module.css

Create `app/components/Header.module.css` with CSS module syntax (`:local` scopes):

```css
.navbar {
  /* navbar styles from (marketing)/styles.css */
}

.navContainer {
  /* nav-container styles */
}

.logo {
  /* logo styles */
}

.navMenu {
  /* nav-menu styles */
}

.navItemDropdown {
  /* nav-item-dropdown styles (for Tools dropdown) */
}

.dropdown {
  /* dropdown menu styles */
}

.navLink {
  /* nav-link styles */
}

.navPill {
  /* nav-pill styles (Contact button) */
}

.hamburger {
  /* hamburger button styles */
}

.hamburger.active {
  /* hamburger active state */
}

.hamburger span {
  /* hamburger lines */
}

/* Media queries for responsive behavior */
@media (max-width: 768px) {
  /* Mobile styles */
}

@media (min-width: 769px) {
  /* Desktop styles */
}
```

### Step 3: Convert class names to camelCase

CSS modules in Next.js use camelCase for class selectors. Map:

| Original | CSS Module |
|----------|-----------|
| `.navbar` | `.navbar` |
| `.nav-container` | `.navContainer` |
| `.logo` | `.logo` |
| `.nav-menu` | `.navMenu` |
| `.nav-item-dropdown` | `.navItemDropdown` |
| `.dropdown` | `.dropdown` |
| `.nav-link` | `.navLink` |
| `.nav-pill` | `.navPill` |
| `.hamburger` | `.hamburger` |

### Step 4: Verify Header.tsx matches

Open Header.tsx and verify all `className={styles.xxx}` references map to `.xxx` in CSS module:

```bash
grep "styles\." app/components/Header.tsx | cut -d' ' -f1 | sort -u
# Expected output:
# styles.navbar
# styles.navContainer
# styles.logo
# styles.navMenu
# styles.navItemDropdown
# styles.dropdown
# styles.navLink
# styles.navPill
# styles.hamburger
```

Then verify CSS module has all these as class selectors:

```bash
grep "^\." app/components/Header.module.css | sed 's/.*\.\([^ {]*\).*/\1/' | sort -u
# Should match all className references from grep above
```

### Step 5: Extract from source

Use grep to find the exact lines in source:

```bash
# Find line ranges for navbar styles in (marketing)/styles.css
grep -n "\.navbar\|\.hamburger\|\.nav-" app/\(marketing\)/styles.css
```

Copy all matching blocks into Header.module.css, preserving:
- Color values (or convert to CSS variables)
- Font sizes, padding, margins
- Flexbox/grid layouts
- Media queries
- Transitions and animations
- Hover/active states

### Step 6: Test CSS validity

Run CSS linter (if available) or visual inspection:

```bash
# Check for syntax errors
cat app/components/Header.module.css | grep -E "^[^/]" | tail -5
```

Expected: Valid CSS with closing braces matching opening braces

---

## Critical Styles to Preserve

### Hamburger Menu Toggle
- `.hamburger` default state (hidden on desktop, visible on mobile)
- `.hamburger.active` state (changes visual appearance when menu opens)
- Responsive breakpoint (768px) where hamburger appears/hides

### Dropdown Menu
- `.dropdown` visibility (hidden by default)
- `.nav-item-dropdown:hover .dropdown` show on desktop
- Mobile: toggle via JavaScript `.active` state

### Responsive Breakpoints
```css
/* Mobile first */
@media (max-width: 768px) {
  .navMenu { display: none; }
  .hamburger { display: block; }
}

@media (min-width: 769px) {
  .navMenu { display: flex; }
  .hamburger { display: none; }
}
```

---

## Validation

### File Structure Check
```bash
head -5 app/components/Header.module.css  # Should show valid CSS
wc -l app/components/Header.module.css    # Should be 200+ lines
```

### Class Name Check
```bash
# All styles references in Header.tsx should exist in CSS module
grep "styles\." app/components/Header.tsx | sed 's/.*styles\.\([a-zA-Z]*\).*/\1/' | sort -u > /tmp/used.txt
grep "^\." app/components/Header.module.css | sed 's/\.\([a-zA-Z]*\).*/\1/' | sort -u > /tmp/defined.txt
diff /tmp/used.txt /tmp/defined.txt  # Should be empty (all used styles are defined)
```

---

## Testing

### Syntax Validation
- CSS module should have no syntax errors
- All braces should match (opening { with closing })
- All semicolons present on property lines

### Behavior Validation (will test in Step 3)
- Hamburger button appears on mobile
- Menu opens/closes when hamburger clicked
- Dropdown appears on Tools hover (desktop)
- Responsive layout works at 320px, 768px, 1200px

---

## Notes

- CSS modules automatically scope styles with unique hashes, preventing conflicts
- Class names convert from kebab-case to camelCase in JS (`.nav-menu` → `navMenu`)
- Media queries remain in CSS module (not extracted)
- No duplicate styles between Header.module.css and (marketing)/styles.css (verify after extraction)

---

## Next Task

→ **03-update-homepage.md** — Update homepage to use new Header component

