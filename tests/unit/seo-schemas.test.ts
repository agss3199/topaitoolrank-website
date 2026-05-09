/**
 * SEO Schema Component Tests
 *
 * Verifies JSON-LD structured data is correctly formed in each
 * schema component. Uses source-level analysis consistent with
 * the project's existing test patterns.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../..');

// Load component sources
const BREADCRUMB_SCHEMA = fs.readFileSync(
  path.join(ROOT, 'app/tools/lib/BreadcrumbSchema.tsx'),
  'utf-8'
);
const FAQ_SCHEMA = fs.readFileSync(
  path.join(ROOT, 'app/tools/lib/FAQSchema.tsx'),
  'utf-8'
);
const ORG_SCHEMA = fs.readFileSync(
  path.join(ROOT, 'app/lib/OrganizationSchema.tsx'),
  'utf-8'
);
const NAV_SCHEMA = fs.readFileSync(
  path.join(ROOT, 'app/lib/NavigationSchema.tsx'),
  'utf-8'
);
const SCROLL_REVEAL = fs.readFileSync(
  path.join(ROOT, 'app/(marketing)/elements/ScrollReveal.tsx'),
  'utf-8'
);
const TOOLS_PAGE = fs.readFileSync(
  path.join(ROOT, 'app/tools/page.tsx'),
  'utf-8'
);

// ============================================================
// BreadcrumbSchema
// ============================================================
describe('BreadcrumbSchema', () => {
  it('renders script tag with application/ld+json type', () => {
    expect(BREADCRUMB_SCHEMA).toContain('type="application/ld+json"');
  });

  it('uses BreadcrumbList schema type', () => {
    expect(BREADCRUMB_SCHEMA).toContain("'@type': 'BreadcrumbList'");
  });

  it('builds itemListElement from items prop with position', () => {
    expect(BREADCRUMB_SCHEMA).toContain("'@type': 'ListItem'");
    expect(BREADCRUMB_SCHEMA).toContain('position: index + 1');
  });

  it('includes schema.org context', () => {
    expect(BREADCRUMB_SCHEMA).toContain("'@context': 'https://schema.org'");
  });

  it('uses dangerouslySetInnerHTML with JSON.stringify', () => {
    expect(BREADCRUMB_SCHEMA).toContain('dangerouslySetInnerHTML');
    expect(BREADCRUMB_SCHEMA).toContain('JSON.stringify(schema)');
  });

  it('accepts items prop with name and url fields', () => {
    expect(BREADCRUMB_SCHEMA).toContain('name: string');
    expect(BREADCRUMB_SCHEMA).toContain('url: string');
    expect(BREADCRUMB_SCHEMA).toContain('items: BreadcrumbItem[]');
  });
});

// ============================================================
// FAQSchema
// ============================================================
describe('FAQSchema', () => {
  it('renders script tag with application/ld+json type', () => {
    expect(FAQ_SCHEMA).toContain('type="application/ld+json"');
  });

  it('uses FAQPage schema type', () => {
    expect(FAQ_SCHEMA).toContain("'@type': 'FAQPage'");
  });

  it('builds Question entities with acceptedAnswer', () => {
    expect(FAQ_SCHEMA).toContain("'@type': 'Question'");
    expect(FAQ_SCHEMA).toContain("'@type': 'Answer'");
    expect(FAQ_SCHEMA).toContain('acceptedAnswer');
  });

  it('returns null for empty questions array', () => {
    expect(FAQ_SCHEMA).toContain('if (!questions || questions.length === 0) return null');
  });

  it('renders visible FAQ section with details/summary elements', () => {
    expect(FAQ_SCHEMA).toContain('<details');
    expect(FAQ_SCHEMA).toContain('<summary');
  });

  it('accepts questions prop with q and a fields', () => {
    expect(FAQ_SCHEMA).toContain('q: string');
    expect(FAQ_SCHEMA).toContain('a: string');
  });
});

// ============================================================
// OrganizationSchema
// ============================================================
describe('OrganizationSchema', () => {
  it('renders script tag with application/ld+json type', () => {
    expect(ORG_SCHEMA).toContain('type="application/ld+json"');
  });

  it('uses Organization schema type', () => {
    expect(ORG_SCHEMA).toContain("'@type': 'Organization'");
  });

  it('includes ContactPoint structured data', () => {
    expect(ORG_SCHEMA).toContain("'@type': 'ContactPoint'");
    expect(ORG_SCHEMA).toContain("contactType: 'Customer Service'");
  });

  it('has correct default values for Top AI Tool Rank', () => {
    expect(ORG_SCHEMA).toContain("name = 'Top AI Tool Rank'");
    expect(ORG_SCHEMA).toContain("url = 'https://topaitoolrank.com'");
    expect(ORG_SCHEMA).toContain("email = 'contact@topaitoolrank.com'");
  });

  it('conditionally includes sameAs for social profiles', () => {
    expect(ORG_SCHEMA).toContain('if (sameAs.length > 0)');
    expect(ORG_SCHEMA).toContain('schema.sameAs = sameAs');
  });
});

// ============================================================
// NavigationSchema
// ============================================================
describe('NavigationSchema', () => {
  it('renders script tag with application/ld+json type', () => {
    expect(NAV_SCHEMA).toContain('type="application/ld+json"');
  });

  it('uses SiteNavigationElement schema type', () => {
    expect(NAV_SCHEMA).toContain("'@type': 'SiteNavigationElement'");
  });

  it('uses @graph for multiple navigation elements', () => {
    expect(NAV_SCHEMA).toContain("'@graph'");
  });

  it('includes main navigation links', () => {
    expect(NAV_SCHEMA).toContain("name: 'Main Navigation'");
    expect(NAV_SCHEMA).toContain("{ name: 'Home', url: 'https://topaitoolrank.com' }");
    expect(NAV_SCHEMA).toContain("{ name: 'Tools', url: 'https://topaitoolrank.com/#tools' }");
    expect(NAV_SCHEMA).toContain("{ name: 'Blogs', url: 'https://topaitoolrank.com/blogs' }");
  });

  it('includes tools navigation links', () => {
    expect(NAV_SCHEMA).toContain("name: 'Tools Navigation'");
    expect(NAV_SCHEMA).toContain("{ name: 'WhatsApp Message Formatter'");
    expect(NAV_SCHEMA).toContain("{ name: 'JSON Formatter'");
  });

  it('exports MAIN_NAV_LINKS and TOOL_NAV_LINKS for reuse', () => {
    expect(NAV_SCHEMA).toContain('export const MAIN_NAV_LINKS');
    expect(NAV_SCHEMA).toContain('export const TOOL_NAV_LINKS');
  });
});

// ============================================================
// ScrollReveal
// ============================================================
describe('ScrollReveal', () => {
  it('is a client component', () => {
    expect(SCROLL_REVEAL).toContain('"use client"');
  });

  it('uses IntersectionObserver for scroll detection', () => {
    expect(SCROLL_REVEAL).toContain('new IntersectionObserver');
  });

  it('targets elements with the reveal class', () => {
    expect(SCROLL_REVEAL).toContain('document.querySelectorAll(".reveal")');
  });

  it('adds visible class when element intersects', () => {
    expect(SCROLL_REVEAL).toContain('entry.target.classList.add("visible")');
  });

  it('sets intersection threshold to 0.12', () => {
    expect(SCROLL_REVEAL).toContain('threshold: 0.12');
  });

  it('disconnects observer on cleanup', () => {
    expect(SCROLL_REVEAL).toContain('revealObserver.disconnect()');
  });

  it('renders children without wrapper elements', () => {
    expect(SCROLL_REVEAL).toContain('return <>{children}</>');
  });
});

// ============================================================
// Tools Directory Page — CollectionPage Schema
// ============================================================
describe('Tools Directory Page', () => {
  it('renders CollectionPage JSON-LD', () => {
    expect(TOOLS_PAGE).toContain('"@type": "CollectionPage"');
  });

  it('includes ItemList with tool entries', () => {
    expect(TOOLS_PAGE).toContain('"@type": "ItemList"');
    expect(TOOLS_PAGE).toContain('"@type": "ListItem"');
  });

  it('renders BreadcrumbList JSON-LD for navigation', () => {
    expect(TOOLS_PAGE).toContain('"@type": "BreadcrumbList"');
  });

  it('includes correct canonical URL', () => {
    expect(TOOLS_PAGE).toContain('canonical: "https://topaitoolrank.com/tools"');
  });

  it('sets OpenGraph metadata', () => {
    expect(TOOLS_PAGE).toContain('openGraph:');
    expect(TOOLS_PAGE).toContain('type: "website"');
  });
});
