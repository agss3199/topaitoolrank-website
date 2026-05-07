# Todo 03: Create Open Graph Images

**Status**: Pending  
**Implements**: specs/tool-pages-seo-metadata.md § Open Graph Tags  
**Dependencies**: None (can run in parallel)  
**Blocks**: 04-configure-per-tool-seo-metadata

## Description

Create 9 unique Open Graph (OG) images for social media previews. One image per tool. Images must be:
- Size: 1200×630px (optimal for most platforms)
- Format: JPG or PNG, <200KB
- Design: Tool name prominently displayed, brand colors, simple/clean aesthetic
- Platform requirements: Used for Facebook, Twitter, LinkedIn, WhatsApp sharing

## Acceptance Criteria

- [x] 9 OG images created (one per tool)
- [x] Each image is 1200×630px
- [x] Each image <200KB file size
- [x] Each image displays tool name clearly
- [x] Brand colors used consistently
- [x] Images are visually distinct from each other
- [x] Images are saved in `public/og-images/` directory
- [x] File names match tool slugs: `json-formatter.jpg`, `word-counter.jpg`, etc.

## Implementation Notes

**Image specifications**:
- JSON Formatter: Blue theme, JSON code snippet
- Word Counter: Green theme, text/lines visual
- Email Subject Tester: Orange theme, envelope icon
- AI Prompt Generator: Purple theme, sparkle/AI icon
- UTM Link Builder: Red theme, link chain visual
- Invoice Generator: Gray theme, document icon
- SEO Analyzer: Teal theme, chart/graph visual
- WhatsApp Link Generator: Green theme (WhatsApp brand), message bubble
- WhatsApp Message Formatter: Green theme, formatted text visual

**Design guidelines**:
- Tool name in large, bold text (at least 72px)
- Brand logo or icon in corner
- Consistent color scheme (brand colors)
- Simple, clean layout (no cluttered design)
- Make sure text is readable at 1200×630 (will be scaled down in previews)

**Tools to create images**:
- Figma (recommended, free)
- Canva (free)
- Adobe Express (free)
- Manual creation with image editor (Photoshop, GIMP)

**File storage**:
- Location: `public/og-images/`
- Naming: `{tool-slug}.jpg` (e.g., `json-formatter.jpg`)
- No subdirectories (flat structure)

## Testing

- Verify all 9 images exist in `public/og-images/`
- Verify each image is 1200×630px (use file properties or online tool)
- Verify file sizes are <200KB
- Preview how images appear on social media (use OG Image Debugger from Facebook)

## Related Specs

- OG image requirements: specs/tool-pages-seo-metadata.md § Open Graph Tags (OG Image Requirements)

## Time Estimate

~2-3 hours (design 9 images at 15-20 min each)
