# Todos 07-15: Create Content Articles via ChatGPT

**Status**: Ready for user action  
**Implements**: specs/tool-pages-content-articles.md  
**Dependencies**: None (can run in parallel)  
**Blocks**: 16-add-internal-links-to-articles

## Overview

Generate 9 SEO-optimized content articles (2000+ words each) using ChatGPT. One article per tool. User will provide article prompts to ChatGPT and submit content for integration.

**Workflow**:
1. Use master prompt + 9 tool-specific prompts (provided in `/articles/` folder)
2. Paste prompt into ChatGPT
3. ChatGPT generates 2000-word article
4. Copy content and provide to assistant for integration
5. Assistant formats and integrates into tool pages

Each article follows the structure:
1. Introduction (200 words)
2. How to Use (500 words)
3. Features & Benefits (400 words)
4. Examples & Use Cases (500 words)
5. Tips & Best Practices (300 words)
6. FAQs (100 words)

**Total content**: 18,000 words of original, high-quality content

---

## Todo 07: Write Article - JSON Formatter

**Primary keyword**: JSON formatter  
**Secondary keywords**: JSON beautifier, JSON validator, JSON minify  
**Audience**: Developers, API integrators  
**Unique angle**: JSON formatting for API development and debugging

---

## Todo 08: Write Article - Word Counter

**Primary keyword**: Word counter  
**Secondary keywords**: Character count, word count tool, text counter  
**Audience**: Writers, students, marketers  
**Unique angle**: Counting words/characters for multiple platforms (social media, essays, emails)

---

## Todo 09: Write Article - Email Subject Tester

**Primary keyword**: Email subject tester  
**Secondary keywords**: Email preview, spam checker, subject line optimizer  
**Audience**: Email marketers, campaign managers  
**Unique angle**: Testing subject lines across different email clients for better open rates

---

## Todo 10: Write Article - AI Prompt Generator

**Primary keyword**: AI prompt generator  
**Secondary keywords**: ChatGPT prompts, prompt engineering, AI writing  
**Audience**: AI users, content creators  
**Unique angle**: Creating better prompts to get better results from AI tools

---

## Todo 11: Write Article - UTM Link Builder

**Primary keyword**: UTM link builder  
**Secondary keywords**: UTM parameters, campaign tracking, Google Analytics  
**Audience**: Digital marketers, analytics professionals  
**Unique angle**: Tracking marketing campaigns and understanding traffic sources

---

## Todo 12: Write Article - Invoice Generator

**Primary keyword**: Invoice generator  
**Secondary keywords**: Invoice template, freelance invoicing, invoice software  
**Audience**: Freelancers, small business owners  
**Unique angle**: Creating professional invoices quickly for faster payments

---

## Todo 13: Write Article - SEO Analyzer

**Primary keyword**: SEO analyzer  
**Secondary keywords**: SEO checker, on-page SEO, SEO optimization  
**Audience**: Content creators, digital marketers  
**Unique angle**: Checking on-page SEO factors for better Google ranking

---

## Todo 14: Write Article - WhatsApp Link Generator

**Primary keyword**: WhatsApp link generator  
**Secondary keywords**: WhatsApp link, WhatsApp QR, WhatsApp chat link  
**Audience**: Businesses, marketers  
**Unique angle**: Creating clickable WhatsApp links for websites and marketing

---

## Todo 15: Write Article - WhatsApp Message Formatter

**Primary keyword**: WhatsApp formatter  
**Secondary keywords**: WhatsApp text formatting, WhatsApp bold, WhatsApp italic  
**Audience**: Personal users, businesses  
**Unique angle**: Formatting WhatsApp messages to stand out and communicate better

---

## Implementation Requirements

### Quality Standards

- [x] **Human-written** — Written by humans, not AI. Natural tone, authentic voice.
- [x] **Valuable** — Genuinely useful. Solves a problem. Includes real examples.
- [x] **SEO-optimized** — Keywords naturally incorporated. No stuffing. Reads naturally.
- [x] **No penalties** — White-hat SEO only. No black-hat tactics. Natural linking.
- [x] **Well-structured** — Clear headings, short paragraphs, good scannability.
- [x] **Engaging** — Keeps reader interested. Action-oriented. Builds trust.

### Article Structure

Each article must follow the structure from specs/tool-pages-content-articles.md:

1. **Introduction** (200 words)
   - Hook: Engaging opening that resonates with audience
   - Problem statement: What problem does the tool solve?
   - What the tool does: Brief explanation
   - Why it matters: Quick benefit summary
   - CTA: Lead into how-to section

2. **How to Use** (500 words)
   - Step 1-5: Clear numbered steps
   - Real example data (not generic "your text here")
   - Common use cases embedded in the steps
   - Tips for first-time users

3. **Features & Benefits** (400 words)
   - Key features: 3-4 major features
   - Who benefits: Different user types (developers, freelancers, etc.)
   - Why this tool: Advantages vs manual alternatives
   - Real-world impact (saves time, improves quality, etc.)

4. **Examples & Use Cases** (500 words)
   - 3-4 real-world scenarios
   - Each with: situation, how they used the tool, outcome
   - Different industries/user types
   - Concrete, achievable examples (not fantasy scenarios)

5. **Tips & Best Practices** (300 words)
   - 4-5 practical tips
   - Pro tips for advanced users
   - Common mistakes to avoid
   - Workflow integration advice

6. **FAQs** (100 words)
   - 3-4 common questions
   - Short, direct answers
   - Privacy/security questions if relevant
   - "Can I..." questions about compatibility

### SEO Requirements

- **Keyword placement**: Primary keyword in intro + at least one section heading
- **Secondary keywords**: Naturally scattered throughout (2-3 times each)
- **No stuffing**: Should read naturally. Not "JSON formatter JSON formatter JSON..."
- **Headings**: H2 for main sections, H3 for subsections. Proper hierarchy.
- **Links**: 2-3 internal links to other tools (added in todo 16)
- **Length**: 2000+ words minimum

### Example Tone

**Do**:
> "JSON formatting is essential when working with APIs. Without proper formatting, it's hard to spot errors in your data structure. Our JSON Formatter makes this instant — just paste your code and hit format."

**Don't**:
> "Our JSON Formatter is a great tool that you can use for formatting JSON code. JSON formatting is important. This tool formats JSON. You can use it to format JSON."

### File Placement

Each article will be added directly to the tool page (in todo 02, the layout structure is prepared). The article content goes into the main content area between the tool UI and footer.

### How to Use the Prompts

**Files Provided**:
- `articles/00-MASTER-PROMPT.md` — Overall framework and quality standards
- `articles/01-prompt-json-formatter.txt` — Prompt for JSON Formatter article
- `articles/02-09-prompts.txt` — Prompts for 8 remaining articles

**Process**:
1. Read `articles/00-MASTER-PROMPT.md` first (background on structure and standards)
2. Copy one tool-specific prompt (e.g., 01-prompt-json-formatter.txt)
3. Paste into ChatGPT
4. ChatGPT generates the article (~2000 words)
5. Review for quality (tone, structure, grammar, keyword use)
6. Copy content and provide to assistant
7. Assistant integrates into tool pages
8. Repeat for all 9 articles

### Quality Control Before Submitting

For each ChatGPT-generated article:
- [ ] Word count: 2000-2200 words
- [ ] Structure: Follows 6-section template (intro, how-to, features, examples, tips, FAQs)
- [ ] Tone: Reads naturally, NOT AI-generated sounding
- [ ] Grammar: Spelling and punctuation correct
- [ ] Keywords: Primary keyword appears 3-5 times naturally (not stuffed)
- [ ] Examples: Real, concrete examples provided (not generic)
- [ ] Links: Article is ready for internal links to be added (todo 16)

If ChatGPT output doesn't meet quality, ask it to revise specific sections before pasting to assistant.

### Deliverable

For each article, provide:
- Clean text (plain text or markdown)
- No images or media (text only)
- Clear section breaks with headings
- Ready to integrate into tool page

---

## Completion Checklist

- [x] Master prompt and 9 tool-specific prompts created
- [x] Master prompt explains structure, quality standards, and keyword strategy
- [x] Prompts provided for all 9 tools
- [ ] All 9 articles generated via ChatGPT (user will do this)
- [ ] All articles reviewed for quality (user reviews)
- [ ] All articles provided to assistant (user pastes content)
- [ ] All articles integrated into tool pages (todo 02 wiring)
- [ ] All articles ready for cross-linking (todo 16)
