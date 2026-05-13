---
name: Codification of BMC Generator Architecture Patterns
description: Institutional knowledge extracted from production implementation. Three key patterns codified into reusable agent and skill artifacts for future projects.
type: DECISION
date: 2026-05-13
author: co-authored
session_id: session-bmc-codify
project: bmc-generator
tags: [architecture, patterns, paid-tools, async-orchestration, authentication]
---

# Codification: BMC Generator Architecture Patterns

**Phase:** `/codify` (Phase 05)  
**Status:** ✅ Complete  
**Artifacts Created:**
- `.claude/agents/project/bmc-generator-architecture-specialist.md`
- `.claude/skills/project/bmc-generator-authentication/SKILL.md`
- `.claude/skills/project/component-css-module-safety/SKILL.md`

---

## Decision: Which Patterns to Codify

The BMC Generator implementation revealed five distinct, reusable patterns worth preserving:

### Pattern 1: Three-Tier Timeout Strategy (CODIFIED)
**Codified into:** `bmc-generator-architecture-specialist` § Pattern 1  
**Rationale:** User requirement ("I don't want a blank canvas + cost waste") drove a sophisticated timeout strategy that's generalizable to any multi-phase generation task.  
**Reusability:** High (any workflow with 2+ sequential or parallel phases under time pressure)

### Pattern 2: Stateless HTTP + EventSource (CODIFIED)
**Codified into:** `bmc-generator-architecture-specialist` § Pattern 2  
**Rationale:** Simpler than WebSocket, lower memory overhead, event replay for resilience.  
**Reusability:** High (any real-time progress monitoring under serverless constraints)

### Pattern 3: Cost Tracking with Partial Output (CODIFIED)
**Codified into:** `bmc-generator-architecture-specialist` § Pattern 3  
**Rationale:** Core user guarantee ("pay only for what was used"). Generalizable to any cost-tracked AI service.  
**Reusability:** High (any paid AI tool, billing system)

### Pattern 4: Parallel Agent Orchestration with Graceful Degradation (CODIFIED)
**Codified into:** `bmc-generator-architecture-specialist` § Pattern 4  
**Rationale:** Promise.allSettled() instead of Promise.all() is a critical mindset shift for multi-agent systems.  
**Reusability:** High (any multi-agent workflow)

### Pattern 5: Authentication for Paid Tools (CODIFIED)
**Codified into:** `bmc-generator-authentication/SKILL.md`  
**Rationale:** Sliding-window JWT + layered rate limiting + account lockout is a complete, tested pattern.  
**Reusability:** High (any tool requiring login + cost protection)

### Pattern 6: CSS Module Safety (CODIFIED)
**Codified into:** `component-css-module-safety/SKILL.md`  
**Rationale:** Specific to Next.js dynamic components, but the fallback strategy generalizes.  
**Reusability:** Medium (next time we build dynamic Next.js components)

---

## Why These Patterns Matter

Each pattern emerged from a **real production problem** that a naive implementation would miss:

| Problem | Naive Solution | Our Pattern | Outcome |
|---------|---|---|---|
| Generation times out → blank canvas + cost waste | Hard cutoff | Three-tier fallback | User always sees output, pays fairly |
| WebSocket requires stateful server memory | Full WebSocket impl | Stateless EventSource + replay | Scales on serverless, survives disconnects |
| Budget overruns if user hammered with requests | One global rate limit | Layered: IP, session, daily, global | Protection at every level |
| CSS Modules undefined in dynamic components | Direct `styles.className` access | `cls()` helper with fallback | No 500 errors in production |

---

## For Discussion

1. **Are these patterns self-contained enough?** Each skill/agent should be readable without external context. Did we achieve that? Or do future developers need to keep reading BMC Generator implementation?

2. **Generalization vs specificity:** The authentication pattern is tightly coupled to BMC Generator (username/password from env vars). Should we generalize it to support OpenID Connect, email verification, or multi-user tenants? Or keep it specific as a "simple password login" pattern?

3. **Timeout strategy complexity:** The three-tier pattern is sophisticated (120s hard limit, 100s soft grace, per-phase smart timeouts). Is this worth the implementation cost for future projects, or should we recommend a simpler "abort and show what we have" strategy?

---

## What's NOT Codified (and Why)

### Event Replay Logic
**Status:** Implemented in `bmc-generator` but NOT codified into a reusable skill  
**Reason:** Tightly coupled to SSE (EventSource-specific). Would need separate abstraction for WebSocket, polling, or queue-based systems. **Defer:** Wait until we implement 2+ event-streaming patterns to extract the abstraction.

### Zod Validation Strategy
**Status:** Implemented throughout BMC Generator but NOT codified  
**Reason:** Zod is framework-specific (Next.js TypeScript). Would need a "Validation Patterns" skill covering Zod, Joi, Yup, OpenAPI validators. **Defer:** Create when we have multiple validation implementations to compare.

### Markdown Fallback Rendering
**Status:** Implemented for Tier 3 fallback (raw agent outputs as markdown) but NOT codified  
**Reason:** UI component behavior, not orchestration pattern. Would belong in a "Fallback UI" skill, not architecture specialist. **Defer:** Build 2-3 more tools with fallback UIs before extracting.

---

## Integration with Future Projects

When building the next paid AI tool:

1. **Copy the authentication skill** as-is (username/password login pattern is reusable)
2. **Adapt the architecture specialist** to your use case (timeout durations, phase count, agent parallelism differ)
3. **Use CSS Module safety** whenever building dynamic Next.js components with force-dynamic

Example next project: "PDF Report Generator" (multi-page generation with timeout fallback)
- Use: Three-Tier Timeout strategy, CostTracker pattern, Parallel orchestration
- Adapt: Skip EventSource (maybe use polling), add cloud storage for partial PDFs
- Reuse: Authentication pattern exactly, CSS Module safety if rendering dynamic page

---

## Quality Checklist (Before Finalizing)

- [x] Each artifact is self-contained (readable without external context)
- [x] Real code examples provided (not pseudocode)
- [x] Testing patterns included (how to verify the pattern works)
- [x] Common mistakes documented (what NOT to do)
- [x] Environment variables listed (what's required to run)
- [x] Related patterns cross-referenced (how this connects to other skills/agents)
- [x] Security practices highlighted (where the pattern protects against risks)

---

## Next Steps (Post-Codify)

1. **Use these patterns in the next project** — Test generalization assumptions
2. **Refine after real use** — First reuse will expose gaps or over-complications
3. **Build specialized subskills** as needed (e.g., "Zod Validation Patterns" once we have 3+ Zod implementations)

---

## Related Decisions

- `0034-COMPLETION-phase-implementation-complete.md` — Full implementation details
- `0034-RISK-timeout-partial-output-cost-guarantee.md` — Timeout strategy rationale
- `0010-RISK-critical-security-gaps.md` — Authentication risk assessment

---

## Session Impact

**Before codification:** Knowledge about these patterns lives only in:
- BMC Generator implementation code (scattered across 12 files, 3.8k LOC)
- Journal entries (spread across 15 decision/risk documents)
- Session notes (impermanent, lost when session ends)

**After codification:** Knowledge lives in:
- Reusable agent (`bmc-generator-architecture-specialist`)
- Reusable skills (authentication, CSS Module safety)
- Embedded in documentation with examples + tests
- Ready for next project to import and adapt

**Expected reuse:** These patterns should shorten the next similar project by 30-40% (no need to re-discover three-tier timeout strategy, authentication layering, or CSS Module safety).
