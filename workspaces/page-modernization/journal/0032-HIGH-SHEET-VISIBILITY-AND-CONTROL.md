---
id: "0032"
type: HIGH
slug: missing-sheet-name-visibility-delete-control
date: 2026-05-06T15:00:00Z
severity: HIGH
status: FIXED
---

# High: Missing Sheet Name Visibility and Delete Control

## What Happened

When users uploaded a sheet and refreshed the page, the sheet data persisted correctly (Round 2 fix), but there was no visible indication:
- Which sheet was loaded
- How to upload a different sheet
- Whether they needed to delete the current sheet before uploading a new one

**User Experience**: Sheet appears to be "silently working" with no UI feedback. Upload button only visible when no sheet loaded, causing confusion about current state.

**Impact**: Users had no control over sheet state and couldn't tell at a glance which sheet was active.

## Root Cause

The component showed upload UI conditionally based on `sheets.length`, but when sheets existed:
- No prominent display of loaded sheet names
- No visible way to clear/delete sheets
- Upload dropzone completely hidden

Users had to infer state from the visible "Step 2: Choose Your Channel" section appearing on screen.

## Fix Applied

**Commit**: `6b4cc05`  
**File**: `app/tools/wa-sender/page.tsx`

Added two UI elements:

### 1. Sheet Name Display Header (when sheets exist)
```typescript
{sheets.length > 0 && (
  <div style={{
    padding: '0.75rem 1rem',
    backgroundColor: 'var(--color-bg-gradient-lighter)',
    borderLeft: '4px solid var(--color-accent)',
    borderRadius: '0.375rem',
    marginBottom: '1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  }}>
    <div>
      <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
        Loaded Sheets
      </p>
      <p style={{ margin: 0, fontSize: '1rem', fontWeight: 500, color: 'var(--color-text-headline)' }}>
        {sheets.map(s => s.name).join(', ')}
      </p>
    </div>
```

### 2. Delete Button
Users can click "Delete Sheet" to clear the current sheet and re-upload:
```typescript
<button
  onClick={() => {
    setSheets([]);
    setCurrentIndex(0);
    setSentStatus({});
    setSelectedContacts([]);
  }}
  style={{...}}
  aria-label="Delete loaded sheet and allow re-upload"
>
  Delete Sheet
</button>
```

### 3. Conditional Upload UI
Upload dropzone now only visible when `sheets.length === 0`:
```typescript
{sheets.length === 0 && (
  <>
    <input ... />
    <label ... className="wa-upload-dropzone">...</label>
  </>
)}
```

## Deployment

- **Commit**: `6b4cc05`
- **Deployment**: Vercel (topaitoolrank.com)
- **Status**: LIVE
- **Build Time**: 29s

## Verification

✅ **Sheet names visible** — When sheet loaded, "Loaded Sheets: [name]" header displays  
✅ **Delete control present** — "Delete Sheet" button allows re-upload  
✅ **Upload UI state** — Dropzone hidden when sheets loaded, visible when empty  
✅ **CSS variables** — Uses design system tokens (--color-bg-gradient-lighter, --color-accent)  
✅ **Accessibility** — Delete button has aria-label, meaningful labeling  

## User Experience After Fix

1. User uploads sheet → "Loaded Sheets: [Sheet Name]" appears with blue left border
2. User can now see exactly which sheet is active
3. User clicks "Delete Sheet" to clear and upload a different one
4. Upload dropzone reappears, ready for new file
5. No confusion about state; explicit control over sheet management

## Prevention

For future sheet/file management UI:
1. Always display current state prominently (file names, counts, status)
2. Provide explicit actions to change state (delete, clear, replace)
3. Hide inputs that don't apply to current state (don't just disable)
4. Use design system for visual hierarchy (color, spacing, border)

## Related Issues

- **0030**: Session persistence (data now persists and is visible)
- **0031**: Sidebar styling (design system completeness)

---

**Fixed by**: Commit 6b4cc05  
**Deployed**: 2026-05-06 15:00 UTC  
**Status**: ✅ RESOLVED
