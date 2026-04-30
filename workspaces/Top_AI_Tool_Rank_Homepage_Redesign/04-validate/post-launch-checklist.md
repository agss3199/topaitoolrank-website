# Post-Launch Checklist

Estimated time: 30 minutes. Run after every deployment or homepage change.

## Visual Spot-Check (3 Viewports)

- [ ] Desktop (1440px): All 8 sections render correctly, 2-column hero grid visible
- [ ] Tablet (768px): Single-column layout, no horizontal overflow
- [ ] Mobile (375px): Hamburger menu works, all sections readable, touch targets 44px+

## Lighthouse Audit

- [ ] Performance: >= 90
- [ ] Accessibility: >= 95
- [ ] Best Practices: >= 90
- [ ] SEO: 100

## Core Web Vitals

- [ ] LCP <= 2.2s (target), alert threshold 2.5s
- [ ] FID/INP < 50ms (target), alert threshold 100ms
- [ ] CLS < 0.05 (target), alert threshold 0.1
- [ ] TBT < 200ms

## Form Submission

- [ ] Contact form: valid data submits successfully
- [ ] Contact form: invalid email shows error
- [ ] Contact form: empty required fields show validation

## Console & Network

- [ ] Browser console: zero errors
- [ ] Network tab: zero 404s for assets
- [ ] SSL/HTTPS: no browser warnings

## Broken Links

- [ ] All nav links navigate correctly (#home, #services, #contact)
- [ ] All CTA buttons work
- [ ] External links open in new tab
- [ ] Skip-to-content link works

## Rollback Procedure

If critical issues found after deployment:

```bash
# List recent deployments
vercel ls

# Rollback to previous deployment
vercel rollback <previous-deployment-url>

# Verify rollback
# Open production URL and confirm previous version is live
```

## Pass/Fail Criteria

- ANY Lighthouse score below target: FAIL (investigate before next deploy)
- ANY console error: FAIL (fix before marking complete)
- ANY broken link or 404: FAIL
- ANY CLS > 0.1: FAIL (layout shift regression)
