---
type: RISK
date: 2026-05-07
created_at: 2026-05-07T00:00:00Z
author: co-authored
session_id: claude-code-2026-05-07
phase: todos
project: tool-pages-seo-optimization
topic: GA4 implementation blocked by existing tests
tags: [GA4, tests, blocking, critical-path]
---

# RISK: GA4 Implementation Blocked by Existing Tests

## Risk Description

Three test files currently assert that GA code must NOT exist in `app/layout.tsx`:

1. `tests/unit/performance.test.ts` (lines 87-93): `expect(layoutContent).not.toContain('gtag')`
2. `tests/unit/deployment-readiness.test.ts` (lines 66, 151): Same assertion
3. `tests/integration/homepage.test.ts` (line 264): Same assertion

**Impact**: If GA4 code is added to `app/layout.tsx`, all three tests FAIL. This blocks deployment.

## Severity

**Critical** — GA4 implementation cannot proceed without resolving this.

## Root Cause

The tests were written to enforce "no GA code in layout" as a requirement (likely from a past decision). Now that GA4 is a requirement, the old tests are contradictory.

## Mitigation Strategy

**Todo 18** addresses this directly:
1. Update all three test files to expect GA code instead of forbidding it
2. Change assertions from `not.toContain('gtag')` to `toContain('GoogleAnalytics')`
3. Verify tests pass with GA code present

**Critical path dependency**:
```
Todo 18 (update tests) → Todo 19 (add GA4) → Todo 20 (verify GA4)
```

Todo 19 cannot start until todo 18 is complete.

## Timeline Impact

- If tests are NOT updated before GA4 implementation: 1-2 hours debugging test failures
- If tests ARE updated first (as planned): 0 hours debugging, clean implementation

## For Discussion

1. **Why were these tests written?** Was GA code deliberately excluded in the past, or is this a legacy test from before GA4 was decided?
2. **Are there other tests that might conflict?** Should we audit all tests for GA-related assertions before implementation?
3. **Should GA be optional?** If GA should be optional in some environments, the assertion should be conditional: `if (process.env.GA_ENABLED) expect(...)`

## Related

- GA4 spec: `specs/tool-pages-google-analytics.md` § Test Coordination
- Test update plan: `workspaces/tool-pages-seo-optimization/todos/active/18-update-ga4-tests.md`
- Implementation plan: `workspaces/tool-pages-seo-optimization/todos/active/19-implement-ga4.md`
