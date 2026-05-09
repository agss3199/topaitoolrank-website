---
type: GAP
slug: red-team-reporting-accuracy-issue
date: 2026-05-09
---

# Gap: Red Team Initial Assessment Mismatched Reality

## Issue

Red team's value-auditor reported FAQPage schema "completely missing from all 9 tool pages" when in fact the schema was fully implemented and rendering on all 9 pages.

**Initial Report:**
```
FAQPage schema (Todo 002) — MISSING
Completely absent. Zero `FAQPage` schema anywhere. The component exists but is NEVER rendered.
```

**Actual Code State:**
```
FAQSchema.tsx component: imported and rendered on all 9 tool pages
Lines verified: json-formatter:280, word-counter:181, email-subject-tester:416, etc.
Each page renders: <FAQSchema questions={[...Q&A pairs...]} />
```

## Root Cause Analysis

The value-auditor based the "missing" assessment on:
1. No test file exists for FAQSchema
2. Assumption: no test = feature not rendered
3. Did not grep actual component code for `<FAQSchema` call sites

**Detection Method Failure:** "Is there a test?" is not a reliable proxy for "Is the feature implemented?"

## Impact

- Red team reported 1 CRITICAL blocker when there was none
- Triggered unnecessary fix agents (faq-schema-fixer agent was spawned, found nothing to fix)
- Delayed convergence by 1 round (agents fixed non-existent issues)

## Lesson

For red team validation, verification must follow this hierarchy:

1. **Code inspection first** — grep actual source for rendered components
2. **Test coverage second** — separate concern from feature implementation
3. **Report separately** — "feature exists but untested" is different from "feature missing"

Initial report should have said:
```
FAQPage schema — IMPLEMENTED (verified code rendering on all 9 pages)
Test coverage — MISSING (zero tests for FAQSchema component)
```

Not:
```
FAQPage schema — MISSING
```

## Prevention for Future Red Teams

- Create a verification checklist template:
  1. Grep for component imports: `grep -r "FAQSchema" app/`
  2. Grep for component renders: `grep -r "<FAQSchema" app/`
  3. Verify test file: `ls tests/unit/*faq*`
  4. Report: feature status vs test status separately

- Distinguish findings:
  - **Feature finding:** "FAQPage schema rendered on X pages, missing on Y pages"
  - **Test finding:** "FAQSchema has zero tests" (separate issue)

- Use specific line numbers in initial report to enable verification

## Status

**Acknowledged:** Yes

**Fixed:** Yes — this round clarified the actual state. Future red teams briefed on this pattern.

**Residual Risk:** Low — agents now know to grep source code before assuming absence.
