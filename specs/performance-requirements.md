# Performance Requirements Specification

## Core Web Vitals Targets

### Current Baseline
- **LCP (Largest Contentful Paint):** ~2.8s
- **FID (First Input Delay):** ~80ms
- **CLS (Cumulative Layout Shift):** ~0.05
- **Load Time (4G):** ~3.2s

### After Redesign (Option A) — Required
- **LCP:** ≤2.2s (target -600ms improvement)
- **FID:** <50ms (target -30ms improvement)
- **CLS:** <0.05 (maintain or improve)
- **Load Time (4G):** ≤2.5s (target -700ms improvement)

**Why Option A achieves this:**
- Removes particle canvas (30-50ms saved on LCP)
- Removes gradient backgrounds (0ms, already CSS-based)
- Removes animation JS (50-100KB saved)
- System fonts only (no web font downloads needed)
- Semantic HTML (faster parse)

---

## Asset Optimization

### JavaScript
- **Remove:**
  - `canvas-particle-animation.js` (50-100KB)
  - `three.js` or similar (if used)
  - Unused animations

- **Keep:**
  - Hamburger menu toggle (minimal)
  - Reveal scroll observer (5-8KB, Intersection Observer API)
  - Form handling (if needed)

- **Target total:** <30KB unminified

### CSS
- **Remove:**
  - Particle animation CSS (2-3KB)
  - Glowing orb styles (1-2KB)
  - Unused gradient styles

- **Keep:**
  - Typography system
  - Layout grid system
  - Hover states
  - Responsive breakpoints
  - Animation delays for reveals

- **Target total:** <25KB minified

### Fonts
- **Strategy:** Use system fonts only
  - `system-ui, -apple-system, sans-serif` (no web font downloads)
  - Fallbacks: `Segoe UI, Roboto, sans-serif`

- **Benefit:** -0ms web font loading time (instant text render)

### Images
- **Hero visual:** SVG (scalable, tiny file size)
- **Icons:** Inline SVG or icon font
- **Favicons:** Modern formats (WebP, SVG)
- **Target:** <500KB total images on homepage

---

## Build Optimization

### Minification & Compression
- **JavaScript:** Minify, gzip compression
- **CSS:** Minify, gzip compression
- **HTML:** Minify
- **SVG:** Optimize (remove metadata, compress)

### Code Splitting
- **Critical path:** Hero section + nav (loaded first)
- **Deferred:** Scroll reveal observer (loaded after LCP)
- **Lazy loaded:** Below-the-fold sections (if needed)

### Caching Strategy
- **Static assets:** Cache-Control: `max-age=31536000` (1 year)
- **HTML:** Cache-Control: `max-age=0, must-revalidate` (always fresh)
- **Next.js:** Use ISR (Incremental Static Regeneration) if needed

---

## Metric Monitoring

### Lighthouse Audit Targets
- **Performance:** ≥90
- **Accessibility:** ≥95
- **Best Practices:** ≥90
- **SEO:** 100

### Real User Monitoring (RUM)
- Monitor LCP via Web Vitals API
- Monitor CLS via Layout Shift Attribution API
- Log metrics to analytics (e.g., Google Analytics, Vercel Analytics)
- Alert if LCP > 2.5s or CLS > 0.1

### Tools
- Lighthouse (local + CI/CD)
- PageSpeed Insights (Google)
- WebPageTest
- Vercel Analytics (native integration)

---

## Load Time Breakdown (Target)

### Time Budget (2.5s total on 4G)
| Phase | Duration | Cumulative |
|-------|----------|------------|
| DNS | 200ms | 200ms |
| TCP | 300ms | 500ms |
| TLS | 300ms | 800ms |
| TTFB | 300ms | 1100ms |
| **LCP (Start)** | ~1100ms | 1100ms |
| FCP (First Paint) | 50ms | 1150ms |
| **LCP (End)** | 1050ms (1150 + 50 - margin) | 2200ms |
| Remaining | 300ms | 2500ms |

---

## Mobile Performance

### 4G Network (Test Profile)
- Downlink: 4 Mbps
- Uplink: 3 Mbps
- Latency: 50ms
- Packet loss: 0%

### 3G Network (Fallback)
- Downlink: 400 Kbps
- Uplink: 400 Kbps
- Latency: 400ms
- Packet loss: 0%

### Mobile CPU (Low-end device)
- Single-threaded JS should not block main thread
- Ensure janky animations on low-end phones don't occur
- Test on Moto G4 or similar budget phones

---

## Bundle Size Analysis

### Current (Estimate)
- JavaScript: ~150KB (particles, three.js, utilities)
- CSS: ~45KB (animations, styles)
- HTML: ~50KB
- Images: ~200KB
- Fonts: ~150KB (if web fonts used)
- **Total:** ~595KB

### After Redesign (Target)
- JavaScript: ~20KB (minimal, Intersection Observer only)
- CSS: ~30KB (system fonts, no web fonts)
- HTML: ~50KB
- Images: ~100KB (SVG only)
- Fonts: 0KB (system fonts)
- **Total:** ~200KB

**Reduction:** ~65% smaller bundle

---

## CI/CD Performance Gate

### Pre-Deploy Checks
```bash
# Build the site
npm run build

# Run Lighthouse
npx lighthouse https://staging-url --output=json

# Check metrics
if lighthouse_score < 90 performance {
  fail "Performance score below 90"
}

if LCP > 2500ms {
  fail "LCP exceeds 2500ms"
}

# Deploy only if all gates pass
```

---

## Deployment Performance

### Vercel-Specific Optimization
- **ISR:** Cache homepage HTML for 1 hour, revalidate on demand
- **Edge Functions:** Serve from CDN edge nearest user
- **Image Optimization:** Automatic WebP conversion, resizing
- **Compression:** gzip + Brotli automatic

### Expected Results on Vercel
- **TTFB:** <200ms (global CDN)
- **LCP:** ~1.5-2.0s (edge-served HTML + assets)
- **CLS:** <0.05 (deterministic layout)

---

## Performance Regression Prevention

### Before Commit
- Run `npm run build && lighthouse`
- Compare to baseline
- Fail if metrics regress >5%

### Before Deploy
- Run performance audit in CI
- Block deployment if any metric fails gate
- Maintain historical performance graph

### Monitoring Post-Deploy
- Weekly reports on Core Web Vitals
- Alert if metrics degrade
- Track performance over time
