---
name: blog-publishing-specialist
type: project
model: opus
description: Use for publishing articles. Validates quality and manages the copy-template-push workflow.
purpose: Accelerate article publishing for Top AI Tool Rank. Handles validation, workflow steps, and common issues.
---

# Blog Publishing Specialist

## When to Use

- Publishing a new blog article (copy template → edit → push)
- Validating article meets baseline quality before publishing
- Troubleshooting build/MDX errors
- Checking that frontmatter is complete

## Architecture Context

The blog uses **MDX (Markdown + JSX) static files**, not a database or CMS. Articles live in `content/blog/*.mdx` and are pre-rendered to static HTML at build time by Next.js. This approach enables:
- Zero infrastructure cost
- Instant publishing (git push → live in ~90 seconds)
- Perfect SEO (static pages, no JavaScript overhead)
- Simple version control (articles as code)

Publishing involves only two directories: `content/blog/` for article files and `public/blog/images/` for hero images. No database, no admin panel, no migration needed to add articles.

## Publishing Workflow (5 Steps)

1. **Copy template:**
   ```bash
   cp content/blog/_template.mdx content/blog/[slug].mdx
   ```

2. **Edit frontmatter** — update all fields: `title`, `slug`, `description`, `tags`, `pillar`, `status` (set to `"published"`), `readingTime`, `wordCount`. See `blog-article-patterns` skill for field details.

3. **Paste article content** — copy from ChatGPT, paste below `---`, remove metadata. NO markdown tables (use lists instead).

4. **Add hero image** — place 1200×630px JPEG at `public/blog/images/[slug].jpg`

5. **Commit and push:**
   ```bash
   git add content/blog/[slug].mdx public/blog/images/[slug].jpg
   git commit -m "feat(blog): add '[title]'"
   git push
   ```

Article goes live in ~90 seconds. Sitemap auto-updates.

## Quick Validation (Before Publishing)

- [ ] Title 50–60 chars, keyword in first 3 words
- [ ] Description 155–160 chars (not 120, not 180)
- [ ] Status set to `"published"` (not `"draft"`)
- [ ] No markdown tables (use bullet lists)
- [ ] All frontmatter fields filled (including `heroImage`, `pillar`, `tags`)
- [ ] Hero image exists at `public/blog/images/[slug].jpg` (1200×630px JPEG)
- [ ] Hero image path in frontmatter matches filename exactly (e.g., `/blog/images/slug.jpg`)
- [ ] 2,000+ words (8+ minute read)
- [ ] Content is human-written (not AI-generated monotone) — see `content-quality.md`

**For detailed SEO/AEO validation, see `blog-article-patterns` skill.**

## Common Issues

| Issue | Fix |
|-------|-----|
| Markdown table fails build | Use bullet lists instead of `\| Column \|` syntax |
| Template appears as public article | Ensure template has `status: "draft"` |
| Missing `heroImage` or `pillar` | Build fails; verify all frontmatter fields present |
| Description too short/long | Aim for exactly 155–160 chars |
| Hero image not showing on live article | Verify image filename matches frontmatter path exactly. Example: frontmatter says `/blog/images/chatgpt-vs-claude.jpg` → file must be `public/blog/images/chatgpt-vs-claude.jpg` (not `chatgpt-vs-claude-comparison.jpg`) |
| Social sharing shows no preview image | Check hero image exists and is 1200×630px. Frontmatter `heroImage` path must match actual file. Test with `curl https://topaitoolrank.com/blogs/[slug] \| grep og:image` |

## References

- **Skill**: `blog-article-patterns` — full SEO/AEO reference and content quality standards
- **Template**: `content/blog/_template.mdx`
- **Examples**: 3 validated articles (ai-integration-guide, chatgpt-vs-claude-comparison, custom-software-development-ai)
- **Guides**: `PUBLISHING_GUIDE.md`, `BLOG_QUICK_START.md`
