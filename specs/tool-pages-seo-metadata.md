# Tool Pages SEO Metadata Specification

## Scope

Per-tool SEO metadata (page titles, descriptions, Open Graph tags, structured data) for all 9 micro-SaaS tools. Ensures search engines understand page content and displays properly in search results and social media.

## Page Title & Meta Description

Each tool page has a unique, keyword-optimized title and description.

### Title Format

**50-60 characters total** (optimal for search result display)

```
[Tool Name]: [Primary Benefit] | [Brand]
```

**Examples**:
- "JSON Formatter: Beautify & Validate JSON Online | AI Tool Rank"
- "Word Counter: Count Words & Characters | AI Tool Rank"
- "Email Subject Tester: Optimize Subject Lines | AI Tool Rank"
- "AI Prompt Generator: Create Better ChatGPT Prompts | AI Tool Rank"
- "UTM Link Builder: Track Campaign Links | AI Tool Rank"
- "Invoice Generator: Create Professional Invoices | AI Tool Rank"
- "SEO Analyzer: Check On-Page SEO Scores | AI Tool Rank"
- "WhatsApp Link Generator: Create WhatsApp Links | AI Tool Rank"
- "WhatsApp Message Formatter: Format WhatsApp Text | AI Tool Rank"

**Constraints**:
- Include primary keyword (the tool name or key function)
- Include primary benefit (action/outcome)
- Include brand name for consistency
- Keep under 60 characters for full display in Google results

### Meta Description Format

**150-160 characters total** (optimal for search result display)

```
Free [tool function]. [Primary benefit]. No sign-up required. [Secondary benefit/feature].
```

**Examples**:
- "Free JSON formatter & validator. Beautify, minify, and validate JSON with syntax highlighting. No sign-up required. Perfect for developers and APIs."
- "Free word counter tool. Count words, characters, sentences, and paragraphs instantly. No sign-up required. Supports multiple languages."
- "Free email subject line tester. Preview subject lines across email clients and detect spam words. No sign-up required. Improve email open rates."

**Constraints**:
- Include primary keyword naturally
- Describe the value clearly
- Include "free" and "no sign-up" to increase click-through rate
- Avoid keyword stuffing or repetition
- End with a benefit or action

## Canonical Tags

Each tool page has a canonical URL pointing to itself.

```html
<link rel="canonical" href="https://www.topaitoolrank.com/tools/json-formatter" />
```

**Purpose**: Prevent duplicate content issues if the page is served via multiple URLs.

**Implementation**: Add to the `<head>` section of each tool page via Next.js metadata export.

## Open Graph Tags (Social Media)

Each tool page includes Open Graph tags for rich previews on social media (Facebook, Twitter, LinkedIn, etc.).

```html
<meta property="og:title" content="JSON Formatter: Beautify & Validate JSON | AI Tool Rank" />
<meta property="og:description" content="Free JSON formatter tool. Beautify, validate, and minify JSON with syntax highlighting." />
<meta property="og:image" content="https://www.topaitoolrank.com/og-images/json-formatter.jpg" />
<meta property="og:url" content="https://www.topaitoolrank.com/tools/json-formatter" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Top AI Tool Rank" />
```

### Twitter Card Tags

```html
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="JSON Formatter: Beautify & Validate JSON | AI Tool Rank" />
<meta name="twitter:description" content="Free JSON formatter tool. Beautify, validate, and minify JSON with syntax highlighting." />
<meta name="twitter:image" content="https://www.topaitoolrank.com/og-images/json-formatter.jpg" />
```

**OG Image Requirements**:
- Size: 1200×630px (optimal for most platforms)
- Format: JPG or PNG, <200KB
- Content: Tool name prominently displayed, brand colors, simple/clean design
- One image per tool (generic "tool" image not acceptable)

## Structured Data (JSON-LD Schema)

Each tool page includes structured data for search engines to understand the page type and content.

```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "JSON Formatter",
  "description": "Free online JSON formatter and validator with syntax highlighting.",
  "url": "https://www.topaitoolrank.com/tools/json-formatter",
  "applicationCategory": "Utility",
  "operatingSystem": "Web Browser",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "125"
  },
  "author": {
    "@type": "Organization",
    "name": "Top AI Tool Rank",
    "url": "https://www.topaitoolrank.com"
  }
}
```

**Alternative**: Use `FAQPage` schema if the article includes a FAQ section (recommended).

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is a JSON formatter?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "A JSON formatter is a tool that formats, validates, and beautifies JSON code..."
      }
    }
  ]
}
```

## Mobile Optimization

### Viewport Meta Tag

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

**Purpose**: Ensures proper scaling on mobile devices.

### Mobile-Friendly Checklist

- Text is readable without zooming (16px minimum font size)
- Buttons/links are at least 44×44px (easy to tap)
- No horizontal scrolling required
- Form fields are appropriately sized
- Touch targets have spacing between them (no accidental clicks)

## Language & Character Encoding

```html
<html lang="en" />
<meta charset="UTF-8" />
```

## Favicon & Icons

```html
<link rel="icon" type="image/x-icon" href="/favicon.ico" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
```

## No-Index Pages (if applicable)

Certain pages should NOT be indexed (e.g., draft content, private pages):

```html
<meta name="robots" content="noindex" />
```

**Apply to**: None of the 9 tool pages (all should be indexed).

## Next.js Implementation

Tool pages use Next.js metadata export:

```typescript
// app/tools/json-formatter/page.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'JSON Formatter: Beautify & Validate JSON | AI Tool Rank',
  description: 'Free JSON formatter tool. Beautify, validate, and minify JSON with syntax highlighting.',
  keywords: ['JSON formatter', 'JSON beautifier', 'JSON validator'],
  openGraph: {
    title: 'JSON Formatter: Beautify & Validate JSON | AI Tool Rank',
    description: 'Free JSON formatter tool. Beautify, validate, and minify JSON with syntax highlighting.',
    url: 'https://www.topaitoolrank.com/tools/json-formatter',
    type: 'website',
    images: [
      {
        url: 'https://www.topaitoolrank.com/og-images/json-formatter.jpg',
        width: 1200,
        height: 630,
        alt: 'JSON Formatter Tool',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JSON Formatter: Beautify & Validate JSON | AI Tool Rank',
    description: 'Free JSON formatter tool. Beautify, validate, and minify JSON with syntax highlighting.',
    images: ['https://www.topaitoolrank.com/og-images/json-formatter.jpg'],
  },
  canonical: 'https://www.topaitoolrank.com/tools/json-formatter',
};

export default function JsonFormatterPage() {
  return (
    // Page content
  );
}
```

**Constraint**: Client components (these tool pages use `'use client'`) cannot export metadata directly. Solution: Create a server component wrapper or use middleware to inject metadata. See implementation plan for details.

## Per-Tool Metadata Summary

| Tool | Title | Description | OG Image | Primary Keyword |
|------|-------|-------------|----------|-----------------|
| JSON Formatter | JSON Formatter: Beautify & Validate JSON \| AI Tool Rank | Free JSON formatter tool. Beautify, validate, and minify JSON with syntax highlighting. | json-formatter.jpg | JSON formatter |
| Word Counter | Word Counter: Count Words & Characters \| AI Tool Rank | Free word counter tool. Count words, characters, sentences, and paragraphs instantly. No sign-up required. | word-counter.jpg | Word counter |
| Email Subject Tester | Email Subject Tester: Optimize Subject Lines \| AI Tool Rank | Free email subject line tester. Preview subject lines across email clients and detect spam words. | email-subject-tester.jpg | Email subject tester |
| AI Prompt Generator | AI Prompt Generator: Create Better Prompts \| AI Tool Rank | Free AI prompt generator for ChatGPT. Create better prompts with structure and examples. | ai-prompt-generator.jpg | AI prompt generator |
| UTM Link Builder | UTM Link Builder: Track Campaign Links \| AI Tool Rank | Free UTM link builder. Create tracking links for Google Analytics campaigns instantly. | utm-link-builder.jpg | UTM link builder |
| Invoice Generator | Invoice Generator: Create Invoices \| AI Tool Rank | Free invoice generator tool. Create professional invoices in seconds for freelancers and small businesses. | invoice-generator.jpg | Invoice generator |
| SEO Analyzer | SEO Analyzer: Check On-Page SEO \| AI Tool Rank | Free SEO analyzer tool. Check on-page SEO scores and get optimization recommendations. | seo-analyzer.jpg | SEO analyzer |
| WhatsApp Link Generator | WhatsApp Link Generator: Create Links \| AI Tool Rank | Free WhatsApp link generator. Create clickable WhatsApp chat links for your website. | whatsapp-link-generator.jpg | WhatsApp link generator |
| WhatsApp Message Formatter | WhatsApp Formatter: Format Messages \| AI Tool Rank | Free WhatsApp message formatter. Add bold, italic, and other text formatting to WhatsApp messages. | whatsapp-message-formatter.jpg | WhatsApp formatter |

## Success Criteria

- All 9 tools have correct metadata exported
- Page titles are under 60 characters
- Meta descriptions are 150-160 characters
- Canonical tags point to correct URLs
- Open Graph tags display properly on social media
- Structured data is valid (test via schema.org validator)
- Mobile viewport is configured
- No Search Console errors for metadata
