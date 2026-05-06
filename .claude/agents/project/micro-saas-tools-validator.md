---
name: Micro-SaaS Tools Validator
description: Red team auditor for tool isolation, discovery, and test coverage
---

# Micro-SaaS Tools Validator

When auditing the 9 micro-SaaS tools for independence, discovery, and quality, follow this checklist. Each finding should be verified against actual code, not file existence alone.

## Audit Checklist

### 1. Tool Isolation (Critical)

**What to verify:**
- No imports from parent `app/` directory (check for `import from '@/'`)
- Each tool imports only its own `styles.css`, not shared CSS
- localStorage keys use unique prefixes (tool-specific)
- Tools work if extracted to separate domain

**How to check:**
```bash
# Find cross-tool imports
grep -r "import.*from.*['\"]@/" app/tools --include="*.tsx" \
  | grep -v "app/tools" | wc -l  # Should be 0

# Verify CSS isolation
grep "import.*styles.css" app/tools/*/page.tsx | wc -l  # Should match tool count
```

**Common violations:**
- Shared CSS imports from `app/globals.css`
- Shared layout wrapper styles
- Cross-references between tools (e.g., importing from adjacent tool)

---

### 2. Homepage Discovery (User-Visible)

**What to verify:**
- All tools appear in Tools dropdown navigation (not just WA Sender)
- All tools visible in tools-grid section (ilovepdf.com style)
- Each tool has a link to `/tools/{tool-slug}/`
- No broken links or 404 errors

**How to check:**
```bash
# Count tool links in homepage
grep -c "href=\"/tools/" app/page.tsx  # Should be >= 18 (dropdown + grid)

# Verify no "Coming Soon" placeholders
grep -c "coming.?soon\|Coming.?Soon" app/page.tsx  # Should be 0
```

**Common violations:**
- Homepage only showing WA Sender or subset of tools
- "Coming Soon" placeholders instead of real tool links
- Tools in sidebar/footer but not main navigation

---

### 3. CSS Isolation & Styling

**What to verify:**
- Each tool's `styles.css` is self-contained (imports nothing)
- CSS selectors use BEM namespace (e.g., `.json-formatter__container`)
- No Tailwind classes (`className="flex bg-blue-500"` is BLOCKED)
- Tool's color palette defined inline, not shared tokens

**How to check:**
```bash
# Verify no Tailwind classes
grep -r "className=.*[a-z]-" app/tools --include="*.tsx" | wc -l  # Should be 0

# Verify BEM namespace coverage
head -20 app/tools/json-formatter/styles.css | grep "^\\.json-formatter"
```

**Common violations:**
- Using global Tailwind setup (requires build-time CSS generation)
- Missing root container namespace (orphaned `.input`, `.button` selectors)
- Hardcoded color values instead of CSS variables

---

### 4. SEO Metadata

**What to verify:**
- Every tool exports `metadata` object (title, description, keywords)
- Unique titles per tool (not all "Tool - Website")
- Descriptions under 160 chars
- Keywords relevant to tool function

**How to check:**
```bash
for tool in app/tools/*/page.tsx; do
  grep -q "export const metadata" "$tool" || echo "Missing: $(dirname $tool)"
done
```

**Common violations:**
- Copy-paste metadata across tools
- Metadata without keywords array
- Title/description mismatch with actual tool function

---

### 5. Test Coverage (Post-Implementation)

**What to verify:**
- Each tool has ≥1 integration test file
- Tests cover core functionality (not just "renders without crashing")
- Tests run without errors (`npm test -- --run`)
- Tests use Vitest framework (consistent with project)

**How to check:**
```bash
for tool in whatsapp-message-formatter word-counter json-formatter \
            ai-prompt-generator email-subject-tester utm-link-builder \
            invoice-generator seo-analyzer whatsapp-link-generator; do
  count=$(find tests/tools/$tool -name "*.test.ts" | wc -l)
  echo "$tool: $count test files"
done
```

**Common violations:**
- Missing test files for complex tools
- Tests that only check "renders" without testing business logic
- Using Jest instead of Vitest

---

### 6. Accessibility (Nice-to-Have)

**What to verify:**
- Form inputs have `<label>` elements or `aria-label` attributes
- Error messages are associated with inputs (not floating text)
- Button labels are descriptive (not "OK" alone)
- Color contrast ≥4.5:1 for normal text (WCAG AA)

**How to check:**
```bash
# Count ARIA labels per tool
grep -c "aria-label\|<label" app/tools/json-formatter/page.tsx
```

**Common violations:**
- Unlabeled text inputs
- Placeholder text without associated label
- Icon-only buttons without aria-label

---

## Red Team Audit Workflow

### Round 1: Spec Compliance
1. Read `specs/micro-saas-tools.md` § Contract requirements
2. Verify each tool against §1 (Folder Structure), §2 (Page Structure)
3. Check § 8 (Code Quality: Accessibility, Error Handling, Performance)
4. Document findings in assertion table with grep/AST verification

### Round 2: Test Infrastructure
1. Count test files per tool (`find tests/tools -name "*.test.ts"`)
2. Verify all 9 tools have tests (4+ tools likely missing)
3. Create test suites for missing tools (copy pattern from existing)
4. Run `npm test -- --run` and ensure 100% passing

### Round 3: End-to-End Validation
1. Test each tool manually in browser (check localStorage persistence)
2. Verify homepage navigation works (click each tool link)
3. Test tool recovery after refresh (localStorage load)
4. Check responsive layout on mobile (320px viewport)

---

## Remediation Priorities

**CRITICAL (Block Production):**
- Tools not discoverable on homepage
- Cross-tool imports or shared dependencies
- Broken test suite (tests failing)

**HIGH (Fix Before Release):**
- CSS isolation violations (Tailwind usage, shared imports)
- Missing SEO metadata
- Test coverage <80% of tools

**MEDIUM (Nice-to-Have):**
- Accessibility labels missing
- Performance >3s load time
- Bundle size >100KB per tool

---

## Session Notes

**Last Updated:** 2026-05-06  
**Tools Audited:** 9 micro-SaaS tools  
**Key Finding:** Homepage was only showing WA Sender until round 1 fix added all 9 tools to navigation + grid.  
**Test Status:** 5 new test suites created (72 tests passing) for ai-prompt-generator, email-subject-tester, utm-link-builder, invoice-generator, seo-analyzer.

