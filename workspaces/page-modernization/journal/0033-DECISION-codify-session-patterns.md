---
id: "0033"
type: DECISION
slug: codify-session-persistence-and-styling-patterns
date: 2026-05-06T16:00:00Z
---

# Decision: Codify Session Persistence & Styling Patterns as Project Skills

## What Was Decided

Extracted institutional knowledge from Red Team Round 2-3 validation into reusable project artifacts:
1. **Session Persistence Skill** — debounce + localStorage fallback patterns
2. **Session Persistence Specialist Agent** — diagnostic and fix procedures
3. **Debounce Safety Rule** — mandatory checks for session load and auth
4. **Project Skills Directory** — `.claude/skills/project/wa-sender-deployment.md`

## Why This Decision

### Root Analysis

Across three red team rounds, discovered **three distinct race conditions** causing data loss:
1. **Session persistence**: debounce in flight when user refreshes
2. **Auth redirect**: useAuth loading from localStorage slower than auth check runs
3. **Debounce recreation**: useCallback with deps causes pending calls to cancel

Each required specific fixes applied together in commit `894b5a8` and `6b4cc05`.

### Pattern Recognition

These race conditions are:
- **Systemic** — occur in any Next.js app using localStorage + debounced backend save
- **Non-obvious** — the bugs are timing-dependent, hard to debug without understanding the pattern
- **High-impact** — users lose data silently, eroding trust

Codifying reduces the chance the next developer independently discovers the same bugs.

### Knowledge Preservation

Without codification, this knowledge lives in:
- Commit messages (not indexed by type)
- Journal entries (narrative, not procedural)
- Code comments (scattered, not consolidated)

Making it reusable requires explicit artifacts that agents can find and apply.

## How Knowledge Was Codified

### 1. Skill: Session Persistence & Debounce Patterns
**File**: `.claude/skills/project/wa-sender-deployment.md`

Organized into sections:
- **Session Persistence Race Conditions** — the pattern, solution, why it works, when to apply
- **CSS Variable Enforcement** — discovery workflow + grep commands
- **Icon Mapping** — manifest string → display value conversion
- **Sheet Visibility & Delete Control** — UI state patterns
- **Red Team Validation Checklist** — what to verify in Next.js/Vercel apps

**Format**: Concrete code examples + grep commands, not abstract principles.

### 2. Agent: Session Persistence Specialist
**File**: `.claude/agents/project/session-persistence-specialist.md`

Structured as diagnostic tool:
- **Diagnostic Checklist** — grep patterns to find broken code
- **Fix Template** — exact code replacement patterns
- **Verification** — post-fix testing steps
- **When to Escalate** — deeper issues (RLS, quota, parse failures)

**Format**: Actionable steps a next agent can execute, not narrative.

### 3. Rule: Session Debounce Safety
**File**: `.claude/rules/project/session-debounce-safety.md`

Enforces specific patterns:
- Three-tier fallback on load
- Auth guard before useAuth finishes
- useMemo with empty deps for debounce
- Justify all delay values

**Format**: MUST/MUST NOT rules with code examples + verification checklist.

## What This Prevents in Future Sessions

### Without Codification:
```
Scenario: New developer encounters data-loss bug
1. Spends 2-3 hours debugging timing race conditions
2. Eventually figures out the pattern
3. Applies fix locally
4. Next session, pattern is forgotten
5. Different developer hits same bug again
```

### With Codification:
```
Scenario: New developer encounters data-loss bug
1. Red team finds it (same as before)
2. Searches for "session" + "localStorage" in agents/skills
3. Finds Session Persistence Specialist agent
4. Runs diagnostic checklist, applies fix template
5. Pattern is now known project-wide
```

## Tradeoffs

### Pro:
- Prevents re-discovery of same bugs
- Provides diagnostic tools for faster triaging
- Consolidates scattered knowledge into single sources
- Makes patterns searchable and reusable

### Con:
- Adds 3 new files to `.claude/` (small maintenance cost)
- Rules are project-specific, not general enough for upstream
- Skills require periodic review if patterns evolve

## Related Decisions

- **0030**: Session persistence bug (what was fixed)
- **0031**: Sidebar styling (CSS variable discovery pattern)
- **0032**: Sheet visibility (UI state management pattern)

---

## Next Session Usage

When facing similar issues:

1. **Check for artifacts first**:
   ```bash
   grep -l "session\|debounce\|localStorage" .claude/agents/project/*.md
   grep -l "session\|debounce\|localStorage" .claude/skills/project/*.md
   grep -l "session\|debounce\|localStorage" .claude/rules/project/*.md
   ```

2. **Invoke specialist agent if data-loss suspected**:
   - Run diagnostic checklist
   - Apply fix template
   - Verify with post-fix tests

3. **Enforce rule for all session-related changes**:
   - All three fallback tiers must exist
   - Debounce created in useMemo with empty deps
   - All delay values justified with comments

---

**Codified**: 2026-05-06 16:00 UTC  
**Artifacts**: skill, agent, rule (project-scoped)  
**Status**: ✅ COMPLETE
