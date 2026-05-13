---
type: DECISION
date: 2026-05-10
created_at: 2026-05-10T04:30:00Z
author: co-authored
session_id: current
project: micro-saas-tools
topic: Codify layout, validation, and logging patterns into reusable agents and skills
phase: codify
tags: [codification, agents, skills, validation, responsive-design, logging]
---

# Decision: Codify Layout & Validation Patterns into Institutional Knowledge

## Situation

Phase 02 implementation completed 4 layout & feature todos (001-004) with 0 CRITICAL or HIGH findings. The implementation introduced three foundational patterns that should be preserved as institutional knowledge for future feature development:

1. **Comprehensive field validation** (explicit character rejection regex)
2. **Structured logging framework** (centralized logger with event keys)
3. **Responsive CSS design patterns** (scroll-padding-top for fixed headers, CSS cascade safety rule)

These patterns are reusable across all micro-SaaS tools and should be codified to:
- Enable faster feature development (copy pattern, adapt to context)
- Prevent pattern drift (consistent implementation across tools)
- Reduce red team findings (patterns already validated)

## Decision

**Create project-specific agents and skills in `.claude/agents/project/` and `.claude/skills/project/`:**

1. **New Agent**: `security-validation-specialist.md` — implements comprehensive field validation, framework logger adoption, XSS injection testing
2. **New Skill**: `responsive-css-patterns.md` — captures fixed header compensation, CSS cascade safety rule, responsive breakpoint system
3. **Update**: `SKILL.md` index to reference new skill + agent

## Codified Patterns

### Pattern 1: Security Validation Agent

**What**: Comprehensive field validation using explicit character rejection (not allowlists).

**Why**: Allowlists are fragile — missing one allowed character becomes an injection vector. Explicit rejection of `<>"'``&` is simpler and more obviously correct. Applied to ALL user-controlled fields (10+ fields in invoice PDF export).

**Reusability**: Any future feature that accepts user input (forms, file uploads, API handlers) should use this pattern. The agent provides implementation guidance + XSS unit test template.

**Deliverables**:
- Validation helper with explicit character rejection
- Framework logger module (replaces console.error)
- Unit test suite (26+ tests proving injection attempts fail)
- Pre-existing failure remediation (zero-tolerance Rule 1)

**Meta**: This pattern emerged from red team audit identifying 7 blocking issues during todo validation. Fixing all gaps directly (not deferring) proved faster than re-approval cycle. Codifying the pattern prevents the same issues from recurring.

### Pattern 2: Responsive CSS Skill

**What**: Three interconnected responsive design patterns:
1. **Fixed header compensation** — scroll-padding-top: 120px for anchor links + skip-to-content link for keyboard accessibility
2. **CSS cascade safety rule** — explicit re-declaration of animation properties in media queries
3. **Responsive breakpoint system** — CSS variables (640, 768, 1024, 1440px) for consistent usage

**Why**: 
- Fixed positioning creates two accessibility failures (anchor links obscured, keyboard navigation broken). scroll-padding-top + skip-to-content link is the standard solution.
- CSS cascade removes animation properties when media query overrides dimensions (silent failure, invisible to developers until testing at different breakpoints).
- Breakpoint variables prevent hardcoded pixel values and inconsistency across pages.

**Reusability**: All tool pages should inherit these patterns. Future responsive work should follow the RESPONSIVE-TESTING.md checklist (viewport sizes, per-page validation).

**Deliverables**:
- Fixed header compensation pattern + example code
- CSS cascade safety rule + verification checklist
- Responsive breakpoint system (CSS variables)
- Testing protocol (`RESPONSIVE-TESTING.md`) with 5 viewport sizes + per-page checklists

**Meta**: These patterns emerged from user requirements ("header covers text", "tool pages full-width", "content broken on small screens"). Addressing them revealed secondary implications (keyboard accessibility, animation behavior). Codifying the patterns at the right scope (site-wide, not tool-specific) prevents reimplementation.

### Pattern 3: Framework Logger Framework

**What**: Centralized logger module replacing console.error calls throughout codebase.

**Why**: 
- Raw error messages leak stack traces and internal structure into logs (security risk)
- console.error calls are scattered, making audit compliance unverifiable
- Structured logging (event key + data object) enables aggregation and alerting

**Reusability**: The logger pattern should be adopted project-wide. Initial deployment in invoice-generator; should expand to all tools and API handlers.

**Deliverables**:
- Framework logger module (`app/lib/logger.ts`)
- Usage examples for error handling
- Zero-tolerance remediation (3 pre-existing console.error calls fixed in same PR)

**Meta**: Codifying this as a pattern signals that structured logging is the standard, not an optional enhancement. Future code (and code review) should enforce adoption.

## Alternatives Considered and Rejected

### Alternative 1: Embed Patterns in Specs Only

**Rejected**: Specs are authoritative contracts, not implementation guidance. A developer building the 5th invoice exporter shouldn't need to read a spec to understand the pattern — they should be able to ask the security-validation-specialist agent.

### Alternative 2: Extract Patterns Into General Project Rules

**Rejected**: General rules apply everywhere and create false consensus about global applicability. These patterns are best-practices for micro-SaaS tools specifically, not universal principles. Keeping them in project-scope artifacts (agents/skills/project/) makes intent clear.

### Alternative 3: Wait Until Multiple Tools Use the Pattern

**Rejected**: Waiting creates a "coordination window" where new tools either (a) reinvent the pattern (drift) or (b) lack guidance. Codifying early prevents both outcomes.

## Implementation Record

- **Files created**:
  - `.claude/agents/project/security-validation-specialist.md` (237 lines)
  - `.claude/skills/project/responsive-css-patterns.md` (421 lines)
  
- **Files updated**:
  - `.claude/skills/project/SKILL.md` — added references to new agent + skill
  - Memory index — updated feedback section after SEO and micro-saas red team cycles

- **Related artifacts** (from phase 02 implementation):
  - `app/lib/logger.ts` — framework logger implementation
  - `app/tools/invoice-generator/lib/pdf-generator.ts` — comprehensive field validation
  - `app/globals.css` — scroll-padding-top, CSS cascade safety rule, responsive breakpoints
  - `RESPONSIVE-TESTING.md` — testing protocol

## Outcomes

**Immediate**: Future feature development on micro-SaaS tools can reference these agents/skills instead of re-deriving patterns.

**Medium-term**: These patterns should be extended to:
- WA Sender tool (already uses some validation, can adopt unified pattern)
- Additional micro-SaaS tools as they're added
- Blog publishing system (if form-based content input is added)

**Long-term**: If patterns prove robust across 5+ tools with 0 security findings, consider promoting to global `.claude/agents/` or to Terrene Foundation standards (CO/COC methodology).

## For Discussion

1. **Should the logger pattern be adopted project-wide immediately, or wait for next feature?** — Adopting immediately signals commitment but creates chore work. Waiting risks logger divergence.

2. **Should RESPONSIVE-TESTING.md become a blocking checklist in `/redteam`, or remain a best-practice guideline?** — Making it a blocking checklist ensures every page is validated, but may slow feature delivery.

3. **Should we extract the security validation pattern into a reusable library module** (`lib/validators.ts`), or keep inline in each feature? — Library promotes consistency but adds a maintenance point; inline is simpler for small projects.

4. **How will we know if these patterns are actually being used by future features?** — Should the agent descriptions include this pattern as a "use when..." trigger, or rely on developers discovering the agent through `/codify` output?

---

**Related**: 0027-DECISION-comprehensive-field-validation.md, 0028-DECISION-framework-logger-adoption.md, 0029-DISCOVERY-fixed-header-layout-implications.md, 0030-VALIDATION-redteam-complete.md

**Status**: Codified — ready for team reference
