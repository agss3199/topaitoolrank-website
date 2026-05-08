# Task 06: Test Navigation on Desktop

**Objective**: Verify header navigation works correctly on desktop view  
**Scope**: Test all nav links, dropdowns, and styles on desktop (1200px+)  
**Status**: Not started  
**Estimate**: 15 minutes  
**Depends on**: Tasks 01–05 (Header fully integrated, old header deleted)

---

## Description

Manually test the unified header navigation on desktop to ensure all links work and styles are correct.

---

## Test Environment

- Browser: Chrome or Firefox (latest)
- Screen size: 1200px+ (desktop)
- Dev server: `npm run dev`
- Base URL: `http://localhost:3000`

---

## Test Cases

### Test 1: Homepage Navigation

**Start**: `http://localhost:3000`

| Action | Expected | Result |
|--------|----------|--------|
| Page loads | Header visible, logo shows "Top AI Tool Rank" | ✓/✗ |
| Click "Home" | Stays on homepage, scrolls to #home (top) | ✓/✗ |
| Click "Services" | Scrolls to Services section | ✓/✗ |
| Click "Tools" (link) | Scrolls to Tools showcase section | ✓/✗ |
| Tools dropdown opens on hover | Dropdown menu visible with all 10 tools | ✓/✗ |
| Click a tool in dropdown (e.g., "Word Counter") | Navigates to `/tools/word-counter` | ✓/✗ |
| Click "Blogs" | Navigates to `/blogs/` | ✓/✗ |
| Click "Contact" | Scrolls to Contact section on homepage | ✓/✗ |

**Observations**: ________________

---

### Test 2: Tool Page Navigation

**Start**: `http://localhost:3000/tools/word-counter`

| Action | Expected | Result |
|--------|----------|--------|
| Page loads | Header visible with same layout as homepage | ✓/✗ |
| Click logo | Navigates to homepage (`/`) | ✓/✗ |
| Click "Tools" | Dropdown menu appears with all 10 tools, categorized | ✓/✗ |
| Click different tool (e.g., "JSON Formatter") | Navigates to `/tools/json-formatter` | ✓/✗ |
| Click "Blogs" | Navigates to `/blogs/` | ✓/✗ |
| Click "Contact" | Navigates to homepage `/#contact` (scrolls to contact) | ✓/✗ |
| Tool content renders | Page shows tool's main input/output (not broken) | ✓/✗ |

**Tool pages to test**:
- word-counter
- whatsapp-message-formatter
- json-formatter
- invoice-generator

**Observations**: ________________

---

### Test 3: Blog Navigation

**Start**: `http://localhost:3000/blogs/` (if exists)

| Action | Expected | Result |
|--------|----------|--------|
| Page loads | Header visible | ✓/✗ |
| Click logo | Navigates to homepage | ✓/✗ |
| Click "Tools" | Dropdown appears with all tools | ✓/✗ |
| Click a tool from dropdown | Navigates to that tool page | ✓/✗ |
| Click "Contact" | Navigates to homepage contact section | ✓/✗ |
| Blog content | Page displays posts or content (not broken) | ✓/✗ |

**Observations**: ________________

---

### Test 4: Styling & Appearance

| Check | Expected | Result |
|-------|----------|--------|
| Logo styling | Text "Top AI Tool Rank" visible, clickable | ✓/✗ |
| Nav links | Proper spacing, readable text | ✓/✗ |
| Dropdown alignment | Dropdown menu aligns under "Tools" on hover | ✓/✗ |
| Hover states | Nav links highlight on hover (color change) | ✓/✗ |
| Contact button | "Contact" styled as a pill/button, different color | ✓/✗ |
| Navigation spacing | Consistent spacing between nav items | ✓/✗ |
| Font sizes | Text readable, hierarchy clear | ✓/✗ |

**Observations**: ________________

---

### Test 5: No Console Errors

**Check browser console** (F12 → Console tab):

| Item | Expected | Result |
|------|----------|--------|
| JavaScript errors | Zero errors when page loads | ✓/✗ |
| CSS import errors | No 404 or parsing errors | ✓/✗ |
| Network tab | All resources load successfully (no 404s) | ✓/✗ |

**Screenshot**: Paste console output if any errors found

---

## Test Checklist

- [ ] Homepage navigation all 5 cases pass
- [ ] Tool page navigation all 5 cases pass
- [ ] Blog page navigation (if applicable) passes
- [ ] Styling and appearance all 7 checks pass
- [ ] No console errors
- [ ] All 4 tool pages tested work correctly
- [ ] Links work from every page context

---

## Issues Found

If any test case fails, document:

| Test Case | Issue | Severity | Action |
|-----------|-------|----------|--------|
| | | HIGH/MEDIUM/LOW | Fix / Document / Skip |

---

## Passing Criteria

All test cases pass:
- [ ] All navigation links work from all page types
- [ ] Dropdowns appear correctly on hover
- [ ] No styling regressions (header looks consistent across pages)
- [ ] No console errors
- [ ] Page content below header works correctly

---

## Notes

- Desktop view: 1200px+ width (use browser dev tools to set viewport)
- Test multiple tools (at least 4 different tool pages)
- Test homepage, tool page, and blog page contexts
- Verify dropdown works on hover (not just click)
- Check that Tools list is identical on homepage and tool pages

---

## Next Task

→ **07-test-mobile-responsive.md** — Test header and menu on mobile view

