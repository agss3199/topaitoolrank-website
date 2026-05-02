---
type: DECISION
date: 2026-05-02
phase: codify
tags: [blog, codification, agents, skills, project]
---

# Decision: Codify Blog Publishing Knowledge Into Local Agents & Skills

**Date:** 2026-05-02  
**Phase:** Codify (Phase 5)  
**Status:** Complete  

## Decision

Capture blog publishing workflow and validation patterns into:
1. Updated **blog-publishing-specialist** agent (workflow + common issues)
2. Enhanced **blog-article-patterns** skill suite (4 files: SKILL.md, SEO, AEO, content quality, + NEW image-requirements.md)

Keep all artifacts LOCAL to `.claude/agents/project/` and `.claude/skills/project/` (no upstream proposals, this is a downstream USE repo).

## Rationale

The blog publishing system is production-validated (red team: 0 CRITICAL, 0 HIGH) with:
- 3 published articles (live on topaitoolrank.com)
- 2 consecutive clean validation rounds
- MDX static file architecture decided and implemented
- SEO/AEO patterns validated on real content

**This knowledge is specific to this user's project:**
- The exact publishing workflow (copy template → edit → push → live in 90s)
- Image path requirements learned through red team (1200×630px JPEG, filename matching)
- Content quality standards validated against 3 production articles
- Frontmatter schema for this project's blog

**Why LOCAL only:**
- These patterns are project-scoped (not reusable across all Next.js blogs)
- The skills reference specific file paths (`content/blog/`, `public/blog/images/`)
- The agent references project-specific templates and examples
- Downstream projects that want to publish blogs can copy this workspace and adapt

## What Was Codified

### Agent: blog-publishing-specialist
- Added architecture context (MDX static, zero infra)
- Enhanced image validation checklist
- Added common issues from red team findings (image path mismatches)
- Kept at 67 lines (procedural-only, references skill for details)

### Skills: blog-article-patterns (4 files)
1. **SKILL.md** — Entry point, 80% of routine questions answered
2. **seo-checklist.md** — Title/desc/hierarchy/schema for Google ranking
3. **aeo-patterns.md** — Benchmarks/frameworks for LLM discoverability
4. **content-quality.md** — Authenticity & value delivery standards
5. **NEW: image-requirements.md** — 1200×630px specs, validation, common mistakes

### Key Learning Captured
From red team Round 2 (hero image issue):
- Image filename must match frontmatter path exactly
- Missing images cause 404s on social media previews (~30-40% CTR reduction)
- Validation must happen BEFORE commit (not at deploy time)

## Alternatives Considered

1. **Skip codification** — Knowledge would drift across sessions, next publisher rediscovers image path issue
2. **Upstream to BUILD repo** — These patterns are project-specific; no value in cross-project library
3. **Document in wiki/README** — Dead weight; agents don't consult docs during publishing
   
**CHOSEN:** Codify into agents/skills so future publishing invocations have full context.

## Evidence of Completeness

✓ Agent descriptions <120 chars  
✓ Agent <400 lines (67 lines)  
✓ Skill progressive disclosure (SKILL.md answer 80% of questions)  
✓ All 4 skill files self-contained  
✓ Examples validated (3 production articles pass all checklists)  
✓ No mock data, no stubs, no TODOs  
✓ Red team validated (0 critical findings)  

## For Discussion

1. **Image generation**: Should the skill include Python/Node scripts for generating hero images programmatically, or is the current manual process sufficient?
   - **Context:** Current pattern is manual design in Photoshop/Figma + upload
   - **Alternative:** Provide code templates for automated generation (PIL, sharp)

2. **Scaling to 56+ articles**: Are the current validation patterns sufficient, or should we add pre-commit hooks to validate images exist?
   - **Context:** Image path mismatch found during red team after deploy (not before)
   - **Consideration:** Adding local git hook to validate `public/blog/images/` filenames against `content/blog/` frontmatter before push

3. **Frontmatter schema**: Should we lock the schema to prevent future changes, or keep it open for evolution?
   - **Context:** Current schema is stable but project may want to add fields (featured, author, etc.)
   - **Decision point:** Document mutation protocol if schema changes after 10+ articles published

## Follow-Up Actions

1. If articles expand beyond 56, consider implementing pre-commit hooks for image validation
2. Document the exact image design template (colors, fonts, dimensions) used for the 3 examples so future publishers match visual style
3. Create a CI/CD check that validates frontmatter image paths against filesystem before deploy

---

**Resolution:** Codification complete. Agents and skills updated and committed (b98b00b). All 4 skill files referenced and validated. Ready for next articles (53 remaining toward 56 total).
