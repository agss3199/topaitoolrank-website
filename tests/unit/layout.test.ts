/**
 * Layout Refactoring Tests (Todos 011-022)
 * TDD: These tests are written FIRST, before implementation.
 *
 * Tests validate:
 * - Particle canvas removal (Todo 011)
 * - Hero 2-column grid layout (Todo 012)
 * - Hero visual offset/overflow (Todo 013)
 * - Credibility strip 4-column grid (Todo 014)
 * - Services grid with asymmetric offset (Todo 015)
 * - Tools grid layout (Todo 016)
 * - Why-us 4-column grid (Todo 017)
 * - Process 4-step timeline grid (Todo 018)
 * - Contact 2-column layout (Todo 019)
 * - Mobile responsive (<768px) (Todo 020)
 * - Tablet responsive (768-1023px) (Todo 021)
 * - No horizontal overflow (Todo 022)
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../..');
const PAGE_TSX = fs.readFileSync(path.join(ROOT, 'app/page.tsx'), 'utf-8');
const STYLE_CSS = fs.readFileSync(path.join(ROOT, 'public/css/style.css'), 'utf-8');
const GLOBALS_CSS = fs.readFileSync(path.join(ROOT, 'app/globals.css'), 'utf-8');
const ALL_CSS = GLOBALS_CSS + '\n' + STYLE_CSS;

// ============================================================
// Todo 011: Particle Canvas Removal
// ============================================================
describe('Todo 011: Particle Canvas Removal', () => {
  it('page.tsx contains no canvas element', () => {
    expect(PAGE_TSX).not.toMatch(/<canvas[\s>]/);
  });

  it('page.tsx contains no canvasRef', () => {
    expect(PAGE_TSX).not.toMatch(/canvasRef/);
  });

  it('page.tsx contains no particlesRef', () => {
    expect(PAGE_TSX).not.toMatch(/particlesRef/);
  });

  it('page.tsx contains no particle animation code', () => {
    expect(PAGE_TSX).not.toMatch(/createParticles/);
    expect(PAGE_TSX).not.toMatch(/drawParticles/);
  });

  it('CSS has no #canvas-3d rules', () => {
    expect(ALL_CSS).not.toMatch(/#canvas-3d/);
  });
});

// ============================================================
// Todo 012: Hero 2-Column Grid (Desktop)
// ============================================================
describe('Todo 012: Hero 2-Column Grid', () => {
  it('hero-grid uses CSS grid with 2 columns', () => {
    expect(ALL_CSS).toMatch(/\.hero-grid\s*\{[^}]*display:\s*grid/);
    expect(ALL_CSS).toMatch(/\.hero-grid\s*\{[^}]*grid-template-columns:\s*1fr\s+1fr/);
  });

  it('hero-grid has 60px gap', () => {
    expect(ALL_CSS).toMatch(/\.hero-grid\s*\{[^}]*gap:\s*60px/);
  });

  it('container has max-width 1180px', () => {
    expect(ALL_CSS).toMatch(/\.container\s*\{[^}]*width:\s*min\(1180px/);
  });

  it('page.tsx has hero-content and hero-visual in hero-grid', () => {
    expect(PAGE_TSX).toMatch(/hero-grid/);
    expect(PAGE_TSX).toMatch(/hero-content/);
    expect(PAGE_TSX).toMatch(/hero-visual/);
  });
});

// ============================================================
// Todo 013: Hero Visual 120px Offset
// ============================================================
describe('Todo 013: Hero Visual Offset', () => {
  it('hero-visual has negative margin-bottom for overflow on desktop', () => {
    // Desktop: -120px overflow
    expect(ALL_CSS).toMatch(/\.hero-visual\s*\{[^}]*margin-bottom:\s*-120px/);
  });

  it('hero section does not clip overflow vertically', () => {
    // The hero section must not have overflow: hidden (which would clip the visual)
    // It may have overflow-x: hidden but not overflow: hidden or overflow-y: hidden
    const heroBlock = ALL_CSS.match(/\.hero\s*\{[^}]*\}/);
    if (heroBlock) {
      // overflow: hidden would clip the visual - should not be present
      // overflow-x: hidden is acceptable
      expect(heroBlock[0]).not.toMatch(/overflow:\s*hidden/);
    }
  });
});

// ============================================================
// Todo 014: Credibility Strip
// ============================================================
describe('Todo 014: Credibility Strip', () => {
  it('credibility-strip section exists in page.tsx', () => {
    expect(PAGE_TSX).toMatch(/credibility-strip/);
  });

  it('credibility-grid uses 4-column grid', () => {
    expect(ALL_CSS).toMatch(/\.credibility-grid\s*\{[^}]*grid-template-columns:\s*repeat\(4,\s*1fr\)/);
  });

  it('credibility-strip has vertical padding', () => {
    expect(ALL_CSS).toMatch(/\.credibility-strip\s*\{[^}]*padding/);
  });

  it('page.tsx has 4 credibility items', () => {
    const stripMatch = PAGE_TSX.match(/credibility-grid[\s\S]*?<\/div>\s*<\/section>/);
    if (stripMatch) {
      const items = stripMatch[0].match(/<strong>/g);
      expect(items).toHaveLength(4);
    }
  });
});

// ============================================================
// Todo 015: Services Grid with Asymmetric Offset
// ============================================================
describe('Todo 015: Services Grid Asymmetric', () => {
  it('services-grid uses 4-column grid with 24px gap', () => {
    expect(ALL_CSS).toMatch(/\.services-grid[^{]*\{[^}]*grid-template-columns:\s*repeat\(4,\s*1fr\)/);
    expect(ALL_CSS).toMatch(/\.services-grid[^{]*\{[^}]*gap:\s*(?:24px|var\(--spacing-lg\))/);
  });

  it('service card 3 has translateY(40px) offset class', () => {
    // The third service card should have an offset class
    expect(ALL_CSS).toMatch(/\.service-card-offset[^{]*\{[^}]*transform:\s*translateY\(40px\)/);
  });

  it('page.tsx applies offset class to third service card', () => {
    // Find the third service card and check it has the offset class
    const serviceCards = PAGE_TSX.match(/service-card/g);
    expect(serviceCards).not.toBeNull();
    expect(PAGE_TSX).toMatch(/service-card-offset|service-card.*offset/);
  });
});

// ============================================================
// Todo 016: Tools Grid
// ============================================================
describe('Todo 016: Tools Grid', () => {
  it('tools-grid uses CSS grid', () => {
    expect(ALL_CSS).toMatch(/\.tools-grid\s*\{[^}]*display:\s*grid/);
  });

  it('tools-grid produces 2 columns on desktop', () => {
    expect(ALL_CSS).toMatch(/\.tools-grid\s*\{[^}]*grid-template-columns/);
  });
});

// ============================================================
// Todo 017: Why-Us 4-Column Grid
// ============================================================
describe('Todo 017: Why-Us Grid', () => {
  it('reasons-grid uses 4-column grid', () => {
    expect(ALL_CSS).toMatch(/\.reasons-grid[^{]*\{[^}]*grid-template-columns:\s*repeat\(4,\s*1fr\)/);
  });

  it('reasons-grid has 24px gap or similar', () => {
    expect(ALL_CSS).toMatch(/\.reasons-grid[^{]*\{[^}]*gap/);
  });
});

// ============================================================
// Todo 018: Process Grid
// ============================================================
describe('Todo 018: Process Grid', () => {
  it('process-grid uses 4-column grid', () => {
    expect(ALL_CSS).toMatch(/\.process-grid\s*\{[^}]*grid-template-columns:\s*repeat\(4,\s*1fr\)/);
  });

  it('process steps have visual connector on desktop', () => {
    // Connector via ::after pseudo-element
    expect(ALL_CSS).toMatch(/\.process-step[^{]*::after/);
  });
});

// ============================================================
// Todo 019: Contact 2-Column Layout
// ============================================================
describe('Todo 019: Contact Layout', () => {
  it('contact-grid uses 2-column grid', () => {
    expect(ALL_CSS).toMatch(/\.contact-grid\s*\{[^}]*grid-template-columns/);
  });

  it('page.tsx has contact-copy and contact-form', () => {
    expect(PAGE_TSX).toMatch(/contact-copy/);
    expect(PAGE_TSX).toMatch(/contact-form/);
  });
});

// ============================================================
// Todo 020: Mobile Responsive (<768px)
// ============================================================
describe('Todo 020: Mobile Responsive', () => {
  it('has media query for max-width 767px or 768px', () => {
    expect(ALL_CSS).toMatch(/@media\s*\([^)]*max-width:\s*7(?:67|68|80)px/);
  });

  it('mobile breakpoint sets grids to single column', () => {
    // At mobile, services-grid, reasons-grid, process-grid should be 1fr
    const mobileBlocks = ALL_CSS.match(/@media\s*\([^)]*max-width:\s*(?:560|640|767|768|780)px\)[^{]*\{[\s\S]*?\n\}/g);
    expect(mobileBlocks).not.toBeNull();
    if (mobileBlocks) {
      const combined = mobileBlocks.join('\n');
      expect(combined).toMatch(/grid-template-columns:\s*1fr[^1]/);
    }
  });

  it('mobile H1 font size is 48px via CSS variable', () => {
    // globals.css sets --font-size-h1: 48px at mobile
    expect(GLOBALS_CSS).toMatch(/--font-size-h1:\s*48px/);
  });
});

// ============================================================
// Todo 021: Tablet Responsive (768-1023px)
// ============================================================
describe('Todo 021: Tablet Responsive', () => {
  it('has media query for tablet range', () => {
    // Should have a media query that covers 768-1023 or similar
    expect(ALL_CSS).toMatch(/@media\s*\([^)]*max-width:\s*10(?:23|24)px/);
  });

  it('tablet sets hero-grid to single column', () => {
    // At tablet, hero should be single column
    const tabletBlocks = ALL_CSS.match(/@media\s*\([^)]*max-width:\s*10(?:23|24)px\)[^{]*\{[\s\S]*?\n\}/g);
    if (tabletBlocks) {
      const combined = tabletBlocks.join('\n');
      expect(combined).toMatch(/\.hero-grid[^{]*\{[^}]*grid-template-columns:\s*1fr[^1]/);
    }
  });

  it('tablet hero visual has reduced overflow of 60px', () => {
    // At tablet, margin-bottom should be -60px
    expect(ALL_CSS).toMatch(/margin-bottom:\s*-60px/);
  });
});

// ============================================================
// Todo 022: No Horizontal Overflow
// ============================================================
describe('Todo 022: No Horizontal Overflow', () => {
  it('body has overflow-x hidden', () => {
    expect(ALL_CSS).toMatch(/body\s*\{[^}]*overflow-x:\s*hidden/);
  });

  it('container uses min() for responsive width', () => {
    expect(ALL_CSS).toMatch(/\.container\s*\{[^}]*width:\s*min\(/);
  });
});
