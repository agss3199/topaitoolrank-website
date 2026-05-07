# Todo 19: Implement GA4 Script in Layout → ✅ COMPLETED

**Status**: Completed  
**Implements**: specs/tool-pages-google-analytics.md  
**Dependencies**: 18-update-ga4-blocking-tests (tests must be updated first)  
**Blocks**: 20-verify-ga4-implementation (unblocked)

## Description

Add Google Analytics 4 tracking script to `app/layout.tsx` using Next.js official integration. Enables GA4 tracking on ALL pages site-wide automatically.

**Goal**: GA4 will be LIVE on all pages (homepage, blog, tools) after this todo completes.

**Property ID**: `G-D98KCREKZC` (existing from old static site)

## Acceptance Criteria

- [x] GoogleAnalytics component imported from `@next/third-parties/google`
- [x] GA4 script added to root layout (`app/layout.tsx`)
- [x] Property ID is correct: `G-D98KCREKZC`
- [x] Script loaded asynchronously (doesn't block page rendering)
- [x] All pages load without errors
- [x] Updated GA4 tests pass
- [x] No TypeScript errors

## Implementation Notes

### Step 1: Install required package

```bash
npm install @next/third-parties
```

### Step 2: Update `app/layout.tsx`

Add import at the top:
```typescript
import { GoogleAnalytics } from '@next/third-parties/google';
```

Add component at end of body (before closing `</body>`):
```typescript
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* existing head content */}
      </head>
      <body>
        {children}
        
        {/* GA4 script — place at end of body for async loading */}
        <GoogleAnalytics gaId="G-D98KCREKZC" />
      </body>
    </html>
  );
}
```

### Step 3: Verify no TypeScript errors

```bash
npm run build
```

Should compile without errors.

### Step 4: Run updated tests

```bash
npm run test -- tests/unit/performance.test.ts
npm run test -- tests/unit/deployment-readiness.test.ts
npm run test -- tests/integration/homepage.test.ts
```

All three should pass (they were updated in todo 18 to expect GA code).

## Verification

**Local development**:
1. `npm run dev`
2. Open `http://localhost:3000`
3. Open browser DevTools → Network tab
4. Reload page
5. Search for "googletagmanager" or "gtag" in network requests
6. Should see requests to Google Analytics servers

**Staging/Production**:
- Verify GA script loads without errors
- Check browser console for no GA-related errors
- Real-time users should appear in GA dashboard within 1-2 minutes

## Testing

- [x] Package installed (`npm ls @next/third-parties`)
- [x] Import statement correct
- [x] Component syntax correct
- [x] Property ID is correct (G-D98KCREKZC)
- [x] Placed at end of body (async loading)
- [x] Build succeeds
- [x] No TypeScript errors
- [x] Updated tests pass

## Related Specs

- GA4 implementation: specs/tool-pages-google-analytics.md § GA4 Implementation
- Step 2: specs/tool-pages-google-analytics.md § Step 2: Add GA Script to app/layout.tsx

## Notes

- `@next/third-parties` is the official Next.js integration for GA4
- Script loads asynchronously and doesn't block page rendering
- No additional configuration needed (property ID is all that's required)
- Works on all pages automatically (loaded from root layout)

## Time Estimate

~15 minutes (install, add 2 lines of code, verify)
