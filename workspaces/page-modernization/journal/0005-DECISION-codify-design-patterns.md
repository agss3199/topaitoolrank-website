---
type: DECISION
date: 2026-05-01
created_at: 2026-05-01T14:30:00Z
author: co-authored
session_id: post-deploy-codify
phase: codify
project: page-modernization
topic: Codify design system and page modernization patterns
tags: [design-system, components, patterns, institutional-knowledge]
---

# DECISION: Codify Design System Patterns as Institutional Knowledge

## Summary

After successfully completing and deploying the page modernization project (26 todos, 4 milestones, 7 pages), we codified the lessons learned into reusable agents and skills. This decision captures the patterns and workflows that should inform future Next.js UI modernization work.

## What Was Codified

### 1. Two New Project Agents

**`design-system-builder.md`**
- Purpose: Build and enforce design systems across Next.js applications
- Responsibilities: Token definition, component library creation, design enforcement
- Knowledge base: Token system architecture, component patterns, responsive design strategy
- When to delegate: New component library, design system definition, page compliance audits

**`page-modernizer.md`**
- Purpose: Orchestrate page modernization from legacy styling to design system
- Responsibilities: Legacy page analysis, modernization workflow (build → wire → verify)
- Knowledge base: Common patterns (dark→light theme, responsive grids, form validation)
- When to delegate: Modernizing existing pages, enforcing design token adoption

### 2. Project Skill: `next-design-system-patterns`

Captured reusable patterns and templates:
- **Token System**: CSS variables architecture (colors, spacing, typography, shadows)
- **Component Patterns**: Button, Input, FormField, Modal with accessibility
- **Responsive Design**: Mobile-first approach, 4 breakpoints, fluid typography with clamp()
- **Accessibility Checklist**: WCAG AA compliance requirements
- **Page Modernization Workflow**: 8-step process from audit through red team validation

## Rationale

### Why Codify?

1. **Future Projects**: Next UI modernization or design system work can reuse these patterns instead of rediscovering them
2. **Consistency**: Ensures all future work follows the same standards (design tokens, component library, accessibility)
3. **Delegation**: Agents can reference structured knowledge instead of ad-hoc instructions
4. **Audit Trail**: Institutional knowledge is captured before it disperses across sessions

### Why These Artifacts?

**Agents (vs. skills):**
- Agents are procedural — they know WHAT to do and WHEN to do it
- Agents should own complex workflows (modernization is 4 sequential phases)
- design-system-builder owns the architectural decisions
- page-modernizer owns the workflow execution

**Skill (vs. agents):**
- Skills are reference knowledge — they know the patterns and templates
- Agents delegate to skills for "how do I build a Button?"
- One skill captures all the patterns (tokens, components, responsive, accessibility)

## Success Criteria (Met)

- ✅ Agents documented with clear responsibilities and knowledge base
- ✅ Skill created with practical patterns and code examples
- ✅ Both agents reference the skill for detailed pattern knowledge
- ✅ Codified patterns match actual implementation (from red team audit)
- ✅ Agents are under 400 lines (cc-artifacts compliance)
- ✅ Skill is structured for progressive disclosure (summary → deep patterns)

## Impact on Future Work

### If Next Project Needs UI Modernization

1. Read `design-system-builder` agent → understand design token architecture
2. Read `page-modernizer` agent → understand modernization workflow
3. Read `next-design-system-patterns` skill → get templates and code examples
4. Delegate to design-system-builder → build/enforce design system
5. Delegate to page-modernizer → orchestrate page modernization
6. Reference skill → implement components, responsive design, accessibility

**Estimated savings**: 1 session avoided (don't need to research and design patterns from scratch)

### Quality Gates Enforced

Future agents will have reference implementations for:
- ✅ Token system naming (semantic, not implementation-based)
- ✅ Component library pattern (forwardRef, TypeScript, accessibility)
- ✅ Responsive design (clamp() for typography, 4 breakpoints)
- ✅ Accessibility (WCAG AA checklist baked into workflow)
- ✅ Red team validation (design compliance, component usage, hardcoded color detection)

## Deferred Decisions

Not codified (not high enough priority):
- Tailwind CSS integration patterns (project doesn't use Tailwind in pages)
- Dark mode support (not needed for this project, but should be pattern for future)
- Animation library patterns (used CSS keyframes only)
- Testing patterns for design systems (separate from design system itself)

## For Discussion

1. **Should design token naming convention be enforced at CI/CD time?**
   - Current: Manual review catches semantic naming violations
   - Future: Linter rule to reject hardcoded colors in pages?
   - Trade-off: Stricter enforcement vs. engineering cost

2. **Should component variant system be more formalized?**
   - Current: Button/Badge variants defined in CSS + data attributes
   - Alternative: Use component libraries (Radix, Shadcn) instead of custom components?
   - Consideration: Current approach gives full control + minimal dependencies

3. **Should accessibility checklist become a pre-deployment gate?**
   - Current: Red team verifies, but no automated WCAG checker
   - Future: Add axe-core or similar to CI/CD for baseline automated checks?
   - Trade-off: Catch more issues vs. false positives

---

**Next steps**: Future projects should reference these agents and skill when doing UI work. Monitor what patterns are missing or need updates.
