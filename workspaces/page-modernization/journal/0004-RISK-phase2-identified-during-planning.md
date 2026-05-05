---
name: Phase 2 Risks Identified During Planning
description: Technical, scope, and dependency risks identified; mitigation strategies
type: RISK
---

# Phase 2 Risks Identified During Planning

**Session**: 2026-05-05 (Spec validation + todo planning)

## Risk 1: WA Sender State Refactor Breaks Session Persistence

**Risk Level**: MEDIUM (high impact, moderate probability)

**Description**: Extracting 938-line monolithic page into sub-routes + React Context requires moving state across route boundaries. If backwards compatibility logic fails, existing user sessions won't load.

**Trigger**: Context provider init code doesn't match exact localStorage key format; useEffect race condition on session load.

**Impact**: Deployed Phase 2 → all Phase 1 sessions orphaned → users lose work

**Mitigation**:
- Test 1 (unit): localStorage key format matches Phase 1 exactly (todo 13)
- Test 2 (integration): mock existing session, deploy, verify load on first visit (todo 13)
- Test 3 (E2E): manually test with real browser session before push (todo 13)
- Fallback: localStorage key is unchanged; worst case = new key, old sessions orphaned but not data-lost (user re-uploads)

**Responsibility**: Todo 13 (`wa-sender-session-persistence.md`) owns this risk. Cannot pass until E2E test succeeds.

---

## Risk 2: Supabase RLS Policies Misconfigured (Data Breach)

**Risk Level**: HIGH (critical impact, low-medium probability if not audited)

**Description**: All new Phase 2 tables (templates, contacts, messages, imports) require RLS policies. If policies are incomplete (missing INSERT, wrong USING clause), users can read/modify each other's data.

**Trigger**: Forgot ALTER TABLE ENABLE ROW LEVEL SECURITY; used wrong user_id column; wrote OR instead of AND in USING clause.

**Impact**: User A sends templates intended only for themself; User B can see, edit, or delete User A's templates → privacy violation, potential GDPR incident.

**Mitigation**:
- Automated check (todo 21): adversarial test suite proving cross-user blocking on all operations (SELECT, INSERT, UPDATE, DELETE)
- Code review gate: every RLS policy manually audited before merge
- Spec authority: database-schema.md contains the authoritative DDL; follow it exactly
- DDL verification: migration test runs on clean DB, verifies `\dp` output shows all policies active

**Responsibility**: Todo 20 (migration) owns DDL correctness; todo 21 owns verification. Cannot move to production until todo 21 passes.

**Red Team Note**: Red team validation already confirmed all RLS policies are present and correct in database-schema.md. This risk is LOW post-fix.

---

## Risk 3: `getAllPosts()` Async Change Breaks Blog Build

**Risk Level**: MEDIUM (high impact, low probability if tested)

**Description**: Blog specs assume `async function getAllPosts()` but Phase 1 code is synchronous. Making it async requires updating all call sites (tag/category generation, sitemap, search index). If a call site is missed, build fails.

**Trigger**: Forgot to await in `generateStaticParams`; missed a call site in a utility function; incompatibility with Next.js ISR.

**Impact**: Build fails at deploy time; blog doesn't update; manual rollback required.

**Mitigation**:
- Grep after change: `grep -rn "getAllPosts()" app/lib` finds all call sites; audit each one is awaited
- Grep after change: `grep -rn "getAllPosts" .next` verifies build succeeded (confirms generated routes exist)
- Test: existing blog tests still pass (existing tag/category queries verify interface)
- Type safety: TypeScript enforces `async` in function signature; call sites without `await` are caught as TS errors

**Responsibility**: Todo 01 (tag pages) first uses refactored `getAllPosts()`. If this todo passes all tests, the risk is controlled.

---

## Risk 4: Phone Normalization Silently Fails for Odd Formats

**Risk Level**: MEDIUM (medium impact, low probability with good tests)

**Description**: `libphonenumber-js` has edge cases: extensions (+1-555-123-4567 x100), alternate formats (0207946 0958 with spaces), regional variations. If normalization silently falls back or returns partial data, contacts are sent to wrong numbers.

**Trigger**: Contact with extension gets normalized to base number; message sent to different person; user doesn't notice.

**Impact**: Messages sent to unintended recipient → incorrect outreach, potential embarrassment or legal issue.

**Mitigation**:
- Validation gate (todo 43): normalize → format back to canonical → compare round-trip. If round-trip fails, reject with error, don't silently accept.
- Test suite (todo 43): ~20 edge case examples (extensions, alt formats, regional variants). Verify normalization + round-trip validation.
- User control: import preview shows original + normalized numbers side-by-side. User can catch discrepancies before sending.
- Fallback: if normalization fails, import error + require user action (re-enter phone in standard format)

**Responsibility**: Todo 40 (contacts API) owns validation; todo 43 owns the normalization + test harness.

---

## Risk 5: Blog Categories Don't Match Existing Content

**Risk Level**: MEDIUM (medium impact, low probability post-red-team-fix)

**Description**: Spec originally defined 7 new categories; existing content uses "AI Tools" and "Development". If build-time validation rejects existing categories, blog build breaks.

**Trigger**: Spec said "category must be in [Tutorial, Tool Review, ...]"; existing posts have category: "AI Tools"; build fails.

**Impact**: Deploy blocked; must fix all 3 existing posts' frontmatter before publishing changes.

**Mitigation**: Red team found this and specs were updated to include existing categories. New `CATEGORIES` list is a superset (existing + new). All 3 posts pass validation.

**Status**: RESOLVED (not a risk post-red-team-fix).

---

## Risk 6: Search Index Generation at Build Time Slows Deployment

**Risk Level**: LOW (low impact, low probability)

**Description**: Generating `public/search-index.json` requires enumerating all posts at build time. If blog grows to 1000+ posts, build time could balloon.

**Trigger**: Blog reaches 500+ posts; build goes from 15s to 60s; CI timeout kicks in (90s limit).

**Impact**: Deploy delayed or blocked; rollback required.

**Mitigation**:
- Monitoring (post-Phase 2): track build time in CI logs. Alert if >60s.
- Fallback (Phase 3 if needed): implement incremental search index (only rebuild if posts changed).
- Current scale (3 posts): build time is negligible (~100ms for search index alone).

**Probability**: Very low (need 500+ posts before risk materializes). Deferred to Phase 3 if/when needed.

---

## Risk 7: WA Sender Manifest Declaration Is Stale

**Risk Level**: MEDIUM (medium impact, low probability)

**Description**: Manifest declares `wa_sender_conversations` table as a database table, but specs use `wa_sender_messages`. If implementer follows manifest, they'll create the wrong table. If they follow specs, manifest becomes outdated.

**Trigger**: Inconsistent source of truth (manifest vs specs); implementer chooses wrong source.

**Impact**: Table mismatch in code vs manifest; confusing for future maintenance.

**Mitigation**:
- Red team found this. Spec authority is established: specs are truth. Manifest is a registry, not authoritative for schema.
- Post-Phase 2: update manifest to reference correct table names (`wa_sender_messages`, remove `wa_sender_conversations`).
- Note in code: manifest is kept in sync with specs after each phase; any discrepancy is noted in TODO.

**Responsibility**: Implementation follows specs, not manifest. Manifest update is post-deployment cleanup.

---

## Risk 8: RLS Policies Block Legitimate Admin/Monitoring Operations

**Risk Level**: LOW (low impact, medium probability in future ops)

**Description**: Row-level security filters all queries by `auth.uid() = user_id`. But what about admin operations (bulk export, data cleanup, monitoring queries)?

**Trigger**: Admin needs to see all templates across all users (for quality check); RLS blocks the query.

**Impact**: Admin operations fail; manual workaround required (direct DB access, security risk).

**Mitigation**:
- Not a Phase 2 concern (no admin user role exists yet)
- Phase 3 feature: add `admin_override` RLS policy or use service role for admin queries
- Current: all users are regular users, RLS is correct

**Deferred**: To Phase 3 when admin features are added.

---

## Risk 9: Fuse.js Search Threshold (0.3) Too Permissive or Strict

**Risk Level**: LOW (low impact, easily tunable)

**Description**: Blog search fuzzy matching threshold set to 0.3. If too low, results are noisy (typos matched too broadly). If too high, results are too strict (minor misspellings missed).

**Trigger**: User searches "ai agents"; gets results for "agents", "AI", "machines" (too broad). Or user searches "langchain" with typo "langchan"; no results (too strict).

**Impact**: Search UX confusion; users think blog has no content on topic.

**Mitigation**:
- Not blocking (tunable post-Phase 2)
- Threshold 0.3 is standard in Fuse.js docs (good default)
- Phase 2+ observation: track search queries in localStorage; if no-result queries are high, lower threshold
- Phase 3+: A/B test threshold with user feedback

**Current**: 0.3 is reasonable. Revisit if feedback suggests adjustment.

---

## Risk 10: Blog "getAllPosts()" Performance at Scale

**Risk Level**: LOW (low impact, deferred scaling issue)

**Description**: `getAllPosts()` does a full directory scan + parse every time (even build-time). At 500+ posts, parsing all MDX files could become slow.

**Trigger**: Blog reaches 500 posts; build time exceeds 2 minutes; CI times out.

**Impact**: Deploy blocked until resolved.

**Mitigation**:
- Not a Phase 2 concern (3 posts currently)
- Phase 3 optimization: memoize `getAllPosts()` or add incremental build mode
- Current: build time is negligible

**Deferred**: To Phase 3 when/if blog scales.

---

## Summary

| Risk | Level | Blocking? | Owner | Status |
|------|-------|-----------|-------|--------|
| Session persistence breaks | MEDIUM | YES | Todo 13 | Mitigated by test |
| RLS misconfigured | HIGH | YES | Todo 20-21 | Spec authority verified |
| getAllPosts() async fails | MEDIUM | YES | Todo 01 | Typescript catches errors |
| Phone normalization edge cases | MEDIUM | NO | Todo 43 | Test suite required |
| Category list mismatch | MEDIUM | NO | Red team | RESOLVED |
| Search index slows build | LOW | NO | Post-Phase 2 | Monitoring |
| Manifest stale | MEDIUM | NO | Post-deploy | Update manifest |
| Admin operations blocked | LOW | NO | Phase 3 | Service role planned |
| Search threshold tuning | LOW | NO | Phase 2+ | Observable, tunable |
| Blog performance at scale | LOW | NO | Phase 3 | Incremental build |

---

## Notes for Implementation

1. **Blocking risks** (Levels HIGH/MEDIUM that block deployment):
   - Todo 13 MUST have passing E2E test before merge
   - Todo 21 MUST have passing RLS adversarial tests before merge
   - Todo 01 MUST compile without TS errors

2. **Monitoring risks** (Low priority, but watch during Phase 2+):
   - Build time per deploy (alert if >90s)
   - Search no-result queries (observability)
   - Admin feature requests (triggers Phase 3 work)

3. **All risks documented and mitigated**. No surprises expected during implementation.
