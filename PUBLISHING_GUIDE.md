# Blog Publishing Guide

## Quick Start: Publish an Article in 5 Minutes

### 1. Get the Article Prompt

**Location:** Go to your ChatGPT conversation history or saved prompts
- The prompt templates are in: `workspaces/blog-publishing-protocol/` (if you saved them)
- Or use the general blog post prompt structure provided in your workspace briefs

### 2. Generate Article Content

1. Open ChatGPT and paste one of your article prompts
2. Copy the generated content (the article body — ignore system messages)
3. Have it ready to paste

### 3. Copy the Template

```bash
cp content/blog/_template.mdx content/blog/your-article-slug.mdx
```

Replace `your-article-slug` with a URL-safe name (e.g., `ai-automation-2026`, `chatgpt-vs-claude`)

### 4. Fill in Frontmatter

Open `content/blog/your-article-slug.mdx` in your editor and update the YAML frontmatter (top section between the `---` lines):

```yaml
---
title: "Your Article Title Here (50-60 chars, keyword first)"
slug: "your-article-slug"
description: "Meta description 155-160 chars. Include keyword, benefit, CTA."
excerpt: "2-3 sentence summary for the listing page"
publishedAt: "2026-05-02"  # Today's date
updatedAt: "2026-05-02"    # Same as publishedAt for new articles
category: "AI Tools"         # Choose: "AI Tools", "Business", "Development", etc.
tags:
  - "keyword 1"
  - "keyword 2"
  - "keyword 3"
pillar: "ai-integration"     # Choose: ai-integration, business-automation, development
heroImage: "/blog/images/your-article-slug.jpg"  # Must match filename
heroImageAlt: "Descriptive alt text 8-12 words"
heroImageWidth: 1200
heroImageHeight: 630
author:
  name: "Abhishek"
  role: "AI Tool Researcher"
  avatar: "/blog/author/abhishek.jpg"
featured: false              # Set to true for homepage highlight
status: "published"          # Use "draft" to hide the article
readingTime: 8              # Rough estimate (divide word count by 200)
wordCount: 2200             # Approximate
---
```

### 5. Paste Article Content

Delete the template instructions below the frontmatter and paste your ChatGPT content there.

Keep the markdown formatting from ChatGPT (headings, lists, bold, code blocks, etc.)

### 6. Add Hero Image

1. Find or create a 1200×630px image for your article
2. Save it as: `/public/blog/images/your-article-slug.jpg`
   - Replace `your-article-slug` with your article's slug from step 3
   - Image must be JPG format

Where to get images:
- **Free stock photos:** Unsplash, Pexels, Pixabay
- **AI-generated:** DALL-E, Midjourney, Adobe Firefly
- **Custom:** Design one using Canva

### 7. Commit and Push

```bash
# Stage the article file and image
git add content/blog/your-article-slug.mdx
git add public/blog/images/your-article-slug.jpg

# Commit with a clear message
git commit -m "feat(blog): add article title here"

# Push to GitHub
git push
```

### 8. Watch It Deploy

1. Vercel automatically deploys when you push
2. Wait ~90 seconds for the build to complete
3. Check your blog at `https://topaitoolrank.com/blogs` — your article should appear

---

## File Locations Reference

| What | Where |
|---|---|
| **Article template** | `content/blog/_template.mdx` |
| **Your articles** | `content/blog/*.mdx` (create new files here) |
| **Hero images** | `public/blog/images/` (name must match article slug) |
| **Author avatar** | `public/blog/author/abhishek.jpg` |
| **Blog components** | `app/components/blog/` (don't edit) |
| **Blog config** | `app/lib/blog-types.ts`, `app/lib/blog.ts` (don't edit) |

---

## Article Structure Guide

Your articles should follow this structure (from ChatGPT output):

```markdown
## Introduction
[Hook paragraph explaining why this matters]

## Section 1
### Subsection
Details and examples

## Section 2
More content

## Key Takeaway / Conclusion
Summary + call-to-action
```

This automatically formats with proper typography and spacing.

---

## Frontmatter Field Reference

### Required Fields

- **title** (string) — 50-60 characters, keyword first  
  Example: `"AI Integration: Transform Your Business in 2026"`

- **slug** (string) — URL-safe, lowercase, hyphens only, no spaces  
  Example: `"ai-integration-guide"`  
  This becomes: `/blogs/ai-integration-guide`

- **description** (string) — 155-160 characters, meta description for SEO  
  Should include: primary keyword, benefit statement, CTA  
  Example: `"Comprehensive guide to integrating AI tools into your business workflow. Learn proven strategies, avoid common pitfalls, and maximize ROI in 2026."`

- **excerpt** (string) — 2-3 sentences shown on blog listing page  
  Make it compelling to encourage clicks

- **publishedAt** (date) — ISO format `YYYY-MM-DD`  
  Example: `"2026-05-02"`

- **updatedAt** (date) — ISO format, same as publishedAt for new articles

- **category** (string) — Single category displayed as a badge  
  Use existing: `"AI Tools"`, `"Business"`, `"Development"`, `"Strategy"`

- **tags** (array) — 3-5 lowercase tags for search and related articles  
  Example: `["ai integration", "business automation", "workflow optimization"]`

- **pillar** (string) — Content cluster for related articles  
  Use: `"ai-integration"`, `"business-automation"`, or `"development"`

- **heroImage** (string) — Path in `/public/`  
  Example: `"/blog/images/ai-integration-guide.jpg"`

- **heroImageAlt** (string) — Accessibility alt text, 8-12 words, descriptive  
  Example: `"AI integration workflow connecting business processes"`

- **heroImageWidth** (number) — `1200` (standard)

- **heroImageHeight** (number) — `630` (standard)

- **author** (object) — Author info  
  ```yaml
  author:
    name: "Abhishek"
    role: "AI Tool Researcher"
    avatar: "/blog/author/abhishek.jpg"
  ```

- **status** (string) — `"published"` or `"draft"`  
  Drafts don't appear on the site but can be previewed locally

- **readingTime** (number) — Estimated minutes to read  
  Rule of thumb: `wordCount / 200`  
  Example: 2200 words ÷ 200 = 11 minutes

- **wordCount** (number) — Approximate total word count

### Optional Fields

- **featured** (boolean) — `true` to highlight on homepage (default: `false`)

---

## SEO Checklist

Before publishing, check:

- [ ] **Title** — 50-60 chars, includes primary keyword
- [ ] **Description** — 155-160 chars, includes keyword + benefit + CTA
- [ ] **Slug** — URL-safe, lowercase, hyphens, no special characters
- [ ] **Hero image** — 1200×630px, high quality, relevant to topic
- [ ] **Alt text** — Descriptive, 8-12 words, explains the image
- [ ] **Tags** — 3-5 lowercase tags, all relevant to content
- [ ] **Category** — Single category, accurately reflects content
- [ ] **Pillar** — Matches one of: ai-integration, business-automation, development

✓ When all checked, your article is SEO-optimized and ready to rank.

---

## FAQ

### Q: How do I hide an article after publishing?

Change `status: "published"` to `status: "draft"`, commit, and push. The article disappears from the site but remains in your repository.

### Q: Can I update an article after publishing?

Yes. Edit the `.mdx` file, update `updatedAt` to today's date, commit, and push. The site rebuilds automatically.

### Q: Why isn't my article showing up?

Check:
1. **status is "published"** (not "draft")
2. **No typos in slug** (file path must match)
3. **Hero image exists** at the path in `heroImage`
4. **No YAML errors** (colons, quotes, indentation matter)

### Q: How many articles should I publish per day?

There's no limit. Publish 1 per day, 1 per week, or 5 per day—whatever your pace allows. The system scales automatically.

### Q: Can I write articles in a different format (not MDX)?

The system expects MDX (Markdown + React). Plain markdown works fine—just use standard markdown syntax without React components.

### Q: How do related articles get chosen?

Related articles are picked based on:
1. **Same pillar** — Articles in the same cluster (worth +3 points)
2. **Shared tags** — Articles with matching tags (worth +1 point each)
3. **Most recent** — If fewer than 3 matches, pad with recent posts

So if your article has `pillar: "ai-integration"` and tags `["ai", "chatgpt", "automation"]`, related articles will be other ai-integration articles with any of those tags.

### Q: Can I change the author?

Yes, edit the `author` object in frontmatter. The template uses Abhishek, but you can add yourself:

```yaml
author:
  name: "Your Name"
  role: "Your Title"
  avatar: "/blog/author/your-name.jpg"
```

You'll need to add your avatar image to `/public/blog/author/` first.

---

## Publishing Tips

1. **Use clear headlines** — H2 (`## Heading`) for major sections, H3 (`### Subheading`) for details
2. **Keep paragraphs short** — 2-4 sentences per paragraph for web reading
3. **Use lists liberally** — Bullet points and numbered lists break up text
4. **Add code blocks** for technical articles (markdown syntax highlighting included)
5. **Tables work great** — Use for comparison or structured data
6. **External links** — Auto-open in new tabs with security headers
7. **Images in articles** — Use markdown syntax: `![alt text](image-url)`

---

## What's Next After Publishing?

After your article goes live:

1. **Share on social media** — Copy the article URL and share on Twitter, LinkedIn
2. **Monitor engagement** — Check if readers are finding the article
3. **Update if needed** — Found a typo or error? Edit, commit, push. The site re-deploys automatically.
4. **Keep publishing** — Build momentum with consistent, valuable content

---

## Support

If you hit issues:

1. **Check the template** at `content/blog/_template.mdx` — it has detailed examples
2. **Review a working article** at `content/blog/ai-integration-guide.mdx`
3. **Check file paths** — Image must exist, slug must match filename
4. **Verify YAML syntax** — Use proper indentation and quoting in frontmatter

Happy publishing! 🚀
