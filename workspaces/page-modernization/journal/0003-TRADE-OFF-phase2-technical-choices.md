---
name: Phase 2 Technical Trade-Offs
description: Competing approaches evaluated; chosen approaches and rationales
type: TRADE-OFF
---

# Phase 2 Technical Trade-Offs

**Session**: 2026-05-05 (Planning phase)

## Trade-Off 1: WA Sender State Management

**Options**:
1. **React Context + Provider** (chosen)
   - Pros: Simple, no external deps, works with Next.js App Router
   - Cons: Re-renders on every state change, potential performance issue at scale
   - Scope: ~200 LOC in `context.ts`

2. **Zustand** (lightweight state library)
   - Pros: Optimized for performance, devtools support, small bundle
   - Cons: Added dependency, requires learning curve
   - Scope: ~100 LOC but need to vet library compatibility

3. **Jotai** (primitive atoms)
   - Pros: Granular updates, excellent perf
   - Cons: More verbose, steeper learning curve
   - Scope: ~150 LOC with atomic setup

**Chosen**: React Context. Rationale: WA Sender state is small (file, columns, template selection, UI flags). Context re-renders are negligible. Zero extra dependencies. Aligns with existing Phase 1 patterns (useAuth is context-based).

**Fallback**: If performance becomes issue post-implementation, Zustand migration is straightforward (mechanical).

---

## Trade-Off 2: Phone Normalization Precision vs Simplicity

**Options**:
1. **`libphonenumber-js` library** (chosen)
   - Pros: Handles 200+ countries, validates format, detects country from prefix
   - Cons: 40KB gzipped, one external dependency, slight overhead
   - Accuracy: 99%+ (real-world tested)

2. **Regex + hardcoded country logic**
   - Pros: Zero dependencies, fast
   - Cons: Supports only 5-10 countries, breaks on edge cases (extensions, alternative formats)
   - Accuracy: ~70%

3. **Fallback to user-provided country code**
   - Pros: User control, zero automation
   - Cons: UX friction (every import requires manual country selection), easy to get wrong
   - Accuracy: 100% if user is attentive, ~50% if user is lazy

**Chosen**: `libphonenumber-js`. Rationale: Contacts import is a core feature. Wrong normalization = wrong send targets = send failure. The 40KB cost is acceptable for correctness. Fallback is user's country-code preference, so even if library fails, import doesn't break (uses fallback).

---

## Trade-Off 3: Blog Search: Build-Time vs Runtime

**Options**:
1. **Build-time JSON + client-side Fuse.js** (chosen)
   - Pros: Zero server cost, instant search, works offline, scales to 10K posts
   - Cons: Requires rebuild to pick up new posts (~30s), limited to full-text only
   - Latency: 0ms (client-side)

2. **Server-side API with database full-text search**
   - Pros: Updates instantly when post published, real-time search
   - Cons: Requires database (no cost but adds complexity), API calls on every keystroke
   - Latency: 100-200ms per keystroke

3. **Hybrid: Build-time index + server fallback for recent posts**
   - Pros: Instant search + recent posts visible immediately
   - Cons: Most complex, two implementations to maintain, harder to test
   - Latency: 0ms for cached, 100ms for recent

**Chosen**: Build-time + client-side. Rationale: Blog velocity is 2-4 posts/month. 30s rebuild for a new post is acceptable. Zero server cost. Fast search UX. At 200+ posts the decision might change, but current scale fits perfectly.

---

## Trade-Off 4: Message Status Tracking Strategy

**Options**:
1. **Best-effort (chosen): User confirms send via UI link click**
   - Status meanings: "sent" = link generated, "failed" = error on link generation
   - Accuracy: Tells us when user initiated but not when recipient received
   - Complexity: 0 (user does action, we log outcome)

2. **WhatsApp Business API with webhooks**
   - Status meanings: "sent" = delivered, "read" = recipient opened
   - Accuracy: 99%+ (official delivery receipts)
   - Complexity: Requires Meta approval (2-3 weeks), API integration, webhook server
   - Cost: $0-1000/month depending on volume

3. **Polling WhatsApp Web API** (fragile)
   - Status meanings: "sent" = detected in chat history
   - Accuracy: 60-70% (browser automation is brittle)
   - Complexity: High (Puppeteer/Playwright scraping, fragile to UI changes)
   - Risk: High (breaks when WhatsApp Web updates)

**Chosen**: Best-effort. Rationale: Phase 2 goal is to help users send bulk messages, not to track delivery globally. WhatsApp Business API (2-3 weeks setup) deferred to Phase 3 when volume justifies it. Best-effort status is honest (user sees "sent" meaning what it means) and fast to ship.

---

## Trade-Off 5: Contacts Deduplication Strategy

**Options**:
1. **Phone number (primary) + Email + Name similarity** (chosen)
   - Pros: Catches 95%+ of duplicates, handles global phone formats
   - Cons: Requires three-step check, needs Levenshtein library for name matching
   - False positive rate: ~5% (legitimate different people with similar names)

2. **Phone number only**
   - Pros: Fast, accurate, no additional deps
   - Cons: Misses email-only duplicates, harder to detect from spreadsheets
   - False positive rate: 0% (phone is unique)

3. **User-assisted deduplication**
   - Pros: Perfect accuracy (user makes final call)
   - Cons: Manual, slow, scales poorly (import 1000 contacts = manually review duplicates)
   - False positive rate: N/A (user decides)

**Chosen**: Approach 1 (phone + email + name). Rationale: Phone is primary (most contacts have phone). Email is secondary (global dedup for repeat imports). Name similarity (Levenshtein >80%) catches legitimate same-person entries from different sources. Default OFF, user can toggle. Worst case: false positive duplication → user sees duplicate in send list → can deselect. No data loss.

---

## Trade-Off 6: Blog Category Validation Timing

**Options**:
1. **Build-time validation + hard fail** (chosen)
   - Cons: Cannot deploy blog with invalid frontmatter (requires fix)
   - Pros: Catches errors early, enforces schema contract
   - CI/CD impact: Build fails, developer must fix before merge

2. **Runtime validation + warning log**
   - Cons: Invalid posts silently excluded (confusing if post vanishes)
   - Pros: Can deploy with issues, fix later
   - CI/CD impact: Zero (always passes)

3. **Admin panel with post validation UI**
   - Cons: Requires new admin infrastructure
   - Pros: Easy for non-developers to fix
   - CI/CD impact: Depends on implementation

**Chosen**: Build-time hard fail. Rationale: Blog is git-native. Schema violations should be caught in code review (PR), not in prod. Hard fail prevents broken deploys. Aligns with Phase 1 practices (MDX validation already strict).

---

## Trade-Off 7: RSS Feed Validation

**Options**:
1. **W3C RSS 2.0 Validator (offline check in tests)** (chosen)
   - Pros: Spec-compliant, catches malformed XML early
   - Cons: Adds test overhead (~100ms per test run)

2. **Runtime validation only** (manual W3C check)
   - Pros: Zero test overhead
   - Cons: Easy to regress (XML escape rules can break silently)

3. **No validation** (trust implementation)
   - Pros: Simplest
   - Cons: High risk (feed aggregators reject invalid RSS)

**Chosen**: Test-based validation. Rationale: RSS is machine-parsed by aggregators. Invalid RSS silently fails (feed doesn't appear). Better to catch in tests than in production. Test overhead is tiny.

---

## Summary

All trade-offs explicitly documented with rationales. No hidden assumptions. Implementation team can make deviations with evidence if circumstances change.

Key themes:
- **Correctness over simplicity** (phone normalization, blog validation)
- **Simple over complex** (context over Zustand, best-effort status over webhooks)
- **Ship now over premature scale** (build-time search, no database blog)
