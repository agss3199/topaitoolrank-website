# Link Hygiene Pattern

**Status**: Production (validated 2026-05-08)  
**Applies to**: Footer, navigation, and any place user-facing links live  
**Pattern**: Remove broken/placeholder links, verify all links resolve correctly

## Quick Reference

Broken links:
- `href="#"` — JavaScript placeholder, goes nowhere
- `href="/missing-page"` — Links to non-existent page (404)
- `href="https://example.com"` — Placeholder domain (will break)
- Missing `<Link>` fallback — Internal links that should be Next.js `<Link>`

Resolution:
- Remove placeholder links entirely (do not hide them)
- Replace with real links or implement the destination
- Verify with build + live site check

## The Pattern: Footer Link Cleanup (May 2026)

### Problem
Footer contained:
```tsx
<a href="#">Documentation</a>          // Broken — placeholder
<a href="#">API Docs</a>               // Broken — placeholder
<Link href="/tools">View all tools</Link>  // 404 — no /tools page
```

Users clicking these links:
- `#` → page jumps to top (confusing UX)
- `/tools` → 404 error page

### Diagnosis
```bash
# Check what pages exist
ls -la app/tools/*/page.tsx | wc -l        # 10 tool pages exist
curl https://topaitoolrank.com/tools       # 404 — no listing page

# Check footer for broken links
grep -r "href=\"#\"\|href=\"/missing" app/tools/lib/Footer.tsx
# Found: href="#" for Documentation, API Docs
```

### Solution
```tsx
// Before
<div className={styles.toolFooterColumn}>
  <h3 className={styles.toolFooterColumnTitle}>Resources</h3>
  <Link href="/blogs" className={styles.toolFooterLink}>
    Blog
  </Link>
  <a href="#">Documentation</a>        // REMOVE
  <a href="#">API Docs</a>             // REMOVE
</div>

<div>
  <Link href="/tools">View all tools</Link>  // REMOVE (404)
</div>

// After
<div className={styles.toolFooterColumn}>
  <h3 className={styles.toolFooterColumnTitle}>Resources</h3>
  <Link href="/blogs" className={styles.toolFooterLink}>
    Blog
  </Link>
  {/* Removed: Documentation, API Docs (not implemented) */}
</div>

<div>
  {/* Removed: /tools link (no page exists; use /#tools for homepage section) */}
</div>
```

### Verification
```bash
# 1. Build succeeds
npm run build

# 2. No 404 sources
grep -r "href=\"#\"\|href=\"/missing" app --include="*.tsx"  # 0 matches

# 3. All remaining links are real
grep -r "href=" app/tools/lib/Footer.tsx
# Results:
#   /blogs/      ✓ real page
#   /privacy     ✓ real page
#   /terms       ✓ real page
#   /#contact    ✓ homepage section
#   /sitemap.xml ✓ real file
```

## Anti-Patterns to Avoid

### 1. Hidden Broken Links
```tsx
// DO NOT — hide placeholder link in CSS
<a href="#" style={{ display: 'none' }}>
  Documentation
</a>
// Problem: Still in HTML, still wastes space, still wrong semantically
```

**Instead**: Delete the link entirely. If Documentation becomes needed, add it with real content.

### 2. Pointing to Wrong Pages
```tsx
// DO NOT — documentation link to homepage
<a href="/">Documentation</a>
// DO NOT — point to blog as placeholder
<a href="/blogs">Documentation</a>

// DO — either implement or remove
// If documentation needed:
<Link href="/docs">Documentation</Link>  // Create /docs page
// If not needed:
{/* Documentation not yet implemented */}
```

### 3. External Links Without `rel`
```tsx
// DO NOT — external link without safety attributes
<a href="https://docs.example.com">Docs</a>

// DO — use appropriate rel attributes
<a href="https://docs.example.com" rel="noopener noreferrer" target="_blank">
  Docs (opens in new tab)
</a>

// OR — for Next.js, use Link for internal routes only
<Link href="/docs">Internal docs</Link>
```

### 4. Inconsistent Link Styles
```tsx
// DO NOT — mix <a> and <Link>
<a href="/internal-page">Internal</a>        // HTML anchor
<Link href="/internal-page">Internal</Link>  // Next.js Link

// DO — use Next.js <Link> for all internal routes
<Link href="/blogs">Blog</Link>
<Link href="/#contact">Contact</Link>
```

## Checklist: Link Hygiene Before Deploy

- [ ] No `href="#"` except for semantic anchor links (`href="/#section"`)
- [ ] No `/missing/*` or `/placeholder/*` links
- [ ] No hardcoded `https://example.com` or `https://docs.example.com`
- [ ] All external links have `rel="noopener noreferrer"`
- [ ] All internal routes use `<Link>` not `<a>`
- [ ] Anchor links to real page sections (`#home`, `#tools`, `#contact`)
- [ ] `grep -r "href=\"#\"" app` only shows legitimate anchors
- [ ] Build passes with 0 errors
- [ ] Manual check: Click 5 random footer/nav links, all work

## When to Remove vs. Implement

### Remove if:
- Feature is not in product roadmap
- No content exists for the destination
- Placeholder was added "for future use" (3+ months ago)
- Removing simplifies the UI
- Real user need doesn't justify the work

### Implement if:
- Feature is actively used or requested
- Destination page/content already exists elsewhere (consolidate)
- Adding the link enables a user workflow
- Product roadmap includes this feature

## Common Patterns

### Footer Structure (Correct)
```tsx
<footer>
  <div>
    <h3>Company</h3>
    <Link href="/">Home</Link>
    <Link href="/about">About</Link>
  </div>
  
  <div>
    <h3>Resources</h3>
    <Link href="/blogs">Blog</Link>
    <a href="https://docs.example.com" rel="noopener noreferrer">
      Docs (external)
    </a>
  </div>
  
  <div>
    <h3>Legal</h3>
    <Link href="/privacy-policy">Privacy</Link>
    <Link href="/terms">Terms</Link>
  </div>
</footer>
```

### Anchor Link Pattern (Correct)
```tsx
// Homepage sections with IDs
<section id="home">Home section</section>
<section id="tools">Tools section</section>
<section id="contact">Contact form</section>

// Links to those sections
<Link href="/#home">Home</Link>
<Link href="/#tools">Tools</Link>
<Link href="/#contact">Contact</Link>
```

### Wrong: Placeholder Links
```tsx
// DO NOT:
<a href="#">Coming Soon</a>
<a href="#docs">Documentation</a> {/* but no #docs section */}
<a href="/api-reference">API Docs</a> {/* but /api-reference doesn't exist */}
```

## Red Team Checklist

- [ ] No broken links in footer/navigation
- [ ] All links point to real pages or sections
- [ ] No `href="#"` placeholders
- [ ] No hardcoded example domains
- [ ] Anchor links correspond to real page sections
- [ ] Internal routes use `<Link>`, external use `<a>`
- [ ] External links have `rel="noopener noreferrer"`
- [ ] Sitemap doesn't list broken links
- [ ] Build succeeds

## Delegation

- Delegate to **value-auditor** when deciding which placeholder features to implement
- Delegate to **responsive-layout-expert** when removing links requires layout restructuring
- Delegate to **uiux-designer** when removing links impacts visual hierarchy

## Success Criteria

✅ **Clean links**:
- All links work
- No `href="#"`
- No 404s
- Consistent style (Link vs. <a>)
- Verified manually

❌ **Broken links**:
- `href="#"` still in code
- Links to `/missing/*` pages
- External links without `rel=`
- Build doesn't catch link errors

## History

| Date | Location | Issue | Action |
|------|----------|-------|--------|
| 2026-05-08 | Footer (tools) | `/tools` → 404, `#documentation` → broken | Removed all 3 |
| 2026-05-08 | Sitemap | Broke links not indexed | No changes needed |

---

**Key Insight**: Broken links harm both UX (users get 404s) and trust (looks unprofessional). Remove them entirely — don't hide or stub them. If the page is needed, implement it; if not, the footer is cleaner without it.
