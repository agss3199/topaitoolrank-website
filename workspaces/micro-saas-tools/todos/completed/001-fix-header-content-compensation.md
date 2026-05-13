# Todo 001: Fix Fixed Header Content Compensation

**Priority**: 🔴 CRITICAL (Blocking all other layout fixes)  
**Effort**: ~20 minutes (1 focus block)  
**Implements**: `specs/layout-system-responsive-design.md` § Header Positioning, Keyboard Accessibility

## Description

The fixed header (`position: fixed; top: 18px; height: 72px`) obscures the first 90px of page content. Currently, when users navigate to pages with anchor links (e.g., `/#services`), the page scrolls but the header covers the target section. Keyboard users cannot access content behind the header.

## Acceptance Criteria

- [ ] `html { scroll-padding-top: 120px; }` added to `app/globals.css`
- [ ] Skip-to-content link added as first element in `<body>` (in `app/layout.tsx`)
- [ ] Skip-link CSS added: hidden by default, visible on `:focus`
- [ ] Visual test: Click `/#services` on homepage → section appears below header, not hidden
- [ ] Keyboard test: Press Tab on blank page → first focusable element is "Skip to main content"
- [ ] No console errors in browser devtools

## Changes Required

### File: `app/globals.css`

Add to the root styles section:

```css
html {
  scroll-padding-top: 120px; /* Fixed header (72px) + top offset (18px) + buffer (30px) */
}
```

### File: `app/layout.tsx`

After `<body>` opening tag, add:

```tsx
<a href="#main" className="skip-to-content">Skip to main content</a>
```

### File: `app/layout.tsx` (continued)

Wrap the main content children in a `<main>` element with `id="main"`:

```tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <a href="#main" className="skip-to-content">Skip to main content</a>
        <Header />
        <main id="main">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
```

### File: `app/globals.css` (continued)

Add skip-link styles:

```css
.skip-to-content {
  position: absolute;
  left: -9999px;
  z-index: 999;
  padding: 8px 16px;
  background: var(--color-accent);
  color: var(--color-white);
  border-radius: 4px;
  text-decoration: none;
  font-weight: 600;
}

.skip-to-content:focus {
  position: fixed;
  top: 100px; /* Below fixed header */
  left: 16px;
  z-index: 999;
  outline: 2px solid var(--color-accent-hover);
  outline-offset: 2px;
}
```

## Implementation Notes

- **Scroll-padding value**: 120px = 72px header height + 18px top offset + 30px buffer (ensures comfortable clearance)
- **Skip-link positioning**: Uses `left: -9999px` (keeps in accessibility tree) not `display: none` (removes from tree)
- **Target element**: Main content wrapped in `<main id="main">` for keyboard nav to work across all pages
- **Testing**: Load homepage, click "Services" link → should scroll to service section visible below header

## Dependencies

- None (independent fix)

## Next

→ Todo 002: Add Header/Footer to Blogs (depends on this todo completing)
