# Todo 011: Add FAQ Sections to All 9 Articles

**Implements**: `specs/tool-pages-content-articles.md` § FAQ sections  
**Priority**: ⚠️ MEDIUM  
**Dependency**: Prerequisite check for Todo 002  
**Effort**: 2 hours  
**Session**: 3

## Description

All 9 article markdown files need explicit FAQ sections with Q&A pairs. These sections are required for FAQPage schema (Todo 002).

## Acceptance Criteria

- [ ] All 9 articles have a "## FAQ" or "## Frequently Asked Questions" section
- [ ] Each FAQ section contains 3-4 Q&A pairs
- [ ] Q&A format is clear: "Q: Question?" / "A: Answer text."
- [ ] Content is original, not just copied from main article
- [ ] Build succeeds

## Implementation

For each article in `content/articles/`:

**Add at the end** (before any metadata or conclusion):

```markdown
## Frequently Asked Questions

**Q: What is a JSON formatter?**
A: A JSON formatter is a tool that takes raw JSON data and formats it into a readable structure with proper indentation and line breaks. This makes it easier to understand complex JSON and spot errors.

**Q: Why should I use a JSON formatter?**
A: JSON formatters help developers quickly understand data structures, catch syntax errors, validate data integrity, and reduce debugging time.

**Q: Is this JSON formatter free?**
A: Yes, our JSON formatter is completely free to use. No sign-up, no login, no credit card required. You can format unlimited JSON files online.

**Q: Can I format large JSON files?**
A: Yes, our formatter handles large JSON files efficiently. There's no practical limit, though very large files (over 10MB) may take a few seconds to process.
```

## Article FAQ Requirements

| Article | Must Cover |
|---------|-----------|
| json-formatter-guide.md | What is JSON, why format, how to use, is it free, large files |
| word-counter-guide.md | What is it, how works, why use, counts as word, accuracy |
| email-subject-tester-guide.md | What is it, why important, how improve, is free, accuracy |
| ai-prompt-generator-guide.md | What is it, how use, why helpful, best practices, free |
| seo-analyzer-guide.md | What is SEO, what it checks, how improve score, accuracy, free |
| utm-link-builder-guide.md | What is UTM, why use, structure, tracking, free |
| invoice-generator-guide.md | What is invoice, how use, customizable, templates, free |
| whatsapp-link-generator-guide.md | What is it, how create, QR codes, sharing, free |
| whatsapp-message-formatter-guide.md | What formatting, what works, compatibility, free |

## Testing

```bash
# Verify all articles have FAQ sections
grep -c "## FAQ\|## Frequently Asked" content/articles/*.md
# Should return 9 (one per file)

# Count total Q&A pairs
grep -c "^Q:" content/articles/*.md
# Should be at least 3-4 per article (27-36 total)
```

## Related Todos

- **Todo 002**: Requires FAQ sections to exist (this todo is prerequisite)

---

**Status**: Ready to implement  
**Effort**: 2 hours (all 9 articles)

