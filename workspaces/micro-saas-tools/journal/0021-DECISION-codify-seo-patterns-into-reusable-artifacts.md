---
type: DECISION
slug: codify-seo-patterns-into-institutional-knowledge
date: 2026-05-09
---

# Decision: Codify SEO Implementation Patterns as Institutional Knowledge

## Trigger

Red team validation of 11 SEO optimization todos produced clear, reusable patterns worth capturing for future projects:
- Metadata export patterns for Next.js App Router
- JSON-LD schema rendering architecture
- Foundation SEO items commonly neglected (404, root metadata, robots.txt, favicon, console cleanup)
- Red team methodology improvements (grep-first verification, finding classification)
- Schema testing strategy (source-grep vs behavioral)

Rather than let this knowledge remain in journal entries, codify it into artifacts that the next session (and other projects) can use.

## Artifacts Created

### 1. SEO Implementation Skill
**File:** `.claude/skills/project/seo-implementation/SKILL.md`
**Content:**
- Metadata export pattern (title, description, keywords, openGraph, twitter, robots, canonical)
- JSON-LD schema component architecture (BreadcrumbList, FAQPage, Organization, CollectionPage)
- Schema rendering pattern on pages (hardcoded props, no user input)
- Foundation SEO Checklist (404, root metadata, robots.txt, og:image, console cleanup, favicon, links, auth protection, sitemap)
- Testing strategy (source-grep for server components, behavioral testing upgrade path)
- Common pitfalls (canonical API, relative URLs, generic descriptions, forgotten auth noindex)

**Why:** These patterns repeat on every tool page (9 pages in this project, will grow as tools are added). The checklist prevents "obvious neglected items" from surfacing as gaps in future audits. Future projects can copy this pattern wholesale.

### 2. Red Team Verification Rule
**File:** `.claude/rules/project/red-team-verification.md`
**Content:**
- MUST grep source code before reporting feature missing (not test-file existence)
- MUST distinguish MISSING / BROKEN / UNTESTED findings (different fixes, different severities)
- MUST include verification evidence (grep command, output, line numbers, root cause, remediation)
- Verification hierarchy: code inspection first, test coverage second
- Verification checklist for findings
- Examples from this project (FAQSchema false positive, 404 missing, og:image broken)
- Red team validation protocol for future runs

**Why:** The "FAQPage schema completely missing" finding (when code actually existed, just untested) wasted an entire validation round. This is a class of bugs in the red team process, not one-off failures. Codifying the verification hierarchy prevents recurrence.

### 3. SEO Foundation Checklist Rule
**File:** `.claude/rules/project/seo-foundation-checklist.md`
**Content:**
- Custom 404 page requirement (template included)
- Root metadata description specificity (not generic)
- robots.txt crawl control (/api/, /auth/ disallow)
- og:image validation (must resolve, or remove)
- Console cleanup (no debug in production)
- Favicon fallback strategy (SVG + ICO or SVG-only documented)
- Internal link functionality (spot-check breadcrumbs, nav)
- Auth page protection (robots index: false)
- Sitemap completeness & freshness (not volatile dates)
- Pre-deployment checklist

**Why:** Practical audit (journal 0019) found these nine items aren't part of "11 SEO todos" but are standard SEO practice. Leaving them as gaps in future audits is avoidable. This rule captures them as expected baseline.

## Rationale

### Codification vs. Journal-Only

**Why not keep knowledge in journals?**
- Journals are historical records (what happened)
- Skills/rules are operational guides (what to do next time)
- Journals decay in relevance after a session; rules are timeless

**Why codify now?**
- Patterns are stable (not experimental, proven in a complete project cycle)
- Knowledge is complete (11 todos + 3 rounds of validation = mature understanding)
- Reuse is immediate (SEO work is ongoing; these patterns apply to every new tool/page)
- Prevention is better than discovery (next session won't need to rediscover the verification hierarchy)

### Scope: Project-Specific vs. Global

These artifacts are in `.claude/rules/project/` and `.claude/skills/project/`:
- **Not global** (`rules/` root or `skills/01-core-sdk/`) — these are specific to this project's domain (micro-SaaS tools, Next.js App Router)
- **Project-scoped** — they evolve as the project grows (tools added, SEO strategy refined)
- **Transferable** — future projects with similar architecture can reference them

If Kailash SDK work requires similar metadata/schema patterns, those would be codified in global skills. This project's specific patterns stay local.

## Implementation Details

### Skill File Structure
- Metadata export pattern with example
- JSON-LD schema component examples
- Foundation checklist with specific next steps
- Testing strategy with cost/benefit tradeoff
- Common pitfalls with corrections

### Rule File Structure
- MUST rules with specific guidance
- Examples from this project (concrete, not abstract)
- Verification checklists (actionable)
- Anti-patterns (MUST NOT)
- Root cause analysis (why the rule exists)

## Future Refinement Triggers

These artifacts should be updated when:
1. **New SEO patterns discovered** (e.g., "need video schema on tool pages")
2. **Existing patterns refined** (e.g., "source-grep tests upgraded to behavioral testing")
3. **New tools added** and reveal pattern gaps (e.g., "tools with regional content need hreflang")
4. **Next project iteration** refines the checklist (e.g., "added analytics configuration requirement")

These are living documents, not frozen knowledge.

## Session Impact

**Before codification:** Knowledge was distributed across 6 journal entries. Future sessions would need to search/read all of them to understand SEO patterns.

**After codification:** 
- `.claude/skills/project/seo-implementation/SKILL.md` is the entry point for "how do I implement SEO in this project"
- `.claude/rules/project/red-team-verification.md` prevents verification methodology bugs
- `.claude/rules/project/seo-foundation-checklist.md` prevents scope creep gaps

**Result:** Next SEO-related work can reference these artifacts directly instead of rediscovering patterns.
