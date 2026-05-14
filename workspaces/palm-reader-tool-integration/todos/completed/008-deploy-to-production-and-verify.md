# 008 — Deploy to Production and Verify Tool is Live

**Status**: ready-for-deployment  
**Owner**: implementation-team  
**Phase**: deploy  
**Effort**: 15 min (push → Vercel → smoke test)  
**Depends on**: 007 (tests passing)  
**Blocks**: none (final todo)

---

## Overview

Deploy the completed palm reader tool to production via Vercel, verify the tool is accessible at `/tools/palm-reader`, and run smoke tests to confirm functionality. Use the `/deploy` command following the deployment checklist.

**Scope**: ~15 min — build push, Vercel deployment, smoke test verification.

---

## Specification References

- **Brief Success Criteria**: Tool accessible at `/tools/palm-reader`, deployment successful
- **rules/deploy-hygiene.md** — deployment gates, verification protocol

---

## Acceptance Criteria

### Pre-Deployment Checklist
- [ ] All code committed: `git status` shows clean working tree
- [ ] All tests passing: `npm test -- palm-reader` returns 0 failures
- [ ] Build succeeds: `npm run build` completes without errors
- [ ] No TypeScript errors: `npx tsc --noEmit` clean
- [ ] Environment variables set in Vercel:
  - [ ] `GEMINI_API_KEY` (server-side only, NO `NEXT_PUBLIC_` prefix)
  - [ ] Verify key is valid (test with `/api/tools/palm-reader` manually)
  - [ ] Verify `.env.example` includes `GEMINI_API_KEY` template

### Deployment Execution
- [ ] Run `/deploy` command
- [ ] Vercel build succeeds (check logs)
- [ ] No new errors introduced (compare build output)
- [ ] Deployment completes without errors

### Post-Deployment Verification
- [ ] Tool accessible at `https://[domain]/tools/palm-reader`
- [ ] Page loads without errors (check DevTools Console)
- [ ] Camera permission prompt appears
- [ ] Hand detection works (quality meter updates when hand visible)
- [ ] Auto-capture triggers on good quality (>75% confidence)
- [ ] API call succeeds (results display after analysis)
- [ ] Attribution visible: "made by Abhishek Gupta for MGMT6095"
- [ ] Results display all palm lines with correct colors
- [ ] "Read Another Palm" button resets to camera view
- [ ] "Home" button navigates to `/tools`
- [ ] Mobile responsive (test at 375px width)
- [ ] No console errors in production DevTools
- [ ] Tool appears in `/tools` directory listing
- [ ] Tool routing works from directory page click

### Post-Deployment Security Verification (CRITICAL)
- [ ] API key NOT exposed in browser (check Network tab: no API key in request headers)
- [ ] Rate limiting active: Send 6 rapid requests, verify 429 on 6th request
- [ ] Payload validation: POST oversized image (>10MB), verify 413 response
- [ ] XSS test: Verify Gemini response with HTML tags rendered as text, not executed
- [ ] Check Vercel logs for oversized payload rejections (413 errors indicate protection working)

### Smoke Test (Manual)
- [ ] Navigate to https://[domain]/tools/palm-reader
- [ ] Grant camera permission
- [ ] Point palm at camera
- [ ] Observe quality meter updating (0-100%)
- [ ] Wait for auto-capture trigger
- [ ] Observe "Analyzing palm..." loading state
- [ ] Wait 2-3 seconds for analysis
- [ ] Verify results display with proper formatting
- [ ] Click "Read Another Palm" → camera resets
- [ ] Click "Home" → navigates to `/tools`
- [ ] Click back to `/tools/palm-reader` → works correctly

### Rollback Plan (If Deployment Fails)
- [ ] If Vercel deployment fails: check build logs for errors
- [ ] If errors: rollback to previous deployment (`vercel rollback`)
- [ ] Fix issues locally, commit, re-deploy
- [ ] Do NOT skip deployment gates

---

## Pre-Deployment Commit

Before running `/deploy`, commit all changes:

```bash
git add app/tools/palm-reader/
git add app/tools/page.tsx  (if modified for directory listing)
git commit -m "feat(palm-reader): add AI-powered palm reading tool

- Extract CameraView, ResultsView, QualityMeter components
- Create API route with Gemini Vision integration
- Adapt styling with CSS Modules and cls() helper
- Integrate with website layout (Header, Footer, breadcrumb)
- Add tool to directory listing
- Include API and integration test coverage
- Attribution: made by Abhishek Gupta for MGMT6095

Implements specs/tool-pages-*.md integration requirements.
Resolves: Palm reader standalone app integration"
```

---

## Deployment Command

```bash
# Navigate to project root
cd /path/to/Top_AI_Tool_Rank

# Run deployment command
/deploy

# Or use Vercel CLI directly
vercel deploy --prod
```

The `/deploy` command will:
1. Run pre-deployment gates (tests, lint, build)
2. Build the application
3. Deploy to Vercel production
4. Verify deployment is live

---

## Post-Deployment Verification Steps

### Step 1: Verify URL is Accessible
```bash
curl -I https://[domain]/tools/palm-reader
# Expected: 200 OK (not 404, not 503)
```

### Step 2: Check Page Content
```bash
curl https://[domain]/tools/palm-reader | grep "palm-reader"
# Expected: finds page content (not error page)
```

### Step 3: Manual Browser Test
1. Open https://[domain]/tools/palm-reader in browser
2. Open DevTools Console (F12)
3. Check for errors (red X icon)
4. Test camera access (should prompt for permission)
5. Test hand detection (quality meter should update)
6. Test API call (should return results)

### Step 4: Directory Listing Verification
1. Navigate to https://[domain]/tools
2. Locate "Palm Reader" card
3. Click "Try Tool" button
4. Verify redirect to `/tools/palm-reader` works

### Step 5: Mobile Testing
1. Open `/tools/palm-reader` on mobile device or mobile view
2. Check responsive layout (no horizontal scrolling)
3. Test camera access on mobile (may require additional permissions)
4. Verify touch interactions (buttons clickable)

---

## Monitoring Post-Deployment

### Logs
- Monitor Vercel logs for errors: `vercel logs --prod`
- Check for API errors (500s on `/api/tools/palm-reader`)
- Check for 404s on related routes

### Metrics (if integrated with analytics)
- Monitor page load time
- Monitor API response times (should be 2-3s)
- Monitor error rates

### User-Reported Issues
- Watch for reports of broken camera access
- Watch for analysis errors (API timeouts, rate limits)
- Watch for mobile layout issues

---

## Rollback Procedure (If Issues Found)

If critical issues discovered after deployment:

```bash
# View previous deployments
vercel deployments

# Rollback to previous version
vercel rollback [deployment-id]

# Then fix issues locally and re-deploy
git revert [commit]
git push
/deploy
```

---

## Documentation Updates (Post-Deployment)

After successful deployment:
- [ ] Update project README if there's a tool list section
- [ ] Update homepage if there's a "Featured Tools" section
- [ ] Create announcement/changelog entry (if applicable)
- [ ] Update project documentation with tool integration

---

## Verification Checklist

**Pre-Deployment:**
- [ ] All todos 001-007 completed and marked done
- [ ] Git status: clean working tree
- [ ] All tests passing
- [ ] Build succeeds locally
- [ ] No TypeScript errors
- [ ] Env vars set: `NEXT_PUBLIC_GEMINI_KEY`

**During Deployment:**
- [ ] `/deploy` command runs without errors
- [ ] Vercel build succeeds
- [ ] No new console errors

**Post-Deployment:**
- [ ] Tool accessible at `/tools/palm-reader`
- [ ] Camera access works
- [ ] Hand detection fires
- [ ] Auto-capture triggers
- [ ] API returns results
- [ ] Attribution visible
- [ ] Mobile responsive
- [ ] Directory listing updated
- [ ] No console errors in production

---

## Success Criteria (Final)

✅ Tool live at https://[domain]/tools/palm-reader  
✅ Camera access prompt appears  
✅ Hand detection working (quality meter updates)  
✅ Auto-capture triggers at >75% confidence  
✅ Gemini API analysis successful (2-3s response time)  
✅ Results display with proper formatting  
✅ All buttons functional (Retry, Home, Read Another)  
✅ Mobile responsive layout  
✅ Attribution visible and correctly credited  
✅ No console errors in DevTools  
✅ Tool discoverable via `/tools` directory  

---

## Related Todos

- **Depends on**: 007 (all tests passing)
- **Blocks**: none (final todo)
- **Follows**: All previous todos (001-007)

---

## Session Context

- Project domain: [determine from deployment config]
- Vercel project: [check vercel.json or CLI]
- Previous deployments: `vercel deployments`
- Build command: `npm run build` or `next build`

