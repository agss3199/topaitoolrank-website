# Todo: Fix CSS Architecture — Remove Global Leakage, Implement Route Groups

**Status:** Pending  
**Implements:** specs/styling-architecture.md §Fix, §Target Architecture  
**Dependencies:** None (independent of auth)  
**Blocks:** Component library refactoring (item 04)  
**Capacity:** Single session (~300 LOC configuration + moves)  

## Description

Remove global CSS injection (`public/css/style.css` script in `app/layout.tsx`). Implement route group layouts (`(marketing)`, `(blog)`, `(tools)`) that each wrap their children in a context class and import context-specific CSS. This fixes the "green screen artifact" and prevents style leakage between contexts.

## Implementation

1. **Delete global CSS injection:**
   - Remove lines 38-43 from `app/layout.tsx` that load `/css/style.css`
   - Delete script tag entirely

2. **Create route group layouts:**
   - Create `app/(marketing)/layout.tsx` with `<div className="marketing-context">{children}</div>`
   - Create `app/(blog)/layout.tsx` with `<div className="blog-context">{children}</div>`
   - Create `app/(tools)/layout.tsx` with `<div className="tools-context">{children}</div>`
   - Each layout imports its own `styles.css` (not globally)

3. **Create context-specific CSS files:**
   - Create `app/(marketing)/styles.css` (move all homepage styles from `public/css/style.css`)
   - Create `app/(blog)/styles.css` (blog-context CSS variables and typography)
   - Create `app/(tools)/styles.css` (tools-context CSS variables and spacing)
   - Delete `public/css/style.css` and `public/css/animations.css`

4. **Move animation keyframes:**
   - Move marketing animations to `app/(marketing)/styles.css`
   - Move blog animations (if any) to `app/(blog)/styles.css`
   - Remove from global scope

## Acceptance Criteria

- [ ] `app/layout.tsx` has NO script tag loading `/css/style.css`
- [ ] Route group layouts wrap content in context class (`marketing-context`, etc.)
- [ ] Each route group imports its own styles (not globally)
- [ ] Article pages render with NO styles from marketing context
- [ ] Tool pages render with NO styles from blog/marketing contexts
- [ ] `public/css/style.css` is deleted
- [ ] `public/css/animations.css` is deleted
- [ ] All animation keyframes are in route group CSS files
- [ ] No duplicate `* { reset }` rules
- [ ] Local `npm run dev` shows clean article pages (no green screen, no unexpected styles)

## Testing

```bash
# Verify no global CSS is loaded
curl http://localhost:3000/blogs/ai-integration-guide | grep "public/css"
# Should return NOTHING (no references to /css/style.css)

# Verify article page renders cleanly
# Visit http://localhost:3000/blogs/ai-integration-guide in browser
# Check DevTools > Styles: should only see blog context styles, no marketing styles
```

