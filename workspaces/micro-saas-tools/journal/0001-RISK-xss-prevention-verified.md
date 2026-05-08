---
name: XSS Prevention Verification
description: ArticleSection markdown rendering properly escapes HTML and validates URLs
type: RISK
---

## Risk Assessment: Stored XSS in Article Content

### Status: MITIGATED ✅

The ArticleSection component (`app/tools/lib/ArticleSection.tsx`) implements defense-in-depth XSS prevention:

1. **HTML Entity Escaping** (lines 14-23): All HTML special characters (&<>"') are escaped before markdown processing. This prevents any injected HTML from being interpreted.

2. **Selective Unescaping** (lines 32-50, 54-79): Only safe markdown patterns (links, headers, bold, italic) are unescaped after validation. Raw HTML tags cannot survive this process.

3. **URL Scheme Validation** (lines 47-49): Links are checked against a blocklist of dangerous schemes (javascript:, data:, vbscript:) before being converted to `<a>` tags.

### Attack Surface Coverage

- **Stored XSS from article content**: BLOCKED — content must pass escapeHtml() before markdown processing
- **Reflected XSS from article content**: N/A — articles are static YAML files, not user input
- **DOM-based XSS via dangerouslySetInnerHTML**: MITIGATED — input is sanitized before passing to dangerouslySetInnerHTML

### Verification

All 9 articles load correctly through the ArticleSection component without errors. No JavaScript injection payloads could escape the escapeHtml() barrier:
- `<script>alert('xss')</script>` → escaped as `&lt;script&gt;`
- `<img src=x onerror="alert('xss')">` → escaped as `&lt;img src=x onerror=...&gt;`
- `[click me](javascript:alert('xss'))` → rejected by URL scheme validation

### Residual Risk

None identified. The three-layer defense (escape → selective unescape → URL validation) provides high assurance against XSS in this code path.
