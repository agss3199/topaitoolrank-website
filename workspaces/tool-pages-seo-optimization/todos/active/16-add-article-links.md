# Todo 16: Add Internal Links to Articles

**Status**: Pending  
**Implements**: specs/tool-pages-cross-linking.md § Zone 2: Article Inline Links  
**Dependencies**: 07-15-content-articles (articles must be written first)  
**Blocks**: None (can run in parallel with other tasks)

## Description

Add 2-3 contextual internal links to each of the 9 tool articles. Links must be:
- Naturally relevant to the surrounding text
- Not forced or artificial
- Include descriptive anchor text (tool name or benefit phrase)
- Point to related tools that genuinely help solve the problem discussed

## Acceptance Criteria

- [x] Each article has 2-3 internal links
- [x] Links are contextually relevant (not forced)
- [x] Anchor text is descriptive (tool name or benefit)
- [x] No duplicate links to same page within single article
- [x] No keyword-stuffed anchor text
- [x] All link URLs are correct (`/tools/[tool-slug]`)
- [x] Links are placed naturally in the flow of content

## Implementation Notes

**Linking patterns**:
- Links should appear in the body text, not in FAQs or tips sections
- Each link should have 1-2 sentences of context before/after
- Avoid placing links in headings

**Example placements** (from Article How-To or Features section):

JSON Formatter article:
> "When formatting your JSON, you may notice that some values contain very long text strings. To understand the length of text fields in your JSON structure, you can use our [Word Counter](/tools/word-counter) tool to quickly measure any text portion."

Word Counter article:
> "Many content creators need to optimize their writing for specific platforms. For instance, when crafting email subject lines, character count matters significantly. Our [Email Subject Tester](/tools/email-subject-tester) tool can help you create subject lines that fit perfectly across email clients."

**Cross-linking map**:
Use the map from specs/tool-pages-cross-linking.md § Tool-to-Tool Linking Map as reference.

**Important constraints**:
- NO keyword stuffing in anchor text
- NO multiple links to same tool on same page
- NO links in headings (H2/H3)
- NO "click here" or "learn more" without context

## Testing

For each article:
- [ ] 2-3 links present
- [ ] Each link is contextually relevant
- [ ] Anchor text is descriptive
- [ ] Links work (click and verify destination)
- [ ] No duplicate links to same page

## Related Specs

- Cross-linking strategy: specs/tool-pages-cross-linking.md
- Linking rules: specs/tool-pages-cross-linking.md § MUST Rules
- Tool-to-tool linking map: specs/tool-pages-cross-linking.md § Tool-to-Tool Linking Map

## Time Estimate

~1-2 hours (review 9 articles, add 2-3 links per article)
