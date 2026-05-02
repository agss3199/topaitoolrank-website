# SEO Optimization Checklist

Patterns for ranking in Google, Bing, and other search engines.

## Title Optimization (50–60 chars, keyword first)

**Criteria:**
- 50–60 characters including spaces
- Primary keyword in first 3 words
- Year/number adds credibility signal
- Benefit or emotional angle

**Examples (All Pass):**
- "AI Integration: Transform Your Business in 2026" (49 chars) — keyword first, includes year
- "ChatGPT vs Claude: Head-to-Head Comparison (2026)" (51 chars) — keyword first, comparison angle
- "Custom Software Development with AI: Why Off-the-Shelf Fails" (60 chars) — keyword first, provocative angle

**Anti-patterns (All Fail):**
- "All You Need to Know About AI Tools" (36 chars) — too short
- "Artificial Intelligence in Modern Business Applications..." (85 chars) — too long
- "The Ultimate Guide: How to Use ChatGPT" (39 chars) — keyword not first

## Meta Description (155–160 chars)

**Criteria:**
- 155–160 characters (not 120, not 180)
- Include primary keyword (exact match or synonym)
- Include benefit ("Learn", "Discover", "Maximize", "Compare")
- Include CTA or action ("Complete guide", "Case studies")

**Examples (All Pass):**
- "Complete guide to integrating AI tools into business workflows. Learn proven strategies, avoid common pitfalls, maximize ROI, and implement AI successfully." (158 chars)
- "Compare ChatGPT vs Claude in 2026: detailed analysis of pricing, speed, accuracy, coding ability, creativity. Which AI tool should you use? Complete guide." (155 chars)

**Anti-patterns (All Fail):**
- "This article compares two AI tools" (35 chars) — too short
- "In this comprehensive guide, we discuss artificial intelligence, machine learning..." (178 chars) — too long
- "Article about AI" (16 chars) — no keyword, no benefit

## Heading Hierarchy

**Rules:**
- **H1**: Auto-generated from title (don't include in content)
- **H2**: 5–10 major sections per article
- **H3**: 10–15 subsections (2–3 per H2 average)
- **H4**: Avoid; use H3 instead
- **All headings**: `scroll-margin-top: 5rem` for anchor link offset when sticky header is present

**Example structure:**
```
H1: Article Title (auto)
  H2: Overview / Introduction
    H3: Background
    H3: Why This Matters
  H2: Comparison 1
    H3: Option A's Strength
    H3: Option B's Strength
    H3: Winner
  H2: Benchmarks
    H3: MMLU (Knowledge)
    H3: HumanEval (Coding)
  H2: Pricing
  H2: Use Cases
  H2: Conclusion
```

## Keyword Optimization

**Primary Keywords** (in title + first 100 words):
- Natural density: 10–15 mentions (not keyword-stuffed)
- Appears in title, description, H2 headings
- Varies phrasing (not exact repetition)

**Secondary Keywords** (in body):
- Supporting keywords mentioned 3–5 times
- Long-tail variations ("AI tool integration", "enterprise AI adoption")
- Appear in subsection headings

**Example:**
- Primary: "chatgpt", "claude" (15 mentions across full article)
- Secondary: "large language models", "pricing", "coding ability"
- Variations: "AI assistant", "LLM comparison", "language model"

## Structured Data (JSON-LD BlogPosting)

Auto-injected by Next.js `generateMetadata`. Verify present in page source:

```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "Article Title",
  "description": "Meta description",
  "image": "https://topaitoolrank.com/blog/images/slug.jpg",
  "datePublished": "2026-05-02",
  "dateModified": "2026-05-02",
  "author": { "@type": "Person", "name": "Abhishek" }
}
```

**Why it matters:** Google extracts article metadata directly from schema without HTML parsing.

## Open Graph & Twitter Tags

Auto-generated from frontmatter. Appear when article shared on social media:

- `og:title` = article title
- `og:description` = meta description
- `og:image` = heroImage URL (1200×630px recommended)
- `og:type` = "article"
- `twitter:card` = "summary_large_image"

**Why it matters:** Social previews with image + title + description drive click-through rate on LinkedIn, Twitter, Facebook.

## Validation Checklist

Before publishing, confirm:

- [ ] Title 50–60 chars, keyword in first 3 words
- [ ] Description 155–160 chars, includes keyword + benefit + CTA
- [ ] H2/H3 hierarchy correct (5–10 H2, 10–15 H3)
- [ ] Heading hierarchy proper (no H1→H3 jumps)
- [ ] All headings have proper scroll-margin-top
- [ ] JSON-LD BlogPosting schema present in page source
- [ ] OG/Twitter tags auto-generated
- [ ] Canonical URL correct

See `SKILL.md` for full reference and examples.
