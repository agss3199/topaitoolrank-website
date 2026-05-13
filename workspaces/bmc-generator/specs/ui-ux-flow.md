# BMC Generator — UI/UX Flow & Components

Frontend specification for the complete user journey through BMC generation.

## Page Route

`/tools/bmc-generator/` — standalone page, isolated from rest of website styling

## Component Hierarchy

```
<BMCGeneratorPage>
  ├─ <IdeaInputForm />          (Phase 1A: user enters business idea)
  ├─ <ClarifyingQuestionsForm /> (Phase 1B: user answers questions)
  ├─ <GenerationStatusPanel />    (Phase 2-4: real-time progress display)
  ├─ <BMCCanvasDisplay />         (Phase 4 output: 9x markdown table)
  ├─ <CritiqueSummary />          (Phase 4 output: risks + strengths)
  ├─ <RecommendationsPanel />     (Phase 4 output: strategic next steps)
  └─ <ErrorBoundary />            (catches component-level errors)
```

---

## Phase 1A: Idea Input Form

**Component:** `<IdeaInputForm />`

**UI:**
```
┌─────────────────────────────────────────┐
│  BMC Generator                          │
│                                         │
│  Describe your business idea in plain   │
│  English. Be specific about the problem │
│  you solve and who benefits.            │
│                                         │
│  ┌─────────────────────────────────────┐
│  │ My idea: [textarea, 50-500 chars]   │
│  │ Char count: 0/500                   │
│  └─────────────────────────────────────┘
│                                         │
│  [ ] Generate clarifying questions     │
│  (Estimated cost: $0.02-0.05)          │
│  (Estimated time: 45-90 seconds)       │
│                                         │
│  [ Analyze ]  [ Clear ]                │
└─────────────────────────────────────────┘
```

**Validation:**
- Min 50 chars (warn at 45 chars)
- Max 500 chars (disable submit at 501)
- Non-empty required for submit

**On Submit:**
1. POST `/api/bmc-generator/start` with idea
2. Disable "Analyze" button (prevent double-click)
3. Show loading spinner
4. Transition to Phase 1B on success

**Accessibility:**
- `<textarea>` with `aria-label="Business idea"`
- Char counter uses `aria-live="polite"` for updates
- "Analyze" button disables on submit

---

## Phase 1B: Clarifying Questions Form

**Component:** `<ClarifyingQuestionsForm />`

**UI:**
```
┌─────────────────────────────────────────┐
│  Your Idea: "AI-powered fitness coach" │
│                                         │
│  Answer a few quick questions to       │
│  refine the analysis:                  │
│                                         │
│  1. Who is your primary customer?      │
│     [text input, required]             │
│                                         │
│  2. What problem does your solution   │
│     solve most directly?               │
│     [text input, required]             │
│                                         │
│  3. How are you thinking about price? │
│     [text input, optional]             │
│                                         │
│  [ Back ] [ Continue ]                 │
└─────────────────────────────────────────┘
```

**Behavior:**
- Questions are 3-5, generated dynamically
- All questions required except explicitly marked optional
- "Back" button: reset to Phase 1A (discard answers)
- "Continue" button: submit answers

**On Continue:**
1. Validate all required fields non-empty
2. POST `/api/bmc-generator/answers` with answers
3. Disable "Continue" button
4. Show loading spinner
5. On success: transition to Generation Status Panel
6. If validation fails: Show red error message "Please fill all required fields"

**Accessibility:**
- Each question has `<label for="question_N">`
- Error messages have `role="alert"`
- "Continue" button disabled until all required fields filled

---

## Phase 2-4: Generation Status Panel

**Component:** `<GenerationStatusPanel />`

**Purpose:** Real-time progress feedback as agents execute. This is CRITICAL to the user experience (user clarified 60-90s is acceptable with visual feedback).

**UI:**
```
┌─────────────────────────────────────────┐
│  Generating Your BMC...                 │
│                                         │
│  Phase 2: BMC Sections                  │
│  ▓▓▓▓▓▓░░░ 66%                          │
│  Current: ValuePropositionsAgent        │
│                                         │
│  Phase 3: Red Team Review               │
│  ░░░░░░░░░░ 0%                          │
│  (waiting for Phase 2 to complete)      │
│                                         │
│  Phase 4: Synthesis                     │
│  ░░░░░░░░░░ 0%                          │
│  (waiting for Phase 3 to complete)      │
│                                         │
│  Elapsed: 18 seconds                    │
│  Cost so far: $0.0087                   │
│  Estimated total: $0.033                │
│                                         │
│  Do not refresh or leave this page      │
└─────────────────────────────────────────┘
```

**Real-Time Updates (SSE Stream):**

The component subscribes to `/api/bmc-generator/stream/status?session_id=...` and updates on each event:

```typescript
const es = new EventSource(`/api/bmc-generator/stream/status?session_id=${sessionId}`);
es.onmessage = (e) => {
  const update = JSON.parse(e.data);
  // update: { phase, activeAgent, progress, elapsedMs, tokensUsed, costUSD, timestamp }
  setPhaseProgress(update.phase, update.progress);
  setActiveAgent(update.activeAgent);
  setCostSoFar(update.costUSD);
  setElapsedSeconds(Math.round(update.elapsedMs / 1000));
};
```

**Progress Calculation (Displayed):**
```
Phase 1: 100% (fixed, completed before this panel)
Phase 2: (agentsComplete / 9) * 100%
Phase 3: (critiquesComplete / 3) * 100%
Phase 4: 0% or 100% (binary, no intermediate progress)
```

**Phase Labels:**
- Phase 2: "BMC Sections" (generating 9 sections)
- Phase 3: "Red Team Review" (validating model)
- Phase 4: "Synthesis" (finalizing output)

**Fallback Messaging:**
- Phase not started: "Waiting for previous phase to complete"
- Agent timeout: "⚠️ Agent delayed, proceeding..." (gray text, non-blocking)
- Agent failed: "❌ Section unavailable" (red text, but generation continues)

**Error Handling:**
- If SSE disconnects: Show "Connection lost, retrying..." + auto-reconnect every 2s
- If generation fails: Show error panel with "Retry" button
- If generation times out (>2 minutes): Show "Taking longer than expected..." + "Continue waiting" / "Download logs" buttons

**Accessibility:**
- Progress bar has `role="progressbar" aria-valuenow="66" aria-valuemin="0" aria-valuemax="100"`
- Active agent updated via `aria-live="polite"` region
- Cost and elapsed time have `aria-live="assertive"` for changes

---

## Phase 4: BMC Canvas Display (Full & Partial)

**Component:** `<BMCCanvasDisplay />`

**Purpose:** Render final 9-section Business Model Canvas as a professional-looking table. Handles full completion, partial completion (timeout), and agent-only fallback.

### Full Completion

**UI (Markdown Table → HTML):**

| Customer Segments | Value Propositions | Channels |
|---|---|---|
| [content] | [content] | [content] |
| | Channels |  |
| Customer Relationships | Key Resources | Key Activities |
| [content] | [content] | [content] |
| Key Partners | Cost Structure | Revenue Streams |
| [content] | [content] | [content] |

**Rendering:**
- Table is responsive: on mobile, stack into 3-column layout
- Each cell has light background, padding, minimal borders
- Content is left-aligned, word-wrappable
- Font: system sans-serif, 14px body, 16px headers

**Interactivity:**
- Copy button (top-right): Copy entire canvas as markdown
- Download button: Save as PDF
- Share button: Generate shareable URL (or copy to clipboard)

### Partial Completion (Timeout / Soft Limit)

When generation hits a timeout and some sections complete:

**Visual Indicator:**
- Completed sections: normal white background
- Skipped sections: light gray background (#f5f5f5) with diagonal stripes (repeating-linear-gradient)
- Skipped section content: "[Section unavailable — generation timed out after 98 seconds]"

**Example:**

| ✅ Customer Segments | ✅ Value Propositions | ⏸️ Channels (skipped) |
|---|---|---|
| [content] | [content] | [Section unavailable — generation timed out after 98 seconds] |
| | |  |
| ✅ Customer Relationships | ✅ Key Resources | ⏸️ Key Activities (skipped) |
| [content] | [content] | [Section unavailable — generation timed out after 98 seconds] |
| ✅ Key Partners | ⏸️ Cost Structure (skipped) | ✅ Revenue Streams |
| [content] | [Section unavailable — generation timed out after 98 seconds] | [content] |

**User Message Above Canvas:**
```
⚠️ Generation timed out at 98 seconds. Showing 6 of 9 sections.
Cost charged: $0.16 (not the full $0.25 budget)
[Try Again] [Download Partial Results]
```

### Agent-Only Fallback (Tier 3)

When <6 agents complete or synthesis times out, show raw agent outputs as markdown blocks instead of a canvas:

**UI:**
```
⚠️ Generation could not complete (hard timeout at 120 seconds).
Showing 4 available sections. Cost charged: $0.12.

## Customer Segments
[Agent output as markdown]

## Value Propositions
[Agent output as markdown]

## Key Resources
[Agent output as markdown]

## Revenue Streams
[Agent output as markdown]

[Missing sections: Channels, Customer Relationships, Key Activities, Key Partners, Cost Structure]
```

**Rendering:**
- H2 headers for each section
- Content rendered as plain markdown (no table)
- Missing sections listed at bottom
- Gray background for the entire fallback block to indicate incomplete state

---

**Responsive Behavior:**
- Desktop (>1200px): Full 3x3 grid, side-by-side with critique panel
- Tablet (600-1200px): Full grid, critique below
- Mobile (<600px): Stack into single column, expandable sections
- Fallback (agent-only): single-column markdown blocks on all screen sizes

---

## Phase 4: Critique Summary Panel

**Component:** `<CritiqueSummary />`

**UI:**
```
┌─────────────────────────────────────────┐
│  Red Team Assessment                    │
│                                         │
│  🔴 High-Risk Items (3)                 │
│  ├─ Revenue model depends heavily on... │
│  ├─ Competition in this space is...     │
│  └─ Customer acquisition cost...        │
│                                         │
│  🟡 Medium-Risk Items (2)                │
│  ├─ Scaling manufacturing...            │
│  └─ Regulatory uncertainty...           │
│                                         │
│  ✅ Strengths (2)                       │
│  ├─ Clear target customer...            │
│  └─ Defensible IP position...           │
│                                         │
└─────────────────────────────────────────┘
```

**Content:** Rendered from `FinalBMC.critique_summary` (arrays of strings).

**Visual Treatment:**
- HIGH: Red icon (🔴) + bold text
- MEDIUM: Orange icon (🟡)
- STRENGTH: Green icon (✅)
- Each item is a bullet, max 1-2 lines

**Accessibility:**
- Heading "Red Team Assessment" has `<h2>`
- Risk icons have `aria-label="High risk", "Medium risk", "Strength"`

---

## Phase 4: Recommendations Panel

**Component:** `<RecommendationsPanel />`

**UI:**
```
┌─────────────────────────────────────────┐
│  Strategic Recommendations              │
│                                         │
│  1. Validate key assumptions around     │
│     customer willingness to pay         │
│                                         │
│  2. Develop partnerships with           │
│     established distribution channels   │
│                                         │
│  3. Plan for regulatory compliance      │
│     early (Q1 2026)                     │
│                                         │
│  Next Steps                             │
│                                         │
│  1. [ ] Create detailed financial      │
│        projections                      │
│  2. [ ] Identify and contact 10 potential │
│        customers                        │
│  3. [ ] Research competitor pricing...  │
│                                         │
└─────────────────────────────────────────┘
```

**Content:**
- Top section: `FinalBMC.strategic_recommendations` (array of strings, 1-5 items)
- Bottom section: `FinalBMC.next_steps` (array of strings, 1-5 items, rendered as checkbox list)

**Interactivity:**
- Checkboxes are local-only (no server sync), reset on page refresh
- Purpose: Help user track manual follow-up work

**Typography:**
- Recommendations in regular text (max 2-3 lines each)
- Next steps as checklist (unchecked initially)

---

## Error Boundary

**Component:** `<ErrorBoundary />`

**Scope:** Catches errors from any child component

**UI on Error:**
```
┌─────────────────────────────────────────┐
│  ❌ Something went wrong                 │
│                                         │
│  Generation failed in Phase 2.          │
│  Fewer than 6 BMC sections completed.   │
│                                         │
│  Partial results may still be available │
│  below.                                 │
│                                         │
│  [ Retry Generation ] [ Download Logs ] │
│                                         │
│  Error details (for debugging):         │
│  [ Show error trace ]                   │
│                                         │
└─────────────────────────────────────────┘
```

**Actions:**
- "Retry Generation": POST `/api/bmc-generator/generate` again (costs another $0.03-0.05)
- "Download Logs": Download session log as JSON (for debugging)
- "Show error trace": Expand error details (dev-only, hidden by default)

**Fallback Rendering:**
If Phase 4 fails but Phase 2-3 completed, show partial BMC with incomplete sections marked as "Analysis unavailable".

---

## Loading States

**Throughout all phases:**
- Spinner indicator (rotating circle, CSS animation)
- Loading text: "Analyzing your idea...", "Generating sections...", "Reviewing model...", "Finalizing output..."
- Do not disable page (user can scroll context, copy previous output)

---

## Mobile-First Responsive Design

**Breakpoints:**
- Mobile: <600px (single column, stack all sections)
- Tablet: 600-1200px (2-column layout, canvas + critiques side-by-side)
- Desktop: >1200px (3-column with recommendations sidebar)

**Form Inputs:**
- Full width on mobile (100% - 2x padding)
- Max 600px on desktop

**Canvas Table:**
- Horizontal scrolling on mobile if too wide
- Word-wrap enabled for cell content
- Tap-to-expand sections on mobile

---

## Accessibility (WCAG 2.1 AA)

- All interactive elements keyboard-accessible (Tab, Enter, Space)
- Form labels associated with inputs (`<label for="">`)
- Color not sole means of conveying info (icons + text)
- Contrast ratio ≥4.5:1 for text
- Focus visible (outline on focused elements)
- Aria-live regions for dynamic updates (progress, cost, errors)
- Error messages associated with inputs (`aria-describedby`)

---

## Copy-to-Clipboard Feature

**On BMC Canvas "Copy" button:**
```typescript
const markdown = `
# Business Model Canvas

## Customer Segments
[section content]

## Value Propositions
[section content]

...
`;

navigator.clipboard.writeText(markdown);
showToast("Copied to clipboard!");
```

**Toast:** Brief notification "Copied!" at top-center, fades after 2s

---

## Share Feature (Optional, Phase 6+)

Generate shareable URL: `/tools/bmc-generator/view?shared_id=abc123`
- Stores result in sessionStorage or server cache for 24 hours
- Viewer sees read-only BMC (no editing, no regeneration)
- Share link is unique UUID, prevents enumeration

---

## Isolation Guarantee

This entire page is self-contained:
- No imports from `app/components` (except layout wrapper)
- No global styles applied
- Styled via local CSS modules only (`BMCGeneratorPage.module.css`)
- No dependency on root theme (colors, fonts hardcoded in component styles)
- Deletable: remove `/app/tools/bmc-generator/` and page disappears with zero side effects

See `isolation-deployment.md` for full details.
