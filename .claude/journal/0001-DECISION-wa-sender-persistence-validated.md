---
date: 2026-04-29
type: DECISION
title: WA Sender State Persistence Pattern Validated for Production
---

## Summary

The three-layer state persistence model for the WA Sender tool (React auto-save → Next.js API → Supabase PostgreSQL) has passed comprehensive red team validation and is now approved for production use.

## Pattern Validated

**Three-Layer Model:**
1. **React Layer** — useEffect with exhaustive dependency array triggers auto-save on ANY state change
2. **API Layer** — Next.js validates all inputs (UUID format, length constraints) before touching database
3. **Database Layer** — Supabase stores complete session state; restored on component mount via separate API call

**Key Decisions:**
- Use `IF NOT EXISTS` / `DROP IF EXISTS` for all DDL to make migrations idempotent
- Validate at API boundary (not frontend) to prevent malformed data reaching database
- Show all errors to user via `setNotice()` to enable self-correction
- Mask userId in logs to prevent PII exposure
- Defer session load to separate effect (not auto-save effect) to prevent double-saves on mount

## Why This Works

- **No Silent Failures** — Every error visible to user
- **No Partial State** — All 8 fields save together, all restore together
- **Recoverable from Corruption** — Idempotent migrations can re-run safely
- **Auditable** — Structured logs with context enable triage
- **Tested** — 40+ test cases covering all persistence paths

## Impact

This pattern can be reused for any Next.js + Supabase project requiring session persistence across login cycles. The validation proves the approach handles edge cases (concurrent saves, network failures, schema evolution) correctly.

## Codification

Patterns documented in `.claude/skills/project/wa-sender-patterns.md` for reuse on future projects.
