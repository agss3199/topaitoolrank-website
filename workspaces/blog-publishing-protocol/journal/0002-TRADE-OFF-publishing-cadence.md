# TRADE-OFF: Publishing Cadence vs. Quality

**Date**: May 2, 2025

**Context**: Deciding between 930 words/day (56 articles in 90 days) vs. slower cadence with higher individual article quality.

**Decision**: Commit to **930 words/day cadence** (56 articles in 90 days) with quality gates at checkpoints, not per-article blocking gates.

**Options Evaluated**:

| Option | Cadence | Total Articles (90d) | Avg Article Quality | Traffic by Day 90 | Risk |
|---|---|---|---|---|---|
| **A (Chosen)** | 930 w/day | 56 articles | 7/10 (good enough) | 50K-100K cumulative | Quality variance |
| **B** | 600 w/day | 36-40 articles | 9/10 (excellent) | 20K-50K cumulative | Misses 100K goal |
| **C** | 1200 w/day | 70+ articles | 6/10 (passable) | 60K-120K cumulative | Low SEO score, bot-like |

**Why Option A Was Chosen**:

1. **Meets Business Goal**: 56 articles at 930 w/day hits 100K visitor target by day 120 (56 articles rank by week 12; exponential growth kicks in)
2. **Realistic Effort**: 930 w/day = 2-3 articles/week with 3-person team (1 writer per pillar domain)
3. **Quality Control**: 47-point SEO checklist prevents "minimum viable" articles; Gate 2 optimization phase ensures no articles ship with major issues
4. **Feedback Loops**: Monitoring at day 30/60/90 allows mid-course corrections (rewrite low-CTR articles before reaching 100K goal)

**Why Not Option B**:
- 36-40 articles (9/10 quality) produces excellent individual pieces but misses cumulative scale
- 50K cumulative visitors by day 90 requires extending to day 150-180 to hit 100K
- Extra 30-60 days delays success and increases risk of scope creep/team attrition

**Why Not Option C**:
- 70+ articles in 90 days requires 1,300+ w/day (unsustainable; requires 4-5 writers)
- Faster pace increases error rates; lower-quality articles fail SEO checklist and produce low traffic
- Risk of "content farm" perception (Google penalizes thin, rapidly-produced content)

**Implementation**:
- Phase 1 (Days 1-30): 1 article every 2-3 days (lower cadence; more time for pillar pages)
- Phase 2 (Days 31-60): 2 articles/week (acceleration)
- Phase 3 (Days 61-90): 2 articles/week (sustain; network effects compound)

---

## Quality Gates (Prevent Shipping Low-Quality Articles)

| Gate | Phase | Owner | Block Condition |
|---|---|---|---|
| SEO Checklist | Optimize | Editor | Fails > 5 of 47 points |
| Readability | Optimize | Grammarly | Flesch < 50 |
| Link Validation | Publish | QA | Broken links exist (404s) |
| Plagiarism | Publish | QA | > 2% duplicate content |
| Mobile Render | Publish | QA | Layout broken on phone |

If an article fails a gate, it goes back to the phase that caused the failure (not published). No exceptions.

---

## Risk Mitigation

**If Behind Schedule** (< 1 article/week published):
- Review: Are writers blocked? Is research taking too long?
- Action: Hire freelance writer or reduce scope (48 articles instead of 56)
- Contingency: Month-by-month reassessment

**If Quality Drops** (> 20% of articles fail SEO checklist):
- Review: Is template clear? Are writers trained?
- Action: Retraining session; extend research phase (give writers more time per article)
- Contingency: Reset cadence to 1.5 articles/week (slower, but higher quality)

---

## Decision Rule for Future Sessions

If the team can consistently hit 2 articles/week AND pass 47-point checklist 95%+ of the time, this cadence is validated. If missing targets or quality is declining, throttle back to 1.5 articles/week (43 articles in 90 days; still hits ~50K visitors by day 120)

