# Todo 002: Add FAQPage Schema to All 9 Tool Pages

**Implements**: `specs/tool-pages-seo-metadata.md` § FAQ schema (recommended)  
**Priority**: 🚨 CRITICAL  
**Dependency**: Todo 011 (article FAQ sections must be added first)  
**Effort**: 2-3 hours  
**Session**: 1 (requires completion of Session 3 Todo 011 first OR pre-implementation verification)  
**Blocker Note**: Cannot start this todo until article FAQ sections exist. Either implement Todo 011 first, or verify all 9 articles already have FAQ sections.

## Description

Add FAQPage structured data to all 9 tool page layouts. Each article contains FAQ content but no schema markup. FAQPage schema enables "People Also Ask" rich results in Google, which increase CTR by 30-50%.

## Acceptance Criteria

- [ ] All 9 tool layouts (`app/tools/*/layout.tsx`) export FAQPage schema
- [ ] Each FAQPage contains 3-4 Q&A items extracted from article FAQ sections
- [ ] Schema validates in Google's Rich Results Test tool (0 errors, 0 warnings)
- [ ] Schema structure follows schema.org FAQPage spec exactly
- [ ] Build succeeds (`npm run build`)
- [ ] No TypeScript errors

## Implementation Steps

### Step 1: Verify Article FAQ Sections (5 min) — BLOCKING CHECK

Check that all 9 articles have explicit FAQ sections with Q&A pairs:
```bash
grep -l "## FAQ\|## Frequently Asked" content/articles/*.md
# Should return 9 files

# If fewer than 9, you MUST implement Todo 011 first, or add FAQ sections now
```

**⚠️ CRITICAL**: If any articles are missing FAQ sections, STOP and implement Todo 011 before proceeding. Cannot create FAQPage schema without source FAQ content.

**Option A**: If articles already have FAQ sections → Proceed with Step 2
**Option B**: If articles missing FAQs → Implement Todo 011 first, then return to this todo

### Step 2: Extract FAQ Data (30 min)
For each article, identify 3-4 Q&A pairs. Example from json-formatter-guide.md:
```
Q: What is JSON?
A: JSON is a lightweight, text-based data format...

Q: How do I format JSON?
A: Paste your JSON, and the formatter will...
```

### Step 3: Add FAQPage Schema to Tool Layouts (2 hours)
Add to each `app/tools/[tool-name]/layout.tsx`:

```typescript
// Add near other schema definitions
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is a JSON formatter?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "A JSON formatter is a tool that takes raw JSON data and formats it into a readable structure with proper indentation and line breaks."
      }
    },
    {
      "@type": "Question",
      "name": "Why use a JSON formatter?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "JSON formatters help developers quickly understand complex JSON structures, catch syntax errors, and validate data structures."
      }
    },
    // ... 2 more Q&A pairs
  ]
};

// In the JSX where other schemas are added:
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
/>
```

### Step 4: Validate Schema (30 min)
For each tool page:
1. Build and deploy locally: `npm run build && npm run dev`
2. Visit `http://localhost:3000/tools/[tool-name]`
3. Go to https://search.google.com/test/rich-results
4. Paste the URL
5. Verify: "FAQ" appears in the enhancements list with 0 errors

## FAQ Extraction Map

| Tool | File | Expected FAQs |
|------|------|---------------|
| JSON Formatter | content/articles/json-formatter-guide.md | What is JSON?, Why format JSON?, How to use?, Common errors? |
| Word Counter | content/articles/word-counter-guide.md | What is a word counter?, How does it work?, Why use it?, What counts as a word? |
| Email Subject Tester | content/articles/email-subject-tester-guide.md | What is an email subject tester?, Why test subjects?, How to improve CTR?, ... |
| AI Prompt Generator | content/articles/ai-prompt-generator-guide.md | What is a prompt generator?, How do I use it?, Why is it useful?, ... |
| SEO Analyzer | content/articles/seo-analyzer-guide.md | What is SEO?, How to optimize?, What's a good score?, ... |
| UTM Link Builder | content/articles/utm-link-builder-guide.md | What is UTM tracking?, Why use UTM codes?, How to structure URLs?, ... |
| Invoice Generator | content/articles/invoice-generator-guide.md | What's an invoice?, How to create one?, What fields to include?, ... |
| WhatsApp Link Generator | content/articles/whatsapp-link-generator-guide.md | What is WhatsApp linking?, How to create links?, ... |
| WhatsApp Message Formatter | content/articles/whatsapp-message-formatter-guide.md | How to format messages?, What formatting works?, ... |

## Testing & Validation

```bash
# Build locally
npm run build

# Start dev server
npm run dev

# For each tool, visit and validate:
# https://localhost:3000/tools/json-formatter (and others)
# Then use: https://search.google.com/test/rich-results
# Paste URL and verify FAQPage schema with 0 errors
```

## Deployment Checklist

- [ ] All 9 tools validate with 0 schema errors
- [ ] Build succeeds
- [ ] No console warnings
- [ ] Google Search Console: submit updated sitemap
- [ ] Monitor Search Console Rich Results report for "FAQ" enhancements (1-2 weeks)

## Related Todos

- **Todo 011**: Add FAQ sections to articles (prerequisite check)
- **Todo 001**: Homepage schema (parallel, independent)

## Expected Impact

- **CTR improvement**: +30-50% on FAQ-eligible queries
- **Monthly traffic gain**: ~150-230 additional clicks (estimated)
- **Timeline**: Rich results appear in Search Console within 1-2 weeks

---

**Status**: Ready to implement  
**Estimated Traffic Impact**: +30-50% CTR on FAQ queries  
**Related Finding**: F-02 in seo-audit-comprehensive.md

