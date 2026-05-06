# Project Skills — WA Sender Deployment Knowledge

This directory contains project-specific skills documenting patterns, anti-patterns, and solutions discovered during WA Sender development and validation.

## Available Skills

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
**Last Updated**: 2026-05-06 16:00 UTC
