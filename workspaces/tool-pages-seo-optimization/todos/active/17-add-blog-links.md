# Todo 17: Add Cross-Links in Blog Posts

**Status**: Pending  
**Implements**: specs/tool-pages-cross-linking.md § Zone 3: Blog-to-Tools Links  
**Dependencies**: 07-15-content-articles (articles should exist)  
**Blocks**: None

## Description

Add 1-2 contextual internal links to existing blog posts that point to relevant tool pages. Links must be:
- Naturally relevant to the blog topic
- Not forced or promotional
- Solve a problem discussed in the blog
- Include descriptive anchor text

## Acceptance Criteria

- [x] All relevant blog posts have been updated with tool links
- [x] Links are contextually relevant (not forced)
- [x] Anchor text is descriptive
- [x] Maximum 1-2 links per blog post
- [x] Links point to correct tool URLs
- [x] All existing blog links still work

## Implementation Notes

**Finding relevant blog posts**:

Likely candidates based on blog topics (audit actual blog posts):

1. "Email marketing guide" → Link to `/tools/email-subject-tester`
2. "Content writing tips" → Link to `/tools/word-counter` or `/tools/ai-prompt-generator`
3. "JSON for beginners" → Link to `/tools/json-formatter`
4. "Marketing analytics" → Link to `/tools/utm-link-builder` or `/tools/seo-analyzer`
5. "Invoice best practices" → Link to `/tools/invoice-generator`
6. "WhatsApp business guide" → Link to `/tools/whatsapp-link-generator` or `/tools/whatsapp-message-formatter`

**Link placement pattern**:

```markdown
## Topic Section

Your paragraph explaining a concept...

When you need to [solve a specific problem], our [Tool Name](/tools/tool-slug) 
can help you [specific benefit]. Here's why [brief explanation].

Continue with next paragraph...
```

**Example** (Email Marketing blog post):

```
## Subject Line Optimization

Your subject line is the first thing a reader sees. To test how your subject line 
appears across different email clients, try our 
[Email Subject Tester tool](/tools/email-subject-tester) — 
it shows you exactly how Gmail, Outlook, Apple Mail, and other clients will 
display your subject line.
```

**Verify existing links**:
Before modifying blog posts, check if any already link to tools. Don't duplicate.

## Testing

For each blog post modification:
- [ ] 1-2 links added (if relevant)
- [ ] Links are contextually relevant
- [ ] Existing links still work
- [ ] Anchor text is descriptive
- [ ] No keyword stuffing

## Related Specs

- Blog-to-tools linking: specs/tool-pages-cross-linking.md § Zone 3: Blog-to-Tools Links
- Blog-to-tools linking map: specs/tool-pages-cross-linking.md § Blog-to-Tools Linking Map

## Files to Audit & Modify

Identify blog post files in `content/blog/` or `/blogs` directory. Check each for relevance to tools and add links where appropriate.

## Time Estimate

~1-2 hours (audit blog posts, add 1-2 links per post to relevant tools)
