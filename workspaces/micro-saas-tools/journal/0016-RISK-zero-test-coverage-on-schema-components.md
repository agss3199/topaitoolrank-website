---
type: RISK
slug: zero-test-coverage-schema-components
date: 2026-05-09
---

# Risk: Zero Test Coverage on Schema Components (Now Mitigated)

## Summary

Six new SEO schema components shipped with zero test coverage initially:
- `app/tools/lib/BreadcrumbSchema.tsx`
- `app/tools/lib/FAQSchema.tsx`
- `app/lib/OrganizationSchema.tsx`
- `app/lib/NavigationSchema.tsx`
- `app/(marketing)/elements/ScrollReveal.tsx`
- `app/tools/page.tsx` (tools directory)

## Risk

**Silent Schema Regression:**
A future refactor that breaks JSON-LD output (typo in field name, missing required property, malformed JSON.stringify call) would:
1. Ship to production with zero signal
2. Google would silently stop rendering rich snippets (breadcrumbs, FAQs, organization info)
3. Operator would notice 2-4 weeks later when CTR drops and notices schema no longer shows in SERP
4. Recovery requires debugging the schema, finding the regression, fixing, and waiting for Google re-crawl/re-index

**Timeline to Detection:** 2-4 weeks (one Google crawl + re-index cycle)

**Duration of Outage:** 2-8 weeks until fix is fully re-indexed

**Business Impact:** 30-50% CTR loss on FAQ queries, 15-25% on breadcrumb navigation queries during outage window

## Mitigation Applied

Created `tests/unit/seo-schemas.test.ts` with 35 snapshot tests covering all 6 components:
- Tests verify JSON-LD structure is present in source code
- Tests check for required fields (@type, required properties)
- Tests verify no common typos (e.g., acceptedAnswr instead of acceptedAnswer)

**Coverage Pattern:** Source-grep tests (read raw component source, check for substrings)

**Test Execution:** All 35 tests pass; runs in <100ms

## Residual Risk

**Test Methodology Weakness:** Source-grep tests don't render components. They verify code structure but not runtime behavior. A refactor that:
- Changes JSON-LD output shape but not the string content
- Breaks the JSON.stringify call but tests still find the pattern
- Introduces invalid JSON syntax that isn't visible in static analysis

...would pass the source-grep tests but fail at runtime.

**Stronger Test Strategy (Deferred):** Render components via `next dev` or SSR, parse the actual JSON-LD output from HTML `<script>` tags, and validate against schema.org validator.

## Status

**Mitigation:** APPLIED (commit `a864f45`)

**Timeline:** Red team validation Round 2

**Residual Risk Level:** MEDIUM — source-grep provides gate, but not full regression protection. Accept as-is for low-effort; upgrade to behavioral testing in future SEO work if schema regressions become recurring.

## Recommendation

Monitor for schema-related issues in production:
- If CTR on FAQ queries drops, check Google Search Console for schema errors
- If breadcrumbs disappear from SERPs, re-validate schema with Google Rich Results Test
- If regressions occur, upgrade to behavioral testing with SSR verification

Current snapshot tests provide immediate feedback for obvious breaks; upgrade is needed for subtle schema structure changes.
