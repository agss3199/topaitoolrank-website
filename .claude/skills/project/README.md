# Project Skills — Micro-SaaS & Tool Pages

This directory contains project-specific skills documenting patterns, anti-patterns, and solutions discovered during micro-SaaS tool development, WA Sender deployment, and site-wide modernization.

## Available Skills

### Component Consolidation Pattern (NEW — May 2026)
**File**: `component-consolidation/SKILL.md`  
**Topics**:
- Extract duplicate components into shared location
- Unify imports across 3+ pages using path aliases
- Delete old implementations and verify no orphaned code
- CSS Module scoping for component isolation
- Red team checklist for consolidation

**Use this skill when**:
- Consolidating duplicate Header, Footer, Layout, or Navigation components
- Reducing code duplication across tool pages
- Establishing single source of truth for site-wide components
- Verifying imports are consistent and consolidated

**Example**: Consolidated Header.tsx (11 pages) and removed 2,400 LOC of duplicate code

---

### Link Hygiene Pattern (NEW — May 2026)
**File**: `link-hygiene/SKILL.md`  
**Topics**:
- Remove broken placeholder links (`href="#"`, `/missing`, hardcoded domains)
- Verify all footer/navigation links resolve correctly
- Use Next.js `<Link>` for internal routes, `<a>` for external
- Anchor link patterns (`#home`, `#tools`, `#contact`)
- Sitemap implications of broken links

**Use this skill when**:
- Reviewing footer and navigation for broken links
- Deciding whether to implement or remove placeholder pages
- Fixing 404 errors from non-existent routes
- Cleaning up UI before deployment

**Example**: Removed `/tools` link (404), removed `#documentation` (placeholder)

---

### Responsive Animation Safety (NEW — May 2026)
**File**: `responsive-animation-safety/SKILL.md`  
**Topics**:
- Prevent silent animation loss in media query overrides
- CSS cascade and property override patterns
- Explicit animation re-declaration in responsive CSS
- CSS variables for DRY animation properties
- Detection and prevention strategies
- Testing animations across all breakpoints

**Use this skill when**:
- Building responsive components with animations
- Debugging animations that work on mobile but not desktop
- Reviewing media query CSS for animation properties
- Preventing silent failures in responsive design
- Setting up animation coverage checks in CI

**Example**: Fixed neural core rings — animations were silently removed on desktop when media query resized them (commit 17ca20f)

---

### WA Sender Deployment & Session Persistence
**File**: `wa-sender-deployment.md`  
**Topics**:
- Session persistence race conditions with debounce + localStorage
- CSS variable discovery workflow (finding undefined vars)
- Icon mapping from manifest strings to display values
- Sheet visibility & delete control patterns
- Red team validation checklist for Next.js/Vercel apps

**Use this skill when**:
- Fixing session persistence issues
- Discovering missing CSS variables
- Converting manifest data to UI values
- Reviewing file upload/management UX
- Red teaming Next.js applications

**Example patterns**:
```typescript
// Fallback to localStorage when API returns success but null session
if (data.ok && !data.session) {
  const cached = localStorage.getItem(localStorageKey);
  if (cached) applySessionData(JSON.parse(cached));
}
```

---

## Related Artifacts

- **Agents**: See `.claude/agents/project/` for diagnostic & fix procedures
- **Rules**: See `.claude/rules/project/` for mandatory patterns
- **Journal**: See `workspaces/page-modernization/journal/` for detailed decision/discovery

---

## Skill Structure

Each project skill should include:
1. **Pattern Description** — what problem it solves
2. **Root Cause Analysis** — why the problem happens
3. **Solution with Code** — exact fixes and examples
4. **When to Apply** — scenarios and contexts
5. **Prevention** — how to avoid in future
6. **Grep Commands** — how to find existing instances

---

## When to Create New Skills

Create a new project skill when you need to document:
1. Reusable code patterns (not one-off solutions)
2. Discovery workflows that multiple agents should know
3. Checklists or procedures specific to this project
4. Common anti-patterns and how to avoid them

---

## Maintenance

Skills should be updated when:
- New edge cases discovered (add to existing section)
- Patterns evolve or are replaced (update, don't duplicate)
- Code examples become outdated (keep examples functional)

---

**Created**: 2026-05-06  
**Last Updated**: 2026-05-08 03:50 UTC  
**Skills**: 4 (Component Consolidation, Link Hygiene, WA Sender Deployment, Responsive Animation Safety)
