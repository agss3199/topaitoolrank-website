---
name: Missing Edge Case Tests
description: ArticleSection and API endpoint lack comprehensive edge-case test coverage
type: GAP
---

## Test Coverage Gaps Identified

### ArticleSection Component

**Current State**: Component exists with XSS prevention logic but has zero unit tests.

**Missing Test Cases**:
1. Empty article content (edge case: "")
2. Malformed markdown (e.g., unclosed `[link](url` brackets)
3. Deeply nested headers (# ## ### #### #####)
4. Mixed formatting ([**bold _italic_**])
5. URL edge cases:
   - Relative URLs (`/path/to/page`)
   - Fragment URLs (`#anchor`)
   - Query strings (`?param=value`)
   - Encoded URLs (`%20`, `%2F`)
   - URLs with unicode characters
6. Link text with special characters (`[foo & bar](url)`)
7. Code blocks with backticks (`` `code with ``` inside` ``)
8. Very long paragraphs (>10,000 characters)

**Risk Level**: MEDIUM — Component works for happy path but edge cases may expose markdown conversion bugs or missed XSS vectors.

### API Endpoint (`/api/tools/article`)

**Current State**: Endpoint exists and returns article content but has zero error-case tests.

**Missing Test Cases**:
1. Invalid tool name (`?tool=nonexistent`)
2. Missing tool parameter
3. Malformed slug in tool map
4. File read permission errors (file deleted after deploy)
5. Article file contains invalid UTF-8
6. Very large article (>10MB) — memory/streaming implications
7. Concurrent requests to same endpoint
8. Cache behavior (multiple requests, should be efficient)

**Risk Level**: LOW-MEDIUM — Most errors are handled gracefully (404, 500 response), but no explicit test coverage.

### Recommended Actions

1. **ArticleSection tests**: Add unit tests for all markdown edge cases
2. **API tests**: Add integration tests for error paths and edge cases
3. **End-to-end tests**: Add Playwright test that loads a tool page and verifies article renders without errors
4. **Security tests**: Add tests that attempt XSS injection in article content and verify it's blocked

**Tracking**: Create `/implement` todos for:
- `test(article): add unit tests for ArticleSection markdown conversion`
- `test(api): add integration tests for /api/tools/article endpoint`
- `test(e2e): add Playwright tests for tool pages with articles`
