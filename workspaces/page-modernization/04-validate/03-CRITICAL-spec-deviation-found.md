# CRITICAL: Spec Deviation Found — Requires Clarification

**Date**: 2026-05-08  
**Issue**: Implementation plan deviates from existing spec without acknowledgment  
**Severity**: BLOCKING — Convergence cannot be achieved without resolution  
**Status**: Awaiting decision

---

## The Issue

### Existing Spec Requirement

From `specs/tool-pages-header-footer.md` (lines 79–81):

```
### Implementation Details

- **Location**: Create `app/tools/lib/Header.tsx` as shared React component
- **Import path**: All tool pages import from `../lib/Header`
```

**What this means**: Header component should live in the tool library (`app/tools/lib/`), not at application root.

### Current Codebase State

Header currently exists at: `app/tools/lib/Header.tsx` (matches spec)

Tool pages import: `import Header from "../lib/Header"` (matches spec)

### My Analysis Plan Deviation

From `01-header-unification-implementation.md` (Step 1–2):

```
- Create `app/components/Header.tsx`
- Create `app/components/Header.module.css`
- Update tool pages to import from `@/app/components/Header`
```

**What this does**: Moves header to application root, NOT tool library.

---

## Why This Matters

### Architectural Impact

| Aspect | Spec Requirement | My Plan | Conflict? |
|--------|-----------------|---------|-----------|
| Header location | `app/tools/lib/` (tool library) | `app/components/` (app root) | ✗ YES |
| Import path | `../lib/Header` (relative) | `@/app/components/Header` (path alias) | ✗ YES |
| Reason | Headers are shared tool infrastructure | Headers are universal UI | ✗ CONTRADICTION |

### The Question

**Is the spec outdated?** Or **should headers stay in `app/tools/lib/`?**

Two valid design choices:

#### Option A: Keep Headers in `app/tools/lib/` (Spec Compliant)
- Extract homepage header → move to `app/tools/lib/Header.tsx` (replace current)
- Keep tool pages importing `../lib/Header`
- Homepage imports from relative path: `import Header from "./tools/lib/Header"`
- **Pro**: Follows existing spec, tool-specific library, clear ownership
- **Con**: Homepage couples to tool library, less intuitive import path

#### Option B: Move Headers to `app/components/` (My Plan)
- Extract homepage header → `app/components/Header.tsx`
- Update tool pages to import `@/app/components/Header`
- Delete old `app/tools/lib/Header.tsx`
- **Pro**: Cleaner separation, universal components, more intuitive path
- **Con**: Deviates from spec, requires spec update

---

## Spec Deviation Protocol

Per `rules/specs-authority.md` § "Spec Files Are Updated at First Instance":

> When domain truth changes during any phase, the relevant spec file MUST be updated immediately — not batched at phase end.

**My failure**: I didn't check the spec against my plan. I created a plan that deviates from the spec without documenting the deviation or updating the spec.

---

## Convergence Status

**Current**: ❌ BLOCKED

Cannot proceed to `/implement` because:
1. Implementation plan deviates from spec (lines 79–81 of `tool-pages-header-footer.md`)
2. Deviation not documented
3. Spec not updated
4. No explicit decision made about which approach is correct

---

## Required Action

Choose one:

### Path A: Update Spec to Match My Plan (Recommended)

If you approve moving headers to `app/components/`:
1. I update `specs/tool-pages-header-footer.md` to document the new location
2. I update my implementation plan to reference the spec change
3. Convergence resumes
4. We proceed to `/implement`

**Rationale for Option A**:
- `app/components/` is more intuitive for shared UI components
- Cleaner architecture (tool-specific code in `app/tools/`, shared UI in `app/components/`)
- Easier for future developers to find headers

### Path B: Rewrite Plan to Match Spec (Conservative)

If you prefer keeping headers in `app/tools/lib/`:
1. I rewrite my implementation plan to put headers in `app/tools/lib/`
2. I update the plan to show homepage importing from tool library
3. Convergence resumes
4. We proceed to `/implement`

**Rationale for Option B**:
- Aligns with existing spec
- No spec update needed
- Tool library is the designated place for shared tool infrastructure

---

## My Recommendation

**Option A** — update the spec to reflect `app/components/`.

**Why**:
- `app/components/` is the standard Next.js location for reusable UI components
- The homepage header is not tool-specific; it's site-wide UI
- Tool library (`app/tools/lib/`) should hold tool-specific utilities, not universal components
- Future developers will expect to find shared components in `app/components/`

But this is **your decision** — I can execute either path.

---

## What Happens Next

1. You choose Path A or Path B
2. I update the spec and/or plan accordingly
3. Red team validation resumes
4. Convergence achieved
5. `/implement` can proceed

**The block is intentional and correct** — I should have caught this during analysis. Red team caught it during validation (which is the point of red team).

