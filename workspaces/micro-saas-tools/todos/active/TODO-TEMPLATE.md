# Todo Template: All Implementation Todos

This document describes the detailed structure for todos 101–502. Each tool follows three phases:

1. **BUILD** — Create the component structure and core logic (2–3 hours)
2. **WIRE** — Connect inputs/outputs, localStorage, file operations (1 hour)
3. **TEST** — Unit tests, component tests, E2E tests (1 hour)

All todo IDs follow the pattern: `[WAVE][NUMBER]-[verb]-[tool-slug]`

---

## WAVE 1 TODOS (Tools 1–3)

### TODO 101: BUILD WhatsApp Message Formatter

**Effort**: 2.5 hours  
**Implements**: specs/micro-saas-tools.md § 5 (Tool List: Wave 1, Tool 1)  
**Depends on**: 001

**Description**:
Build the WhatsApp Message Formatter UI and markdown-to-WhatsApp conversion logic. Users paste markdown-formatted text, tool converts to WhatsApp formatting (bold, italic, monospace, links), and displays preview.

**Core Logic**:
- Input: markdown text (e.g. `**bold**`, `_italic_`, `` `code` ``, `[link](url)`)
- Processing: Parse markdown, convert to WhatsApp syntax (`*bold*`, `_italic_`, `` ```code``` ``)
- Output: Formatted text in preview box

**Files to Create**:
```
app/tools/whatsapp-message-formatter/
├── page.tsx
├── styles.css
├── lib/
│   └── markdown-to-whatsapp.ts
└── components/
    └── Preview.tsx
```

**Acceptance Criteria**:
- [ ] Page loads without errors
- [ ] Input textarea accepts text
- [ ] Preview updates in real-time as user types
- [ ] All markdown patterns convert correctly
- [ ] CSS is namespace-scoped (`.whatsapp-message-formatter`)
- [ ] No imports from shared `lib/`, `components/`
- [ ] Responsive on 320px–2560px

---

### TODO 102: WIRE WhatsApp Message Formatter

**Effort**: 1 hour  
**Implements**: specs/micro-saas-tools.md § 2 (Tool Contracts)  
**Depends on**: 101

**Description**:
Connect input/output operations: localStorage persistence, copy-to-clipboard, download as .txt file.

**Wiring**:
- Save draft to `localStorage.setItem("wam-draft", text)` on input change
- Load draft on page mount
- Copy button: `navigator.clipboard.writeText(formatted)`
- Download button: Trigger file download of formatted text

**Acceptance Criteria**:
- [ ] localStorage persists draft across page refresh
- [ ] Copy button copies formatted text
- [ ] Download button triggers file download
- [ ] No mock data or placeholder behaviors
- [ ] All operations are real (no logging-only stubs)

---

### TODO 103: TEST WhatsApp Message Formatter

**Effort**: 1 hour  
**Implements**: specs/micro-saas-tools.md § 9 (Testing Contracts)  
**Depends on**: 102

**Description**:
Write comprehensive tests covering all markdown conversion patterns, localStorage, and user interactions.

**Test Categories**:

**Unit Tests** (`markdown-to-whatsapp.test.ts`):
- Bold: `**text**` → `*text*`
- Italic: `_text_` → `_text_`
- Code: `` `code` `` → `` ```code``` ``
- Links: `[text](url)` → `[text](url)` (no change)
- Complex: Mixed patterns in single string
- Edge cases: Empty input, incomplete patterns, nested patterns

**Component Tests** (`Preview.test.tsx`):
- Renders without errors
- Updates preview on input change
- Handles rapid input changes (debouncing)
- localStorage integration

**E2E Tests** (`whatsapp-message-formatter.e2e.test.ts`):
- User enters markdown text → sees formatted preview
- User clicks copy → text in clipboard
- User clicks download → file downloads
- User refreshes page → draft persists

**Acceptance Criteria**:
- [ ] All markdown patterns tested (≥15 test cases)
- [ ] localStorage integration tested
- [ ] Copy/download operations tested
- [ ] E2E test covers full user flow
- [ ] ≥80% code coverage

---

### TODO 104: BUILD WhatsApp Link Generator + QR Code

**Effort**: 2.5 hours  
**Implements**: specs/micro-saas-tools.md § 5 (Tool List: Wave 1, Tool 2)  
**Depends on**: 001

**Description**:
Build WhatsApp link generator. Users enter phone number, message text, and tool generates:
1. WhatsApp link (`https://wa.me/[phone]?text=[message]`)
2. QR code image pointing to that link

**Core Logic**:
- Input: Phone number (format: +[country][number]), message text
- Processing: Validate phone number, URL-encode message, generate QR code
- Output: Link + QR code image

**Files to Create**:
```
app/tools/whatsapp-link-generator/
├── page.tsx
├── styles.css
├── lib/
│   ├── phone-formatter.ts
│   └── qr-generator.ts
└── components/
    ├── PhoneInput.tsx
    └── QRDisplay.tsx
```

**Dependencies**:
- `qrcode.js` (or similar, ~8KB) for QR generation — import directly in component, not shared

**Acceptance Criteria**:
- [ ] Phone input validates international format
- [ ] Message input accepts any text
- [ ] QR code generates without errors
- [ ] Link preview shows formatted URL
- [ ] Responsive on mobile (QR code still scannable)
- [ ] No imports from shared resources

---

### TODO 105: WIRE WhatsApp Link Generator + QR Code

**Effort**: 1 hour  
**Implements**: specs/micro-saas-tools.md § 2 (Tool Contracts)  
**Depends on**: 104

**Description**:
Connect I/O operations: localStorage persistence, copy link, download QR image.

**Wiring**:
- Save inputs to `localStorage.setItem("wlg-phone", phone)`, `localStorage.setItem("wlg-message", message)`
- Copy link to clipboard
- Download QR code as PNG file

**Acceptance Criteria**:
- [ ] Form persists on refresh
- [ ] Copy link button works
- [ ] Download QR button works
- [ ] No mock data

---

### TODO 106: TEST WhatsApp Link Generator + QR Code

**Effort**: 1 hour  
**Implements**: specs/micro-saas-tools.md § 9 (Testing Contracts)  
**Depends on**: 105

**Description**:
Comprehensive tests for phone validation, URL formatting, QR generation, and user flows.

**Test Coverage**:
- Phone validation (various international formats)
- Message encoding (special characters, spaces, etc.)
- QR code generation
- localStorage persistence
- Copy/download operations
- E2E: Full user flow

**Acceptance Criteria**:
- [ ] ≥15 test cases covering all scenarios
- [ ] QR code image actually generates (not mocked)
- [ ] localStorage tested
- [ ] ≥80% code coverage

---

### TODO 107: BUILD Word Counter & Text Analyzer

**Effort**: 2–3 hours  
**Implements**: specs/micro-saas-tools.md § 5 (Tool List: Wave 1, Tool 3)  
**Depends on**: 001

**Description**:
Build real-time text analyzer. Users paste text, tool displays:
- Word count
- Character count (with/without spaces)
- Sentence count
- Paragraph count
- Reading time estimate
- Most common words (top 10)

**Core Logic**:
- Input: Textarea accepting any text
- Processing: Split by words/sentences, count characters, estimate reading time
- Output: Real-time statistics display

**Files to Create**:
```
app/tools/word-counter/
├── page.tsx
├── styles.css
├── lib/
│   └── text-analyzer.ts
└── components/
    ├── TextInput.tsx
    └── Statistics.tsx
```

**Acceptance Criteria**:
- [ ] All statistics calculated correctly
- [ ] Updates in real-time (no debounce needed)
- [ ] Handles empty input gracefully
- [ ] Responsive layout
- [ ] Top words list displayed correctly

---

### TODO 108: WIRE Word Counter & Text Analyzer

**Effort**: 1 hour  
**Implements**: specs/micro-saas-tools.md § 2 (Tool Contracts)  
**Depends on**: 107

**Description**:
Connect I/O: localStorage persistence, export statistics as JSON/CSV.

**Wiring**:
- Save text to `localStorage.setItem("wc-text", text)`
- Export button: Download stats as JSON
- Load draft on page mount

**Acceptance Criteria**:
- [ ] Text persists across refresh
- [ ] Export produces valid JSON/CSV
- [ ] No mock data

---

### TODO 109: TEST Word Counter & Text Analyzer

**Effort**: 1 hour  
**Implements**: specs/micro-saas-tools.md § 9 (Testing Contracts)  
**Depends on**: 108

**Description**:
Test all calculation logic, real-time updates, and user flows.

**Test Coverage**:
- Word/character/sentence/paragraph counting
- Reading time calculation
- Edge cases (empty input, single word, special characters)
- Top words algorithm
- localStorage
- E2E flow

**Acceptance Criteria**:
- [ ] ≥20 test cases
- [ ] All edge cases covered
- [ ] ≥80% code coverage

---

## WAVE 2 TODOS (Tools 4–6)

### TODO 20X: BUILD/WIRE/TEST [Tool Name]

Follow the **exact same pattern** as Wave 1:

1. **BUILD** (2–3 hours):
   - Create folder structure
   - Implement core logic
   - No I/O (localStorage, API calls, downloads)

2. **WIRE** (1 hour):
   - Connect localStorage
   - Connect download/copy operations
   - Connect API calls (if applicable)

3. **TEST** (1 hour):
   - Unit tests for logic
   - Component tests for UI
   - E2E tests for full flow

**Todos 201–209** repeat this pattern for:
- Tool 4: AI Prompt Generator (201, 202, 203)
- Tool 5: Email Subject Line Tester (204, 205, 206)
- Tool 6: UTM Link Builder (207, 208, 209)

---

## WAVE 3 TODOS (Tools 7–10)

### TODO 30X: BUILD/WIRE/TEST [Tool Name]

Same BUILD/WIRE/TEST pattern as Waves 1–2, with one difference:

**Wire phase includes API integration**:
- Tool 7 (JSON Formatter): No API
- Tool 8 (Business Name Generator): LLM API call (OpenAI or similar)
- Tool 9 (Invoice Generator): PDF library integration
- Tool 10 (SEO Analyzer): URL fetch + meta tag parsing

**Todos 301–312** repeat the pattern for:
- Tool 7: JSON Formatter (301, 302, 303)
- Tool 8: Business Name Generator (304, 305, 306)
- Tool 9: Invoice Generator (307, 308, 309)
- Tool 10: SEO Analyzer (310, 311, 312)

---

## TESTING & FINALIZATION (Todos 401–406)

All testing todos run concurrently with implementation (TDD approach), but the final gate todos run **after all tools are implemented**:

### TODO 401: Integration Testing

**Effort**: 1 hour  
**Depends on**: 109, 209, 309, 312

**Description**:
Verify all 10 tools run independently without sharing state or affecting each other. Cross-tool isolation verification.

**Tests**:
- Open two tools in separate tabs — verify no data leakage
- Change localStorage in one tool — verify others unaffected
- Test suite runs all tool tests — verify no conflicts

---

### TODO 402: Accessibility Audit

**Effort**: 1 hour  
**Depends on**: 106, 206, 306, 312

**Description**:
WCAG AA compliance audit for all tools.

**Checklist**:
- Keyboard navigation works (tab, enter)
- ARIA labels on all inputs
- Color contrast ≥4.5:1
- Touch targets ≥44px

---

### TODO 403: Performance Audit

**Effort**: 1 hour  
**Depends on**: 106, 206, 306, 312

**Description**:
Core Web Vitals compliance for all tools.

**Metrics**:
- LCP <2.5s on 4G
- FID <100ms
- CLS <0.1
- Bundle size <100KB per tool

---

### TODO 404: Regression Testing

**Effort**: 1 hour  
**Depends on**: All tool tests

**Description**:
Add regression tests for all discovered edge cases and bugs.

---

### TODO 405: Mobile Responsive Testing

**Effort**: 1 hour  
**Depends on**: 106, 206, 306, 312

**Description**:
Manual responsive testing: 320px (iPhone SE), 768px (iPad), 1024px (desktop), 2560px (wide monitor).

---

### TODO 406: Final Quality Gates

**Effort**: 1 hour  
**Depends on**: 401–405

**Description**:
- All tests passing
- No warnings in build/test output
- SEO metadata complete
- Deployment-ready

---

## DEPLOYMENT (Todos 501–502)

### TODO 501: SEO Setup

**Effort**: 1 hour  
**Depends on**: 406

**Description**:
- Update `robots.txt` to allow `/tools/*`
- Generate `sitemap.xml` with all tool URLs
- Verify meta tags on each tool page

### TODO 502: Analytics Setup

**Effort**: 1 hour  
**Depends on**: 501

**Description**:
- Configure Google Analytics tracking
- Set up performance monitoring
- Document dashboard setup

---

## Summary

**Total Todos**: 38 (1 setup + 27 tool todos + 6 testing + 2 deployment + 2 documentation)

**Pattern**:
- 10 tools × 3 todos each = 30 tool todos
- 8 other todos (setup, testing, deployment)

All tool todos follow the BUILD → WIRE → TEST pattern with no exceptions.
