# Milestone 5: Performance Optimization — Detailed Todos

**Specs:** `specs/performance-requirements.md`
**Todos:** 044–055
**Estimated:** 1 session
**Gate:** Lighthouse Performance score ≥90, LCP ≤2.2s, FID <50ms, CLS <0.05 on a simulated 4G connection.

---

## Todo 044: Minify and Compress JavaScript

**Task:** Ensure all JavaScript delivered to the browser is minified and served with gzip or Brotli compression. Verify the final JS bundle is under 30KB unminified equivalent.

**Spec reference:** `specs/performance-requirements.md` — Asset Optimization: JavaScript, Build Optimization: Minification & Compression. Target total JS: ~20KB.

**Acceptance Criteria:**
- [ ] `npm run build` produces minified JS output (Next.js does this by default in production mode)
- [ ] Verify minification is not disabled in `next.config.js` (no `swcMinify: false` or equivalent)
- [ ] Gzip or Brotli compression active on server (Vercel handles this automatically — verify in response headers)
- [ ] Total JavaScript transferred: ≤30KB (measured in DevTools Network tab on production build preview)
- [ ] No unused large libraries in bundle (verify with `npm run build` bundle analysis or `@next/bundle-analyzer`)

**Files Affected:**
- `next.config.js` — verify minification settings
- `package.json` — confirm no `--no-minify` flags in build scripts

**Dependencies:** Todo 023 (particle JS removed — largest savings already done)

**Verification:**
1. `npm run build` — check output for JS chunk sizes
2. Serve production build locally: `npm start`
3. DevTools Network tab — filter JS — sum transferred sizes — must be ≤30KB
4. Response headers show `Content-Encoding: gzip` or `br`

---

## Todo 045: Minify and Compress CSS

**Task:** Ensure CSS is minified in production builds and compressed in transit. Verify total CSS is under 25KB minified.

**Spec reference:** `specs/performance-requirements.md` — Asset Optimization: CSS target <25KB minified. Build Optimization: Minification.

**Acceptance Criteria:**
- [ ] Next.js production build minifies CSS by default — verify this is active
- [ ] Tailwind CSS purge is configured correctly (all template paths in `content` array of `tailwind.config.ts`)
- [ ] Total CSS transferred: ≤25KB (measured in DevTools Network on production build)
- [ ] No duplicate CSS rules (no duplicate imports of globals)
- [ ] Response headers show CSS served with compression

**Files Affected:**
- `tailwind.config.ts` — verify `content` paths cover all components
- `next.config.js` — verify no CSS minification is disabled

**Dependencies:** Todo 027 (unused CSS already removed)

**Verification:**
1. `npm run build` — check CSS chunk sizes in output
2. DevTools Network — filter CSS — sum sizes — must be ≤25KB transferred
3. Tailwind build log shows purged classes (classes removed vs kept)

---

## Todo 046: Optimize All SVG Assets (Remove Metadata)

**Task:** Run all SVG files through an SVG optimizer (e.g., SVGO) to strip editor metadata, comments, and redundant data. Target <100KB total SVG/image payload.

**Spec reference:** `specs/performance-requirements.md` — Asset Optimization: Images (SVG), Build Optimization: SVG optimize. Target images: ~100KB total.

**Acceptance Criteria:**
- [ ] All SVG files in `public/` processed through SVGO or equivalent
- [ ] SVG metadata (Adobe Illustrator comments, editor IDs, unused `<defs>`) removed
- [ ] SVG file sizes reduced by ≥20% compared to originals (typical SVGO result)
- [ ] SVGs render identically after optimization (visual comparison)
- [ ] Total image payload (all SVGs + any other images): ≤500KB (spec target)
- [ ] Optimized SVGs committed to repository (replace originals)

**Files Affected:**
- All `.svg` files in `public/` directory

**Dependencies:** None

**Verification:**
1. Compare file sizes before vs after SVGO — document reduction
2. Visual comparison: render each SVG in browser before and after — identical appearance
3. DevTools Network — total Images row — must be ≤500KB

---

## Todo 047: Convert Raster Images to WebP (If Any Exist)

**Task:** If any `.png` or `.jpg` images exist on the homepage, convert them to `.webp` format for smaller file sizes. If only SVGs are used (per spec), this todo is a verification step confirming no raster images remain.

**Spec reference:** `specs/performance-requirements.md` — Asset Optimization: Images ("Hero visual: SVG; Favicons: Modern formats WebP, SVG").

**Acceptance Criteria:**
- [ ] Audit all `<img>` tags and CSS `background-image` references on the homepage
- [ ] If any `.png` or `.jpg` found: convert to `.webp` using `cwebp` or Squoosh, update src references
- [ ] If using Next.js `<Image>`: Next.js automatically serves WebP — verify `next/image` is used for all `<img>` elements
- [ ] Favicons: confirm modern formats used (SVG favicon + `.ico` fallback)
- [ ] No unoptimized raster images served directly via `<img src="...jpg">` bypassing Next.js Image optimization

**Files Affected:**
- `public/` — any `.png` or `.jpg` images replaced with `.webp`
- `app/page.tsx` — `<img>` tags converted to Next.js `<Image>` component if not already

**Dependencies:** None

**Verification:**
1. `find public/ -name "*.jpg" -o -name "*.png"` — should return empty (only SVGs and WebP expected)
2. DevTools Network — Images section — content-type should be `image/webp` or `image/svg+xml`

---

## Todo 048: Implement Code Splitting for Scroll Reveal Observer

**Task:** Ensure the Intersection Observer scroll reveal script is loaded deferred — after the Largest Contentful Paint element has rendered — so it does not block the critical rendering path.

**Spec reference:** `specs/performance-requirements.md` — Build Optimization: Code Splitting ("Critical path: Hero section + nav loaded first; Deferred: Scroll reveal observer loaded after LCP").

**Acceptance Criteria:**
- [ ] Scroll reveal JS is NOT loaded in `<head>` blocking position
- [ ] If implemented as a `<script>` tag: has `defer` attribute
- [ ] If implemented as a React `useEffect`: already deferred by React hydration timing
- [ ] If implemented as a dynamic import: `import()` called inside `useEffect` or on user scroll
- [ ] Hero section and navigation render correctly before scroll reveal script executes
- [ ] LCP element (H1 headline) is visible before scroll reveal observer initializes

**Files Affected:**
- `app/page.tsx` — script loading strategy for reveal observer
- `public/js/scroll-reveal.js` — if external script file

**Dependencies:** Todo 033 (scroll reveal observer code from Milestone 4)

**Verification:**
1. DevTools Performance tab — record page load — confirm reveal script executes after LCP
2. DevTools Network — script load waterfall — reveal script loads after initial HTML render
3. Disable JavaScript — page should still be readable (progressive enhancement)

---

## Todo 049: Verify System Fonts Only (No Web Font Downloads)

**Task:** Confirm the page uses only the system font stack specified in the design system — no Google Fonts, Adobe Fonts, or other web font downloads.

**Spec reference:** `specs/performance-requirements.md` — Fonts: "Use system fonts only: system-ui, -apple-system, sans-serif. Benefit: -0ms web font loading time."

**Acceptance Criteria:**
- [ ] `font-family` declarations in CSS use only: `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` (or subset)
- [ ] Zero `@font-face` declarations in any stylesheet
- [ ] Zero `<link rel="stylesheet" href="fonts.googleapis.com/...">` in HTML
- [ ] Zero `@import url(https://fonts.googleapis.com/...)` in CSS
- [ ] `next/font` is NOT used (it downloads fonts) — confirmed not imported in any file
- [ ] DevTools Network — zero requests to `fonts.googleapis.com` or `fonts.gstatic.com`
- [ ] Text renders immediately on page load (no FOIT — Flash of Invisible Text)

**Files Affected:**
- `app/globals.css` — verify font-family declarations
- `app/layout.tsx` — verify no next/font imports
- `tailwind.config.ts` — verify fontFamily config uses system stack

**Dependencies:** Todo 002 (typography scale from design system)

**Verification:**
1. DevTools Network — filter by "font" type — zero results
2. `grep -r "fonts.googleapis\|@font-face\|next/font" app/` — zero hits
3. Page text renders instantly on load (no font swap visible)

---

## Todo 050: Run Lighthouse Audit (Target: Performance ≥90)

**Task:** Run Lighthouse against the production build (served locally or on staging) and document all scores. Performance must be ≥90. Fix any issues preventing ≥90 before this todo is marked complete.

**Spec reference:** `specs/performance-requirements.md` — Lighthouse Audit Targets: Performance ≥90, Accessibility ≥95, Best Practices ≥90, SEO 100.

**Acceptance Criteria:**
- [ ] Lighthouse run on production build (`npm run build && npm start`) or staging URL
- [ ] Performance score: ≥90
- [ ] Accessibility score: ≥95 (detailed accessibility work in Milestone 6)
- [ ] Best Practices score: ≥90
- [ ] SEO score: 100
- [ ] All Lighthouse "Opportunities" and "Diagnostics" reviewed — any item with high impact fixed
- [ ] Lighthouse report JSON or screenshot saved as artifact

**Files Affected:** Varies based on Lighthouse findings. Any fixes applied to relevant CSS/JS/HTML files.

**Dependencies:** Todos 044–049 (all optimization work done before final audit)

**Verification:**
1. `npm run build && npm start`
2. Chrome DevTools Lighthouse panel — run audit on `http://localhost:3000`
3. Screenshot all four score values
4. Document any score below target with explanation of remediation

---

## Todo 051: Verify LCP ≤2.2s

**Task:** Measure Largest Contentful Paint using Lighthouse and Chrome DevTools Performance panel. LCP must be ≤2.2s on a simulated 4G Slow throttle profile.

**Spec reference:** `specs/performance-requirements.md` — Core Web Vitals: LCP ≤2.2s. Time budget breakdown table.

**Acceptance Criteria:**
- [ ] LCP measured with Lighthouse using "Mobile" preset (includes network throttling)
- [ ] LCP value: ≤2.2s
- [ ] LCP element identified (should be the H1 headline text or hero image, whichever is largest/renders latest)
- [ ] LCP element is not delayed by render-blocking resources
- [ ] If LCP >2.2s: identify bottleneck (TTFB, render-blocking JS/CSS, large image) and fix

**Files Affected:** Varies based on findings.

**Dependencies:** Todo 050 (Lighthouse run provides LCP measurement)

**Verification:**
1. Lighthouse mobile audit — "Largest Contentful Paint" metric — must show ≤2.2s
2. DevTools Performance tab — record page load — find LCP marker — confirm ≤2200ms

---

## Todo 052: Verify FID <50ms

**Task:** Measure First Input Delay. FID must be <50ms, indicating the main thread is not blocked during page load.

**Spec reference:** `specs/performance-requirements.md` — Core Web Vitals: FID <50ms.

**Acceptance Criteria:**
- [ ] Lighthouse "Total Blocking Time" (TBT) <200ms (TBT is the lab proxy for FID)
- [ ] No long tasks (>50ms) on the main thread during page load visible in DevTools Performance
- [ ] Scroll reveal observer initialization does not cause a long task
- [ ] If TBT >200ms: identify the long task and defer or split it

**Files Affected:** Varies based on findings.

**Dependencies:** Todo 050 (Lighthouse provides TBT measurement)

**Verification:**
1. Lighthouse — "Total Blocking Time" metric — must be <200ms
2. DevTools Performance — Main thread — confirm no red "Long Task" markers during load

---

## Todo 053: Verify CLS <0.05

**Task:** Measure Cumulative Layout Shift. CLS must be <0.05, meaning elements do not visibly jump around during page load.

**Spec reference:** `specs/performance-requirements.md` — Core Web Vitals: CLS <0.05.

**Acceptance Criteria:**
- [ ] Lighthouse CLS score: <0.05
- [ ] No layout shifts from late-loading fonts (system fonts load instantly — no FOIT/FOUT)
- [ ] No layout shifts from images without explicit `width` and `height` attributes
- [ ] No layout shifts from hero visual overflow animation on load
- [ ] If CLS ≥0.05: use Chrome DevTools Layout Shift attribution to identify shifting element and fix

**Files Affected:** Varies based on CLS source.

**Dependencies:** Todo 049 (system fonts remove the most common CLS source — font swap)

**Verification:**
1. Lighthouse — "Cumulative Layout Shift" metric — must show <0.05
2. Chrome DevTools Performance — Layout Shift records — confirm no shifts above threshold

---

## Todo 054: Test on 4G Network (Simulate in DevTools)

**Task:** Test the full page load experience on a simulated 4G Slow network profile to confirm load time ≤2.5s and LCP ≤2.2s under real-world conditions.

**Spec reference:** `specs/performance-requirements.md` — Mobile Performance: 4G Network profile (4 Mbps down, 50ms latency). Load time target ≤2.5s.

**Acceptance Criteria:**
- [ ] DevTools Network tab — set throttle to "Slow 4G" (or manually: 4 Mbps, 50ms latency)
- [ ] Hard refresh — DOMContentLoaded ≤2.0s
- [ ] Load event ≤2.5s
- [ ] Page is visually usable by 2.2s (LCP)
- [ ] No assets fail to load within the 2.5s window
- [ ] Test repeated 3 times — all three runs within targets

**Files Affected:** Read-only verification. Findings may create follow-up fix todos.

**Dependencies:** Todos 044–053

**Verification:**
1. DevTools Network — Throttling dropdown — select "Slow 4G"
2. Hard refresh (Ctrl+Shift+R)
3. Record Load time from Network panel bottom bar
4. Record LCP from Performance tab or Lighthouse

---

## Todo 055: Test on Low-End Mobile Device (Moto G4 Simulator)

**Task:** Simulate a low-end Android device (Moto G4 profile) with CPU throttling to verify the page remains performant and animations do not cause jank.

**Spec reference:** `specs/performance-requirements.md` — Mobile CPU: "Test on Moto G4 or similar budget phones. Single-threaded JS should not block main thread."

**Acceptance Criteria:**
- [ ] Chrome DevTools — Device Toolbar — select "Moto G4" device preset
- [ ] DevTools Performance — CPU throttle set to 4x slowdown
- [ ] Page loads within 4s on Moto G4 profile (spec allows longer for low-end)
- [ ] Scroll reveal animations do not cause frame drops below 30fps
- [ ] Hamburger menu animation smooth (no jank)
- [ ] No JavaScript errors or crashes
- [ ] If jank found: identify the animation or script causing it and optimize (reduce complexity or skip animation on low-end via `navigator.hardwareConcurrency` check)

**Files Affected:** Varies based on findings.

**Dependencies:** Todos 044–054

**Verification:**
1. DevTools Device Toolbar: select Moto G4 (360x640)
2. DevTools Performance: set CPU 4x throttle
3. Record scroll through entire page — check for dropped frames (red bars in performance timeline)
4. All frame rates: ≥30fps (ideally 60fps)
