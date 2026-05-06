# Micro-SaaS Tools Implementation Master Plan

**Project**: 10 standalone utility tools for topaitoolrank.com  
**Constraint**: Each tool completely isolated (own folder, own CSS, no shared resources)  
**Total Estimated Effort**: ~32–41 hours autonomous execution (~3–4 sessions)

---

## Build Order & Dependencies

```
Setup (1 todo)
  ↓
Wave 1 (9 todos: 3 tools × 3 tasks each)
  ↓
Wave 2 (9 todos: 3 tools × 3 tasks each)
  ↓
Wave 3 (12 todos: 4 tools × 3 tasks each)
  ↓
Testing & Finalization (6 todos)
  ↓
SEO & Deployment (2 todos)
```

**Dependency Notes**:
- Setup must complete before any tool build
- Each tool's build, wire, and test can run in parallel with other tools in the same wave
- Wave 2 depends on Wave 1 completion (SEO indexing, homepage discovery)
- Wave 3 depends on Wave 2 completion (analytics, traffic patterns)
- Testing runs concurrent with implementation (TDD per tool)
- Deployment and SEO run last (after all 10 tools complete)

---

## Implementation Timeline

| Phase | Wave | Tools | Time | Session(s) |
|-------|------|-------|------|-----------|
| Setup | — | Infrastructure | 1h | 1 |
| Impl. | 1 | 3 frontend tools | 7–9h | 1–2 |
| Impl. | 2 | 3 more frontend tools | 8–11h | 1–2 |
| Impl. | 3 | 4 backend/API tools | 16–21h | 2–3 |
| QA | — | Testing, integration, E2E | 4–6h | 1–2 |
| Deploy | — | SEO, analytics, monitoring | 2–3h | 1 |
| **Total** | | **10 tools** | **32–41h** | **3–4** |

---

## Todo List (All Tasks)

### SETUP

- [ ] **001-setup-tool-infrastructure** — Create app/tools/ folder structure and CSS isolation template

### WAVE 1: Frontend-Only (7–9 hours, 3 tools)

#### Tool 1: WhatsApp Message Formatter

- [ ] **101-build-whatsapp-message-formatter** — UI + markdown to WhatsApp syntax logic
- [ ] **102-wire-whatsapp-message-formatter** — Connect input/output, localStorage, download
- [ ] **103-test-whatsapp-message-formatter** — Unit + component + E2E tests

#### Tool 2: WhatsApp Link Generator + QR Code

- [ ] **104-build-whatsapp-link-generator** — UI + URL builder + QR logic
- [ ] **105-wire-whatsapp-link-generator** — Connect inputs, QR display, download
- [ ] **106-test-whatsapp-link-generator** — Unit + component + E2E tests

#### Tool 3: Word Counter & Text Analyzer

- [ ] **107-build-word-counter** — UI + statistics calculation engine
- [ ] **108-wire-word-counter** — Real-time stats, localStorage, export
- [ ] **109-test-word-counter** — Unit + component + E2E tests

### WAVE 2: Frontend + Optional APIs (8–11 hours, 3 tools)

#### Tool 4: AI Prompt Generator for Business

- [ ] **201-build-ai-prompt-generator** — UI + template system + variable injection
- [ ] **202-wire-ai-prompt-generator** — Form inputs, output display, copy/download
- [ ] **203-test-ai-prompt-generator** — Unit + component + E2E tests

#### Tool 5: Email Subject Line Tester

- [ ] **204-build-email-subject-tester** — UI + scoring algorithm + suggestions engine
- [ ] **205-wire-email-subject-tester** — Input validation, real-time scoring, export
- [ ] **206-test-email-subject-tester** — Unit + component + E2E tests

#### Tool 6: UTM Link Builder

- [ ] **207-build-utm-link-builder** — UI + URL builder + validation
- [ ] **208-wire-utm-link-builder** — Input handling, URL generation, copy/download
- [ ] **209-test-utm-link-builder** — Unit + component + E2E tests

### WAVE 3: Backend/API Optional (16–21 hours, 4 tools)

#### Tool 7: JSON Formatter & Validator

- [ ] **301-build-json-formatter** — UI + JSON parser + formatter + validator
- [ ] **302-wire-json-formatter** — Input/output, error display, copy/download
- [ ] **303-test-json-formatter** — Unit + component + E2E tests (malformed JSON edge cases)

#### Tool 8: Business Name Generator (AI)

- [ ] **304-build-business-name-generator** — UI + LLM integration + list display
- [ ] **305-wire-business-name-generator** — Form inputs, API calls, results, copy/download
- [ ] **306-test-business-name-generator** — Unit + component + E2E tests (API mocking)

#### Tool 9: Invoice Generator (PDF)

- [ ] **307-build-invoice-generator** — UI + form + PDF rendering engine
- [ ] **308-wire-invoice-generator** — Form inputs, PDF generation, download
- [ ] **309-test-invoice-generator** — Unit + component + E2E tests (PDF output verification)

#### Tool 10: Meta Tag / SEO Analyzer

- [ ] **310-build-seo-analyzer** — UI + URL input + meta tag parsing
- [ ] **311-wire-seo-analyzer** — Fetch endpoint, parse meta tags, display analysis
- [ ] **312-test-seo-analyzer** — Unit + component + E2E tests (live URL fetching)

### TESTING & FINALIZATION

- [ ] **401-integration-testing** — Cross-tool integration (ensure no shared state, isolation)
- [ ] **402-accessibility-audit** — WCAG AA compliance for all 10 tools
- [ ] **403-performance-audit** — Bundle size, load time, memory, Core Web Vitals
- [ ] **404-regression-testing** — Add regression tests for all discovered edge cases
- [ ] **405-mobile-responsive-testing** — 320px–2560px responsive validation
- [ ] **406-final-quality-gates** — All tests passing, no warnings, deployment-ready

### SEO & DEPLOYMENT

- [ ] **501-seo-setup** — robots.txt, sitemap.xml, meta tags, canonical URLs
- [ ] **502-analytics-setup** — Google Analytics tracking, performance monitoring

---

## Per-Todo Details

(Individual todo files listed below follow this template structure)

### Todo Template

```
# [Todo Title]

**ID**: [001-NNN]  
**Effort**: [X hours]  
**Implements**: specs/micro-saas-tools.md § [relevant section]  
**Depends on**: [previous todo IDs]  
**Blocks**: [next todo IDs]

## Description

[What needs to be done, why, acceptance criteria]

## Implementation Notes

[Technical approach, edge cases, testing strategy]

## Files to Create/Modify

- `app/tools/[tool-name]/page.tsx`
- `app/tools/[tool-name]/styles.css`
- `tests/tools/[tool-name]/[tool-name].test.ts`

## Verification Checklist

- [ ] No imports from shared `lib/`, `components/`, `utils/`
- [ ] All CSS in tool's `styles.css` or inline (no globals.css)
- [ ] No database writes, no auth, no external services (except Wave 3 APIs)
- [ ] Responsive on 320px–2560px
- [ ] All tests passing
- [ ] SEO metadata exported
```

---

## Ownership & Parallelization

**Wave 1** (Session 1–2):
- 001 (setup) — serial (blocks all)
- 101–109 — parallel (3 tools × 3 tasks each, can run in any order)

**Wave 2** (Session 2–3):
- 201–209 — parallel (depends on 001 only)

**Wave 3** (Session 3–4):
- 301–312 — parallel (depends on 001 only)

**Testing & QA** (Session 4):
- 401–406 — parallel after all implementation todos

**Deployment** (Session 4–5):
- 501–502 — serial after 406

---

## Quality Gates

| Gate | Condition |
|------|-----------|
| After Wave 1 | All 3 tools load, interactive, localStorage works, tests pass |
| After Wave 2 | All 6 tools load, SEO metadata present, no shared state |
| After Wave 3 | All 10 tools fully functional, APIs integrated, no mock data |
| Before Deployment | All tests pass, accessibility audit clean, performance acceptable |

---

## Constraint Enforcement

Every todo MUST verify:

1. **No shared resources** — no imports from root `lib/`, `components/`, `utils/`
2. **CSS isolated** — tool's own `styles.css`, no global CSS injection
3. **Data local** — localStorage only, no server writes
4. **Self-contained** — could extract tool folder to separate domain without modification
5. **Tests comprehensive** — unit + component + E2E, 80%+ coverage

---

## Related Documentation

- Specification: `specs/micro-saas-tools.md`
- Analysis: `workspaces/micro-saas-tools/01-analysis/02-tool-deep-dives.md`
- Architecture: specs/micro-saas-tools.md § 1 (Complete Tool Isolation)
