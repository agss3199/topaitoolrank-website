# Todo 014: Add Hero Image to Homepage (Optional)

**Implements**: `specs/tool-pages-seo-metadata.md` § Homepage optimization  
**Priority**: ℹ️ LOW (Optional)  
**Dependency**: None  
**Effort**: 1 hour  
**Session**: 4 (optional)

## Description

Homepage is CSS-only with no images. Adding a hero image opens up Google Image search traffic and provides visual content for social sharing.

## Acceptance Criteria

- [ ] Hero image added to homepage (tool collage or brand image)
- [ ] Image uses `next/image` for optimization
- [ ] Alt text describes image content (targets keywords)
- [ ] Image renders properly on mobile
- [ ] Build succeeds

## Implementation

**File**: `app/page.tsx` (in refactored version from Todo 001)

**Add Image**:
```typescript
import Image from 'next/image';

export default function HomePage() {
  return (
    <div className="hero-section">
      <div className="hero-content">
        <h1>Free AI Tools for Every Task</h1>
        <p>Discover 10+ free AI tools for writing, coding, design, analysis, and more.</p>
      </div>
      
      <div className="hero-image">
        <Image
          src="/images/tools-collage.jpg"
          alt="Collection of free AI tools for writing, coding, design, and text analysis"
          width={1200}
          height={630}
          priority
          className="hero-img"
        />
      </div>
    </div>
  );
}
```

## Image Requirements

- **Dimensions**: 1200x630 (golden ratio)
- **Format**: WebP preferred, JPEG fallback
- **File size**: <200KB (optimize with tinypng.com)
- **Alt text**: Targets keywords ("free AI tools", "writing tools", "coding tools")
- **Content**: Tool icons/logos, visual representation of tool categories

## Optional Enhancements

- Add `sizes` attribute for responsive images: `sizes="(max-width: 768px) 100vw, 50vw"`
- Create different image variants for light/dark mode
- Use CSS `background-image` with `next/image` for parallax effect

## Testing

```bash
npm run build && npm run dev

# Visit homepage
# https://localhost:3000

# Check image loads
# DevTools → Network → filter "image"
# Should see tools-collage.jpg loading

# Check alt text
curl http://localhost:3000 | grep "alt="
# Should show: alt="Collection of free AI tools..."
```

## Expected Impact

- **Image search traffic**: 2-5% additional organic traffic
- **Social sharing**: Better preview when shared
- **CTR improvement**: Richer homepage preview in SERPs

---

**Status**: Optional implementation  
**Estimated Traffic Impact**: +2-5% from image search  
**Related Finding**: F-11 in seo-audit-comprehensive.md (optional)

