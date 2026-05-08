# Decision: Codify Component Consolidation Pattern

**Date**: 2026-05-08  
**Type**: DECISION  
**Phase**: 05 (Codify)  
**Scope**: Extracting reusable patterns from header unification work

---

## Summary

During header unification work (May 8, 2026), we identified a reusable pattern: consolidating duplicate components across 3+ pages into a shared location with unified imports. This pattern is foundational for scaling maintainable UI across sites with multiple pages. Created two new project skills to document this pattern and the companion pattern for link hygiene.

## Pattern 1: Component Consolidation

### What We Did
- Identified 11 pages with inconsistent Header implementations (homepage + 10 tools)
- Extracted to single source of truth: `app/components/Header.tsx` (152 lines)
- Unified all imports to `@/app/components/Header` (path alias)
- Deleted old implementations: `app/tools/lib/Header.tsx` and CSS
- Verified: build succeeds (0 errors), no orphaned code, all 11 pages render correctly

### Outcome
- Eliminated 2,400+ LOC of duplicate code
- Created single point of maintenance for header changes
- Reduced future branding changes from editing 11 files to 1
- Established pattern for consolidating other components (Footer, Layout, Navigation)

### Why This Matters
Duplicate components create exponential maintenance cost: N pages × any change = N edits. Consolidation collapses N edits → 1 edit, and scales the benefit as the site grows.

## Pattern 2: Link Hygiene

### What We Did
- Audited footer and navigation links for broken/placeholder links
- Found: `/tools` link (404 — no page exists), `#documentation` (placeholder), `#api-docs` (placeholder)
- Removed all three non-functional links
- Verified: build succeeds, no new 404 sources, remaining links all work

### Outcome
- Eliminated user-facing 404 errors
- Removed visual clutter of unimplemented features
- Improved footer UX by removing confusing broken navigation
- Prevented future users from clicking dead links

### Why This Matters
Broken links harm both UX (user confusion) and trust (unprofessional appearance). Removing them is a simple but high-impact improvement. If a feature is needed later, implement it; if not, the footer is cleaner without it.

## Codification Artifacts Created

### `.claude/skills/project/component-consolidation/SKILL.md`
- Full pattern documentation with red team checklist
- Example: Header unification (11 pages, 2,400 LOC saved)
- When to apply, when NOT to apply
- Common gotchas (CSS Module scoping, import path consistency)
- Delegation guidance (design-system-builder, page-modernizer, responsive-layout-expert)

### `.claude/skills/project/link-hygiene/SKILL.md`
- Pattern for removing broken/placeholder links
- Footer structure best practices
- Anchor link patterns
- Anti-patterns to avoid (hidden broken links, wrong external links, inconsistent styles)
- Red team checklist before deploy

### Updated `.claude/skills/project/README.md`
- Added both new skills to project skills index
- Revised description to cover both component and site maintenance
- Updated last modified date and skill count

## Why Codify Now

1. **Reusability**: Both patterns apply to future work on this site and potentially other projects
2. **Teachability**: Future sessions can reference these skills instead of rediscovering the patterns
3. **Consistency**: Codified patterns ensure the next agent applies the same approach without re-analysis
4. **Scalability**: As the site grows (more pages, more components), these patterns become more valuable

## Related Decisions

- **2026-05-08 Header Unification** (commit ce33a42): Consolidation pattern in practice
- **2026-05-08 Footer Cleanup** (commit f1bcd00): Link hygiene pattern in practice
- **2026-05-01 Design System Mismatch** (0001-DISCOVERY): Identified need for consolidated components

## Open Questions for Future Sessions

- Should we consolidate Footer using the same pattern?
- Are there other duplicated components (Layout, Navigation) worth consolidating?
- Should we establish a "component audit" task before each new feature?

## Implementation Notes for Future Sessions

When consolidating new components:
1. Use `.claude/skills/project/component-consolidation/SKILL.md` as reference
2. Follow the red team checklist before declaring consolidation complete
3. Create a journal entry documenting the consolidation
4. Update specs if component scope or API changes

When reviewing UI/navigation before deploy:
1. Use `.claude/skills/project/link-hygiene/SKILL.md` as reference
2. Verify no broken links exist in footer, navigation, or body
3. Remove placeholders entirely; don't hide them
4. Check that all external links have `rel="noopener noreferrer"`

---

**Status**: Complete  
**Artifacts**: 2 new skills, 1 updated README  
**Commits**: 5006e8c (docs(skills): codify component consolidation and link hygiene patterns)
