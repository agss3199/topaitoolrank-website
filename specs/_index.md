# Specifications Index

This directory contains the authority specifications for all domain areas of topaitoolrank.com. Each spec file is detailed enough to be the complete reference for implementation and review.

---

## Track A: WA Sender Enhancement (Phase 2)

| File | Domain | Purpose |
|------|--------|---------|
| [`wa-sender-core.md`](wa-sender-core.md) | Architecture | ToolShell integration, sub-routes, state management, backwards compatibility |
| [`wa-sender-templates.md`](wa-sender-templates.md) | Message Templates | CRUD API, template schema, variable substitution, storage contracts |
| [`wa-sender-contacts.md`](wa-sender-contacts.md) | Contact Management | Import/deduplicate, persistent storage, export with metadata |
| [`wa-sender-history.md`](wa-sender-history.md) | Send History | Message log schema, analytics, filtering/pagination, status tracking |

## Track B: Blog Scalability (Phase 2)

| File | Domain | Purpose |
|------|--------|---------|
| [`blog-indexing.md`](blog-indexing.md) | Discovery & SEO | Tag/category routes, RSS feed, search index generation, sitemap |

## Core Infrastructure

| File | Domain | Purpose |
|------|--------|---------|
| [`database-schema.md`](database-schema.md) | Data Model | All tables (Phase 1 + new Phase 2), RLS policies, indexes, migrations |
| [`design-system.md`](design-system.md) | Visual Design | Colors, typography, spacing, components, accessibility, responsive layout |

---

## Usage

When implementing a feature:

1. Find the relevant spec file in this index
2. Read it thoroughly — it is the authority on what to build
3. Verify your implementation matches every detail
4. If the spec needs updating after implementation, update it in the same commit and document the deviation

When reviewing code:

1. Identify which spec(s) apply
2. Check implementation against spec requirements line by line
3. Flag any deviations (with rationale if documented)
4. Ask: "Does the implementation match the spec?"

---

## Modification Protocol

**Update specs immediately when implementation reveals gaps.** Per `rules/specs-authority.md` § "Specs are documents written to solve problems", not blueprints written and locked. If a spec doesn't cover a case you encountered during implementation, update the spec in the same commit and explain the change in the commit body.

Example:

```
feat(design): modernize auth pages to match branding

Updated button specs to include loading state styling.
Loading buttons use gray-300 background with spinner overlay.
Implemented per spec §7 Components with new loading variant.
Updated design-system.md to document the variant.

Commit: 6e8a7b4
```

