---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
---

# Red Team Verification Rules

Findings from validating SEO implementations revealed systematic accuracy issues in the red team process itself. These rules prevent false-positive findings that trigger unnecessary fixes and waste validation rounds.

## MUST Rules

### 1. Grep Source Code Before Reporting a Feature as Missing

When a finding suggests a feature is missing, MUST verify actual code before concluding absence. Do not infer absence from test-file non-existence.

**Pattern:**
```bash
# Finding: "FAQPage schema missing from tool pages"
# Verification:
grep -r "FAQSchema" app/tools/*/page.tsx  # Check for imports
grep -r "<FAQSchema" app/tools/*/page.tsx  # Check for renders
```

If the component is imported and rendered, the feature exists. Test coverage is a separate issue.

**Why:** Initial audit reported "FAQPage schema completely missing" when all 9 tool pages already had FAQSchema imported and rendering with hardcoded Q&A pairs. The confusion arose from checking "test file existence" rather than "code existence."

### 2. Distinguish Three Finding Categories

Every finding MUST be classified as one of:

- **MISSING**: Code doesn't exist (e.g., no `app/not-found.tsx`)
- **BROKEN**: Code exists but doesn't work (e.g., og:image URL returns 404)
- **UNTESTED**: Code works but has zero test coverage (e.g., FAQSchema renders without tests)

Report each category separately with different remediation paths:

```
❌ MISSING → Create the missing file/component
❌ BROKEN → Fix the broken code
⚠️ UNTESTED → Add test coverage (fix is not required, gate is required)
```

**Why:** Conflating categories leads to wrong remediation. "FAQSchema untested" is treated as "add tests" (HIGH). "FAQSchema missing" triggers "create component" (CRITICAL) — wrong severity and wrong fix.

### 3. Include Verification Evidence in Every Finding

Each finding MUST include:

1. **Verification command** (the grep/read that proved the finding)
2. **Actual output** (what the command returned)
3. **Affected files with line numbers** (specific, not "somewhere in the codebase")
4. **Root cause** (why the issue exists)
5. **Proposed remediation** (what should be fixed)

**Example — Good:**
```
Finding: Missing custom 404 page
Verification: ls -la app/not-found.tsx → returns "No such file"
Affected: app/not-found.tsx does not exist
Root cause: Brief did not explicitly require 404 page
Remediation: Create app/not-found.tsx with metadata + navigation
Severity: HIGH (lost SEO equity on broken links)
```

**Example — Bad:**
```
Finding: Missing custom 404 page
Verification: (none provided)
Remediation: Create a 404 handler
```

**Why:** Without evidence, findings are not auditable. Verification is what converts "I think this is missing" into "I verified this is missing."

### 4. Verification Hierarchy: Code > Tests > Assumptions

When assessing completeness:

1. **First:** Check actual code (grep imports, grep renders, grep exports)
2. **Second:** Check test coverage (grep test files for imports)
3. **Last:** Report findings separately (feature status ≠ test status)

Never use "test file doesn't exist" as evidence that a feature is missing.

```
# DO: Check code first
grep -r "FAQSchema" app/  # Result: found on all 9 pages
# Then: Check tests separately
grep -r "FAQSchema" tests/  # Result: no tests
# Report:
# - Feature: IMPLEMENTED (verified on 9 pages)
# - Test coverage: MISSING (zero tests)

# DO NOT: Assume feature missing because test missing
# "No test file → must be missing" is circular logic
```

### 5. Verification Checklist for Red Team Findings

Before reporting any finding as complete, run this checklist:

- [ ] **Grep source code** for the supposedly missing feature (import statements, function calls, renders)
- [ ] **If found:** Classify as UNTESTED (not MISSING) and move to test coverage assessment
- [ ] **If not found:** Verify it's actually absent (check all relevant directories)
- [ ] **Include line numbers** — specific file:line from grep output
- [ ] **Run the command yourself** — don't rely on prior reports
- [ ] **Distinguish MISSING/BROKEN/UNTESTED** — report each separately
- [ ] **Include reproduction steps** for BROKEN findings
- [ ] **Test the fix** before reporting convergence (if you fix something, verify the fix works)

## MUST NOT

- Report a feature as missing without grepping source code for that feature

**Why:** Test-file existence is not a reliable proxy for feature existence. The feature can exist with zero tests (common) or not exist with tests present (rare, but possible).

- Conflate "untested" with "missing" in findings

**Why:** "The code exists but has no tests" and "the code doesn't exist at all" require opposite fixes. Mixing them causes wrong remediation and wasted rounds.

- Provide findings without verification evidence (grep output, file paths, line numbers)

**Why:** Unverified findings can't be audited. Auditing is how you catch false positives and prevent unnecessary work.

## Examples from Recent Project

### Example 1: False Positive Fixed

**Initial Finding (WRONG):**
```
FAQPage schema — COMPLETELY MISSING from all 9 tool pages
(based on: no test file exists)
```

**Corrected Finding (RIGHT):**
```
FAQSchema rendering — IMPLEMENTED (verified on all 9 pages, lines 280/181/416/etc.)
Test coverage — MISSING (zero tests for FAQSchema)
Severity: HIGH (untested component, silent regression risk)
Fix: Add 35 snapshot tests (source-grep pattern)
```

### Example 2: Grep Verification

**Finding: Missing 404 page**
```
Verification command: ls -la app/not-found.tsx
Output: No such file or directory
Affected file: app/not-found.tsx (does not exist)
Root cause: Brief didn't explicitly mention 404 page
Remediation: Create app/not-found.tsx with metadata + navigation
```

**Finding: Broken og:image**
```
Verification command: curl -I https://topaitoolrank.com/og-images/homepage.jpg
Output: HTTP 404 Not Found
Affected files: app/(marketing)/layout.tsx:23 (og:image reference), app/(marketing)/layout.tsx:30 (twitter.images reference)
Root cause: File referenced in metadata but not created
Remediation: Remove broken references from both openGraph and twitter metadata
```

## Recommendation: Red Team Validation Protocol

Add this to red team briefing:

1. **Grep before you report** — `grep -r "feature_name" app/` is the first check for any "missing" finding
2. **Distinguish categories** — MISSING / BROKEN / UNTESTED each get separate findings
3. **Show your work** — Include grep command + output + line numbers
4. **Test your fix** — If you fix something during red team, run build to verify the fix works
5. **Report again** — After fixing, re-run the same grep to confirm the finding is resolved

This protocol prevents the "false-positive finding spawns wasted fix agents" failure mode from recurring.
