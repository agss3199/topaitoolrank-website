# Decision: Three-State API Error Handling Pattern

**Date:** 2026-05-07  
**Phase:** Codification (Phase 05)  
**Context:** Red team validation revealed silent article loading failures across all 9 micro-SaaS tool pages.

## Decision

Implement a standardized **three-state error handling pattern** for all async API fetches in tool pages:

1. **articleLoading** — request in flight
2. **articleContent** — success case (data ready)
3. **articleError** — failure case (user-visible message)

## Rationale

**Why this approach over alternatives:**

| Option | Trade-off | Chosen? |
|--------|-----------|---------|
| Single "error" state for all cases | Simple but conflates API errors with network errors | ❌ |
| Promise-based `.then().catch()` | Less readable than async/await | ❌ |
| **Three-state (this pattern)** | **Clear separation of concerns; aligns with loading UI pattern** | ✅ |
| Retry logic on failure | Adds complexity; user refresh is sufficient for this use case | ❌ |

## Key Principles Established

1. **Always clear error state on success** — prevents stale error UI from previous failures
2. **Distinguish error types** — non-200 API responses vs. network/catch errors provide different context
3. **User-visible language** — "Failed to load article" not "fetch() threw error"
4. **Display errors first** — render `{error && ...}` before loading check so feedback is immediate

## Implementation Details

- All 9 tool pages use identical pattern (`app/tools/*/page.tsx`)
- Error state initialized to empty string `""`
- useEffect catches both non-200 responses AND exceptions
- Error div uses `cls()` helper for CSS Module safety
- No retry button (users can refresh; retry increases API cost)

## Impact

- **User Experience:** Silent failures → clear feedback when APIs fail
- **Developer Onboarding:** Pattern documented in project agent + skill
- **Maintenance:** Future tool pages can copy the pattern from existing implementations
- **Testing:** 60/60 article tests validate error handling works correctly

## Related Decisions

- **Project Rule:** `.claude/rules/project/css-module-safety.md` — all error containers use `cls()` helper
- **Project Agent:** `.claude/agents/project/error-handling-specialist.md` — full pattern guide
- **Project Skill:** `.claude/skills/project/api-error-handling/SKILL.md` — implementation reference

## Status

✅ **Implemented across all 9 tools**
✅ **Tests passing: 60/60**
✅ **Red team convergence: ACHIEVED**

---

**Approver:** Red team final validation (2026-05-07)
**Next Review:** When adding new tool pages or API integrations
