# 007 — Add API Route Tests and Integration Verification Tests

**Status**: completed  
**Owner**: testing-specialist  
**Phase**: implement  
**Effort**: 30 min (3 test files, straightforward coverage)  
**Depends on**: 001, 002, 003, 004 (all implementation code complete)  
**Blocks**: 008 (deployment)

---

## Overview

Create test suite covering API route functionality (Gemini integration, error handling, response validation) and integration tests verifying the full tool flow (camera → API call → results display). Tests follow the project's 3-tier testing strategy: unit tests with mocks, integration tests with real infrastructure.

**Scope**: ~300 LOC across 3 test files (unit API, unit components, integration flow).

---

## Specification References

- **R1-R6**: All functional requirements
- **rules/testing.md** — 3-tier testing strategy, real infrastructure in Tier 2
- **rules/zero-tolerance.md** — pre-existing failures must be resolved

---

## Acceptance Criteria

### Test File 1: API Route Tests (Tier 1 + Tier 2)
- [ ] Create `app/api/tools/palm-reader/__tests__/route.test.ts`
- [ ] Unit tests (Tier 1): Mock Gemini API, test response parsing
  - [ ] Test: POST with valid image returns 200 + PalmReadingResponse
  - [ ] Test: POST with invalid image returns 400
  - [ ] Test: POST with non-palm returns `is_palm: false`
  - [ ] Test: POST with missing image returns 400 + error message
  - [ ] Test: Gemini API error returns 500 + error message
  - [ ] Test: Rate limit error (429) handled gracefully
  - [ ] Test: Response structure matches spec §R2 exactly
- [ ] Integration test (Tier 2): Call real Gemini API with test image
  - [ ] Test: Real API call succeeds and returns valid response
  - [ ] Test: Non-palm image properly rejected
  - [ ] Test: Response time within acceptable range (2-5s)

### Test File 2: Component Tests (Tier 1)
- [ ] Create `app/tools/palm-reader/__tests__/components.test.tsx`
- [ ] CameraView component tests:
  - [ ] Test: Component renders without crashing
  - [ ] Test: Canvas element rendered
  - [ ] Test: MediaPipe initialization called on mount
  - [ ] Test: Quality meter displays percentage
  - [ ] Test: Status message updates based on quality/centering/stability
  - [ ] Test: onCapture callback triggered when ready
- [ ] ResultsView component tests:
  - [ ] Test: Results render with all palm line sections
  - [ ] Test: Absent lines hidden (`present: false`)
  - [ ] Test: Overall reading section displays correctly
  - [ ] Test: Tips section displays correctly
  - [ ] Test: Buttons clickable and call props callbacks
- [ ] QualityMeter component tests:
  - [ ] Test: Displays quality percentage correctly
  - [ ] Test: Updates on prop change

### Test File 3: Integration Tests (Tier 2)
- [ ] Create `app/tools/palm-reader/__tests__/integration.test.ts`
- [ ] End-to-end page flow:
  - [ ] Test: Page mounts, CameraView visible
  - [ ] Test: User can trigger capture (API call initiated)
  - [ ] Test: Loading state shows during API call
  - [ ] Test: API response displays in ResultsView
  - [ ] Test: "Read Another Palm" resets to camera view
  - [ ] Test: "Home" navigates correctly
- [ ] Error scenarios:
  - [ ] Test: API error displays user-friendly message
  - [ ] Test: Non-palm image shows appropriate message
  - [ ] Test: Network error handled gracefully

### Code Quality Requirements
- [ ] All tests use `describe` and `it` blocks (Jest/Vitest convention)
- [ ] Tests are deterministic (no random data, seeded randomness if needed)
- [ ] Mock setup/teardown proper (no state leakage between tests)
- [ ] No hardcoded delays (use proper async/await or jest.useFakeTimers)
- [ ] TypeScript strict mode: no `any` types in tests
- [ ] 100% pass rate: `npm test -- palm-reader`

### Test Data & Mocks
- [ ] Mock Gemini API responses in unit tests
- [ ] Use real test image for Tier 2 tests (sample palm or non-palm)
- [ ] Mock MediaPipe in component tests
- [ ] Mock `useRouter` for navigation tests
- [ ] Verify error handling with various API responses

### Coverage Metrics
- [ ] API route: 90%+ coverage (all error paths tested)
- [ ] Components: 80%+ coverage (render + callbacks)
- [ ] Critical paths: 100% (capture → API → display)
- [ ] Run coverage report: `npm test -- --coverage`

---

## Files to Create

```
app/api/tools/palm-reader/
├── __tests__/
│   └── route.test.ts (new, ~100 LOC)

app/tools/palm-reader/
├── __tests__/
│   ├── components.test.tsx (new, ~150 LOC)
│   └── integration.test.ts (new, ~50 LOC)
```

---

## Test Example: API Route (Unit Test with Mock)

```typescript
// app/api/tools/palm-reader/__tests__/route.test.ts
import { POST } from '../route';
import { NextRequest } from 'next/server';

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn(() => ({
    getGenerativeModel: jest.fn(() => ({
      generateContent: jest.fn(async () => ({
        response: {
          text: jest.fn(() => JSON.stringify({
            is_palm: true,
            confidence: 85,
            lines: { /* ... */ },
            overall_reading: "Good fortune ahead",
            tips: "Be open to opportunities"
          }))
        }
      }))
    }))
  }))
}));

describe('POST /api/tools/palm-reader', () => {
  it('returns 200 with valid palm image', async () => {
    const request = new NextRequest('http://localhost:3000/api/tools/palm-reader', {
      method: 'POST',
      body: JSON.stringify({ image: 'data:image/jpeg;base64,...' })
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.is_palm).toBe(true);
  });

  it('returns 400 for missing image', async () => {
    const request = new NextRequest('http://localhost:3000/api/tools/palm-reader', {
      method: 'POST',
      body: JSON.stringify({})
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
```

---

## Test Example: Component (Unit Test with Mock)

```typescript
// app/tools/palm-reader/__tests__/components.test.tsx
import { render, screen } from '@testing-library/react';
import CameraView from '../components/CameraView';

jest.mock('@mediapipe/hands', () => ({
  Hands: jest.fn()
}));

describe('CameraView', () => {
  it('renders canvas element', () => {
    render(<CameraView onCapture={jest.fn()} onHome={jest.fn()} />);
    const canvas = screen.getByRole('img', { hidden: true }); // canvas
    expect(canvas).toBeInTheDocument();
  });

  it('displays quality percentage', () => {
    render(<CameraView onCapture={jest.fn()} onHome={jest.fn()} />);
    expect(screen.getByText(/quality/i)).toBeInTheDocument();
  });
});
```

---

## Running Tests

```bash
# Run all tests
npm test

# Run palm-reader tests only
npm test -- palm-reader

# Run with coverage
npm test -- --coverage palm-reader

# Watch mode during development
npm test -- --watch palm-reader
```

---

## Verification Checklist

- [ ] All 3 test files created
- [ ] Tests run without errors: `npm test -- palm-reader`
- [ ] All tests pass (0 failures)
- [ ] Coverage report shows 80%+ coverage
- [ ] No console warnings/errors from tests
- [ ] Mocks properly set up and torn down
- [ ] API route tests include both success and error cases
- [ ] Component tests verify render + callbacks
- [ ] Integration tests verify end-to-end flow
- [ ] Unit tests isolated (no test dependencies)
- [ ] TypeScript errors resolved (strict mode)
- [ ] Test names are descriptive ("returns 200 with valid palm" not "works")

---

## Debugging Tests

If tests fail:
1. Check mock setup (Gemini API, MediaPipe)
2. Verify component props match interface
3. Check async/await handling (not missing await)
4. Inspect API response structure
5. Debug with `screen.debug()` to inspect DOM

---

## Related Todos

- **Depends on**: 001, 002, 003, 004 (all code complete)
- **Blocks**: 008 (deployment requires tests passing)
- **Parallelize with**: 006 (directory listing — tests can run independently)

---

## Session Context

- Test runner: Jest or Vitest (check `package.json`)
- Testing library: React Testing Library (check `package.json`)
- Mock patterns: Reference existing tool tests in `app/tools/__tests__/`
- Gemini API test data: Sample images in test fixtures (if available)

