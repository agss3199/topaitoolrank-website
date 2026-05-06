# Project Rules — WA Sender Development Guidelines

This directory contains project-specific rules enforcing mandatory patterns, constraints, and safety checks discovered during development and red team validation.

## Available Rules

### Session Debounce Safety
**File**: `session-debounce-safety.md`  
**Applies to**:
- `app/tools/*/page.tsx` — session load, auth check, debounced save
- `app/api/sheets/*` — session API endpoints
- `lib/*.ts` — auth hooks, utility functions

**Mandatory Checks**:
1. Three-tier fallback on session load (Supabase → localStorage → empty)
2. Auth check guards against useAuth loading race
3. Debounce created in useMemo with empty deps
4. Debounce delay value must be justified with comments

**Enforcement**: This rule blocks commits if:
- Session load skips localStorage fallback when API returns null
- Auth redirect runs before useAuth finishes loading
- Debounce created with deps that cause recreation
- Debounce delay is a magic number with no comment

---

## Rule Structure

Each project rule should specify:
1. **Applies to**: Path patterns that trigger this rule
2. **MUST Rules**: Non-negotiable enforcement points
3. **MUST NOT**: Anti-patterns that are explicitly blocked
4. **Verification Checklist**: How to verify compliance
5. **Related Rules**: Links to complementary rules
6. **Origin**: Incident or decision that drove the rule

---

## When Rules Activate

Rules are loaded when you:
1. Edit a file matching the `paths:` patterns
2. Run `/redteam` or `/deploy` (all rules loaded for audit)
3. Explicitly reference the rule file

---

## When to Create New Rules

Create a new project rule when you discover:
1. A **mandatory pattern** that all code must follow
2. That prevents a **class of bugs** (not one-off issues)
3. That can be **automatically verified** or checked in review

Example: If all API endpoints must log requests, create a "API Logging" rule.

---

## Enforcement Levels

- **MUST**: Non-negotiable; blocks commits and deployments
- **MUST NOT**: Explicitly forbidden patterns
- **Recommended/Suggested**: Best practices, not enforced

---

## Maintenance

Rules should be reviewed when:
- New similar incidents occur (tighten rule scope)
- Rule becomes too broad (split into multiple rules)
- Technology changes (update examples, paths)

Do NOT create rules for one-time workarounds. Rules should outlive the incident that created them.

---

**Created**: 2026-05-06  
**Last Updated**: 2026-05-06 16:15 UTC
