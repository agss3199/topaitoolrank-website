# 006 — Add Palm Reader to Tools Directory Listing

**Status**: completed  
**Owner**: react-specialist  
**Phase**: implement  
**Effort**: 10 min (find directory page, add card)  
**Depends on**: 005 (tool layout finalized)  
**Blocks**: 008 (deployment needs directory updated)

---

## Overview

Add a tool card for "Palm Reader" to the tools directory page at `/tools`, so users can discover and access the new tool. Include descriptive title, icon/emoji, brief description, and "Try Tool" link. Ensure the card matches the visual style of other tool cards.

**Scope**: ~30 LOC — one new card component/entry in tools directory.

---

## Specification References

- **R5: Tool Integration** — spec §R5 mentions tools directory listing
- **Brief**: Tool must be discoverable via `/tools` directory

---

## Acceptance Criteria

### Directory Card Content
- [ ] Tool name: "Palm Reader" (or "🌴 Palm Reader" with emoji)
- [ ] Description: Short 1-2 line description (e.g., "AI-powered palm reading entertainment using computer vision")
- [ ] Icon/Visual: Palm emoji (🌴) or hand emoji (✋) or custom icon
- [ ] Status badge: "Live" or "New" badge (if applicable)
- [ ] "Try Tool" button: Links to `/tools/palm-reader`
- [ ] Category/Tag: "Entertainment" or "AI Tools" or "Vision AI"

### Card Styling
- [ ] Card design matches existing tool cards on page
- [ ] Responsive: stacks vertically on mobile, grid layout on desktop
- [ ] Hover state: subtle shadow/transform on hover
- [ ] Colors: matches website theme (indigo/purple accents)
- [ ] Text readable and properly sized

### Directory Page Location
- [ ] Find tools directory page (likely `app/tools/page.tsx` or `app/(marketing)/page.tsx`)
- [ ] Add new tool card to tool grid/list
- [ ] Maintain alphabetical or logical order with other tools
- [ ] Verify page builds without errors

### Related Lists/Navigation
- [ ] Check if tools are listed elsewhere (navigation menu, sidebar, homepage)
- [ ] Add Palm Reader to all relevant tool lists (if applicable)
- [ ] Update tools count in any "We have X tools" text (if applicable)

---

## Files to Modify

```
app/tools/page.tsx (or app/(marketing)/page.tsx)
  └── Add <ToolCard> for Palm Reader to the tools grid
      
app/components/tool-card.tsx (if component-based)
  └── Verify ToolCard component accepts all needed props
      
OR inline the card if not using a component
```

---

## Example Tool Card Markup

### Option A: Component-Based (If Using ToolCard Component)
```typescript
<ToolCard
  name="Palm Reader"
  description="AI-powered palm reading entertainment using computer vision"
  icon="🌴"
  href="/tools/palm-reader"
  category="Entertainment"
  isNew={true}
/>
```

### Option B: Inline Card (Tailwind Classes)
```typescript
<div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
  <div className="flex items-center justify-between mb-3">
    <h3 className="text-xl font-bold text-gray-900">🌴 Palm Reader</h3>
    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Live</span>
  </div>
  <p className="text-gray-600 text-sm mb-4">
    AI-powered palm reading entertainment using computer vision and generative AI.
  </p>
  <a
    href="/tools/palm-reader"
    className="inline-block bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
  >
    Try Tool →
  </a>
</div>
```

---

## Integration Steps

### Step 1: Locate Tools Directory Page
- Search for page displaying tool cards
- Likely locations:
  - `app/tools/page.tsx` — tools listing page
  - `app/(marketing)/page.tsx` — homepage with tools section
  - `app/components/tools-grid.tsx` — reusable grid component

### Step 2: Identify Card Structure
- Look at how existing tools are rendered (invoice-generator, seo-analyzer, etc.)
- Check if there's a ToolCard component or if cards are inlined
- Copy structure from existing card

### Step 3: Add Palm Reader Card
- Add new card entry in same position as other tools
- Use same props/markup as existing cards
- Maintain consistent spacing and styling

### Step 4: Verify Order
- Alphabetical order (if used): "Palm Reader" comes before most tools
- Or logical grouping: place with similar entertainment/AI tools
- Check if there's a preferred ordering scheme

---

## Verification Checklist

- [ ] Tools directory page located and identified
- [ ] Palm Reader card added to page
- [ ] Card displays with correct name and description
- [ ] Card has appropriate icon/emoji
- [ ] "Try Tool" button links to `/tools/palm-reader`
- [ ] Card styling matches other tool cards
- [ ] Page builds without errors: `npm run build`
- [ ] Page renders correctly in browser
- [ ] Card responsive on mobile (375px viewport)
- [ ] Card responsive on tablet (768px viewport)
- [ ] Card responsive on desktop (1920px viewport)
- [ ] Hover state visible and functional
- [ ] No console errors in DevTools
- [ ] Link to `/tools/palm-reader` works correctly
- [ ] Tools count updated if applicable

---

## Testing the Link

After deploying (todo 008), verify:
1. Navigate to `/tools`
2. Locate Palm Reader card
3. Click "Try Tool" button
4. Verify redirect to `/tools/palm-reader` works
5. Verify tool loads and is functional

---

## Related Todos

- **Depends on**: 005 (tool layout complete)
- **Blocks**: 008 (deployment needs directory updated for discoverability)
- **Parallelize with**: 007 (testing — can run tests while directory is being updated)

---

## Session Context

- Reference tools: invoice-generator, seo-analyzer, ai-prompt-generator
- Find tools directory: grep for "Tools" or "tools" in `app/` to locate page
- Styling reference: check existing tool cards for CSS classes used

