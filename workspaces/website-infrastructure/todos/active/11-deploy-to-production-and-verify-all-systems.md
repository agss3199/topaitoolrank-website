# Todo: Deploy to Production & Verify All Systems Working

**Status:** Pending  
**Implements:** All specs (integration verification)  
**Dependencies:** Item 10 (tests pass)  
**Blocks:** None (final step)  
**Capacity:** Single session (~200 LOC deployment + verification)  

## Description

Deploy all infrastructure changes to production. Verify: sitemap includes all pages, social previews work for articles, navigation shows tools, auth tokens are validated, tool data is isolated, article pages are clean (no green screen).

## Deployment Steps

1. **Pre-deployment checks:**
   - All tests pass locally: `npm run test`
   - Local build succeeds: `npm run build`
   - No lint errors: `npm run lint`
   - No TypeScript errors: `npm run type-check`
   - Commit message references implementation todos (e.g., "fixes #01, #02, #03 ...")

2. **Deploy to Vercel:**
   - Push to main: `git push origin main`
   - Vercel auto-builds and deploys
   - Database migrations run automatically
   - Monitor deployment for errors

3. **Post-deployment verification:**
   - [ ] Homepage loads (marketing context)
   - [ ] Blog listing loads (`/blogs`)
   - [ ] Article loads (`/blogs/ai-integration-guide`) — NO green screen, NO marketing styles
   - [ ] WA Sender tool loads (`/tools/wa-sender`) protected by auth
   - [ ] Tool B loads (`/tools/tool-b`) protected by auth
   - [ ] Navigation shows both tools (auto-discovered from manifests)
   - [ ] Sitemap is valid XML and includes all pages
   - [ ] Article page has correct SEO meta tags
   - [ ] Article page has correct Open Graph image tag
   - [ ] Social preview works (share on LinkedIn, shows image + title + description)
   - [ ] WA Sender token rejected on `/tools/tool-b/*` (401)
   - [ ] Tool B token rejected on `/tools/wa-sender/*` (401)
   - [ ] User A cannot see User B's data
   - [ ] Auth login flow works
   - [ ] Auth logout clears tokens
   - [ ] Privacy policy loads (`/privacy-policy`)
   - [ ] Terms of service loads (`/terms`)

## Acceptance Criteria (ALL MUST PASS)

- [ ] Production build succeeds without errors
- [ ] Vercel deployment is green (no failed builds)
- [ ] Homepage is accessible
- [ ] Blog system works (articles are readable)
- [ ] Article pages are CLEAN (no green screen artifact, no marketing styles)
- [ ] WA Sender tool is protected by auth (can access with valid token)
- [ ] Tool B is protected by auth (can access with valid token)
- [ ] Cross-tool token rejection works (401 on wrong tool)
- [ ] Data isolation works (User A cannot access User B's data)
- [ ] Sitemap is complete (includes home, blog listing, articles, tools, legal, auth)
- [ ] Sitemap XML is valid (can be parsed by search engines)
- [ ] Social previews work (OG tags are present and valid)
- [ ] Navigation is populated (reads from tool registry, no hardcoding)
- [ ] At least 3 articles are published and live
- [ ] Lighthouse score on article page: Performance ≥80, SEO ≥95, Accessibility ≥90

## Testing (Post-Deployment)

```bash
# Verify sitemap
curl https://topaitoolrank.com/sitemap.xml | grep -c "<url>"
# Should be 10+ URLs (home, blog listing, 3+ articles, tools, legal, auth)

# Verify article is clean
curl https://topaitoolrank.com/blogs/ai-integration-guide \
  | grep -i "green\|#22c55e\|pulse" || echo "✓ No green styles found"

# Verify article SEO
curl https://topaitoolrank.com/blogs/ai-integration-guide \
  | grep "<title>\|og:image\|og:description" | head -5
# Should show title, image URL, description

# Verify WA Sender is protected
curl https://topaitoolrank.com/tools/wa-sender
# Should redirect to login or return 401 (not public)

# Verify cross-tool rejection
# Get wa-sender token, try to access tool-b API
curl -H "Authorization: Bearer <wa-sender-token>" \
  https://topaitoolrank.com/api/tool-b/data
# Should return 401

# Verify navigation loads tools
curl https://topaitoolrank.com/api/tools/list | jq .
# Should return both wa-sender and tool-b
```

## Rollback Plan (If Issues Arise)

If production deployment fails:
1. Revert last commit: `git revert HEAD`
2. Push to main: `git push origin main`
3. Vercel redeploys previous working version
4. Investigate issue and retry deployment

## Post-Deployment Monitoring (First 24 Hours)

- Monitor error logs for auth failures
- Monitor error logs for database connection issues
- Monitor response times for API routes
- Check social media: share article link, verify preview works
- Request user feedback on tool access and responsiveness

