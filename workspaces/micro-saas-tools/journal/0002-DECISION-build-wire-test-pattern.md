# DECISION: BUILD-WIRE-TEST Separation Pattern for Each Tool

**Date**: 2026-05-06  
**Phase**: /todos  
**Status**: Approved and enforced in todo structure

## Decision

Each of the 10 tools will have **exactly 3 todos** following a strict separation:

1. **BUILD** (2–4 hours): Create UI, implement core logic, NO I/O operations
2. **WIRE** (1 hour): Connect localStorage, download/copy buttons, API calls
3. **TEST** (1 hour): Unit tests, component tests, E2E tests

This pattern repeats for every tool: 10 tools × 3 todos = 30 tool todos, plus 8 shared todos (setup, testing, deployment).

## Rationale

**Separation of concerns**: Splitting each tool into three distinct phases prevents mixing logic implementation with I/O plumbing:

1. **BUILD focuses on correctness**
   - Core algorithm/logic verified independently
   - UI structure implemented clearly
   - No side effects (localStorage, API, files)
   - Easier to test in isolation

2. **WIRE focuses on user experience**
   - All I/O operations (localStorage, downloads, API calls)
   - Copy-to-clipboard functionality
   - Persistence across page refreshes
   - Data export (JSON, CSV, PDF, etc.)
   - By separating from BUILD, changes to persistence don't affect core logic

3. **TEST focuses on comprehensive coverage**
   - Unit tests for logic (BUILD phase)
   - Component tests for UI (BUILD + WIRE)
   - E2E tests for full user flow (WIRE phase)
   - Integration testing (cross-tool isolation)

## Example: Word Counter Tool

### BUILD Todo (107): Logic + UI
```typescript
// Core: text analysis logic
function analyzeText(text: string): Stats {
  return {
    words: text.split(/\s+/).length,
    chars: text.length,
    sentences: text.split(/[.!?]/).length,
    // ...
  };
}

// UI: React component with input/output
export default function WordCounter() {
  const [text, setText] = useState("");
  const stats = analyzeText(text);
  return <div>{/* display stats */}</div>;
}
```

**Acceptance**: Logic works, UI renders, real-time updates work.
**Does NOT include**: localStorage, download button, persistence.

### WIRE Todo (108): I/O Operations
```typescript
// Add after BUILD is complete:
useEffect(() => {
  // Load from localStorage on mount
  const saved = localStorage.getItem("wc-text");
  if (saved) setText(saved);
}, []);

useEffect(() => {
  // Save to localStorage on change
  localStorage.setItem("wc-text", text);
}, [text]);

// Add download button wired to real function
<button onClick={() => downloadAsFile(text, "word-count.txt")}>
  Download
</button>
```

**Acceptance**: localStorage persists, download works, all I/O is real (no mocks).
**Does NOT change**: Core logic remains identical from BUILD phase.

### TEST Todo (109): Comprehensive Tests
```typescript
// Unit tests for BUILD phase logic
test("analyzeText counts words correctly", () => {
  const stats = analyzeText("hello world");
  expect(stats.words).toBe(2);
});

// Component tests for BUILD + WIRE integration
test("renders stats in real-time as user types", async () => {
  render(<WordCounter />);
  const input = screen.getByRole("textbox");
  await userEvent.type(input, "test text");
  expect(screen.getByText(/2 words/)).toBeInTheDocument();
});

// E2E tests for full user flow
test("user enters text, refreshes page, text persists", async () => {
  // ... full browser flow
});

// localStorage integration test
test("localStorage persists draft across refresh", async () => {
  // ... verify persistence
});
```

## Benefits of This Pattern

1. **Parallel work**: Once BUILD is done, another agent can WIRE while first agent tests
2. **Risk isolation**: If WIRE breaks, don't re-run BUILD tests — the issue is clearly in I/O
3. **Clear acceptance**: BUILD is done when logic works; WIRE is done when I/O works; TEST is done when suite passes
4. **Easy rollback**: If WIRE approach fails, revert and try different I/O strategy without touching BUILD
5. **Code review**: Each phase is a distinct PR (if desired) with clear scope

## Implementation Timeline

**Example: Single Tool (4 hours total)**

| Phase | Hours | What's Done |
|-------|-------|------------|
| BUILD | 2–3h | Logic + UI complete, no persistence |
| WIRE | 1h | localStorage + downloads wired |
| TEST | 1h | All tests written and passing |

**Example: Wave 1 (3 tools parallel, 7–9 hours total)**

```
Session time (hours)  0   1   2   3   4   5   6   7   8   9
─────────────────────┼───┼───┼───┼───┼───┼───┼───┼───┼───┤
Tool 1 BUILD          [────────────────]
Tool 2 BUILD                      [────────────────]
Tool 3 BUILD                                   [────────────────]
Tool 1 WIRE                           [─────]
Tool 2 WIRE                                       [─────]
Tool 3 WIRE                                           [─────]
Tool 1 TEST                             [─────]
Tool 2 TEST                                         [─────]
Tool 3 TEST                                             [─────]
```

With parallelization, 3 tools fit in ~9 hours instead of 12 (sequential).

## Comparison: BUILD-WIRE-TEST vs Monolithic

### Monolithic Approach (REJECTED)
```
Todo: "Build Word Counter"
├── Create UI
├── Implement logic
├── Add localStorage
├── Add download button
├── Write tests
└── 4–5 hours (all mixed together)
```
Problems:
- Hard to parallelize (can't WIRE while BUILD is running)
- Tests at the end (slower feedback)
- If tests fail, unclear if it's logic or I/O

### BUILD-WIRE-TEST Approach (ADOPTED)
```
Todo 107: BUILD (2–3h) → clear acceptance criteria
Todo 108: WIRE (1h) → depends on 107, clear scope
Todo 109: TEST (1h) → depends on 108, comprehensive
```
Advantages:
- Parallelizable (3 tools × 3 phases = flexible scheduling)
- Clear dependencies (TEST doesn't start until WIRE done)
- Easy to spot issues (failing TEST → check WIRE, not logic)
- TDD-friendly (tests written after logic is done)

## Enforcement

1. **Master todo list** (000-master.md) shows explicit dependencies
2. **Setup todo** (001) creates templates that separate BUILD/WIRE concerns
3. **Each tool's todos** reference this decision
4. **Integration test** (401) verifies no monolithic todos were created

## Risk: Accidental Coupling

**Risk**: During WIRE phase, a developer realizes the core logic (BUILD) needs to change. This creates a hidden dependency back to BUILD.

**Mitigation**:
- BUILD phase acceptance includes "logic complete and verified"
- WIRE phase limited to I/O operations — should NOT require logic changes
- If WIRE discovers a logic bug, create a separate "fix" commit and update BUILD acceptance
- Code review catches accidental logic changes during WIRE phase

## Alternatives Considered

**Option A: Monolithic "Build Tool"** (rejected)
- Simpler planning (fewer todos)
- Harder to parallelize
- Slower feedback on logic errors

**Option B: Test-Driven** (rejected as primary)
- Write tests before code
- Possible, but BUILD phase logic is too exploratory
- Compromise: TEST phase is comprehensive, not test-first

**Option C: Continuous Integration** (rejected)
- Merge BUILD immediately when logic done
- Merge WIRE immediately when I/O done
- Merge TEST immediately when tests pass
- Too granular, not compatible with autonomous execution model

## Approval

✅ Documented in masters todos (000-master.md)  
✅ Examples provided (101–109, 201–209, 301–312)  
✅ Template details provided (TODO-TEMPLATE.md)  
✅ Sample detailed todo (201-build-ai-prompt-generator.md)

## Future Optimization

After Wave 1 completes, evaluate:
- Parallel WIRE/TEST (if WIRE doesn't break assumptions)
- Automated WIRE from BUILD (boilerplate generation)
- Shared WIRE utilities (localStorage patterns, download helpers)
