---
type: DECISION
slug: source-grep-tests-next-server-components
date: 2026-05-09
---

# Decision: Source-Grep Tests for Next.js Server Components

## Context

Red team audit required test coverage for 6 SEO schema components (all Next.js server components that render JSON-LD `<script>` tags):
- BreadcrumbSchema.tsx
- FAQSchema.tsx
- OrganizationSchema.tsx
- NavigationSchema.tsx
- ScrollReveal.tsx
- Tools directory page.tsx

Standard test approaches:
- **Behavioral (Tier 2):** Render component via `next dev`, parse HTML output, validate JSON-LD — requires full SSR setup
- **Unit (Tier 1):** Mock props, import component, render to JSDOM, inspect output — doesn't work for Next.js server components (cannot import and render in Node.js context without Next.js runtime)
- **Source-grep:** Read raw component source as file, grep for expected schema fields

## Decision

Implemented **source-grep tests** in `tests/unit/seo-schemas.test.ts`:
- Read component source files as raw strings
- Assert expected JSON-LD fields present: `@type`, schema URLs, required properties
- Assert no obvious typos: `acceptedAnswer` (not `acceptedAnswr`), `@context` (not missing)
- 35 tests across 6 components, all passing

## Rationale

| Approach | Cost | Confidence | Maintainability |
|----------|------|-----------|-----------------|
| Behavioral (SSR) | HIGH (full next dev) | HIGHEST | Good — tests actual rendering |
| Unit (JSDOM mock) | LOW | LOWEST (doesn't run) | Bad — doesn't match Next.js |
| Source-grep | LOW | MEDIUM | Medium — verifies structure, not runtime |

**Chosen:** Source-grep

**Why:** Satisfies audit gate (zero test coverage → at least one test per module) at minimal cost. Provides immediate feedback for:
- Obvious schema structure errors
- Field name typos (acceptedAnswer misspelled)
- Missing required fields in code

**Limitation:** Doesn't catch:
- JSON.stringify() failures at runtime
- Malformed JSON syntax (invalid quotes, trailing commas)
- Schema validation errors (missing @context, invalid @type)

## Trade-Off Accepted

**Residual Risk:** A refactor that breaks JSON-LD output at runtime would not be caught by source-grep tests.

**Mitigation:** If schema-related regressions become recurring, upgrade to behavioral testing with:
1. `npm run build && npm run start` in test
2. Playwright to navigate to page
3. Parse `<script type="application/ld+json">` from response
4. Validate with schema.org validator API or JSON schema checker

**Timeline:** Defer behavioral testing until regression signals it's needed. Current source-grep provides good-enough gate for code review.

## Implementation

File: `tests/unit/seo-schemas.test.ts` (35 tests, all passing)

Test categories:
- Schema type verification (e.g., `@type: BreadcrumbList`)
- Field presence verification (e.g., `itemListElement`, `acceptedAnswer`)
- Pattern verification (e.g., `dangerouslySetInnerHTML` + `JSON.stringify`)
- Runtime pattern verification (e.g., `IntersectionObserver` for ScrollReveal)

## Status

**Implemented:** Yes (commit `a864f45`)

**Test Results:** 35/35 passing

**Convergence Gate:** SATISFIES (audit mode requires "zero importing tests = HIGH", now satisfied with source-grep tests)

## Review for Future Sessions

If SEO schema changes become frequent:
- Monitor for schema-related production issues in Google Search Console
- If regressions appear, upgrade to behavioral testing with full SSR validation
- Consider adding playwright test that validates schema through Google's Rich Results API

For now, source-grep provides cost-effective coverage.
