# Project Skills

## Blog Publishing System

- **[blog-article-patterns](./blog-article-patterns/)** — Production-ready blog article publishing patterns for Top AI Tool Rank. MDX-based content system with validated SEO and AEO (AI search) optimization. Progressive disclosure: read `SKILL.md` for overview, then dive into `seo-checklist.md`, `aeo-patterns.md`, or `content-quality.md` for detailed patterns. Complete publishing workflow: copy template → edit frontmatter → paste ChatGPT content → add hero image → git push → Vercel deploy (~90 seconds). 3 validated example articles (2,150–3,600 words). Red team validated: 0 critical, 0 high findings.

  Sub-files:
  - **[seo-checklist.md](./blog-article-patterns/seo-checklist.md)** — Title/description optimization, heading hierarchy, structured data, OG tags for Google/Bing ranking
  - **[aeo-patterns.md](./blog-article-patterns/aeo-patterns.md)** — Benchmarks, decision frameworks, citation-friendly content for LLM (Claude/ChatGPT) discoverability
  - **[content-quality.md](./blog-article-patterns/content-quality.md)** — Authenticity standards, value delivery patterns, article structure templates

## WA Sender Tool

- **[wa-sender-patterns](./wa-sender-patterns.md)** — Full-stack state persistence for bulk messaging. Three-layer model: React auto-save → Next.js API validation → Supabase PostgreSQL. Includes patterns for exhaustive useEffect dependencies, session restoration on mount, UUID validation, input length constraints, structured error logging, and idempotent PostgreSQL migrations (DROP POLICY IF EXISTS, ADD COLUMN IF NOT EXISTS). Production-validated (red team convergence: 0 critical, 0 high findings).

## Responsive Design & Accessibility

- **[responsive-css-patterns](./responsive-css-patterns.md)** — Production-ready responsive design patterns for micro-SaaS tools. Three core patterns: (1) Fixed header compensation via scroll-padding-top + skip-to-content link for anchor links and keyboard navigation; (2) CSS cascade safety rule — explicit re-declaration of animation properties in media queries; (3) Responsive breakpoint system using CSS variables (640px, 768px, 1024px, 1440px). Includes RESPONSIVE-TESTING.md checklist with 5 viewport sizes and per-page validation. Red team validated: 40+ spec assertions verified, 0 critical findings.

  Sub-files:
  - **[RESPONSIVE-TESTING.md](../../../RESPONSIVE-TESTING.md)** — Testing protocol with viewport table and per-page checklists (Content Layout, Navigation, Animations, Forms, Images)

## Security & Input Validation

See `.claude/agents/project/` for **security-validation-specialist** agent — implements comprehensive field validation (explicit character rejection), framework logger adoption, XSS injection unit tests (26+ cases), and pre-existing failure remediation per zero-tolerance Rule 1.
