# Milestone 8: Deployment & Monitoring — Detailed Todos

**Specs:** `specs/performance-requirements.md` (monitoring section), deployment workflow
**Todos:** 085–095
**Estimated:** 1 session
**Gate:** Page is live on production, Core Web Vitals confirmed on real user data, monitoring alerts active.

---

## Todo 085: Set Up Performance Monitoring (Vercel Analytics or Google Analytics)

**Task:** Integrate a performance monitoring solution to capture real user Core Web Vitals data post-launch. Vercel Analytics is the preferred option since the project is deployed on Vercel.

**Spec reference:** `specs/performance-requirements.md` — Metric Monitoring: Real User Monitoring (RUM), Tools: "Vercel Analytics (native integration)".

**Acceptance Criteria:**
- [ ] Vercel Analytics enabled for the project in the Vercel dashboard (Settings > Analytics)
- [ ] OR Google Analytics 4 with Web Vitals integration configured
- [ ] Analytics script loaded on the page without blocking LCP (loaded after critical content)
- [ ] Web Vitals (LCP, FID/INP, CLS) captured and visible in analytics dashboard
- [ ] No analytics keys hardcoded — all via environment variables (`NEXT_PUBLIC_GA_ID` etc.)
- [ ] Analytics does NOT degrade performance scores (verify Lighthouse before/after)

**Files Affected:**
- `app/layout.tsx` — add analytics script
- `.env.local` — add analytics environment variable
- `vercel.json` or Vercel dashboard — enable Vercel Analytics

**Dependencies:** None (can be done in parallel with other Milestone 8 todos)

**Verification:**
1. Vercel dashboard — Analytics tab — page views appearing
2. OR Google Analytics — Real-time report shows page views
3. Web Vitals visible in analytics within 24-48 hours of launch (RUM data needs real users)

---

## Todo 086: Configure Core Web Vitals Tracking

**Task:** Ensure LCP, FID (or INP), and CLS are explicitly tracked and queryable in the analytics platform. Set up custom events or use the platform's built-in Web Vitals reporting.

**Spec reference:** `specs/performance-requirements.md` — Real User Monitoring: "Monitor LCP via Web Vitals API. Monitor CLS via Layout Shift Attribution API. Alert if LCP > 2.5s or CLS > 0.1."

**Acceptance Criteria:**
- [ ] LCP metric tracked and visible in dashboard
- [ ] CLS metric tracked and visible in dashboard
- [ ] FID or INP metric tracked and visible
- [ ] Metrics filterable by date range, device type (mobile vs desktop)
- [ ] Metrics compared against targets: LCP ≤2.2s, CLS <0.05, FID <50ms
- [ ] If using Vercel Analytics: built-in Web Vitals dashboard confirmed active
- [ ] If using Google Analytics: `web-vitals` npm package integrated and sending events

**Files Affected:**
- `app/layout.tsx` or a dedicated analytics component — Web Vitals reporting code

**Dependencies:** Todo 085

**Verification:**
1. Trigger a page load — check analytics debug mode — LCP, CLS, FID events sent
2. Dashboard shows all three Web Vitals metrics

---

## Todo 087: Deploy to Staging Environment

**Task:** Deploy the completed homepage to the staging/preview environment on Vercel. Verify the staging deployment is a faithful reproduction of the local production build.

**Spec reference:** `specs/performance-requirements.md` — CI/CD Performance Gate: "Build site, run Lighthouse, check metrics."

**Acceptance Criteria:**
- [ ] `vercel deploy` (preview deployment) succeeds with zero build errors
- [ ] Staging URL accessible and loads correctly
- [ ] All environment variables present on staging (verify in Vercel dashboard — no missing `NEXT_PUBLIC_*` vars)
- [ ] Page renders correctly on staging at desktop and mobile
- [ ] No 404 errors for assets (all static files present)
- [ ] Staging URL shared for review (document the URL)

**Files Affected:** Deployment configuration only (no code changes)

**Dependencies:** Todo 085 (analytics set up before deploy)

**Verification:**
1. `vercel deploy` — success with preview URL output
2. Open preview URL — page loads
3. Chrome DevTools — Network — zero 404s

---

## Todo 088: Run Final Lighthouse Audit on Staging

**Task:** Run Lighthouse against the staging URL to get a final measurement on actual hosted infrastructure (CDN, edge, compression). Scores must meet all targets before production deploy is authorized.

**Spec reference:** `specs/performance-requirements.md` — CI/CD Performance Gate, Lighthouse Audit Targets.

**Acceptance Criteria:**
- [ ] Performance: ≥90 on staging URL
- [ ] Accessibility: ≥95
- [ ] Best Practices: ≥90
- [ ] SEO: 100
- [ ] LCP: ≤2.2s
- [ ] CLS: <0.05
- [ ] TBT (proxy for FID): <200ms
- [ ] All four score screenshots saved as deployment artifacts
- [ ] If any score misses target: fix the issue before proceeding to Todo 090 (production deploy)

**Files Affected:** Fix any issues found that cause score regression on staging vs local.

**Dependencies:** Todo 087 (staging deployed)

**Verification:**
1. Chrome DevTools Lighthouse — run against staging URL — mobile preset
2. Screenshot all four score values + LCP/CLS/TBT metrics
3. All targets met before marking this todo complete

---

## Todo 089: Smoke Test on Staging (Full User Journey)

**Task:** Walk through the complete user journey on staging: load page, read content, navigate sections, submit contact form. This is the final human-equivalent QA pass before production.

**Acceptance Criteria:**
- [ ] Page loads on staging without errors (console clean)
- [ ] Hero section visible and correctly laid out
- [ ] Scroll through all 8 sections — all content present, no broken layouts
- [ ] Click all CTA buttons — navigate correctly
- [ ] Submit contact form with valid data — success message shown
- [ ] Submit contact form with invalid data — error messages shown
- [ ] Mobile viewport (375px) on staging — hamburger menu works, all sections readable
- [ ] All external links open in new tab
- [ ] Analytics events firing (open analytics debug mode during test)

**Dependencies:** Todos 087, 088

**Verification:**
1. Navigate to staging URL
2. Complete full user journey checklist above
3. Document any issues found — fix before production deploy

---

## Todo 090: Deploy to Production

**Task:** Promote the staging/preview deployment to production on Vercel. This is the live deployment gate.

**Spec reference:** `specs/performance-requirements.md` — Deployment Performance: Vercel-Specific Optimization.

**Acceptance Criteria:**
- [ ] `vercel --prod` deploy succeeds with zero errors
- [ ] Production URL (`topaitorank.com` or equivalent) resolves and loads correctly
- [ ] SSL/HTTPS certificate valid — no browser security warnings
- [ ] DNS resolves correctly (no propagation delays if domain was changed)
- [ ] All environment variables present on production environment
- [ ] Production deployment is NOT a different build from staging — same build artifact promoted
- [ ] Previous deployment available as rollback if needed (note the previous deployment ID)

**Files Affected:** Deployment only

**Dependencies:** Todos 088, 089 (staging verified before production deploy)

**Verification:**
1. `vercel --prod` — success output with production URL
2. Open production URL — page loads with HTTPS
3. Chrome DevTools — zero errors, zero 404s
4. Note the previous deployment ID for rollback: document in todo comment

---

## Todo 091: Verify Core Web Vitals on Production (Actual User Data)

**Task:** After production deploy, verify Core Web Vitals using PageSpeed Insights (which uses Chrome UX Report field data for production URLs). This is the real-world measurement.

**Spec reference:** `specs/performance-requirements.md` — Tools: "PageSpeed Insights (Google)." Core Web Vitals targets.

**Acceptance Criteria:**
- [ ] PageSpeed Insights run on production URL
- [ ] Lab data (Lighthouse): LCP ≤2.2s, CLS <0.05, TBT <200ms
- [ ] Field data (if available after sufficient traffic): LCP P75 ≤2.5s, CLS P75 <0.1
- [ ] PageSpeed Insights "Mobile" score: ≥80 (real-world is typically lower than lab)
- [ ] PageSpeed Insights "Desktop" score: ≥90
- [ ] Any regressions vs staging Lighthouse results investigated

**Dependencies:** Todo 090 (production deployed)

**Verification:**
1. Navigate to `https://pagespeed.web.dev/` — enter production URL
2. Run analysis — screenshot results
3. Compare to staging Lighthouse results — no significant regressions

---

## Todo 092: Set Up Monitoring Alerts (LCP > 2.5s, CLS > 0.1)

**Task:** Configure automated alerts that notify when Core Web Vitals degrade beyond acceptable thresholds.

**Spec reference:** `specs/performance-requirements.md` — Real User Monitoring: "Alert if LCP > 2.5s or CLS > 0.1."

**Acceptance Criteria:**
- [ ] If using Vercel Analytics: configure alert rules in Vercel dashboard for LCP > 2.5s
- [ ] If using Google Analytics: configure alert in Google Analytics Admin > Alerts for LCP degradation
- [ ] CLS alert threshold: >0.1
- [ ] Alerts delivered via email (or Slack if configured)
- [ ] Alert configuration documented (which metric, which threshold, which notification channel)
- [ ] Test alert: verify alerts are correctly configured (trigger a test if platform allows)

**Files Affected:** Configuration in Vercel/analytics dashboard — no code changes

**Dependencies:** Todo 086 (Web Vitals tracking configured), Todo 090 (production deployed)

**Verification:**
1. Vercel dashboard or analytics platform — Alerts section — confirm alert rules exist
2. Thresholds match spec: LCP >2.5s and CLS >0.1
3. Notification channel (email) confirmed

---

## Todo 093: Create Post-Launch Checklist

**Task:** Document a post-launch verification checklist for use after future deployments or changes to the homepage. This checklist ensures no regressions slip through in future sessions.

**Spec reference:** `specs/performance-requirements.md` — Performance Regression Prevention.

**Acceptance Criteria:**
- [ ] Checklist covers: visual spot-check (3 viewports), Lighthouse score, Core Web Vitals, form submission, console errors, broken links
- [ ] Checklist saved to: `workspaces/Top_AI_Tool_Rank_Homepage_Redesign/04-validate/post-launch-checklist.md`
- [ ] Each checklist item has a clear pass/fail criterion
- [ ] Checklist includes rollback procedure (how to revert to previous Vercel deployment)
- [ ] Estimated time to complete checklist: ≤30 minutes

**Files Affected:**
- New file: `workspaces/Top_AI_Tool_Rank_Homepage_Redesign/04-validate/post-launch-checklist.md`

**Dependencies:** Todo 090

**Verification:**
1. Checklist file exists at the specified path
2. Checklist covers all major risk areas
3. Rollback instructions are accurate (Vercel CLI: `vercel rollback <deployment-url>`)

---

## Todo 094: Monitor User Feedback (Surveys, Analytics)

**Task:** Set up a basic mechanism for capturing user feedback on the redesigned homepage during the first two weeks post-launch.

**Acceptance Criteria:**
- [ ] Analytics configured to track key user engagement metrics (scroll depth, time on page, CTA click rate)
- [ ] If a feedback widget or survey is in scope: implemented and functional
- [ ] Analytics goals/events defined for: CTA button clicks, form submissions, section scroll-depth milestones (25%, 50%, 75%, 100%)
- [ ] Baseline engagement metrics documented from the first 7 days of data
- [ ] Any user-reported visual or functional issues captured

**Files Affected:**
- `app/layout.tsx` or page — analytics event tracking for key interactions

**Dependencies:** Todo 090 (production deployed)

**Verification:**
1. Analytics platform — verify scroll depth events and CTA clicks are tracked
2. After 7 days: document baseline engagement rates

---

## Todo 095: Document Any Issues Found Post-Launch

**Task:** Create a living log of issues discovered during the first two weeks post-launch. Each issue is logged with: description, severity (critical/high/medium/low), steps to reproduce, and resolution status.

**Acceptance Criteria:**
- [ ] Issue log file created: `workspaces/Top_AI_Tool_Rank_Homepage_Redesign/04-validate/post-launch-issues.md`
- [ ] Each issue entry includes: date found, description, severity, reproduction steps, status (open/resolved/wont-fix)
- [ ] Critical issues (broken page, data loss, accessibility regression) resolved within 24 hours
- [ ] High issues (visual regressions, broken interactions) resolved within 1 week
- [ ] Log reviewed at end of two-week monitoring period and summarized

**Files Affected:**
- New file: `workspaces/Top_AI_Tool_Rank_Homepage_Redesign/04-validate/post-launch-issues.md`

**Dependencies:** Todo 090 (production deployed)

**Verification:**
1. Issue log file exists
2. Any issues found during Todos 091–094 are logged here
3. Status of each issue is current (not stale)
