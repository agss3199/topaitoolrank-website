# Todo 18: Update GA4-Blocking Tests → ✅ COMPLETED

**Status**: Completed  
**Implements**: specs/tool-pages-google-analytics.md § Test Coordination  
**Dependencies**: None (must be done first)  
**Blocks**: 19-implement-ga4-script-in-layout (unblocked)

## Description

Update three test files that currently assert GA code must NOT exist in `app/layout.tsx`. These tests block GA4 implementation. Update assertions to expect GA code.

**CRITICAL PATH**: These tests MUST be fixed before GA4 code can be added to layout.tsx. This is the gate.

## Acceptance Criteria

- [x] `tests/unit/performance.test.ts` updated (lines 87-93)
- [x] `tests/unit/deployment-readiness.test.ts` updated (lines 66, 151)
- [x] `tests/integration/homepage.test.ts` updated (line 264)
- [x] All three tests pass with GA code present in layout
- [x] No regression in other test assertions

## Implementation Notes

### Test File 1: `tests/unit/performance.test.ts` (lines 87-93)

**Current assertion** (BLOCKS GA):
```typescript
expect(layoutContent).not.toContain('gtag');
```

**Change to**:
```typescript
expect(layoutContent).toContain('GoogleAnalytics');
expect(layoutContent).toContain('G-D98KCREKZC');
```

**Rationale**: The test was ensuring no GA code was loaded. Now it should verify GA code IS loaded with correct property ID.

### Test File 2: `tests/unit/deployment-readiness.test.ts` (lines 66, 151)

**Current assertions** (BLOCKS GA):
```typescript
// Line 66:
expect(layoutContent).not.toContain('gtag');

// Line 151:
expect(layoutContent).not.toContain('gtag');
```

**Change to**:
```typescript
// Line 66:
expect(layoutContent).toContain('GoogleAnalytics');

// Line 151:
expect(layoutContent).toContain('G-D98KCREKZC');
```

**Rationale**: Same as above. Should verify GA is present, not absent.

### Test File 3: `tests/integration/homepage.test.ts` (line 264)

**Current assertion** (BLOCKS GA):
```typescript
// Related GA assertion (find and update)
expect(layoutContent).not.toContain('gtag');
// or similar
```

**Change to**:
```typescript
expect(layoutContent).toContain('GoogleAnalytics');
```

**Rationale**: Consistent with other test updates.

## Approach

**Option A** (Recommended): Remove the "NOT" assertion and add positive assertion
```typescript
// BEFORE
expect(layoutContent).not.toContain('gtag');

// AFTER
expect(layoutContent).toContain('GoogleAnalytics');
expect(layoutContent).toContain('G-D98KCREKZC');
```

**Option B**: Environment-based skip
If GA is meant to be optional in some environments:
```typescript
if (process.env.GA_ENABLED !== 'false') {
  expect(layoutContent).toContain('GoogleAnalytics');
}
```

Option A is recommended. GA should always be present.

## Testing

After updating tests:
```bash
npm run test -- tests/unit/performance.test.ts
npm run test -- tests/unit/deployment-readiness.test.ts
npm run test -- tests/integration/homepage.test.ts
```

All three should pass with the updated assertions (without GA code yet).

**Verify tests fail correctly**:
Run tests now, they should FAIL with assertion "expected NOT to contain 'gtag'" because there's no GA code yet. This is expected.

After todo 19 (GA4 implementation), these tests should PASS.

## Related Specs

- GA4 spec: specs/tool-pages-google-analytics.md § Test Coordination
- Test update rules: specs/tool-pages-google-analytics.md

## Time Estimate

~30 minutes (update 3 test files, verify tests)
