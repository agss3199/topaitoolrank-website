# GAP: Accessibility Standards Variance

**Date**: 2026-04-30
**Impact**: High (affects compliance, user inclusion)

## Finding

The homepage implements WCAG 2.1 Level AAA accessibility (7:1 contrast, focus indicators, semantic HTML, ARIA labels), but secondary pages may not meet the same standards:

**Audit findings:**

1. **Form elements** — Authentication pages may lack proper label associations
   - Current: Unclear if every input has `<label for="id">` connection
   - Missing: `aria-describedby` linking labels to inputs
   - Missing: Required field indicators with `aria-label="required"`

2. **Focus indicators** — Not clear if all pages have 2px blue outline
   - Homepage: Has focus-visible styles
   - Auth pages: Unknown (need full audit)
   - Tool pages: Unknown

3. **Heading hierarchy** — Blog/legal pages may have skipped levels
   - Current: Not investigated
   - Risk: Screen readers cannot navigate by heading structure

4. **Color contrast** — Auth pages use darker backgrounds; may not meet 7:1 ratio
   - Dark theme inherently challenges contrast
   - Glassmorphism compounds (white text on semi-transparent white)

5. **Live regions** — Form validation feedback not announced to screen readers
   - Current: Error messages appear visually
   - Missing: `aria-live="polite"` or `aria-live="assertive"` regions
   - Missing: Status announcements (e.g., "Loading...") for async operations

6. **Semantic HTML** — May use `<div onclick>` instead of `<button>`
   - Current: Unclear without full code audit
   - Risk: Keyboard users cannot activate with Enter/Space

## Root Cause

1. **No accessibility spec** before this analysis
2. **No automated checks** (no aXe, WAVE, or contrast checker in CI)
3. **Manual audits skipped** secondary pages
4. **Homepage compliance** didn't cascade (accessibility as afterthought, not design-first)

## Implications

- **Legal risk**: Non-compliance with WCAG 2.1 AAA may violate accessibility laws (ADA, AODA, etc.)
- **User exclusion**: Colorblind, visually impaired, keyboard-only users face barriers
- **Development cost**: Retrofitting accessibility is costlier than building it in
- **Brand reputation**: Accessibility is table-stakes for modern SaaS

## Verification Plan

**Pre-implementation audit (Tier 1 pages):**
1. Run aXe DevTools on login/signup pages
2. Check WAVE for structural issues
3. Verify WebAIM contrast ratio (7:1+ for text)
4. Test keyboard navigation (Tab through all fields)
5. Test screen reader experience (NVDA or VoiceOver)

**Implementation requirements** (per specs/design-system.md § Accessibility):
- ✅ WCAG 2.1 Level AAA compliance (7:1 contrast)
- ✅ Focus indicators on all interactive elements
- ✅ Semantic HTML (button, label, nav, main, section)
- ✅ ARIA labels on custom interactive elements
- ✅ Keyboard navigation support (Tab order logical)
- ✅ Motion preferences respected (prefers-reduced-motion)
- ✅ Form labels associated with inputs
- ✅ Error messages linked via aria-describedby
- ✅ Live regions for status announcements

## Resolution

**Phase 1 (Tier 1 Modernization):**
- Build forms with proper label associations
- Implement live region for error messages
- Apply design-system focus indicators
- Audit contrast on all text

**Phase 2 (Accessibility Specialist):**
- Run full aXe/WAVE audit on all pages
- Test with keyboard and screen reader
- Document any remaining deviations
- Create accessibility regression tests

**Phase 3 (Enforcement):**
- Add aXe to CI/CD pipeline
- Create accessibility testing checklist
- Document accessibility requirements in component library

## References

- **WCAG 2.1**: https://www.w3.org/WAI/WCAG21/quickref/
- **Web Accessibility Laws**: https://www.w3.org/WAI/policies-and-laws/
- **Contrast Checker**: https://webaim.org/resources/contrastchecker/
- **aXe DevTools**: https://www.deque.com/axe/devtools/

## Related Documents

- `specs/design-system.md` § Accessibility — Authority on WCAG AAA requirements
- `workspaces/page-modernization/02-plans/01-modernization-strategy.md` § Accessibility — Implementation approach

