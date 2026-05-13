# BMC Generator — Complete User Flow

End-to-end journey from user landing on the tool through receiving the final Business Model Canvas.

---

## Flow Overview

```
User Lands → Input Idea → Answer Questions → Generate → See Results → Export
   ↓           ↓            ↓                 ↓          ↓             ↓
 Phase 1A    Form Input   Questions      Phases 2-4   Display      Download
              Validate     Response       Real-Time    Full BMC      Canvas
                                          Updates
```

---

## Detailed Flow: Idea Input (Phase 1A)

### User Lands on /tools/bmc-generator/

**What User Sees:**
```
┌──────────────────────────────────────────┐
│ BMC Generator                            │
│                                          │
│ Describe your business idea in plain     │
│ English. Be specific about the problem   │
│ you solve and who benefits.              │
│                                          │
│ ┌────────────────────────────────────┐   │
│ │ My idea:                           │   │
│ │ [textarea, placeholder text]       │   │
│ │                                    │   │
│ │ Character count: 0/500             │   │
│ └────────────────────────────────────┘   │
│                                          │
│ [ ] Analyze           [ Clear ]         │
│                                          │
│ Estimated cost: $0.02–0.05              │
│ Estimated time: 45–90 seconds           │
└──────────────────────────────────────────┘
```

**User Actions & Expected Outcomes:**

| User Does | System Responds | UX Feedback |
|-----------|-----------------|-------------|
| Lands on page | Load form | Form appears, textarea focused |
| Types business idea (e.g., "AI fitness coach for runners") | Count characters | Counter updates: "47/500" |
| Continues typing (reaches 50+ chars) | Enable button | "Analyze" button becomes clickable (green) |
| Clicks "Analyze" | POST /api/bmc-generator/start | Button disables, spinner appears |
| Waits 3–5 seconds | OrchestratorAgent generates 3–5 questions | Form clears, questions display |
| — | Server broadcasts initial status | SSE stream starts, status panel appears |

**Value Delivered:** User has clarified their business concept into structured questions they can think about.

**Error Cases:**
- Idea < 50 chars: "Please describe your idea in at least 50 characters"
- Idea > 500 chars: Textarea disabled at 501 chars
- API fails: Show "Unable to generate questions. Try again."
- User clicks "Clear": Reset form to empty state

---

## Detailed Flow: Questions & Answers (Phase 1B)

### System Displays Clarifying Questions

**What User Sees:**
```
┌──────────────────────────────────────────┐
│ Your Idea: "AI-powered fitness coach     │
│ that personalizes workouts for runners" │
│                                          │
│ Answer these to refine the analysis:     │
│                                          │
│ 1. Who is your primary customer?         │
│    [text input, required]                │
│                                          │
│ 2. What is the core problem you solve?  │
│    [text input, required]                │
│                                          │
│ 3. How are you thinking about pricing?  │
│    [text input, optional]                │
│                                          │
│ [ Back ] [ Continue ]                    │
└──────────────────────────────────────────┘
```

**User Actions & Expected Outcomes:**

| User Does | System Responds | UX Feedback |
|-----------|-----------------|-------------|
| Reads questions | — | Questions displayed, text inputs empty |
| Clicks "Back" | Return to idea input form | Form state reset, can edit idea again |
| Fills question 1 (e.g., "Long-distance runners") | Capture text | Input updates, "Continue" button remains disabled |
| Fills question 2 (required) | Capture text | Both required fields populated |
| Leaves question 3 (optional) empty | Ignore | No validation error |
| Clicks "Continue" | POST /api/bmc-generator/answers | Button disables, spinner appears |
| Waits 3–5 seconds | OrchestratorAgent normalizes answers | Questions hidden, status panel appears |
| — | Server creates BusinessContext | Phase 1 complete, Phase 2 begins |

**Value Delivered:** User has clarified their business model. System now has structured context (BusinessContext) for generating BMC sections.

**Error Cases:**
- Required field empty: Red outline on input, "Please fill all required fields"
- API fails: "Unable to process answers. Try again."
- User clicks "Back" mid-processing: Abort current request, return to form

---

## Detailed Flow: Generation & Real-Time Progress (Phases 2–4)

### System Executes All 4 Phases with Real-Time Updates

**What User Sees (Immediately After Submitting Answers):**

```
┌──────────────────────────────────────────┐
│ Generating Your BMC...                   │
│                                          │
│ Phase 2: BMC Sections                    │
│ ▓▓▓▓░░░░░░ 44% (4/9 agents complete)    │
│ Current: RevenueStreamsAgent             │
│ Status: Computing...                     │
│                                          │
│ Phase 3: Red Team Review                 │
│ ░░░░░░░░░░ 0% (waiting for Phase 2)    │
│                                          │
│ Phase 4: Synthesis                       │
│ ░░░░░░░░░░ 0% (waiting for Phase 3)    │
│                                          │
│ ⏱ Elapsed: 12 seconds                    │
│ 💰 Cost so far: $0.0091                  │
│ 📊 Estimated total cost: $0.033          │
│                                          │
│ Please wait. Do not refresh.              │
└──────────────────────────────────────────┘
```

**Real-Time Updates (Via SSE Stream):**

The page subscribes to `/api/bmc-generator/stream/status?session_id=...` and updates every ~2 seconds:

| Time | Event | UI Update |
|------|-------|-----------|
| +0s | Phase 2 starts | Progress bar 0%, "Phase 2: BMC Sections" active |
| +3s | CustomerSegmentsAgent completes | Progress 11% (1/9), cost $0.0012 |
| +6s | ValuePropositionsAgent completes | Progress 22% (2/9), cost $0.0025 |
| +9s | ChannelsAgent completes | Progress 33% (3/9), cost $0.0038 |
| +12s | CustomerRelationshipsAgent completes | Progress 44% (4/9), cost $0.0051, ElapsedTime "12 seconds" |
| ... | ... | ... |
| +30s | RevenueStreamsAgent completes (slowest) | Progress 100% (9/9 complete), Phase 2 complete |
| +30s | Phase 3 starts | Phase 2 progress bar full, Phase 3 bar activates at 0% |
| +35s | MarketFeasibilityAgent completes | Phase 3 progress 33% (1/3) |
| +40s | BusinessModelAgent completes | Phase 3 progress 66% (2/3) |
| +45s | CompetitivePositioningAgent completes | Phase 3 progress 100% (3/3), Phase 3 complete |
| +45s | Phase 4 starts | Phase 4 bar activates at 0% |
| +50s | SynthesisAgent completes, FinalBMC generated | All phases complete |
| +51s | Page transitions | Status panel replaced with final BMC display |

**User Experience During Generation:**

1. **Visual Feedback:** Progress bars advance smoothly (user sees which phase is active)
2. **Agent Visibility:** Agent name changes (user sees "CustomerSegmentsAgent" → "ValuePropositionsAgent" → etc.)
3. **Cost Transparency:** Real-time cost updates (user sees $0.001, $0.002, $0.003 accumulating)
4. **Time Awareness:** Elapsed seconds ticking up (user sees "5 seconds", "10 seconds", etc.)
5. **Non-Blocking:** User can scroll, read context, copy previous outputs (no frozen UI)

**Error Cases During Generation:**

| Error | User Sees | User Can Do |
|-------|-----------|------------|
| Single agent timeout | ⚠️ "RevenueStreamsAgent delayed, proceeding..." | Continue, phase proceeds with 8/9 sections |
| <6 agents complete in Phase 2 | ❌ "BMC generation failed. Fewer than 6 sections completed." | [Retry] or [Download Logs] |
| All critique agents fail in Phase 3 | ⚠️ "Red Team Review unavailable" | Continue, Phase 4 proceeds without critique |
| Synthesis fails in Phase 4 | ❌ "Final synthesis failed" | [Retry] or [Download Logs] + show partial BMC |
| SSE connection drops | "Connection lost, retrying..." | Auto-reconnect every 2s, generation continues |

---

## Detailed Flow: Results Display (Phase 4 Output)

### System Shows Final Business Model Canvas

**What User Sees (Full Page):**

```
┌──────────────────────────────────────────┐
│ Your Business Model Canvas               │
│ [Copy] [Download PDF] [Share]            │
│                                          │
│ Executive Summary (2-3 sentences)        │
│ "AI-powered personalized fitness for     │
│  long-distance runners, monetized via    │
│  subscription, differentiated by ML      │
│  running metrics..."                     │
│                                          │
│ ┌─────────┬─────────┬──────────┐        │
│ │Customer │  Value  │ Channels │        │
│ │Segments │Propositions│        │        │
│ │         │         │          │        │
│ ├─────────┼─────────┼──────────┤        │
│ │Customer │   Key   │   Key    │        │
│ │Relationships│Resources│Activities│        │
│ │         │         │          │        │
│ ├─────────┼─────────┼──────────┤        │
│ │  Key    │  Cost   │ Revenue  │        │
│ │ Partners│ Structure│ Streams  │        │
│ │         │         │          │        │
│ └─────────┴─────────┴──────────┘        │
│                                          │
│ Red Team Assessment                      │
│ 🔴 High-Risk Items (3)                  │
│  ├─ Revenue model depends on...         │
│  ├─ Competition in this space...        │
│  └─ Customer acquisition cost...        │
│                                          │
│ 🟡 Medium-Risk Items (2)                 │
│  ├─ Scaling manufacturing...            │
│  └─ Regulatory uncertainty...            │
│                                          │
│ ✅ Strengths (2)                        │
│  ├─ Clear target customer...             │
│  └─ Defensible IP position...            │
│                                          │
│ Strategic Recommendations                │
│ 1. Validate key assumptions...           │
│ 2. Develop partnerships with...          │
│ 3. Plan for regulatory compliance...     │
│                                          │
│ Next Steps                               │
│ [ ] Create detailed financial project.. │
│ [ ] Identify and contact 10 potential... │
│ [ ] Research competitor pricing...       │
│                                          │
│ Generation metadata:                     │
│ Cost: $0.0331  Tokens: 89,500           │
│ Agents executed: 14  Agents failed: 0   │
│ Time elapsed: 51 seconds                 │
└──────────────────────────────────────────┘
```

**User Actions & Expected Outcomes:**

| User Does | System Responds | Result |
|-----------|-----------------|--------|
| Reads canvas & critiques | — | Can understand business model at a glance |
| Clicks [Copy] button | Copy canvas as markdown | Toast: "Copied to clipboard!" (2s fade) |
| Clicks [Download PDF] button | Generate PDF, download | File saved: "bmc-fitness-2026-05-12.pdf" |
| Clicks [Share] button | Generate shareable URL | Tooltip with link, "Copy link to clipboard" |
| Checks checkbox for "Create detailed financial..." | Store checkbox state locally | Checkbox marked ✓ (persists until page close) |
| Scrolls down | Page scrolls | Can read all sections, critiques, recommendations |
| Refreshes page | Lose session state | Must restart from idea input (warning: "Changes not saved") |

**Value Delivered:**
- User has a complete, professional Business Model Canvas
- User can export, share, or use as starting point for further planning
- User has identified risks and next steps for validation
- User has learned how business model dimensions interact

**Error Cases:**
- Canvas rendering fails: "Display error. Results may still be downloading..."
- PDF generation fails: [Download PDF] disabled, show "PDF unavailable"
- Share link generation fails: [Share] disabled, user can copy canvas manually

---

## Alternative Paths

### Path: User Wants to Restart

**Scenario:** User submits idea, answers questions, but wants to try a different idea mid-generation.

**User Actions:**
1. Clicks browser back button OR
2. Closes tab and reopens `/tools/bmc-generator/`

**System Behavior:**
- Aborts current generation
- Returns to idea input form
- User can submit new idea

**Note:** Each generation costs $0.03-0.05 (no free restarts).

### Path: User Encounters Error During Phase 2

**Scenario:** <6 agents complete successfully in Phase 2.

**User Sees:**
```
❌ BMC Generation Failed

Fewer than 6 sections completed successfully.
Unable to generate complete Business Model Canvas.

[Retry Generation]  [Download Session Logs]
```

**User Options:**
1. [Retry Generation]: POST /api/bmc-generator/generate again (new $0.03+ charge)
2. [Download Session Logs]: Download JSON file with agent outputs, errors, tokens used (for debugging)
3. Navigate away: Loss of session, can restart

---

## Accessibility Considerations

| Aspect | Implementation |
|--------|----------------|
| **Color blindness** | Icons + text labels (🔴 "High Risk", ✅ "Strength") |
| **Keyboard navigation** | All buttons accessible via Tab, Enter, Space |
| **Screen readers** | ARIA labels on progress bars, live regions for status updates |
| **Mobile zoom** | Responsive layout scales to 200% zoom without horizontal scroll |
| **Form validation** | Clear error messages, red outline on invalid fields |

---

## Success Metrics

**User has successfully completed the flow when:**

1. ✅ Submitted business idea (50-500 chars)
2. ✅ Answered clarifying questions (2-3 required answers)
3. ✅ Watched generation progress (saw 4-phase execution with real-time updates)
4. ✅ Received final Business Model Canvas (all 9 sections populated)
5. ✅ Reviewed red team critique (identified ≥1 high-risk item)
6. ✅ Saw strategic recommendations (actionable next steps)

**Bonus (not required for MVP):**
- Exported canvas as PDF or markdown
- Shared canvas with peer
- Marked checklist items for follow-up

---

## Flow Duration & Cost

**Typical Session:**

| Phase | Duration | Cost |
|-------|----------|------|
| Idea input | 2-3 min | $0.000 |
| Questions answering | 2-3 min | $0.000 |
| Generation (Phases 2-4) | 50-60 sec | $0.033 |
| Results review | 3-5 min | $0.000 |
| **Total user time** | **~10-15 minutes** | **$0.033** |

**Cost Breakdown:**
- Phase 1: $0.005 (questions + normalization)
- Phase 2: $0.013 (9 agents, ~44k tokens)
- Phase 3: $0.009 (3 critique agents, ~21k tokens)
- Phase 4: $0.006 (synthesis, ~5k tokens)
- **Total: $0.033** (within $0.05 user-approved budget)

---

## Conclusion

The user flow prioritizes **transparency over speed**. Every user sees exactly what agent is working, how much progress has been made, and what the final output represents. This builds trust and allows users to understand the BMC generation process, not just consume a magic output.
