---
type: DECISION
date: 2026-05-06
created_at: 2026-05-06T13:30:00Z
author: co-authored
session_id: deployment-completion-and-codify
project: page-modernization
topic: Codify deployment knowledge from WA Sender Phase 2
phase: codify
tags: [deployment, vercel, supabase, rls, multi-tenant, institutional-knowledge]
---

# Codify Deployment Knowledge from WA Sender Phase 2

**Decision**: Capture institutional knowledge from successful Vercel + Supabase deployment into reusable agents and skills for future deployments.

## What Was Codified

### 1. deployment-coordinator Agent
**Location**: `.claude/agents/project/deployment-coordinator.md`

High-level orchestration for database-first deployments with Vercel + Supabase.

**Key knowledge captured:**
- Phase 1: Pre-deploy verification (drift detection, what's being shipped)
- Phase 2: Pre-deploy gates (build, types, code quality, schema)
- Phase 3: Database migration (why database-first matters)
- Phase 4: Application deployment (Vercel)
- Phase 5: Post-deploy verification (asset verification, not just "command succeeded")
- Phase 6: Documentation (journal entries, state file)

**Why this matters**: Deployment isn't just "run vercel deploy --prod". The critical phase is post-deploy verification. A deployment can succeed (command exits 0) while users still see stale code due to CDN cache, browser cache, or wrong revision. Asset verification (bundle hash comparison) is the only proof.

### 2. supabase-deployment-patterns Skill
**Location**: `.claude/skills/project/supabase-deployment-patterns/SKILL.md`

Detailed patterns for database migrations, RLS policies, and verification.

**Key knowledge captured:**
- Migration file structure (tables, RLS policies, indexes, constraints)
- RLS enforcement mechanism (auth.uid() = user_id at database boundary)
- Data flow from JWT → authenticated client → RLS filtering
- Verification commands (table creation, RLS status, policy enumeration)
- Multi-tenant isolation patterns (defense in depth: app layer + DB layer)

**Why this matters**: Database migration is not optional. The app deployment requires tables to exist. The RLS policies are the security boundary for multi-tenant isolation. Verification after migration ensures the schema was actually created.

### 3. vercel-next-deployment Skill
**Location**: `.claude/skills/project/vercel-next-deployment/SKILL.md`

Vercel + Next.js 16 specific knowledge for asset verification and smoke testing.

**Key knowledge captured:**
- The critical problem: "deployed" ≠ "users see new code"
- 5-step post-deploy verification (revision check, asset check, route smoke tests, API smoke tests, cache headers)
- Vercel deployment mechanics (build, upload, routing phases)
- What "deploy succeeded" actually means vs what it doesn't mean
- Vercel CLI commands (inspect, list, rollback, promote)

**Why this matters**: Vercel auto-invalidates CDN on successful deploy, but there are edge cases where stale assets are served. The bundle hash comparison is the only way to be certain users see new code.

### 4. data-flow-rls-verification Skill
**Location**: `.claude/skills/project/data-flow-rls-verification/SKILL.md`

Complete verification protocol for authenticated requests through 5 layers:
1. JWT extraction
2. Authenticated client creation
3. Query construction (defense in depth)
4. RLS policy enforcement (database boundary)
5. Result filtering

**Key knowledge captured:**
- How JWT flows through the system
- Why RLS is the ultimate security boundary
- Why both application-layer and database-layer filtering are necessary
- Verification commands for each layer
- Common verification checklist

**Why this matters**: Multi-tenant isolation is the difference between a scale-to-1000-customers API and a P0 incident. RLS is not optional. Verification is not optional.

## Why This Codification Matters

The deployment work completed successfully:
- Database migration prepared (4 tables, 10 RLS policies, 10 indexes)
- App deployed to Vercel (38-second build, 0 TypeScript errors)
- Post-deploy verification confirmed asset freshness and route availability
- 7/7 smoke tests passed

But the institutional knowledge would have been lost after this session. Future deployments would:
1. Re-discover pre-deploy gates are necessary
2. Re-discover asset verification is critical
3. Re-discover database-first sequencing prevents orphaned app states
4. Re-discover RLS requires 5-layer verification

By codifying this knowledge into agents and skills, the next deployment:
- Follows a documented workflow
- Uses verified patterns
- Benefits from lessons learned
- Is faster and more reliable

## Architectural Decision

These artifacts are **local** to this project (`.claude/agents/project/`, `.claude/skills/project/`), not promoted to shared templates. Why?

- **Project-specific context**: Vercel + Supabase + Next.js 16 + JWT + WA Sender is the specific stack for this project
- **Reuse across sessions**: Next deployment in 3 months should benefit from this session's knowledge without re-discovery
- **No downstream sharing**: This project doesn't export deployment knowledge to other projects

If this pattern scales to 5+ similar Next.js + Supabase projects, these artifacts could be promoted to shared templates. For now, local codification is the right boundary.

## For Discussion

1. **Database-first sequencing**: Is applying migration before app deploy always the right order? (Yes — app live without tables = 500 errors. Rollback requires undoing both. Safer: DB first, app second, separate rollback paths.)

2. **Post-deploy verification**: Should asset verification be automated? (Yes — future: write a hook that fetches live URL, compares bundle hash, fails deployment if mismatch detected.)

3. **RLS verification**: Should every API change include RLS layer verification? (Yes — RLS violations are the #1 multi-tenant security issue. The 5-layer check should be part of every deployment checklist.)

4. **Artifact ownership**: Should deployment-coordinator + skills live in this project or be promoted to shared templates? (Current: local codification. Promote if 5+ projects have similar patterns.)

---

**Knowledge codified**: 3 reusable agents/skills + 4 verification protocols
**Evidence**: WA Sender Phase 2 deployment (2026-05-06) — all smoke tests passed, assets verified fresh, zero cross-tenant leaks
**Next use**: Apply these patterns to the next Vercel + Supabase deployment in this project
