# Hero Image Requirements

**TL;DR:** Create 1200×630px JPEG → place at `public/blog/images/[slug].jpg` → reference in frontmatter as `heroImage: "/blog/images/[slug].jpg"` → filenames must match exactly.

## Image Specifications

| Property | Requirement | Why |
|----------|-------------|-----|
| **Dimensions** | 1200×630px | Optimal for social sharing previews (LinkedIn, Twitter, Facebook) |
| **Format** | JPEG (85% quality) or PNG | JPEG preferred for 30-40% smaller file size |
| **File size** | <50KB | Fast load on social platforms |
| **Color space** | RGB (not CMYK) | Web browsers don't support CMYK |
| **Aspect ratio** | 1.904:1 (exactly 1200/630) | Prevents image distortion on social shares |

## Directory Structure

```
project-root/
├── public/
│   └── blog/
│       ├── images/                    ← Hero images (1200×630)
│       │   ├── ai-integration-guide.jpg
│       │   ├── chatgpt-vs-claude.jpg
│       │   └── custom-software-development.jpg
│       └── author/                    ← Author avatars (200×200)
│           └── abhishek.jpg
└── content/
    └── blog/
        ├── ai-integration-guide.mdx   ← References above image
        ├── chatgpt-vs-claude-comparison.mdx
        └── custom-software-development-ai.mdx
```

## Frontmatter Setup

Every article MUST include the image path. The path must match the actual filename exactly:

```yaml
---
heroImage: "/blog/images/slug.jpg"        # Path as served by Next.js (public/ is root)
heroImageAlt: "Descriptive alt text 8-12 words"
heroImageWidth: 1200
heroImageHeight: 630
---
```

**Critical rule:** If frontmatter says `/blog/images/chatgpt-vs-claude.jpg`, the file MUST be at `public/blog/images/chatgpt-vs-claude.jpg` — not `chatgpt-vs-claude-comparison.jpg` or any variant.

## Validation Checklist

Before pushing:

- [ ] Image created at 1200×630px
- [ ] Saved as JPEG with 85% quality (or PNG)
- [ ] File size <50KB
- [ ] Placed at `public/blog/images/[slug].jpg`
- [ ] Frontmatter `heroImage` path matches filename exactly
- [ ] Alt text is descriptive (8-12 words, no placeholder text)
- [ ] `heroImageWidth: 1200` and `heroImageHeight: 630` in frontmatter

## Verification (After Deploy)

Live verification via curl:

```bash
# Check og:image tag points to correct URL
curl https://topaitoolrank.com/blogs/[slug] | grep og:image

# Verify image loads (returns 200, not 404)
curl -I https://topaitoolrank.com/blog/images/[slug].jpg

# Test social preview (LinkedIn, Twitter will load og:image)
# Paste URL into LinkedIn post composer to see preview with image
```

## Why This Matters

1. **Social sharing**: Incorrect images don't load on LinkedIn/Twitter, reducing click-through rate by ~30-40%
2. **SEO**: og:image tags enable Google's rich snippets
3. **Fast sharing**: 1200×630 is the exact size platforms display (no resizing needed)
4. **Filename matching**: Path mismatches (chatgpt-vs-claude vs chatgpt-vs-claude-comparison) cause 404 errors that break social previews

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Image dimensions 800×600 or 1920×1080 | Resize to exactly 1200×630 |
| Frontmatter path `/blog/images/slug.jpg` but file is `slugname.jpg` | Rename file to match frontmatter path |
| PNG file 200KB | Convert to JPEG 85% quality (~30KB) |
| Alt text: "blog header image" | Use descriptive alt: "AI integration connecting business processes" (8-12 words, specific) |
| Image in `public/blog/` instead of `public/blog/images/` | Move to correct subdirectory |

## Image Generation

To create hero images programmatically (Python):

```python
from PIL import Image, ImageDraw, ImageFont

def create_hero_image(title, filename):
    img = Image.new('RGB', (1200, 630), color='#1a2340')
    draw = ImageDraw.Draw(img)
    
    # Use system font or custom font
    font = ImageFont.truetype("arial.ttf", 48)
    
    # Center text
    bbox = draw.textbbox((0, 0), title, font=font)
    x = (1200 - (bbox[2] - bbox[0])) // 2
    y = (630 - (bbox[3] - bbox[1])) // 2
    
    draw.text((x, y), title, fill='white', font=font)
    img.save(filename, 'JPEG', quality=85)

create_hero_image("Article Title", "public/blog/images/slug.jpg")
```

See `.claude/agents/project/blog-publishing-specialist.md` for publishing workflow with images.
