# Project Agents — WA Sender & Session Persistence

This directory contains project-specific agents for topaitoolrank.com development. These agents are built from patterns discovered during red team validation and deployment cycles.

## Available Agents

### Session Persistence Specialist
**File**: `session-persistence-specialist.md`  
**Use when**: Data loss after refresh, debounce not working, or session not loading  
**Capabilities**:
- Diagnose session persistence race conditions
- Apply fixes for localStorage + debounced backend save patterns
- Debug auth check timing issues
- Verify debounce closure correctness

**Example usage**:
- User reports "data lost after upload and refresh"
- Run diagnostic checklist from agent
- Apply fix template
- Verify with post-fix tests

---

## Related Artifacts

- **Skills**: See `.claude/skills/project/` for detailed patterns
- **Rules**: See `.claude/rules/project/session-debounce-safety.md` for mandatory checks
- **Journal**: See `workspaces/page-modernization/journal/` for decision/discovery entries

---

## When to Create New Agents

Create a new project agent when you discover:
1. A **repeated pattern** across 2+ code locations
2. That requires **step-by-step diagnosis** or **specific procedures**
3. That can be **reused by future agents** without customization

Example: If frontend validation patterns are discovered, create a "Frontend Validation Specialist" agent.

---

## Maintenance

Update agents when:
- Related code changes significantly (new debounce library, auth system change)
- Journal discovers new edge cases for existing patterns
- Next session reports the diagnostic checklist missed something

Do NOT update agents for one-off fixes or temporary workarounds.

---

**Created**: 2026-05-06  
**Last Updated**: 2026-05-06 16:30 UTC
