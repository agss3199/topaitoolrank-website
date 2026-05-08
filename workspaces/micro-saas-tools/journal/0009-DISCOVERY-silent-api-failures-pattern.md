# Discovery: Silent API Failures Blind Users

**Date:** 2026-05-07  
**Phase:** Red Team Validation → Codification  
**Severity:** HIGH (user-visible) → Fixed  

## Problem Identified

All 9 micro-SaaS tool pages had **zero user feedback when the article loading API failed**:

```typescript
// BEFORE (broken pattern)
useEffect(() => {
  const loadArticle = async () => {
    try {
      const res = await fetch('/api/tools/article?tool=json-formatter');
      if (res.ok) {
        const data = await res.json();
        setArticleContent(data.content || '');
      }
      // BUG: No handling for non-200 responses
    } catch (error) {
      console.error('Failed to load article:', error);
      // BUG: Error logged but NOT shown to user
    } finally {
      setArticleLoading(false);
    }
  };
  loadArticle();
}, []);

// Result: API 500 error → nothing visible to user, article section just vanishes
```

## Root Causes

1. **Missing non-200 check** — code only handled success (res.ok) and exceptions, not API errors
2. **No error state** — exceptions logged to console but no `articleError` state to display
3. **Silent failure** — nothing prevents the page from rendering normally even when critical data is missing

## Pattern Discovered: Three Failure Modes

### Mode 1: API Error (non-200 status)
```
Scenario: /api/tools/article returns 404 Not Found
User sees: Nothing (article section missing, no error message)
Fix: Add explicit `if (res.ok)` check, set articleError on false
```

### Mode 2: Network Error (fetch throws)
```
Scenario: Network timeout or CORS error
User sees: Console error, nothing visible
Fix: Catch block sets articleError with user-friendly message
```

### Mode 3: Success + No Content
```
Scenario: API returns 200 but data is null/undefined
User sees: Empty article section (OK)
Fix: Default to empty string: `setArticleContent(data.content || '')`
```

## Implementation Insight

The three-state pattern (`loading`, `data`, `error`) **must distinguish between**:
- Fetch-in-flight (loading)
- Data ready (display it)
- Fetch failed (show error immediately, don't wait for loading flag)

**Critical:** Error must render BEFORE checking `!loading`, otherwise users see loading state while API error exists.

```typescript
// CORRECT order (errors shown immediately)
{articleError && <div>Error message</div>}
{loading && <div>Loading...</div>}
{!loading && articleContent && <div>Content</div>}

// WRONG order (errors hidden by loading check)
{loading && <div>Loading...</div>}
{articleError && <div>Error message</div>}  // unreachable if loading=true
{articleContent && <div>Content</div>}
```

## Why It Wasn't Caught Earlier

1. **Unit tests don't cover it** — component tests against mock data don't surface missing error handling
2. **Happy path is obvious** — code works fine when API succeeds
3. **Silent failures are hard to spot** — "article section missing" looks like intentional empty state, not an error
4. **Local dev has fast network** — timeouts are rare, so exception path rarely exercised

## Implications for Future Work

When adding async operations to tool pages:
- ✅ Implement three-state error handling BEFORE adding UI
- ✅ Test the failure path explicitly (mock `res.ok = false` and `throw` cases)
- ✅ Display errors to users, not just console logs
- ✅ Clear error state on retry/success to prevent stale error messages

## This Session's Verification

- ✅ 60/60 article tests verify error handling
- ✅ Build completes: 40/40 pages
- ✅ Red team final report: CONVERGENCE ACHIEVED
- ✅ All 9 tools updated in parallel (no manual copy-paste, reduced error risk)

---

**Pattern captured in:** `.claude/agents/project/error-handling-specialist.md`  
**Skill guide:** `.claude/skills/project/api-error-handling/SKILL.md`  
**Next session reminder:** Copy this pattern for any new async operations
