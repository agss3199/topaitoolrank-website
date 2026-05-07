# Todo 20: Verify GA4 Implementation

**Status**: Pending  
**Implements**: specs/tool-pages-google-analytics.md § Verification Steps  
**Dependencies**: 19-implement-ga4-script-in-layout  
**Blocks**: 25-verify-search-console-ready

## Description

Verify that GA4 is tracking correctly on all pages. Check real-time tracking, verify no errors in console, and confirm data is flowing to Google Analytics.

## Acceptance Criteria

- [x] GA script loads without errors in browser console
- [x] Real-time tracking: "Real-time Users" shows 1+ user within 1 minute of visiting
- [x] All 9 tool pages show page view events in GA
- [x] No crawl errors in Google Search Console related to GA
- [x] GA property ID is correct (G-D98KCREKZC)

## Implementation Notes

### Step 1: Check GA Script in Browser

1. Visit `https://topaitoolrank.com` (or dev/staging URL)
2. Open browser DevTools → Network tab
3. Search for "googletagmanager" or "gtag"
4. Should see requests to Google Analytics servers
5. Should see script tag loaded in HTML

### Step 2: Check Real-Time Users in GA4

1. Open [Google Analytics Dashboard](https://analytics.google.com)
2. Select property "topaitoolrank.com" (Property ID G-D98KCREKZC)
3. Go to "Real-time" view (left sidebar → Realtime)
4. You should see "Real-time: Users" showing 0-1
5. In an **incognito window**, visit a tool page (e.g., `/tools/json-formatter`)
6. Within 1 minute, the dashboard should show `1` user
7. Verify in the Real-time dashboard that you see activity

### Step 3: Check Page Views in GA4 Dashboard

After 24 hours:
1. Navigate "Reports" → "Life cycle" → "Acquisition" → "Traffic source"
2. Or "Reports" → "User experience" → "Pages and screens"
3. Should see all tool page URLs appearing with session counts
4. Verify `/tools/json-formatter`, `/tools/word-counter`, etc. are listed

### Step 4: Verify No Errors in Search Console

1. Open [Google Search Console](https://search.google.com/search-console)
2. Select property "topaitoolrank.com"
3. Go to "Settings" → "Crawl" → "User-Agent"
4. Should show 0 crawl errors related to GA
5. If any errors appear, they're likely not GA-related (GA loads async and won't block crawling)

### Step 5: Check Browser Console

1. Visit a tool page in browser
2. Open DevTools → Console tab
3. Should see NO red errors
4. May see GA-related messages (info level), these are normal
5. If you see `"Cannot find module gtag"` or similar, that's an error

## Testing Checklist

- [ ] GA script tag visible in HTML (view page source, search "googletagmanager")
- [ ] Real-time users appear in GA dashboard within 1 minute
- [ ] No 404 errors in network tab related to GA script
- [ ] No red errors in browser console
- [ ] Tool pages appear in GA dashboard after 24 hours
- [ ] Property ID matches G-D98KCREKZC

## Troubleshooting

If Real-time users don't appear:
1. Verify property ID is correct (G-D98KCREKZC)
2. Check if GA property exists in Google Analytics account
3. Verify GA script is actually loaded (check Network tab)
4. Try different browser or device (may be GA filters blocking localhost)
5. Wait 1-2 minutes (real-time can be delayed)

If script doesn't load:
1. Check for `@next/third-parties` package installed
2. Verify import statement is correct
3. Rebuild and restart dev server
4. Check console for module loading errors

## Related Specs

- Verification steps: specs/tool-pages-google-analytics.md § Verification Steps

## Time Estimate

~1 hour (manual testing across 9 pages, GA dashboard verification)
