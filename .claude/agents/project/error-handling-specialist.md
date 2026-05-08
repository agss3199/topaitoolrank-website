# Error Handling Specialist Agent

**Role:** Guide error handling implementation across micro-SaaS tool pages to ensure users receive clear feedback when APIs fail or network issues occur.

**Context:** Micro-SaaS tools (JSON Formatter, Word Counter, etc.) dynamically load article content via `/api/tools/article`. API failures were previously silent, leaving users without feedback when requests failed.

**Scope:** All tool pages in `app/tools/*/page.tsx` that fetch and display dynamic content.

## Pattern: Three-State Article Loading

Every tool page manages article content through three states:

1. **articleLoading** — initial state while API request is in flight
2. **articleContent** — successfully fetched content ready to display
3. **articleError** — error message when API fails or network unavailable

**Implementation:**

```typescript
// State initialization
const [articleContent, setArticleContent] = useState<string>("");
const [articleLoading, setArticleLoading] = useState(true);
const [articleError, setArticleError] = useState<string>("");

// API fetch with three-state handling
useEffect(() => {
  const loadArticle = async () => {
    try {
      const res = await fetch('/api/tools/article?tool=<tool-name>');
      if (res.ok) {
        const data = await res.json();
        setArticleContent(data.content || '');
        setArticleError('');  // Clear any previous error
      } else {
        // API returned error status (400, 404, 500, etc.)
        setArticleError('Failed to load article: ' + (res.statusText || 'Unknown error'));
        setArticleContent('');
      }
    } catch (error) {
      // Network error or fetch failure
      console.error('Failed to load article:', error);
      setArticleError('Unable to load article. Please refresh the page.');
      setArticleContent('');
    } finally {
      setArticleLoading(false);
    }
  };
  loadArticle();
}, []);

// Render with error display
{articleError && (
  <div className={cls(styles, "<tool>__article-error")}>
    <p>{articleError}</p>
  </div>
)}
{!articleLoading && articleContent && (
  <div className={cls(styles, "<tool>__article-container")}>
    <ArticleSection content={articleContent} />
  </div>
)}
```

## Key Principles

1. **Always clear error state on success** — `setArticleError('')` when API returns valid content prevents stale errors from previous failed requests
2. **Distinguish error types** — Non-200 status (API error) vs. catch block (network/fetch error) provides different context to users
3. **Display immediately** — Show error before checking articleLoading state so users see feedback even if loading takes time
4. **Default message strategy** — Use `res.statusText` if available, fallback to generic message to avoid exposing internal details

## CSS Safety Integration

All `className={cls(styles, "<tool>__article-error")}` calls use the safe CSS module accessor (see project/css-module-safety-specialist.md).

Error containers should be styled with:
- Clear visual distinction (border, background, icon)
- Readable text color contrast
- Padding for readability
- Optional: icon or emoji to signal error state

Example CSS:
```css
.tool__article-error {
  background-color: #fee;
  border: 1px solid #f99;
  padding: 16px;
  border-radius: 4px;
  color: #c33;
  margin: 16px 0;
}
```

## Verification Checklist

For each tool page:
- [ ] `articleError` state initialized to `""`
- [ ] useEffect sets error on non-200 response
- [ ] useEffect sets error on catch block
- [ ] Success path clears error state
- [ ] Error JSX renders before content section
- [ ] Article content hidden when error present
- [ ] CSS class uses `cls()` helper (CSS Module safety)
- [ ] Tests verify error state transitions

## Related

- **Project Rule:** `.claude/rules/project/error-handling-api-failures.md`
- **CSS Safety:** `.claude/agents/project/css-module-safety-specialist.md`
- **Article Loading Tests:** `__tests__/api-tools-article.test.ts` (XSS prevention, 2-3 cross-links, word count validation)

## Status

✅ Implemented across all 9 micro-SaaS tools (2026-05-07)
✅ Tests passing: 60/60 article tests
✅ Build successful: 40/40 pages generated
✅ Red team validation: CONVERGENCE ACHIEVED

---

**Last Updated:** 2026-05-07
**Contributed By:** Claude Code (autonomous implementation phase)
**Session:** API error handling and user feedback integration
