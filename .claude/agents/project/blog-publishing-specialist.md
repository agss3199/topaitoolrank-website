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
- [ ] All frontmatter fields filled
- [ ] Hero image at correct path
- [ ] 2,000+ words (8+ minute read)

**For detailed SEO/AEO validation, see `blog-article-patterns` skill.**

## Common Issues

| Issue | Fix |
|-------|-----|
| Markdown table fails build | Use bullet lists instead of `\| Column \|` syntax |
| Template appears as public article | Ensure template has `status: "draft"` |
| Missing `heroImage` or `pillar` | Build fails; verify all frontmatter fields present |
| Description too short/long | Aim for exactly 155–160 chars |

## References

- **Skill**: `blog-article-patterns` — full SEO/AEO reference and content quality standards
- **Template**: `content/blog/_template.mdx`
- **Examples**: 3 validated articles (ai-integration-guide, chatgpt-vs-claude-comparison, custom-software-development-ai)
- **Guides**: `PUBLISHING_GUIDE.md`, `BLOG_QUICK_START.md`
