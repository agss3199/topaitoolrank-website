# Tool Isolation Verification Checklist

**Purpose**: Verify each tool is completely isolated and has zero dependency on shared website resources.

Use this checklist BEFORE marking any tool todo as complete.

---

## Folder Structure ✓

- [ ] Tool folder exists: `app/tools/[tool-slug]/`
- [ ] Has `page.tsx` (main page component)
- [ ] Has `styles.css` (isolated CSS file)
- [ ] Has `lib/` folder with tool-specific utilities
- [ ] Has `components/` folder with tool-specific components
- [ ] Has `README.md` documenting the tool
- [ ] NO shared dependencies (no imports from `..` or `../..`)

## CSS Isolation ✓

Run: `grep -n "^import\|^@import\|from.*globals" app/tools/[tool-slug]/styles.css`

Expected: **0 matches**

- [ ] NO `@import` from `globals.css`
- [ ] NO `@import` from other files
- [ ] NO Tailwind `@layer` directives
- [ ] All selectors start with `.tool-slug` namespace
- [ ] All colors defined in tool's `:root` (prefix: `--ts-*` or similar)
- [ ] ALL CSS rules scoped to tool namespace (0 global selectors)

Example of CORRECT selectors:
```css
.word-counter { ... }
.word-counter__input { ... }
.word-counter__button { ... }
```

Example of INCORRECT selectors:
```css
body { ... }           /* ❌ Global */
.button { ... }        /* ❌ Not scoped */
h1 { ... }             /* ❌ Global */
```

## Page Component ✓

Run: `grep -n "from.*lib/\|from.*components/\|from.*utils/" app/tools/[tool-slug]/page.tsx | grep -v "\.\/lib\|\.\/components"`

Expected: **0 matches** (no imports from shared `lib/`, `components/`, `utils/`)

- [ ] Imports CSS from local `./styles.css`
- [ ] Imports components from local `./components/`
- [ ] Imports utilities from local `./lib/`
- [ ] NO imports from project-level `lib/`
- [ ] NO imports from project-level `components/`
- [ ] NO imports from project-level `utils/`
- [ ] NO imports from `@/lib/`, `@/components/`, `@/utils/`
- [ ] Has `export const metadata` with SEO title + description

## Component Files ✓

For each file in `app/tools/[tool-slug]/components/`:

Run: `grep -n "from.*lib/\|from.*components/\|from.*utils/" app/tools/[tool-slug]/components/*.tsx | grep -v "\.\/\|\.\.\/"`

Expected: **0 matches**

- [ ] Imports only from local `./` or `../` (sibling folders)
- [ ] Imports styles from `../styles.css`
- [ ] NO imports from project-level shared resources
- [ ] All CSS class names use tool namespace (`.tool-slug__*`)

## Utility Files ✓

For each file in `app/tools/[tool-slug]/lib/`:

Run: `grep -n "from.*lib/\|from.*components/" app/tools/[tool-slug]/lib/*.ts | grep -v "\.\/\|\.\.\/"`

Expected: **0 matches**

- [ ] NO imports from project-level `lib/`
- [ ] NO imports from project-level `components/`
- [ ] Pure utility functions (no React components)
- [ ] Each utility is self-contained (no external dependencies except browser APIs)

## localStorage Isolation ✓

Run: `grep -n "localStorage.setItem\|localStorage.getItem" app/tools/[tool-slug]/**/*.tsx` to find all localStorage keys

Keys must follow pattern: `[tool-slug]-*`

- [ ] All localStorage keys prefixed with tool slug (e.g., `wc-text`, `apg-template-id`)
- [ ] NO generic keys like `text`, `input`, `data` (would conflict with other tools)
- [ ] Key example (GOOD): `localStorage.setItem("word-counter-text", value)`
- [ ] Key example (BAD): `localStorage.setItem("text", value)` ← conflicts!

## API Calls ✓

Run: `grep -n "fetch\|axios\|api\|/api/" app/tools/[tool-slug]/**/*.tsx`

If your tool makes API calls:

- [ ] All endpoints are HTTPS
- [ ] NO cross-tool API sharing (each tool has its own endpoints if needed)
- [ ] All API keys in `.env` (not hardcoded)
- [ ] Tool works offline if API fails (graceful degradation)

If your tool makes NO API calls:

- [ ] Confirm zero fetch/axios imports (pure frontend)
- [ ] Tool is completely functional without network

## Download/Copy Functions ✓

Run: `grep -n "downloadAsFile\|copyToClipboard" app/tools/[tool-slug]/**/*.tsx`

- [ ] Download functions create Blob + URL (no server call)
- [ ] Copy to clipboard uses `navigator.clipboard` API
- [ ] Both functions are in tool's own `lib/` (not shared)
- [ ] Both functions are isolated implementations (can exist identically in multiple tools)

## Test Files ✓

Run: `ls -la tests/tools/[tool-slug]/`

- [ ] Folder exists: `tests/tools/[tool-slug]/`
- [ ] Has at least 3 test files:
  - `[tool-slug].unit.test.ts` — Core logic tests
  - `[tool-slug].component.test.ts` — React component tests
  - `[tool-slug].e2e.test.ts` — End-to-end user flow tests
- [ ] All tests import ONLY from tool folder
- [ ] NO imports from shared test utilities (except testing-library)
- [ ] Tests verify localStorage isolation (no data leakage)

## Package.json / Dependencies ✓

If using any npm packages:

- [ ] Packages listed in root `package.json` (installed globally)
- [ ] Tool COMMENTS or DOCUMENTS which packages it uses
- [ ] NO tool-specific dependencies (would require separate installations)
- [ ] Total tool bundle <100KB (including dependencies)

## README.md ✓

Tool-specific README should exist and include:

- [ ] What the tool does (1-2 sentences)
- [ ] How to use it (user perspective)
- [ ] How to modify it (developer perspective)
- [ ] CSS isolation notes (explain namespace pattern)
- [ ] Folder structure diagram
- [ ] Any dependencies or external resources
- [ ] NO instructions to import from shared resources

## Browser Compatibility ✓

- [ ] Works on Chrome/Edge (latest 2 versions)
- [ ] Works on Firefox (latest 2 versions)
- [ ] Works on Safari (latest 2 versions)
- [ ] Works on mobile browsers (iPhone Safari, Chrome Android)
- [ ] Responsive on 320px–2560px widths
- [ ] No console errors on load

## Performance ✓

- [ ] Tool JS bundle: <100KB (minified + gzipped)
- [ ] Tool CSS: <50KB (minified + gzipped)
- [ ] Page load time: <3 seconds on 4G
- [ ] Interaction time: <500ms response to user input
- [ ] NO memory leaks in localStorage usage
- [ ] NO infinite loops in real-time processing

## Accessibility ✓

- [ ] Keyboard navigation works (tab, enter, arrows)
- [ ] All form inputs have `<label>` or ARIA label
- [ ] Color contrast ≥4.5:1 for normal text
- [ ] Links are underlined or visually distinct
- [ ] Touch targets ≥44px (mobile)
- [ ] NO flash/flicker (accessibility standard)

## Security ✓

- [ ] NO hardcoded API keys or secrets
- [ ] NO `dangerouslySetInnerHTML` with user input
- [ ] Input validation prevents injection
- [ ] File downloads don't expose file system paths
- [ ] localStorage data is not sensitive (no passwords/tokens)
- [ ] NO eval() or similar dangerous functions

---

## Final Verification

Before marking a tool todo COMPLETE, run this automated verification:

```bash
# Run all checks in one command
cd app/tools/[tool-slug]

# Check for shared imports
echo "=== Checking for shared imports ==="
grep -r "from.*lib/" --include="*.tsx" --include="*.ts" . | grep -v "\.\/lib" | grep -v "test" || echo "✓ No shared lib imports"
grep -r "from.*components/" --include="*.tsx" . | grep -v "\.\/components" | grep -v "test" || echo "✓ No shared component imports"
grep -r "from.*utils/" --include="*.tsx" --include="*.ts" . | grep -v "\.\/utils" || echo "✓ No shared utils imports"

# Check CSS for globals.css imports
echo "=== Checking CSS isolation ==="
grep "@import\|globals" styles.css && echo "✗ Found shared CSS imports!" || echo "✓ CSS is isolated"

# Check for global selectors (basic check)
echo "=== Checking for namespace compliance ==="
grep -E "^(body|h[1-6]|p|div|button|input|select) *{" styles.css && echo "⚠ Found potential global selectors!" || echo "✓ Selectors are namespaced"

# Check localStorage keys
echo "=== Checking localStorage key naming ==="
grep -r "localStorage" --include="*.tsx" --include="*.ts" . | grep -o "'[a-z-]*'" | sort -u
echo "^ Verify all keys follow pattern: [tool-slug]-*"

# Check for console output
echo "=== Checking test coverage ==="
ls -1 ../../tests/tools/[tool-slug]/*.test.* 2>/dev/null | wc -l | xargs echo "Test files found:"
```

---

## Sign-Off

Tool completed when:

- [ ] ALL checkboxes above are checked ✓
- [ ] Automated verification passes (0 shared imports, CSS isolated, etc.)
- [ ] Tests pass: `npm test -- app/tools/[tool-slug]`
- [ ] Developer has read this checklist and verified each point
- [ ] No human involvement needed for deployment

---

**Isolation Check Date**: ________________  
**Checked By**: ________________  
**Verification Status**: ☐ PASS ☐ FAIL  
**Notes**: _______________________________________________________________________________
