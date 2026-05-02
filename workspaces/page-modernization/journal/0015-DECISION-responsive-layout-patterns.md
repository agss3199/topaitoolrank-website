---
type: DECISION
date: 2026-05-01
title: Codify Responsive Layout Patterns into Agent
slug: responsive-layout-patterns
---

# Decision: Codify Responsive Layout Patterns into Agent

## What Was Decided

Created `.claude/agents/project/responsive-layout-expert.md` as a project-specific agent to capture responsive CSS patterns and best practices discovered while fixing WA Sender responsive issues.

## Why

The red team validation (CSS fixes for modal overflow, zoom-out white screen, print preview issues) surfaced four reusable patterns:

1. **Modal viewport safety** — Use `min(max-width, calc(100vw - padding))` instead of hardcoded widths
2. **Desktop layout composition** — Keep `flex-direction: column`, control via max-widths rather than row layout with sticky sidebars
3. **Print styles reset** — Always reset to single-column block layout, remove interactive elements
4. **Overflow handling** — Modal bodies need `overflow-x: hidden`, form elements need `max-width: 100%`

These patterns are non-obvious (the zoom-out issue required understanding the interaction between `position: fixed` modals and flex-direction changes) and worth preserving for future responsive design work.

## How Applied

- **Agent created** with clear purpose, when-to-use, key patterns, common pitfalls, validation checklist
- **Compliance verified** — description under 120 chars with trigger phrase ("Use for responsive CSS bugs")
- **Cross-referenced** to actual code locations (`Modal.tsx`, `wa-sender.css`)

## Related Files

- `.claude/agents/project/responsive-layout-expert.md` — The agent itself
- `app/components/Modal.css` — Modal viewport fix with `min()` function
- `app/tools/wa-sender/wa-sender.css` — Desktop layout refactor removing flex-direction: row
- WA Sender red team validation results — Discovery of all four pattern violations

## Future Use

Future responsive design bugs should trigger delegation to this agent early for pattern validation before implementation.
