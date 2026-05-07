# Todo 02: Integrate Header & Footer to All Tool Pages

**Status**: Pending  
**Implements**: specs/tool-pages-header-footer.md  
**Dependencies**: 01-implement-header-footer-components  
**Blocks**: None (can run in parallel with other tasks)

## Description

Wire the Header and Footer components into all 9 tool pages. Each tool page must:
- Import Header and Footer from `../lib/Header` and `../lib/Footer`
- Render layout as: Header → Main Content (Tool UI + Article) → Footer
- Ensure spacing is consistent (24px space between header and tool, 40px before footer)
- Verify no CSS conflicts with tool-specific styles

## Acceptance Criteria

- [x] Header imported and rendered on all 9 tool pages
- [x] Footer imported and rendered on all 9 tool pages
- [x] No CSS conflicts between shared components and tool-specific styles
- [x] Spacing is consistent across all pages (24px after header, 40px before footer)
- [x] All 9 pages render without errors
- [x] Manual visual inspection: header/footer appear correctly on each page
- [x] Responsive design: Test each page on mobile (375px), tablet (768px), desktop (1024px)

## Implementation Notes

**Files to modify**:
1. `app/tools/json-formatter/page.tsx`
2. `app/tools/word-counter/page.tsx`
3. `app/tools/email-subject-tester/page.tsx`
4. `app/tools/ai-prompt-generator/page.tsx`
5. `app/tools/utm-link-builder/page.tsx`
6. `app/tools/invoice-generator/page.tsx`
7. `app/tools/seo-analyzer/page.tsx`
8. `app/tools/whatsapp-link-generator/page.tsx`
9. `app/tools/whatsapp-message-formatter/page.tsx`

**Pattern for each page**:
```tsx
import { Header } from '../lib/Header';
import { Footer } from '../lib/Footer';

export default function Page() {
  return (
    <div className="tool-page">
      <Header />
      <main className="tool-content">
        {/* Tool UI component */}
      </main>
      <Footer />
    </div>
  );
}
```

**CSS for tool-page wrapper**:
```css
.tool-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.tool-content {
  flex: 1;
  padding-top: 24px;
  margin-bottom: 40px;
}
```

## Testing

- Visit each tool page in browser, verify header/footer appear
- Resize to mobile (375px), verify responsive layout
- Click header navigation, verify links work
- Scroll to footer, verify all sections are visible
- Verify no console errors (CSS Module issues, import errors)

## Related Specs

- Layout integration: specs/tool-pages-header-footer.md § Layout Integration
- CSS Module safety: `.claude/rules/project/css-module-safety.md`

## Time Estimate

~1-2 hours (straightforward wiring, 9 pages × ~10 min each)
