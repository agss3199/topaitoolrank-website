# Web Performance Budget: Core Web Vitals as Hard Gates

## When to Use This Skill

- Setting performance targets before development begins
- Measuring actual performance during M5 (Performance Optimization)
- Blocking deployment until Core Web Vitals targets are met
- Troubleshooting performance regressions (which metric regressed? when? how much?)

## The Three Core Web Vitals

### 1. LCP (Largest Contentful Paint): ≤2.2 seconds

The time until the largest visible element (heading, hero image, card) is painted and interactive.

**Why 2.2s?** Google's empirical research: pages with LCP >2.5s see 24% higher bounce rate. Staying ≤2.2s keeps you in the "good" zone with headroom for variance.

**What degrades LCP:**
- Large unoptimized images (hero images, logos)
- Render-blocking CSS/JavaScript
- Third-party scripts (analytics, ads, fonts)
- Slow backend API responses

**Measurement:**
```bash
# Local dev — use Lighthouse (Chrome DevTools → Lighthouse)
# Lab environment — measurable but NOT production conditions
# Production — use field tools (Real User Monitoring)

# Command-line Lighthouse
npm install -g lighthouse
lighthouse https://www.example.com --view
```

**Quick wins:**
- Remove render-blocking stylesheets (use `defer` or inline critical CSS)
- Lazy-load third-party scripts (Google Analytics, chat widgets)
- Optimize hero image (JPEG instead of PNG, serve WebP, use `next/image`)
- Preload critical fonts (if using web fonts at all — prefer system fonts)

### 2. FID (First Input Delay): <50ms OR INP (Interaction to Next Paint): <200ms

The time between a user's first interaction (click, tap, key press) and the browser responding visually.

**Note:** Google is migrating from FID to INP. INP is stricter (measures ALL interactions, not just first). If you optimize for INP, FID is automatic.

**What degrades INP:**
- Long JavaScript tasks (>50ms blocking the main thread)
- Unfinished React re-renders during interaction
- Blocking event handlers without `setTimeout`

**Measurement:**
```
Chrome DevTools → Performance tab → Record interaction → look for "Long Task" warnings
```

**Quick wins:**
- Break long JavaScript tasks into smaller chunks using `setTimeout(..., 0)`
- Use `requestIdleCallback` for non-urgent work (analytics, logging)
- Minimize React re-renders during interaction (useCallback, useMemo)
- Defer heavy computations to Web Workers

### 3. CLS (Cumulative Layout Shift): <0.05

The sum of all unexpected layout shifts (elements moving around, pushing content down). Measured on a scale of 0.0 to 1.0.

**Why <0.05?** A CLS of 0.1 means 10% of the viewport shifted unexpectedly on average. <0.05 is imperceptible to users.

**What causes layout shift:**
- Images/videos without height (browser doesn't reserve space)
- Ads that load after page paints
- Fonts that swap (web font loads, text re-flows)
- Modals/dropdowns that push content

**Measurement:**
```
Chrome DevTools → Performance tab → look for purple "CLS" entries
CLS = sum of (distance × visible proportion) for each shift
```

**Quick wins:**
- Always set width/height on `<img>` tags (or use `aspect-ratio` in CSS)
- Reserve space for ads and lazy-loaded content (empty container with height)
- Use `font-display: swap` or `font-display: fallback` (or use system fonts to avoid swapping entirely)
- Avoid inserting elements before the fold during load

## The Four-Layer Measurement Protocol

### Layer 1: Lab (Local Dev) — Before Commit

```bash
# Lighthouse in headless mode
npm run build  # ensure production build
lighthouse https://localhost:3000 --chrome-flags="--headless" \
  --output-path=./lighthouse-report.json
```

**Thresholds (lab are optimistic):**
- LCP: ≤1.8s (lab is faster than production, 2.2s floor in prod)
- INP: <100ms (lab measurement is noisy; real-world <200ms matters more)
- CLS: <0.05

**Why lab matters:** Catches regressions before they ship. Lab Lighthouse is ~2× faster than real user conditions, so if lab passes, production usually does too (with headroom).

### Layer 2: Local Network (Staging) — Before Merge

Deploy to a staging environment with production builds and measure from a "real" network connection (not localhost). Use WebPageTest or Lighthouse with network throttling.

```bash
# Simulate 4G network (what ~60% of users have)
lighthouse https://staging.example.com \
  --throttle-method=simulate \
  --throttling='{"rttMs":50,"downloadThroughputKbps":5000,"uploadThroughputKbps":2500}'
```

**Thresholds (still optimistic):**
- LCP: ≤2.0s
- INP: <120ms
- CLS: <0.05

### Layer 3: Real User Monitoring (Production) — During Rollout

Instrument production with a real user monitoring (RUM) tool that sends Core Web Vitals data from actual users' browsers. Examples: Google Analytics 4 (GA4), Sentry, Vercel Analytics, LogRocket.

```typescript
// Google Analytics 4 RUM (lazy-loaded, non-blocking)
if (typeof window !== 'undefined' && navigator.sendBeacon) {
  import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
    getCLS(console.log);
    getFID(console.log);
    getLCP(console.log);
    // ... send to GA4
  });
}
```

**Production thresholds (what matters for SEO):**
- LCP: ≤2.5s (75th percentile of users)
- INP: <200ms (75th percentile of users)
- CLS: <0.1 (75th percentile of users)

**Why production RUM matters:** Your lab Lighthouse is worthless if real users on 3G have LCP >4s. RUM captures the 75th percentile, which is Google's ranking signal.

### Layer 4: Monitoring & Alerting — Continuous

Set up dashboards to monitor Core Web Vitals over time. Alert on regressions (e.g., "LCP increased from 2.1s to 2.8s since commit X").

```
Vercel Analytics → Web Vitals
Google Search Console → Core Web Vitals report
Custom: Sentry profiling + Datadog dashboards
```

## The Optimization Checklist

Use this checklist DURING M5 (Performance Optimization). Each item should be measured before/after to confirm the impact.

### Bundle Size

- [ ] Check JavaScript bundle size with `npm run build` → `.next/static/chunks/`
- [ ] Identify largest chunks with `npm install -g webpack-bundle-analyzer`
- [ ] Code-split by route (Next.js App Router does this automatically)
- [ ] Lazy-load heavy libraries (`React.lazy` for large components)
- [ ] Remove unused dependencies (`npm ls` + manual audit)
- [ ] Minify CSS and JavaScript (Next.js does this automatically)

**Target:** <200KB JavaScript total (gzipped). <400KB is acceptable.

### Images

- [ ] Convert JPG/PNG to WebP format (10-30% smaller)
- [ ] Use `next/image` for auto-optimization
- [ ] Lazy-load below-the-fold images (`loading="lazy"`)
- [ ] Serve responsive images (srcset for different screen sizes)
- [ ] Optimize SVGs (remove metadata, use CSS instead of inline fills)

**Target:** Hero image <100KB, all images <2MB total.

### Third-Party Scripts

- [ ] Lazy-load Google Analytics (use `/api/analytics` endpoint that GA is loaded via `<script>`; do not block page load)
- [ ] Remove unused scripts (chat widgets, session recordings, heat maps unless they're genuinely needed)
- [ ] Self-host critical fonts (don't pull from Google Fonts CDN)
- [ ] Use `async` or `defer` for non-critical `<script>` tags

**Target:** Critical path has zero external dependencies.

### CSS

- [ ] Inline critical CSS (above-the-fold styles in `<style>` tag)
- [ ] Defer non-critical CSS (load rest via `rel="stylesheet"` after page ready)
- [ ] Remove unused CSS classes (PurgeCSS / Next.js Tree-shaking)
- [ ] Avoid `@import` in CSS (blocks rendering)

**Target:** Critical CSS <10KB.

### Fonts

- [ ] Use system fonts (`font-family: system-ui, -apple-system, sans-serif`)
- [ ] If web fonts required: use `font-display: swap` (prevent FOUT)
- [ ] Load fonts with `preload` link (e.g., `<link rel="preload" href="..." as="font" crossorigin>`)
- [ ] Subset fonts to Latin-only if your audience is Latin-script

**Target:** Zero web fonts is ideal. If required, ≤2 fonts max.

### Layout & Rendering

- [ ] Reserve space for all images (set `width` and `height` or `aspect-ratio`)
- [ ] Avoid layout shifts during load (CLS <0.05)
- [ ] Use `content-visibility: auto` for off-screen elements (tells browser to skip rendering)
- [ ] Avoid synchronous `fetch` or blocking operations in page load

**Target:** Zero unexpected layout shift.

### Server

- [ ] Check Time to First Byte (TTFB): should be <600ms from user to server
- [ ] Use edge caching for static pages (Vercel Edge Cache is automatic)
- [ ] Check database query latency: should be <100ms per critical path
- [ ] If slow API calls are required, lazy-load the component

**Target:** TTFB <600ms (Vercel's typical: <200ms).

## Example: Real-World Performance Regressions

### Regression 1: Analytics Script Blocks LCP

**Before (LCP = 3.2s):**
```html
<head>
  <script async src="https://www.googletagmanager.com/gtag/js?id=GA_ID"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'GA_ID');
  </script>
</head>
```

**After (LCP = 1.9s):**
```typescript
// Lazy-load GA after page loads
useEffect(() => {
  if (typeof window !== 'undefined') {
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=GA_ID';
    document.head.appendChild(script);
    // ... rest of GA init
  }
}, []);
```

**Impact:** +1.3s LCP improvement by removing render-blocking script.

### Regression 2: Hero Image Unoptimized

**Before (LCP = 2.8s):**
```jsx
<img src="/images/hero.png" alt="Hero" />  {/* 5MB PNG */}
```

**After (LCP = 1.6s):**
```jsx
<Image 
  src={heroImage} 
  alt="Hero" 
  priority  // load immediately
  quality={85}  // compress
  width={1200} 
  height={600} 
/>
```

**Impact:** +1.2s LCP improvement by auto-optimization and priority loading.

### Regression 3: Unbounded Interaction Handler

**Before (INP = 450ms):**
```typescript
const handleFilter = (value: string) => {
  const results = largeArray.filter(item => 
    item.name.toLowerCase().includes(value.toLowerCase())
  );  // Synchronous, blocking, 200ms+ on large data
  setResults(results);
};
```

**After (INP = 45ms):**
```typescript
const handleFilter = (value: string) => {
  setResults([]);  // Immediate visual response
  
  // Do the heavy work in background
  requestIdleCallback(() => {
    const results = largeArray.filter(item => 
      item.name.toLowerCase().includes(value.toLowerCase())
    );
    setResults(results);
  });
};
```

**Impact:** +400ms INP improvement by moving blocking work off the main thread.

## Deployment Gate

**Do NOT merge a PR that degrades Core Web Vitals:**

```bash
# Before merge, run Lighthouse
npm run build
lighthouse https://staging-pr.example.com \
  --output-path=./lighthouse-pr.json

# Compare against main
lighthouse https://staging-main.example.com \
  --output-path=./lighthouse-main.json

# Alert if LCP, INP, or CLS regressed by >10%
```

**Regressions acceptable only with:**
1. Written justification in the PR description
2. Concrete plan to fix in next commit/sprint
3. Team lead sign-off

## See Also

- `rules/web-perf-budget.md` — hard performance gates
- `specs/performance-requirements.md` — target definitions
- `rules/debounce-server-calls.md` — reduce client→server frequency to reduce latency perception
- `rules/payload-size-guard.md` — reduce request body sizes

## Tools & References

- **Lighthouse:** https://chromedevtools.io/docs/lighthouse (built into Chrome, also CLI)
- **WebPageTest:** https://www.webpagetest.org (free, detailed waterfall charts)
- **Google PageSpeed Insights:** https://pagespeed.web.dev (real-world RUM data)
- **Vercel Analytics:** https://vercel.com/docs/analytics (built into Vercel deployments)
- **Google Search Console:** Core Web Vitals report (what Google sees for your site)
- **web-vitals library:** https://github.com/GoogleChromeLabs/web-vitals (minimal RUM collection)

## Origin

Homepage redesign (2026-04-30): M5 (Performance Optimization). Set hard targets: LCP ≤2.2s, INP <50ms, CLS <0.05. Removed GA from critical path (lazy-loaded post-onload), optimized hero image (WebP, `next/image`), inlined critical CSS. Achieved LCP 1.8s, INP 35ms, CLS 0.01. Targets included in deployment verification and monitoring setup. See Milestone 5 completion and specs/performance-requirements.md.
