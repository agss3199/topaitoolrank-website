---
type: application
platform: vercel
framework: nextjs
environment: production
---

# Deployment Configuration — Top AI Tool Rank Website

## Platform

**Vercel** — Next.js 16 application deployed to https://topaitoolrank.com

## Repository

- **Remote**: https://github.com/agss3199/topaitoolrank-website.git
- **Branch**: master
- **Auto-Deploy**: Enabled (pushes to master trigger automatic preview/production deploys)

## Build & Deployment

### Build Command

```bash
npm run build
```

Compiles Next.js 16 with Turbopack, generates 14 static routes + 7 dynamic API endpoints.

### Output Directory

`.next` — Next.js build output

### Pre-Deploy Gates

All gates MUST pass before deploying:

1. **Build**: `npm run build` must succeed with zero TypeScript errors
2. **Lint**: `npm run lint` must pass (no ESLint violations)
3. **Type Check**: Next.js build includes full TypeScript validation

### Deploy Command

```bash
vercel deploy --prod
```

Pushes to Vercel and promotes to production after successful build.

## Verification Steps

### 1. Revision Check

```bash
vercel inspect topaitoolrank.com
```

Confirm deployed commit matches `git rev-parse HEAD`.

### 2. User-Visible Asset Verification

Fetch live site and verify design system CSS variables are present:

```bash
curl -fsSL https://topaitoolrank.com -H "Cache-Control: no-cache" | grep -o "var(--color-\|var(--spacing-\|var(--font-"
```

Expected: Multiple instances of CSS variable usage in inline styles or class names.

### 3. Page Status Verification

All modernized pages MUST return 200:

```bash
for page in "" "/auth/login" "/auth/signup" "/blogs" "/tools/wa-sender" "/privacy-policy" "/terms"; do
  curl -s -o /dev/null -w "$(basename $page || echo 'home'): %{http_code}\n" https://topaitoolrank.com$page
done
```

Expected output: All pages return 200.

### 4. Smoke Test — Live Site Features

- Homepage: Loads, displays hero and CTA
- Login page: Form fields render, email/password inputs functional
- Signup page: Form fields render, name/email/password/confirm fields present
- Blog page: Grid layout shows articles, search and category filters present
- WA Sender tool: Form inputs load, file upload area visible
- Privacy Policy: Content displays with proper styling
- Terms page: Content displays with proper styling

## Cache Invalidation

Vercel automatically invalidates CDN cache on successful deployment. No manual cache clearing required.

## Rollback Procedure

If issues are detected post-deploy:

1. Identify the last known-good commit in `deploy/.last-deployed`
2. Revert to that commit: `git revert <commit-sha>`
3. Push to master (auto-triggers redeploy)
4. Verify live site returns to known-good state

## State File

**Location**: `deploy/.last-deployed`

**Contents**: SHA of the last successfully deployed commit

**Updated**: After each successful deploy (post-verification)

## Production URLs

- **Primary Domain**: https://topaitoolrank.com (alias to Vercel deployment)
- **Vercel URL**: https://topaitoolrank-website-agss3199.vercel.app (or auto-generated URL)
- **Inspector**: https://vercel.com/agss3199/topaitoolrank-website

## Routes (All Static Pre-Rendered)

| Route                  | Type      | Status |
| ---------------------- | --------- | ------ |
| `/`                    | Static    | ✓      |
| `/auth/login`          | Static    | ✓      |
| `/auth/signup`         | Static    | ✓      |
| `/blogs`               | Static    | ✓      |
| `/privacy-policy`      | Static    | ✓      |
| `/terms`               | Static    | ✓      |
| `/tools/wa-sender`     | Static    | ✓      |
| `/api/auth/login`      | Dynamic   | ✓      |
| `/api/auth/signup`     | Dynamic   | ✓      |
| `/api/discord`         | Dynamic   | ✓      |
| `/api/sheets/load`     | Dynamic   | ✓      |
| `/api/sheets/save`     | Dynamic   | ✓      |

## Environment Variables

Configured in Vercel project settings (not in .env.local):

- `NEXT_PUBLIC_SITE_NAME=WA Sender`
- Additional auth/API keys via Vercel env dashboard

## Last Deployment

- **Commit**: c5c452ee49ad8ebb6c04657534da7fb55f3fa3d8
- **Date**: 2026-05-01
- **Status**: ✅ LIVE
- **Verification**: All 6 pages return 200, design system CSS variables active
