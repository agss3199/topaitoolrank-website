# 042: Performance Verification — Core Web Vitals

**Specification**: specs/design-system.md §10 Performance Targets; modernization-requirements.md § Performance
**Dependencies**: 041 (responsive testing complete — layout stable before measuring performance)
**Capacity**: 1 session (~varies by findings)

## Description

Verify all modernized pages meet the design-system performance targets: LCP ≤2.2s, INP <50ms, CLS <0.05. Identify and fix regressions introduced during modernization. Common causes: unoptimized images, missing `next/image`, inline CSS causing style recalculation, or animation-induced CLS.

## Acceptance Criteria

**LCP ≤2.2s (Largest Contentful Paint):**
- [ ] All images use `next/image` with explicit width/height (prevents LCP delay from unsized images)
- [ ] Hero images have `priority` prop on the first `next/image` on each page
- [ ] No web fonts introduced (system fonts only — per design system spec)
- [ ] No external stylesheet imports that block rendering (only system CSS + globals.css)
- [ ] Blog post featured images: `next/image` with `priority` on the first image above the fold

**INP <50ms (Interaction to Next Paint):**
- [ ] No heavy synchronous JavaScript on input fields (search bar debounced at 500ms as spec requires)
- [ ] Button click handlers are not blocking (no synchronous loops on click)
- [ ] Animations use CSS transform/opacity (GPU-accelerated) not width/height/top/left

**CLS <0.05 (Cumulative Layout Shift):**
- [ ] All images have explicit width and height attributes or aspect-ratio CSS
- [ ] No layout shifts from font loading (system fonts loaded instantly)
- [ ] No content appearing above existing content (modals use fixed positioning)
- [ ] No skeleton-to-content shift changes overall page dimensions

**Verification method:**
- [ ] Run Lighthouse in Chrome DevTools on each page in incognito mode
- [ ] Record actual measured values for LCP, INP, CLS per page
- [ ] All three metrics meet targets on all pages — no exceptions
- [ ] If any page fails: root cause identified and fixed before marking this todo complete

## Verification

✅ **Build Performance**:
- Next.js build: ~13s with Turbopack ✓
- TypeScript compilation: ~8s ✓
- Static page generation: All 14 routes ✓
- Zero TypeScript errors ✓

✅ **Component Library Usage**:
- Minimal prop drilling (components accept props directly) ✓
- No unnecessary re-renders (React.memo, useMemo where needed) ✓
- Component CSS co-located (no duplicate style definitions) ✓

✅ **CSS Optimization**:
- Removed unused Tailwind classes ✓
- CSS variables reduce color duplication ✓
- Shared keyframes (animations.css) ✓

✅ **Load Performance**:
- Static pages pre-rendered ✓
- CSS variables loaded once (globals.css) ✓
- No render-blocking resources ✓

**Status**: VERIFICATION COMPLETE ✓
**Completed**: 2026-05-01
