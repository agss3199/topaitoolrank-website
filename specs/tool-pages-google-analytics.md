# Tool Pages Google Analytics Specification

## Scope

Google Analytics 4 (GA4) implementation for all 9 micro-SaaS tool pages plus existing blog pages. Tracks page views, user engagement, and tool usage to inform future optimization decisions.

## Current Status

**GA4 Property ID**: `G-D98KCREKZC` (exists from old static site, needs wiring in Next.js app)

**Current implementation**: None in Next.js application (`app/layout.tsx` has no GA code)

**Legacy**: Old static `index.html` had GA code, but that site is replaced by Next.js version

## GA4 Implementation

### Step 1: Install Next.js Analytics Package

```bash
npm install @next/third-parties
```

**Note**: `@next/third-parties` is the official Next.js integration for Google Analytics (replaces older `next-google-analytics` packages).

### Step 2: Add GA Script to app/layout.tsx

The root layout is the place for GA code to track all pages site-wide.

```typescript
// app/layout.tsx
import { GoogleAnalytics } from '@next/third-parties/google';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Other head content */}
      </head>
      <body>
        {children}
        {/* Place GA at end of body */}
        <GoogleAnalytics gaId="G-D98KCREKZC" />
      </body>
    </html>
  );
}
```

**Why end of body?** GA script loads asynchronously and doesn't block page rendering when placed at the end.

### Step 3: Configure GA4 for Events (Optional Phase 2)

Beyond page view tracking, optional events can track specific user actions:

```typescript
'use client'; // Only needed if in a client component

import { useEffect } from 'react';

export function ToolUsageTracker({ toolName }: { toolName: string }) {
  useEffect(() => {
    // Track tool usage
    if (window.gtag) {
      window.gtag('event', 'tool_used', {
        tool_name: toolName,
        timestamp: new Date().toISOString(),
      });
    }
  }, [toolName]);

  return null;
}
```

**Events to consider tracking**:
- `tool_opened` — User navigates to a tool page
- `tool_used` — User clicks "Format", "Count", etc. (submit action)
- `content_viewed` — User scrolls to article content
- `download_clicked` — User downloads or copies results

## Test Coordination

**Critical**: Three existing test files assert that GA code is NOT in `app/layout.tsx`. These tests must be updated before GA4 code can be added.

### Tests Blocking GA4 Implementation

1. **File**: `tests/unit/performance.test.ts`
   - **Lines**: 87-93
   - **Assertion**: `expect(layoutContent).not.toContain('gtag')`
   - **Status**: BLOCKS GA4 addition

2. **File**: `tests/unit/deployment-readiness.test.ts`
   - **Line**: 66, 151
   - **Assertion**: `expect(layoutContent).not.toContain('gtag')`
   - **Status**: BLOCKS GA4 addition

3. **File**: `tests/integration/homepage.test.ts`
   - **Line**: 264
   - **Assertion**: Related GA assertion
   - **Status**: BLOCKS GA4 addition

### Test Update Strategy

**Before adding GA code**, update these tests to:

1. **Option A** (Recommended): Remove assertions that GA must NOT exist. Add new assertions that GA DOES exist and is configured correctly.

```typescript
// BEFORE (blocks GA)
expect(layoutContent).not.toContain('gtag');

// AFTER (verifies GA)
expect(layoutContent).toContain('GoogleAnalytics');
expect(layoutContent).toContain('G-D98KCREKZC');
```

2. **Option B**: Skip GA checks in tests by environment variable.

```typescript
if (process.env.GA_ENABLED !== 'false') {
  expect(layoutContent).toContain('GoogleAnalytics');
}
```

## GA4 Property Configuration

### Measurement Protocol

GA4 automatically captures:
- **Page views**: Every URL navigation
- **Session info**: Session duration, entry page, exit page
- **User info**: Device type, browser, OS, country, language
- **Engagement**: Scroll depth, time on page, interaction rate

### Custom Events (Phase 2)

The following custom events are RECOMMENDED to add for deeper insight:

```typescript
// Tool usage event
gtag('event', 'tool_used', {
  'tool_name': 'json_formatter',
  'tool_category': 'developer',
  'input_size': 'large',  // small, medium, large
});

// Content engagement event
gtag('event', 'content_engaged', {
  'content_type': 'article',
  'article_section': 'how_to_use',
  'scroll_depth': '75',
});
```

**Note**: Custom events require additional setup in Google Analytics admin panel (define new events, configure properties). Save for Phase 2.

## Verification Steps

### Step 1: Check GA Script in HTML

Open the deployed site in a browser, right-click "View Page Source", search for "GoogleAnalytics" or "gtag". Should find the GA script loaded.

```html
<!-- Should be present -->
<script src="https://www.googletagmanager.com/gtag/js?id=G-D98KCREKZC"></script>
```

### Step 2: Check Real-Time Users in GA4

1. Open [Google Analytics Dashboard](https://analytics.google.com)
2. Select property `topaitoolrank.com`
3. Navigate to "Real-time" view
4. Visit the site in a new incognito window
5. Confirm that "Real-time: Users" shows `1` user (yourself) within 1 minute

### Step 3: Check Page Views in GA4

After real-time verification:

1. Navigate "Acquisition" → "Traffic source" or "Pages and screens"
2. Wait 24 hours for data to populate
3. Confirm all 9 tool page URLs appear in the report with session counts
4. Confirm article pages have higher engagement time than tool UI pages

### Step 4: Verify No Errors in Search Console

1. Open [Google Search Console](https://search.google.com/search-console)
2. Check for any crawl errors or warnings related to GA loading
3. Should be 0 errors (GA script loads asynchronously and won't block indexing)

## Data Privacy & Compliance

### GDPR Compliance

GA4 should be configured to respect user privacy:

1. **IP Anonymization** (optional):
   - In Google Analytics admin, configure to anonymize IPs automatically
   - Not required for US-only traffic, but recommended for EU compliance

2. **Data Deletion**: GA4 automatically deletes data after 14 months (configurable in GA4 admin)

3. **Privacy Policy**: Mention GA in privacy policy:
   - "We use Google Analytics to understand how users interact with our site"
   - "Data is anonymized and used only for improving our service"

### Cookie Consent (Optional)

If the site has a cookie consent banner:
- Ensure GA is loaded only after user consent is given
- OR configure GA to load in "consent mode" where it respects browser privacy settings

**Current status**: No cookie consent banner is visible on the site (may be handled in Next.js or backend).

## Monitoring & Maintenance

### Daily (First Week After Launch)

- Check real-time users to confirm GA is loading
- Verify no crawl errors in Search Console
- Check for any JavaScript errors in browser console related to GA

### Weekly (First Month)

- Monitor total sessions and users
- Check page views per tool (confirm all 9 appear)
- Monitor bounce rate and average session duration

### Monthly (Ongoing)

- Review top pages by traffic (tools vs blog)
- Identify low-engagement pages that need improvement
- Check user demographics (device type, location, language)
- Review traffic sources (organic, direct, referral)

### Quarterly

- Compare month-over-month growth
- Identify seasonal trends
- Use data to inform content updates

## GA4 Dashboards (Phase 2)

Recommended dashboards to create for ongoing monitoring:

1. **Tool Traffic Dashboard**
   - Top tools by sessions
   - Sessions by tool category
   - Average engagement time per tool

2. **Content Engagement Dashboard**
   - Article scroll depth
   - Time spent on articles
   - Articles vs tool UI engagement

3. **Audience Insights**
   - Geographic distribution
   - Device types (mobile vs desktop)
   - Traffic sources

## Success Criteria

- GA4 script loads successfully in all pages
- Real-time tracking shows 1+ user within 1 minute of visiting
- All 9 tool pages appear in analytics reports within 24 hours
- Page view tracking shows correct URLs for each tool
- No crawl errors or warnings in Search Console
- Tests are updated to reflect GA presence
- GA property ID matches `G-D98KCREKZC`
- Data appears in analytics dashboard with user counts, sessions, and engagement metrics

## Known Constraint

Client components (`'use client'`) in Next.js cannot use Next.js metadata exports. Similarly, custom GA event tracking in client components requires additional setup. The GA script itself (loaded via `app/layout.tsx`) automatically tracks page views and doesn't require per-component configuration, so this is not a blocker for basic GA4 implementation.
