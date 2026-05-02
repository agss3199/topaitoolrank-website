# User Flow: Publishing a New Article (Zero Code Changes)

**Scope:** End-to-end flow for publishing Article 4 (and beyond, up to Article 56) without any changes to the blog system, homepage, design system, or core website.

**Preconditions:**
- Blog infrastructure is deployed (MDX parsing, dynamic routes, sitemap generation)
- Hero image generation tooling is in place
- SEO/AEO validation patterns are documented

---

## Flow Overview

```
1. Publisher prepares article content         (30-45 min)
   └─ Paste ChatGPT output into MDX
   └─ Fill in frontmatter (title, slug, tags)
   └─ Generate hero image (1200×630px JPEG)
2. Publisher validates article quality        (10 min)
   └─ SEO checklist (title, description, keywords)
   └─ AEO checklist (benchmarks, frameworks, citations)
   └─ Image validation (filename matching, size)
3. Commit article to git                      (2 min)
4. Vercel auto-deploys                        (90 sec)
5. Article is live with full SEO              (instant)
   └─ Dynamic route works
   └─ Sitemap includes article
   └─ Social preview works (OG tags)
   └─ Google can crawl and index
```

---

## Detailed Steps

### 1. Publisher Prepares Article

**Source:** ChatGPT output or similar AI tool  
**Format:** Markdown or plain text

**Publisher does:**
1. Copy ChatGPT article content
2. Create new MDX file: `content/blog/{slug}.mdx`
3. Add frontmatter (YAML header)
4. Paste content below frontmatter
5. Create/save hero image to `public/blog/images/{slug}.jpg`

**File structure:**
```
content/blog/
  ai-agent-frameworks.mdx              ← Article 4
  ml-ops-pipeline.mdx                  ← Article 5
  ...
  ai-integration-guide.mdx             ← Already published (Article 1)
  chatgpt-vs-claude-comparison.mdx     ← Already published (Article 2)
  custom-software-development-ai.mdx   ← Already published (Article 3)

public/blog/images/
  ai-agent-frameworks.jpg              ← Hero image (1200×630px)
  ml-ops-pipeline.jpg
  ai-integration-guide.jpg
  chatgpt-vs-claude-comparison.jpg
  custom-software-development-ai.jpg
```

### 2. Create Article File

**File:** `content/blog/ai-agent-frameworks.mdx`

```markdown
---
title: "Building AI Agent Frameworks: A Complete Guide"
slug: "ai-agent-frameworks"
description: "Learn how to design and build production-ready AI agent frameworks that handle complex workflows, function calling, and multi-step reasoning."
excerpt: "AI agents are the next frontier of LLM applications. This guide covers framework design patterns, tool integration, and production deployment strategies."
publishedAt: "2026-05-15"
updatedAt: "2026-05-15"
category: "AI Architecture"
tags:
  - "AI Agents"
  - "LLM Frameworks"
  - "Production AI"
  - "Multi-Step Workflows"
pillar: "ai-integration"
heroImage: "/blog/images/ai-agent-frameworks.jpg"
heroImageAlt: "Diagram showing AI agent architecture with tools, memory, and reasoning loops"
heroImageWidth: 1200
heroImageHeight: 630
author:
  name: "Abhishek"
  role: "AI Tool Researcher"
  avatar: "/blog/author/abhishek.jpg"
featured: false
status: "published"
readingTime: 12
wordCount: 3200
---

# Building AI Agent Frameworks

[Article content from ChatGPT, pasted here...]

## Key Concepts

1. **Agent Definition**
   - Components (LLM, tools, memory)
   - Reasoning patterns (ReAct, Chain-of-Thought)
   - Tool calling mechanism

2. **Framework Design**
   - Function signatures
   - Error handling
   - Graceful degradation

3. **Production Patterns**
   - Monitoring and observability
   - Cost optimization
   - Rate limiting and queueing

[More content...]
```

**Frontmatter rules:**
- `slug`: URL-safe identifier, matches filename (without `.mdx`)
- `title`: 50-60 characters, keyword-first
- `description`: 155-160 characters, includes keyword + benefit + CTA
- `heroImage`: **MUST match the filename exactly** (`/blog/images/{slug}.jpg`)
- `publishedAt`: ISO date (YYYY-MM-DD)
- `status`: `"published"` to include in build, `"draft"` to exclude
- `pillar`: Groups related articles (e.g., "ai-integration" groups all AI-related articles)
- `tags`: 3-5 keywords for SEO + AEO

**Critical rule:** `heroImage` path MUST match the actual file location. Mismatch = image fails to load on social shares (30-40% CTR reduction).

### 3. Generate Hero Image

**Specs:**
- Size: 1200×630 pixels (OpenGraph standard)
- Format: JPEG (25-30KB typical)
- Quality: High-contrast, readable text, relevant to topic

**Tools (choose one):**
- Midjourney: `/imagine [topic] LinkedIn article header`
- DALL-E 3: `"Create a 1200x630px hero image for an article about [topic]"`
- Canva: Use 1200×630px template, add text overlay
- Screenshot: Take screenshot from video, crop to 1200×630px

**Example command (DALL-E 3):**
```
Create a 1200x630 pixel hero image for a technical blog article titled 
"Building AI Agent Frameworks: A Complete Guide". The image should show 
abstract AI architecture elements: nodes, connections, and reasoning loops. 
Use blue and purple gradients. Professional, clean design. 16:9 aspect ratio.
```

**Save location:**
```
public/blog/images/ai-agent-frameworks.jpg
```

**Filename rule:** Must match `{slug}` from the MDX file exactly.

### 4. Validate Article Quality

**SEO Checklist** (for Google ranking):

- [ ] Title includes primary keyword (e.g., "AI Agent Frameworks")
- [ ] Title is 50-60 characters (fits in SERP)
- [ ] Description is 155-160 characters (fits in Google preview)
- [ ] Description includes keyword + benefit + CTA
- [ ] At least 2000 words (minimum for ranking)
- [ ] H1 (article title) appears exactly once at top
- [ ] H2 subheadings include keywords
- [ ] First paragraph mentions primary keyword
- [ ] Internal links to related articles (use `/blogs/[slug]`)
- [ ] Image has descriptive alt text
- [ ] No keyword stuffing (reads naturally)

**AEO Checklist** (for LLM-powered search — Perplexity, ChatGPT, etc.):

- [ ] Article cites specific benchmarks or frameworks (not generic advice)
- [ ] Article includes comparison tables or lists (scannable for LLMs)
- [ ] Article mentions concrete tools, libraries, or services
- [ ] Article includes real-world use cases or examples
- [ ] Article has clear takeaways or summary
- [ ] Headings are questions or clear topic statements
- [ ] Article provides novel insights (not just rehashing existing content)

**Image Checklist:**

- [ ] Image is 1200×630 pixels
- [ ] Image is JPEG format (not PNG)
- [ ] File size is 25-35KB
- [ ] Filename matches slug exactly: `/blog/images/{slug}.jpg`
- [ ] Alt text is descriptive (8-12 words)
- [ ] Image is readable at 300px width (mobile preview)
- [ ] Image has strong color contrast (readable in thumbnails)

**Example validation command:**
```bash
# Check image dimensions and size
identify public/blog/images/ai-agent-frameworks.jpg
# Output: public/blog/images/ai-agent-frameworks.jpg JPEG 1200x630 25KB

# Check frontmatter validity
grep -E "^(slug|title|description|heroImage)" content/blog/ai-agent-frameworks.mdx
# Output should show slug and heroImage match

# Check article reads as valid MDX
npm run build  # Next.js will error if frontmatter is invalid
```

### 5. Commit Article to Git

```bash
git add content/blog/ai-agent-frameworks.mdx
git add public/blog/images/ai-agent-frameworks.jpg
git commit -m "docs: publish article 'Building AI Agent Frameworks: A Complete Guide'

Frontmatter:
- slug: ai-agent-frameworks
- readingTime: 12 minutes
- wordCount: 3200 words
- category: AI Architecture
- tags: AI Agents, LLM Frameworks, Production AI

Image: public/blog/images/ai-agent-frameworks.jpg (1200×630px, 28KB)

SEO validation:
- [x] Title keyword-first, 60 chars
- [x] Description 157 chars, includes CTA
- [x] Internal links to 3 related articles
- [x] H1, H2s include keywords

AEO validation:
- [x] Cites Anthropic and OpenAI benchmarks
- [x] Comparison table (ReAct vs Chain-of-Thought)
- [x] Real-world examples (customer support bots)
- [x] Clear takeaways section"

git push origin feature/publish-article-4
```

**PR description:**
- Title: `docs: publish article about AI Agent Frameworks`
- Body: Article metadata (title, slug, word count, reading time)
- Validation: Checklist of SEO + AEO + image checks (all passing)

### 6. Vercel Deploys

**Deployment process:**
1. GitHub webhook triggers Vercel build
2. Next.js runs `npm run build`
3. Build step:
   - Reads all `.mdx` files from `content/blog/`
   - Parses frontmatter
   - Filters by `status: "published"`
   - Generates static pages for each article
   - Generates dynamic sitemap
4. Build succeeds
5. Deployment published to production
6. Article is live at `https://topaitoolrank.com/blogs/ai-agent-frameworks`

**What happens automatically:**
- Dynamic route `app/blogs/[slug]/page.tsx` renders the article
- Sitemap includes new article URL
- Open Graph meta tags are generated from frontmatter
- Twitter Card meta tags are generated
- JSON-LD schema is injected (for Google Rich Snippets)
- Hero image is fetched and cached
- Social preview works (og:image, og:title, og:description)

### 7. Article is Live

**Verification steps:**

1. **Article page loads:**
   ```bash
   curl https://topaitoolrank.com/blogs/ai-agent-frameworks
   # Status: 200
   # Body includes: <h1>Building AI Agent Frameworks</h1>
   ```

2. **SEO meta tags present:**
   ```bash
   curl https://topaitoolrank.com/blogs/ai-agent-frameworks | grep -E "<title>|og:image|og:description"
   # <title>Building AI Agent Frameworks: A Complete Guide | Top AI Tool Rank</title>
   # <meta property="og:image" content="https://topaitoolrank.com/blog/images/ai-agent-frameworks.jpg">
   # <meta property="og:description" content="Learn how to design and build...">
   ```

3. **Sitemap includes article:**
   ```bash
   curl https://topaitoolrank.com/sitemap.xml | grep ai-agent-frameworks
   # <url><loc>https://topaitoolrank.com/blogs/ai-agent-frameworks</loc>...
   ```

4. **Related articles appear:**
   - Algorithm scores articles by matching `pillar` and `tags`
   - "3 related articles" section shows at bottom
   - Links to other "ai-integration" pillar articles

5. **Social preview works:**
   - Share on LinkedIn: image, title, description preview
   - Share on Twitter: Twitter Card shows
   - Share on WhatsApp: title + image + link preview

---

## Template (For Quick Copy-Paste)

**Create a new article using this template:**

```markdown
---
title: "[50-60 char title, keyword-first]"
slug: "[url-safe-slug-matching-filename]"
description: "[155-160 char: keyword + benefit + CTA]"
excerpt: "[2-3 sentence summary shown on listing page]"
publishedAt: "[YYYY-MM-DD]"
updatedAt: "[YYYY-MM-DD]"
category: "[e.g., AI Architecture, Tools, Frameworks]"
tags:
  - "[primary keyword]"
  - "[secondary keyword]"
  - "[tertiary keyword]"
  - "[fourth keyword]"
  - "[fifth keyword]"
pillar: "[e.g., ai-integration, custom-software, ai-tools]"
heroImage: "/blog/images/[slug].jpg"
heroImageAlt: "[8-12 word descriptive alt text]"
heroImageWidth: 1200
heroImageHeight: 630
author:
  name: "Abhishek"
  role: "AI Tool Researcher"
  avatar: "/blog/author/abhishek.jpg"
featured: false
status: "published"
readingTime: [estimated reading time in minutes]
wordCount: [total word count]
---

# [Title Here]

[Article content...]

## Section 1

[Content...]

## Section 2

[Content...]

## Conclusion

[Summary and takeaways...]
```

**Before publishing:**
1. Save file as `content/blog/[slug].mdx`
2. Save hero image as `public/blog/images/[slug].jpg` (1200×630px)
3. Run SEO + AEO checklist
4. Run `npm run build` locally (verify no errors)
5. Commit both files with validation notes
6. Push to GitHub (Vercel auto-deploys)

---

## Validation Checklist

Before publishing Article 4 (or any article):

- [ ] Frontmatter is valid YAML
- [ ] `slug` matches filename (no `.mdx` extension)
- [ ] `heroImage` path matches actual file location
- [ ] Image is 1200×630px JPEG
- [ ] Title is 50-60 characters
- [ ] Description is 155-160 characters
- [ ] At least 2000 words in article body
- [ ] H1 appears exactly once (article title)
- [ ] H2 subheadings are descriptive
- [ ] First paragraph includes primary keyword
- [ ] Internal links to 2-3 related articles
- [ ] No keyword stuffing (reads naturally)
- [ ] Image alt text is 8-12 words
- [ ] Reading time estimated correctly
- [ ] Word count matches actual content
- [ ] Status is set to `"published"` (not `"draft"`)
- [ ] Local build succeeds: `npm run build`
- [ ] No Markdown syntax errors

---

## What Changed vs What Didn't

### Changed (minimal, content-only)
- Added `content/blog/ai-agent-frameworks.mdx`
- Added `public/blog/images/ai-agent-frameworks.jpg`

### Unchanged (fully automatic)
- Blog system (`app/blogs/[slug]/page.tsx`)
- Blog listing page (`app/blogs/page.tsx`)
- Blog navigation (uses shared nav component)
- Design system (`app/globals.css`)
- Sitemap generation (auto-discovers articles)
- Social meta tags (auto-generated from frontmatter)
- Routing (dynamic route handles all articles)
- SEO (Google can crawl and index automatically)

---

## Publishing 56 Articles (Timeline)

**Estimated timeline for publishing Articles 4–56 (53 articles):**

| Phase | Articles | Time/Article | Total |
|---|---|---|---|
| **Content prep** | 4-15 (12 articles) | 30-45 min | 8-9 hours |
| **Validation** | 4-15 (12 articles) | 10 min | 2 hours |
| **Publishing** | 4-15 (12 articles) | 2-3 min | 30 min |
| **Deployment & verification** | Per batch | 90 sec | 30 min |
| **Week 2-3:** Repeat for 16-40 | 25 articles | Similar | ~18 hours |
| **Week 4-6:** Remaining articles 41-56 | 16 articles | Similar | ~12 hours |
| **Total project time** | 53 articles | ~30 min avg | ~40 hours |

**With parallel tooling (AI image generation, automated validation):**
- Time/article drops to ~20 min
- Total project time: ~25 hours over 6-8 weeks
- ~3-4 articles/week sustainable pace

---

## Troubleshooting

| Issue | Cause | Fix |
|---|---|---|
| Article doesn't appear on blog listing | `status: "draft"` instead of `"published"` | Change to `status: "published"` and rebuild |
| Article page returns 404 | Slug in frontmatter doesn't match filename | Rename file to match slug, or update slug to match filename |
| Hero image is missing | `heroImage` path doesn't match actual file | Check filename and path exactly, including `{slug}.jpg` |
| Social preview shows no image | File is PNG instead of JPEG, or path is wrong | Convert to JPEG or fix path to `public/blog/images/{slug}.jpg` |
| Article doesn't show in sitemap | Local build wasn't run after publishing | Run `npm run build` and verify `public/sitemap.xml` includes URL |
| Related articles section is empty | No other articles share same `pillar` | Add or edit `pillar` field to match existing articles |
| Meta description is truncated in Google | Description is too long (>160 chars) | Shorten to 155-160 characters |
| Build fails with frontmatter error | Invalid YAML syntax (quotes, colons, lists) | Use online YAML validator to check syntax |

