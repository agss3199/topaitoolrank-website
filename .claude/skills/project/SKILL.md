# Project Skills

## Blog Publishing System

- **[blog-article-patterns](./blog-article-patterns/)** — Production-ready blog article publishing patterns for Top AI Tool Rank. MDX-based content system with validated SEO and AEO (AI search) optimization. Progressive disclosure: read `SKILL.md` for overview, then dive into `seo-checklist.md`, `aeo-patterns.md`, or `content-quality.md` for detailed patterns. Complete publishing workflow: copy template → edit frontmatter → paste ChatGPT content → add hero image → git push → Vercel deploy (~90 seconds). 3 validated example articles (2,150–3,600 words). Red team validated: 0 critical, 0 high findings.

  Sub-files:
  - **[seo-checklist.md](./blog-article-patterns/seo-checklist.md)** — Title/description optimization, heading hierarchy, structured data, OG tags for Google/Bing ranking
  - **[aeo-patterns.md](./blog-article-patterns/aeo-patterns.md)** — Benchmarks, decision frameworks, citation-friendly content for LLM (Claude/ChatGPT) discoverability
  - **[content-quality.md](./blog-article-patterns/content-quality.md)** — Authenticity standards, value delivery patterns, article structure templates

## WA Sender Tool

- **[wa-sender-patterns](./wa-sender-patterns.md)** — Full-stack state persistence for bulk messaging. Three-layer model: React auto-save → Next.js API validation → Supabase PostgreSQL. Includes patterns for exhaustive useEffect dependencies, session restoration on mount, UUID validation, input length constraints, structured error logging, and idempotent PostgreSQL migrations (DROP POLICY IF EXISTS, ADD COLUMN IF NOT EXISTS). Production-validated (red team convergence: 0 critical, 0 high findings).
