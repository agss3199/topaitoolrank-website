# Deployment Checklist

## Before First Deployment

### 1. Environment Variables ✅
- [x] `.env` file created with Discord webhook URL
- [ ] Update `NEXTAUTH_SECRET` with production value:
  ```bash
  openssl rand -base64 32
  ```
- [ ] Update `NEXTAUTH_URL` to production domain
- [ ] Copy `.env` values to Vercel project settings

### 2. Google Analytics (Optional)
- [ ] Get GA4 Measurement ID from Google Analytics
- [ ] Update `G-XXXXXXXXXX` in `app/layout.tsx` with your ID
- [ ] Test by visiting site in browser (check tag is firing)

### 3. Dependencies
- [ ] Run `npm install` locally
- [ ] Verify no build errors: `npm run build`
- [ ] Verify dev server works: `npm run dev`

### 4. Git & GitHub
- [ ] Initialize git repo (if not already done)
- [ ] Add `.env` to `.gitignore` (secret keys never in git)
- [ ] Create GitHub repo
- [ ] Push to GitHub: `git push -u origin main`

### 5. Vercel Setup
- [ ] Connect GitHub repo to Vercel
- [ ] Vercel auto-detects Next.js 16
- [ ] In Vercel Project Settings → Environment Variables:
  ```
  DISCORD_WEBHOOK_URL = https://discord.com/api/webhooks/...
  NEXTAUTH_SECRET = <generated value>
  NEXTAUTH_URL = https://topaitoolrank.com
  ```
- [ ] Deploy to Vercel (auto-deploys on git push)

### 6. Domain Configuration
- [ ] In Vercel project → Settings → Domains
- [ ] Add `topaitoolrank.com`
- [ ] Vercel provides CNAME value
- [ ] At domain registrar: Add CNAME record pointing to Vercel
  - Example: `CNAME topaitoolrank.com -> something.vercel.app`
- [ ] Wait for DNS propagation (5-30 minutes)
- [ ] Test: Visit `https://topaitoolrank.com`

### 7. Test All Routes
- [ ] Homepage: `https://topaitoolrank.com/`
- [ ] Services section: `https://topaitoolrank.com/#services`
- [ ] Tools section: `https://topaitoolrank.com/#tools`
- [ ] Contact form: `https://topaitoolrank.com/#contact`
  - [ ] Submit test message (should appear in Discord)
- [ ] Privacy policy: `https://topaitoolrank.com/privacy-policy`
- [ ] Terms: `https://topaitoolrank.com/terms`
- [ ] Blog (coming soon): `https://topaitoolrank.com/blogs/`
- [ ] WA Sender tool: `https://topaitoolrank.com/tools/wa-sender`

### 8. Test Forms
- [ ] Contact form sends to Discord webhook
  - [ ] Fill in all fields
  - [ ] Click "Send Message"
  - [ ] Check Discord channel for embedded message
- [ ] WA Sender tool loads and is functional
  - [ ] Can upload Excel file
  - [ ] Can toggle WhatsApp/Email mode
  - [ ] Data persists in localStorage

### 9. SEO Check
- [ ] Run Lighthouse audit on homepage
  - Target: Performance ≥90, SEO ≥95
- [ ] Verify meta tags in browser DevTools
  - `<title>`, `<meta name="description">`, OG tags
- [ ] Check `robots.txt` is accessible
- [ ] Check `sitemap.xml` is accessible
- [ ] Submit sitemap to Google Search Console

### 10. Security
- [ ] HTTPS enabled (Vercel auto-enables)
- [ ] No secrets in git history
  - Check: `git log --all --oneline -S DISCORD_WEBHOOK`
  - If found, use `git filter-branch` or recreate repo
- [ ] `.env` is in `.gitignore`
- [ ] Webhook URL is server-side only (not exposed in client JS)

### 11. Monitoring
- [ ] Set up error tracking (optional: Sentry, LogRocket)
- [ ] Enable Vercel Analytics (optional: real user metrics)
- [ ] Bookmark Vercel dashboard for monitoring deploys

### 12. Future Tools
- [ ] Create `app/tools/voice-rating/` folder when ready
- [ ] Follow tool isolation pattern (see `app/tools/README.md`)
- [ ] Add to navbar and sitemap
- [ ] Deploy via git push

## Post-Launch

### Week 1
- [ ] Monitor for errors in Vercel logs
- [ ] Check Discord for contact form submissions
- [ ] Verify GA4 is tracking visitors

### Monthly
- [ ] Review Lighthouse scores
- [ ] Check for 404 errors in Vercel logs
- [ ] Update `public/sitemap.xml` if adding tools
- [ ] Review analytics for user behavior

## Troubleshooting

**Domain not working?**
- Wait 30 minutes for DNS propagation
- Check CNAME record at domain registrar
- Verify in Vercel that domain shows "Valid Configuration"

**Form not sending?**
- Check Discord webhook URL in Vercel env vars
- Verify webhook is still active in Discord server
- Check browser console (F12) for errors

**Tool not loading?**
- Clear browser cache (Ctrl+Shift+Delete)
- Check `npm run build` succeeds locally
- Look for errors in Vercel deployment logs

**404 errors?**
- Check route path matches folder structure
- Update sitemap if adding new pages
- Verify file names use lowercase and kebab-case

---

**Estimated time:** 1-2 hours for first-time setup (including DNS propagation wait)
