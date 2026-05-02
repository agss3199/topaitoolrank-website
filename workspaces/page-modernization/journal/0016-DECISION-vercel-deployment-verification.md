---
type: DECISION
date: 2026-05-01
title: Codify Vercel Deployment Verification into Skill
slug: vercel-deployment-verification
---

# Decision: Codify Vercel Deployment Verification into Skill

## What Was Decided

Created `.claude/skills/project/vercel-deployment-verify/` as a project-specific skill to capture the 5-step post-deploy verification protocol discovered during the CSS deployment to production.

## Why

The deployment of CSS responsive fixes surfaced a critical gap: **"deploy command returns exit 0" is NOT the same as "users see the new code."** Users may see stale HTML due to CDN cache, old bundles due to service workers, or traffic still routing to the old revision.

The verification protocol has 5 distinct steps:

1. **Revision check** — Verify the deployed commit is the one we pushed
2. **Traffic check** — Verify the new revision is receiving 100% of traffic
3. **Asset check** — Fetch the live URL and verify the bundle hash matches (the CRITICAL user-visible check)
4. **Smoke tests** — Test critical routes return HTTP 200
5. **Cache invalidation** — Fallback cache busting if Step 3 fails

Each step catches different failure modes:
- Step 1: Deploy succeeded but wrong commit shipped
- Step 2: Revision exists but old revision still serves all traffic
- Step 3: **THE MOST IMPORTANT** — users see stale code despite deployment
- Step 4: Deploy succeeded but endpoints are crashing
- Step 5: Cache layers haven't expired yet

## How Applied

- **Skill created** with progressive disclosure: SKILL.md provides the checklist, 5 sub-files provide detailed validation scripts
- **Portable commands** — All hardcoded domain names replaced with `<domain>` placeholder
- **Compliance verified** — Commands under 150 lines, SKILL.md <100 lines with full checklist
- **Executable validation** — Each sub-file includes shell commands and pass/fail criteria

## Related Files

- `.claude/skills/project/vercel-deployment-verify/SKILL.md` — Overview and checklist
- `.claude/skills/project/vercel-deployment-verify/01-revision-check.md` — Commit verification
- `.claude/skills/project/vercel-deployment-verify/02-traffic-check.md` — Traffic distribution
- `.claude/skills/project/vercel-deployment-verify/03-asset-check.md` — User-visible bundle hash (critical)
- `.claude/skills/project/vercel-deployment-verify/04-smoke-tests.md` — Route functionality
- `.claude/skills/project/vercel-deployment-verify/05-cache-invalidation.md` — CDN fallback
- `deploy/deployments/2026-05-01-CSS-Responsive-Fixes.md` — Record of deployment with all 5 checks

## Future Use

Every production deployment should run this verification checklist before considering the deploy "done." The skill should be referenced in `/deploy` post-deploy verification gates.

## Red Team Findings Fixed

- Added trigger phrase to agent description ("Use for responsive CSS bugs...")
- Removed duplicated commands from SKILL.md (let sub-files own the scripts)
- Replaced hardcoded `topaitoolrank.com` with `<domain>` placeholders in all files
- Fixed revision check to use proper jq parsing of githubCommitSha
- Updated cache invalidation with documented alternatives (vercel redeploy, TTL wait, no-cache header)
