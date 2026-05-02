# Blog Article Patterns — SEO & AEO Optimization

**Version:** 1.0  
**Last Updated:** 2026-05-02  
**Status:** Validated (red team: 0 critical, 0 high findings)

## Overview

Production-ready patterns for publishing blog articles on Top AI Tool Rank. Articles use MDX (Markdown + JSX) stored in `content/blog/*.mdx`, statically generated at build time by Next.js.

## Article Lifecycle

```
1. Copy template (_template.mdx → article-slug.mdx)
2. Edit frontmatter (title, slug, description, tags, pillar, status)
3. Paste ChatGPT article content
4. Add 1200×630px hero image
5. git push
6. Vercel deploys (~90 seconds)
7. Article live at /blogs/[slug]
8. Sitemap auto-updates
```

## Frontmatter Schema

Every article requires YAML frontmatter with these fields:

| Field | Length | Example |
|-------|--------|---------|
| `title` | 50-60 chars | "AI Integration: Transform Your Business in 2026" |
| `slug` | URL-safe | "ai-integration-guide" |
| `description` | 155-160 chars | "Complete guide to integrating AI tools... maximize ROI..." |
| `excerpt` | 2-3 sentences | "Discover how to strategically integrate AI..." |
| `status` | "published"/"draft" | "published" (only for public articles) |
| `category` | Single value | "AI Tools" |
| `tags` | 3-5 lowercase | ["ai integration", "business automation"] |
| `pillar` | Content cluster | "ai-integration" |
| `heroImage` | Path | "/blog/images/slug.jpg" (1200×630px) |
| `featured` | Boolean | false (or true for homepage) |

**Critical rule:** `status: "published"` ONLY for public articles; use `"draft"` for templates.

## Optimization Layers

### 1. SEO (Human Search — Google, Bing)

See `seo-checklist.md` for detailed patterns:

- **Title optimization** (50-60 chars, keyword first)
- **Meta description** (155-160 chars, keyword + benefit + CTA)
- **Heading hierarchy** (H2/H3 structure, scroll-margin-top)
- **Structured data** (JSON-LD BlogPosting schema)
- **Open Graph & Twitter tags** (social previews)

**Example:** "ChatGPT vs Claude: Head-to-Head Comparison (2026)" = 51 chars ✅

### 2. AEO (AI Search — Claude, ChatGPT, Perplexity)

See `aeo-patterns.md` for detailed patterns:

- **Structured data density** (benchmarks, comparisons, frameworks, case studies)
- **AI-preferred patterns** (numbered lists, separate sentences, explicit reasoning)
- **Citation-friendly content** (claims have supporting data in same section)
- **Real numbers** (specific data, not vague generalizations)

**Example:** "$482K savings" is extractable; "good ROI" is not.

### 3. Content Quality (Human-Written, High-Value)

See `content-quality.md` for validation standards:

- **Authenticity** (nuanced tone, specific examples, natural voice)
- **Value delivery** (answers reader questions, practical frameworks)
- **Article structures** (comparison, tutorial, ROI, decision patterns)

**Example:** "ChatGPT wins on X because..., Claude wins on Y because..." is high-value; "both are good" is not.

## Validated Examples

All 3 production articles pass full validation (red team: 0 critical findings):

| Article | Words | Read | SEO Title | Status |
|---------|-------|------|-----------|--------|
| AI Integration Guide | 2,150 | 8 min | 49 chars ✅ | Published |
| ChatGPT vs Claude | 3,200 | 12 min | 51 chars ✅ | Featured |
| Custom Software Dev | 3,600 | 14 min | 60 chars ✅ | Featured |

All include 3+ benchmarks/frameworks, real numbers, concrete examples.

## Quick Reference

**Before publishing:**
- [ ] Title 50–60 chars, keyword in first 3 words
- [ ] Description 155–160 chars, includes keyword + benefit
- [ ] 5–10 H2 sections, 10–15 H3 subsections
- [ ] 3+ benchmarks/comparisons/frameworks
- [ ] Real numbers, specific examples (not vague)
- [ ] Status set to "published"
- [ ] Hero image at correct path
- [ ] 2,000+ words (8+ minute read)
- [ ] No markdown tables (use lists)

## Topics

- **[seo-checklist](./seo-checklist.md)** — Title/description optimization, heading hierarchy, structured data, OG tags
- **[aeo-patterns](./aeo-patterns.md)** — Structured data for LLMs, decision frameworks, citation-friendly content
- **[content-quality](./content-quality.md)** — Authenticity, value delivery, article structure patterns

## References

- **Agent**: `blog-publishing-specialist.md` — workflow steps and common issues
- **Template**: `content/blog/_template.mdx`
- **Examples**: `ai-integration-guide.mdx`, `chatgpt-vs-claude-comparison.mdx`, `custom-software-development-ai.mdx`
- **Guides**: `PUBLISHING_GUIDE.md`, `BLOG_QUICK_START.md`
