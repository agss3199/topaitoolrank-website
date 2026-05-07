---
name: Article generation is critical path blocker
description: User must generate 9 × 2000-word articles via ChatGPT before cross-linking can begin
type: RISK
---

# Risk: Article Generation Timeline

**Date**: 2026-05-07  
**Severity**: MEDIUM  
**Impact**: Blocks todos 16-17 (cross-linking) and final testing (todos 21-25)

## Critical Path Dependency

```
Todo 07-15: User generates 9 articles via ChatGPT
    ↓
Todo 02: Integrate header/footer (can run in parallel, but needs articles for full test)
Todo 04-06: Metadata + sitemap (can run fully in parallel)
    ↓
Todo 16-17: Cross-linking (BLOCKED until articles written)
    ↓
Todo 21-25: Final testing (BLOCKED until articles written)
```

## What's Required from User

**For each of 9 tools:**
1. Open `/articles/NN-prompt-[tool].txt`
2. Copy entire prompt into ChatGPT
3. ChatGPT generates ~2000-word article
4. Review for quality (tone, structure, examples)
5. Copy output and submit to assistant

**Estimated Time**: 20-30 minutes per article × 9 = 3-5 hours total  
**Quality Gate**: Human review required (cannot use raw ChatGPT output if it reads as AI-generated)

## Articles Ready

All prompts are created and waiting:
- Master prompt: `/articles/00-MASTER-PROMPT.md` (framework + quality standards)
- Tool prompts: `/articles/01-prompt-json-formatter.txt` through `/articles/02-09-prompts.txt`

## Parallel Work While Waiting

While user generates articles, code work can proceed:

**Can run fully in parallel** (no article dependency):
- Todos 01-03: Header/Footer components
- Todos 04-06: Metadata + sitemap
- Todos 21-24: Testing setup (will need articles for final E2E, but structure can be prepared)

**Cannot start** (blocked on articles):
- Todos 16-17: Cross-linking (needs article text to identify links)
- Todo 25: Search Console verification (needs articles live first)

## Mitigation

**Recommendation**: User generates articles in background while dev team implements:
- Header/Footer components
- Metadata configuration
- Sitemap updates
- Testing infrastructure

This way, as soon as articles are submitted, integration (todo 02) + cross-linking (todos 16-17) can proceed immediately without waiting.

## Next Session Coordination

- **Session N+1**: Dev implements Milestone 1 + 2 (todos 01-06) in parallel with user article generation
- **Session N+2**: User submits articles → integration + cross-linking (todos 02, 16-17)
- **Session N+3**: Final testing (todos 21-25)

This keeps work flowing without bottlenecks.

