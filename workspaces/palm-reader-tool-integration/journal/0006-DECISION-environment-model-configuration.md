---
name: Environment-based Model Configuration
description: Hardcoded model name updated to support per-environment selection
type: DECISION
date: 2026-05-13
---

# DECISION: Environment-based Model Configuration

## Issue

Red team audit flagged hardcoded model name `"gemini-2.0-flash"` in `route.ts:164` as violating `rules/env-models.md`, which mandates all LLM model names come from environment variables.

## Solution

Updated model selection to read from `GEMINI_MODEL` environment variable with safe fallback:

```typescript
// Before
model: "gemini-2.0-flash"

// After
const modelName = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
model: modelName
```

**File**: `app/api/tools/palm-reader/route.ts:164-165`

## Benefits

1. **Per-environment model selection** — Dev/staging can use cheaper model (gemini-1.5-flash), prod uses capable model (gemini-2.0-flash)
2. **Provider rotation** — Can switch to different model without code change
3. **Safety fallback** — If env var missing, defaults to gemini-2.0-flash
4. **Compliance** — Aligns with `rules/env-models.md` policy

## Trade-offs

- Minimal code change, no complexity added
- Requires `.env` configuration for non-default model selection
- Default behavior unchanged (existing behavior preserved)

## Implementation

- [x] Add environment variable read with fallback
- [x] Verify build succeeds
- [x] Verify tests pass (56/56)
- [x] Document in deployment guide for ops

## Related

- `rules/env-models.md` — Model name configuration policy
- `VALIDATION-REDTEAM.md` — Red team audit findings

---

**Status**: IMPLEMENTED  
**Validation**: Build succeeds, tests pass, backward compatible
