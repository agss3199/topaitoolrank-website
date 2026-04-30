# Milestone 3: Remove Legacy Elements — Detailed Todos

**Specs:** `specs/design-system.md`, `specs/interactions.md` (Removed from Current Design section)
**Todos:** 023–028
**Estimated:** 1 session
**Gate:** Zero console errors, zero references to removed code, no visual regressions from the removal.

---

## Todo 023: Delete Particle Canvas Animation JavaScript

**Task:** Permanently delete all JavaScript files, functions, and inline scripts responsible for the particle canvas animation. This includes any library (e.g., particles.js, tsParticles, three.js if used only for particles) and any custom initialization code.

**Spec reference:** `specs/interactions.md` — "Canvas Particle Animation (REMOVED)", "Removed from Current Design: Particle canvas (commodity, distracting)". `specs/performance-requirements.md` — "Remove: canvas-particle-animation.js (50-100KB)".

**Acceptance Criteria:**
- [ ] All particle animation JS files deleted from `public/js/` or equivalent directory
- [ ] Any `<script src="...particles...">` tags removed from HTML/JSX
- [ ] Any dynamic `import()` or `require()` calls for particle libraries removed
- [ ] Any `window.particlesJS()`, `tsParticles.load()`, or similar initialization calls deleted
- [ ] If a library (e.g., `particles.js`) was installed as an npm package, it is removed from `package.json` and `package-lock.json` (run `npm uninstall particles.js` or equivalent)
- [ ] `npm run build` completes without errors after removal
- [ ] Zero console errors in browser after removal

**Files Affected:**
- `public/js/particles.js` or similar — deleted
- `app/page.tsx` or layout file — remove script tags and initialization
- `package.json` — remove particle library dependency if npm-installed

**Dependencies:** Todo 011 (canvas element already removed from DOM)

**Verification:**
1. `grep -r "particle\|tsParticles\|ParticlesJS" app/ public/ src/` — zero hits
2. `npm run build` — success with no warnings about missing modules
3. Browser console — zero errors on page load

---

## Todo 024: Remove Glowing Orb CSS (hero-orb-one, hero-orb-two)

**Task:** Delete all CSS rules, keyframe animations, and HTML elements associated with the glowing orbs in the hero section (typically classed `.hero-orb-one`, `.hero-orb-two`, or similar radial gradient blobs).

**Spec reference:** `specs/interactions.md` — "Removed from Current Design: Glowing orbs". `specs/performance-requirements.md` — "Remove: Glowing orb styles (1-2KB)".

**Acceptance Criteria:**
- [ ] All `.hero-orb-*` (or equivalent) CSS classes deleted from all stylesheets
- [ ] All `@keyframes` animations associated with orbs deleted (e.g., `@keyframes orbFloat`, `@keyframes orbPulse`)
- [ ] HTML/JSX elements rendering the orbs (typically `<div class="hero-orb-one">`) deleted from page markup
- [ ] No blank space or layout shift remains where orbs were
- [ ] Hero section background is clean (white or defined background color from design system)
- [ ] `npm run build` succeeds

**Files Affected:**
- `app/globals.css` or hero component CSS — delete orb rules and keyframes
- `app/page.tsx` — remove orb `<div>` elements

**Dependencies:** None (independent of other Milestone 3 todos)

**Verification:**
1. `grep -r "hero-orb\|orb-one\|orb-two\|orbFloat\|orbPulse" app/ public/` — zero hits
2. Visual inspection of hero section — no glowing blob effects
3. DevTools Elements panel — no orb `<div>` elements in hero section DOM

---

## Todo 025: Remove Unnecessary Gradient Backgrounds

**Task:** Remove legacy gradient background CSS from sections that should now have solid or transparent backgrounds per the design system. The design system uses a white/off-white background with the neon lime accent — not gradient fills on sections.

**Spec reference:** `specs/design-system.md` — background color tokens (white `#ffffff`, light `--color-bg-light`). `specs/performance-requirements.md` — "Remove: Unused gradient styles".

**Acceptance Criteria:**
- [ ] All `background: linear-gradient(...)` or `background: radial-gradient(...)` rules on section elements reviewed
- [ ] Gradients that were part of the old design (dark/purple/blue gradients) removed
- [ ] Any section that should be white now uses `background: var(--color-bg-light)` or `background: #ffffff`
- [ ] Credibility strip background uses the light gray token (not a gradient)
- [ ] No gradient remains on hero section background (hero uses white or transparent)
- [ ] Neon lime accent used as solid color only (no lime gradient fills)
- [ ] `npm run build` succeeds

**Files Affected:**
- `app/globals.css` — remove legacy gradient rules
- Individual section CSS files — remove section-specific gradient backgrounds

**Dependencies:** Todo 001 (color variables established, so replacement values are known)

**Verification:**
1. `grep -rn "linear-gradient\|radial-gradient" app/ public/` and review each result — confirm all remaining gradients are intentional (if any)
2. Visual inspection: all section backgrounds are solid colors from the design system
3. No dark/purple/blue section backgrounds visible

---

## Todo 026: Remove Deprecated Animation Utilities

**Task:** Delete CSS utility classes and JavaScript functions that drove legacy animations (infinite parallax loops, spinning elements, auto-rotating effects). These were removed from the interaction spec.

**Spec reference:** `specs/interactions.md` — "Removed from Current Design: Infinite parallax loops, Auto-rotating carousels". `specs/performance-requirements.md` — "Remove: Unused animations — 50-100KB saved".

**Acceptance Criteria:**
- [ ] All `@keyframes` for infinite/auto-play animations deleted (e.g., `@keyframes spin`, `@keyframes float`, `@keyframes rotate`, `@keyframes bounce` if not intentionally kept)
- [ ] CSS utility classes that applied `animation: ... infinite` removed (e.g., `.animate-spin`, `.animate-float`, `.animate-pulse` if not part of intentional design)
- [ ] Any JavaScript that triggered auto-play or looping animations deleted
- [ ] Retained animations (hover state transitions `0.2–0.3s`, scroll reveal `0.6s`) are NOT removed
- [ ] `npm run build` succeeds

**Files Affected:**
- `app/globals.css` — remove deprecated animation keyframes and utility classes
- Any JS file with auto-play animation logic

**Dependencies:** Todo 034 should be planned before this — know which animations to KEEP (scroll reveal) before deleting. If Todo 034 is not yet done, be conservative and only delete clearly named legacy animations.

**Verification:**
1. `grep -n "animation.*infinite" app/ public/` — results reviewed; none should remain unless intentional
2. `grep -n "@keyframes" app/ public/` — each result verified as a retained animation
3. Browser: no auto-playing or looping visual effects on page load or while scrolling without user action

---

## Todo 027: Clean Up Unused CSS Classes

**Task:** Audit stylesheets for CSS classes that no longer have any corresponding HTML/JSX elements. Remove dead CSS to reduce bundle size and eliminate confusion.

**Spec reference:** `specs/performance-requirements.md` — CSS target: <25KB minified.

**Acceptance Criteria:**
- [ ] Run PurgeCSS, Tailwind's purge, or manual audit to identify unused classes
- [ ] All identified unused classes removed from stylesheets
- [ ] No currently-rendered elements lose their styles after cleanup (visual regression check)
- [ ] CSS bundle size measured before and after — reduction documented
- [ ] `npm run build` succeeds
- [ ] If using Tailwind, verify `content` array in `tailwind.config.ts` includes all template files so purge is accurate

**Files Affected:**
- `app/globals.css` — remove unused class definitions
- Any component CSS modules — remove unused rules
- `tailwind.config.ts` — verify content paths for purge accuracy

**Dependencies:** Todos 023–026 (earlier removals first, so their classes are already gone)

**Verification:**
1. Before: note CSS bundle size from `npm run build` output
2. After: re-run build and compare — size should be equal or smaller
3. Visual inspection at all three breakpoints — no elements missing styles

---

## Todo 028: Verify No Console Errors After All Legacy Removals

**Task:** Final verification pass across all legacy removal todos. Load the page in a clean browser session (no cache) and confirm zero JavaScript errors, zero 404 network requests for deleted assets, and zero visual regressions.

**Spec reference:** Milestone 3 gate criterion.

**Acceptance Criteria:**
- [ ] Browser console (DevTools) shows zero errors on fresh page load
- [ ] Browser console shows zero warnings related to removed code
- [ ] Network tab shows zero 404 responses (no references to deleted JS or CSS files remain)
- [ ] No broken layout areas visible at desktop (1280px), tablet (768px), or mobile (375px)
- [ ] `npm run build` produces no TypeScript errors, no missing module errors
- [ ] `npm run build` output shows smaller bundle size vs baseline (document numbers)

**Files Affected:** Read-only verification. Any failures found during this todo become new bug fix tasks.

**Dependencies:** Todos 023–027 (all legacy removal complete)

**Verification Checklist:**
1. Open Chrome in Incognito (clears cache)
2. Open DevTools Console tab — load page — screenshot showing zero errors
3. Open DevTools Network tab — filter by "4xx" — confirm zero 404s
4. Resize to 375px, 768px, 1280px — visual inspection
5. Run `npm run build` — paste bundle size output into a comment on this todo
