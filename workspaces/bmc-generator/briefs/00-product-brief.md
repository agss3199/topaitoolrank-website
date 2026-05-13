# BMC Generator — Product Brief

## Product Overview

BMC Generator is a standalone AI-powered tool that creates complete Business Model Canvases from user business ideas. Users input a business concept in plain English and receive a professional, analyzed BMC with risk critiques and strategic recommendations.

## Core Value Propositions

1. **Transparency** — Users see which agent is working, what's being generated, cost tracking, workflow progress, and inter-agent communication
2. **Speed** — Target: complete generation in <45 seconds
3. **Low Cost** — Target: <$0.02 per generation  
4. **Educational** — Users learn how business models work, strategic thinking, and how dimensions interact
5. **Quality** — Multi-agent analysis + red team critique = realistic, substantive BMCs

## Primary Goals

- User inputs business idea in plain English
- System outputs:
  - Complete Business Model Canvas
  - Realistic business analysis
  - Risk critiques
  - Strategic recommendations

## Updated Constraints (User Clarifications)

**May 11, 2026:**
- **Cost Budget:** Up to **$0.05 per generation** (increased from $0.02 target)
- **Latency:** No hard time constraint. Acceptable to take 60-90 seconds as long as:
  - Real-time visual feedback shows activity (agent status indicators)
  - Progress percentage visible for each phase
  - User sees which agent is working and what's happening
  - UI never freezes or goes blank during generation

**May 12, 2026 (Analysis Complete):**
- **Cost Budget:** Revised to **$0.25 per generation** (up from $0.05)
- **Reason:** Verified cost analysis shows $0.1808 per generation with full 14-agent architecture
- **Approved:** Proceed with full architecture (no agent reduction needed)

**May 12, 2026 (Authentication Requirement Added):**
- **Scope Change:** Add simple username/password login (BLOCKING REQUIREMENT)
- **Model:** Like WA Sender — single login page, simple credentials, session-based auth
- **Reason:** Prevent anonymous access, control who can generate BMCs (and incur cost)
- **Impact:** Adds Phase 0A (auth layer) and POST /api/bmc-generator/login endpoint

## System Architecture

### 4-Phase Execution Model

| Phase | Purpose | Execution |
|-------|---------|-----------|
| Phase 1 | Gather context via clarifying questions | Sequential |
| Phase 2 | Generate BMC sections (9 agents) | Parallel |
| Phase 3 | Critique business model (3 red team agents) | Parallel |
| Phase 4 | Synthesize final BMC | Sequential |

### Agent System (13 Total)

**Phase 1: Orchestration (1 agent)**
- OrchestratorAgent: Conversational controller, asks clarifying questions, normalizes context

**Phase 2: BMC Generation (9 agents — parallel)**
- CustomerSegmentsAgent
- ValuePropositionsAgent
- ChannelsAgent
- CustomerRelationshipsAgent
- RevenueStreamsAgent
- KeyResourcesAgent
- KeyActivitiesAgent
- KeyPartnersAgent
- CostStructureAgent

**Phase 3: Red Team Critique (3 agents — parallel)**
- MarketFeasibilityAgent: Validates market opportunity realism
- BusinessModelAgent: Critiques financial/operational viability
- CompetitivePositioningAgent: Challenges differentiation claims

**Phase 4: Synthesis (1 agent)**
- SynthesisAgent: Merges outputs, resolves contradictions, incorporates critiques, formats final BMC

## Isolation Requirements

**CRITICAL:** This tool must be completely self-contained.

- No shared components
- All code in dedicated folder (`app/tools/bmc-generator/`)
- Deletable without affecting rest of website
- Own styling, utilities, hooks
- Own API endpoints (if needed)
- Own types and interfaces

## Design Principles

1. **Transparency First** — Show active agent, current phase, elapsed time, token/cost usage
2. **Parallel by Default** — Independent agents run concurrently
3. **Cost Aware** — Track API costs, token usage, runtime efficiency
4. **Error Isolation** — One failed agent doesn't break system
5. **JSON-First** — All internal outputs structured JSON before markdown rendering
6. **Explainability** — Every recommendation traceable to assumptions, reasoning, user inputs

## Output Format

```
Executive Summary

Business Model Canvas (9x table format)
- Customer Segments
- Value Propositions
- Channels
- Customer Relationships
- Revenue Streams
- Key Resources
- Key Activities
- Key Partners
- Cost Structure

Red Team Risks
Strategic Recommendations
Suggested Next Steps
```

## Structured Context Object (Phase 1)

```json
{
  "industry": "",
  "customer_type": "B2B|B2C",
  "target_market": "",
  "business_model": "",
  "problem": "",
  "pricing_direction": "",
  "geography": "",
  "competitive_landscape": "",
  "key_assumptions": []
}
```

## Future Agent Expansion (Optional)

- TAMAgent — market size estimation
- FinancialProjectionAgent — startup forecasts
- InvestorReadinessAgent — venture viability scoring
- PitchDeckAgent — fundraising decks
- BrandingAgent — names/taglines
- ICPAgent — ideal customer profiles
- MoatAgent — defensibility analysis
- RegulatoryRiskAgent — compliance detection
- PricingOptimizationAgent
- GrowthStrategyAgent — GTM strategies

## Technical Constraints

- Standalone from rest of website
- No shared component imports
- No shared styling/CSS modules
- Must be easily removable (delete `/app/tools/bmc-generator/` and tool disappears)
- Cost tracking built-in (show user per-generation cost)
- Real-time agent status display
- Error handling that doesn't crash the tool
