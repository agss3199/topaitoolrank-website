# Implementation Phase Start — Scope Finalized

**Date**: 2026-04-30
**Scope**: 26 todos (7 existing pages, no scope expansion)
**Timeline**: Scenario A — 4 sessions total

## Final Scope Confirmation

✅ **Approved todos**: 26 (down from 30 after scope deferral)

Deferred to future sprint:
- ❌ Forgotten password pages (014, 015)
- ❌ Blog post detail page (032, 033)

## Todo Organization (26 remaining)

| Milestone | Todos | Count | Status |
|-----------|-------|-------|--------|
| M1: Components | 001-008 | 8 | Ready to start |
| M2: Auth Pages | 010-013 | 4 | Blocked on M1 |
| M3: Tool Pages | 020-024 | 5 | Blocked on M1 |
| M4: Content Pages | 030-031, 034-035 | 4 | Blocked on M1 |
| M5: QA | 040-044 | 5 | Blocked on M2/M3/M4 |

## Execution Plan

**Session 1: Milestone 1 (Component Library)**
- Build Button, Input, Form, Card, Modal, Badge, Avatar components
- All components implement specs/design-system.md
- All components support focus indicators, ARIA labels, responsive design
- Must complete before M2/M3/M4 can start

**Sessions 2-3: Milestones 2, 3, 4 (Pages in parallel)**
- After M1 complete, M2/M3/M4 run in parallel
- M2: Auth pages (login, signup)
- M3: WA Sender modernization (forms, modals, badges)
- M4: Content pages (blog listing, privacy, terms)
- Each page has BUILD todo (visual/structure) then WIRE todo (data/API)

**Session 4: Milestone 5 (QA)**
- Run sequentially: accessibility → responsive → performance → visual → cross-browser
- Each step can surface issues affecting others
- Must pass all checks before production

## Next Step

Launch `/implement` to begin Milestone 1.

