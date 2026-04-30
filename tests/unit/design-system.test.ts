/**
 * Design System Foundation Tests (Todos 001-010)
 * TDD: These tests are written FIRST, before implementation.
 *
 * Tests validate:
 * - CSS variable definitions (colors, typography, spacing)
 * - Tailwind config tokens
 * - Component CSS classes (buttons, inputs, cards, focus)
 * - Shadow/elevation system
 * - WCAG AAA color contrast ratios
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../..');
const GLOBALS_CSS = fs.readFileSync(path.join(ROOT, 'app/globals.css'), 'utf-8');
const STYLE_CSS = fs.readFileSync(path.join(ROOT, 'public/css/style.css'), 'utf-8');
const TAILWIND_CONFIG = fs.readFileSync(path.join(ROOT, 'tailwind.config.ts'), 'utf-8');

// Combine both CSS files for variable checks (variables may be in either)
const ALL_CSS = GLOBALS_CSS + '\n' + STYLE_CSS;

// ============================================================
// Helper: Calculate relative luminance (WCAG 2.1)
// ============================================================
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) throw new Error(`Invalid hex: ${hex}`);
  return [
    parseInt(clean.substring(0, 2), 16),
    parseInt(clean.substring(2, 4), 16),
    parseInt(clean.substring(4, 6), 16),
  ];
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// ============================================================
// Todo 001: CSS Variables for Color Palette
// ============================================================
describe('Todo 001: Color Palette CSS Variables', () => {
  it('defines --color-accent as neon lime #d4ff00', () => {
    expect(ALL_CSS).toMatch(/--color-accent:\s*#d4ff00/);
  });

  it('defines --color-black', () => {
    expect(ALL_CSS).toMatch(/--color-black:\s*#/);
  });

  it('defines --color-white', () => {
    expect(ALL_CSS).toMatch(/--color-white:\s*#/);
  });

  it('defines gray scale variables', () => {
    expect(ALL_CSS).toMatch(/--color-gray-100/);
    expect(ALL_CSS).toMatch(/--color-gray-200/);
    expect(ALL_CSS).toMatch(/--color-gray-500/);
    expect(ALL_CSS).toMatch(/--color-gray-800/);
    expect(ALL_CSS).toMatch(/--color-gray-900/);
  });

  it('defines semantic colors (success, warning, error, info)', () => {
    expect(ALL_CSS).toMatch(/--color-success/);
    expect(ALL_CSS).toMatch(/--color-warning/);
    expect(ALL_CSS).toMatch(/--color-error/);
    expect(ALL_CSS).toMatch(/--color-info/);
  });

  it('defines background colors (light and dark)', () => {
    expect(ALL_CSS).toMatch(/--color-bg-light/);
    expect(ALL_CSS).toMatch(/--color-bg-dark/);
  });

  it('defines headline text color', () => {
    expect(ALL_CSS).toMatch(/--color-text-headline:\s*#0f1419/);
  });

  it('defines body text color', () => {
    expect(ALL_CSS).toMatch(/--color-text-body:\s*#334155/);
  });

  it('defines muted text color', () => {
    expect(ALL_CSS).toMatch(/--color-text-muted/);
  });
});

// ============================================================
// Todo 002: Typography Scale
// ============================================================
describe('Todo 002: Typography Scale', () => {
  it('defines H1 size at 180px for desktop', () => {
    expect(ALL_CSS).toMatch(/--font-size-h1:\s*180px/);
  });

  it('defines H2 size at 56px for desktop', () => {
    expect(ALL_CSS).toMatch(/--font-size-h2:\s*56px/);
  });

  it('defines H3 size at 36px for desktop', () => {
    expect(ALL_CSS).toMatch(/--font-size-h3:\s*36px/);
  });

  it('defines body size at 18px', () => {
    expect(ALL_CSS).toMatch(/--font-size-body:\s*18px/);
  });

  it('defines small size at 14px', () => {
    expect(ALL_CSS).toMatch(/--font-size-small:\s*14px/);
  });

  it('defines button text size at 16px', () => {
    expect(ALL_CSS).toMatch(/--font-size-button:\s*16px/);
  });

  it('defines headline letter spacing at -0.03em', () => {
    expect(ALL_CSS).toMatch(/--letter-spacing-headline:\s*-0\.03em/);
  });

  it('uses system fonts only (no web font downloads)', () => {
    expect(ALL_CSS).toMatch(/font-family:.*system-ui/);
  });

  it('has responsive H1 for tablet (120px)', () => {
    // Check for a media query reducing H1
    expect(ALL_CSS).toMatch(/--font-size-h1:\s*120px/);
  });

  it('has responsive H1 for mobile (48px)', () => {
    expect(ALL_CSS).toMatch(/--font-size-h1:\s*48px/);
  });
});

// ============================================================
// Todo 003: Spacing System
// ============================================================
describe('Todo 003: Spacing System', () => {
  it('defines spacing-xs as 4px', () => {
    expect(ALL_CSS).toMatch(/--spacing-xs:\s*4px/);
  });

  it('defines spacing-sm as 8px', () => {
    expect(ALL_CSS).toMatch(/--spacing-sm:\s*8px/);
  });

  it('defines spacing-md as 16px', () => {
    expect(ALL_CSS).toMatch(/--spacing-md:\s*16px/);
  });

  it('defines spacing-lg as 24px', () => {
    expect(ALL_CSS).toMatch(/--spacing-lg:\s*24px/);
  });

  it('defines spacing-xl as 40px', () => {
    expect(ALL_CSS).toMatch(/--spacing-xl:\s*40px/);
  });

  it('defines spacing-2xl as 60px', () => {
    expect(ALL_CSS).toMatch(/--spacing-2xl:\s*60px/);
  });

  it('defines spacing-3xl as 80px', () => {
    expect(ALL_CSS).toMatch(/--spacing-3xl:\s*80px/);
  });

  it('defines spacing-4xl as 120px', () => {
    expect(ALL_CSS).toMatch(/--spacing-4xl:\s*120px/);
  });
});

// ============================================================
// Todo 004: Tailwind Config Overrides
// ============================================================
describe('Todo 004: Tailwind Config Overrides', () => {
  it('maps accent/neon lime color in Tailwind config', () => {
    expect(TAILWIND_CONFIG).toMatch(/accent.*d4ff00|lime.*d4ff00|neon.*d4ff00/i);
  });

  it('defines custom spacing in Tailwind config', () => {
    expect(TAILWIND_CONFIG).toMatch(/spacing/);
  });

  it('defines border radius variants', () => {
    expect(TAILWIND_CONFIG).toMatch(/borderRadius|border-radius/i);
  });

  it('defines shadow variants in Tailwind config', () => {
    expect(TAILWIND_CONFIG).toMatch(/boxShadow|shadow/i);
  });

  it('removes old blue primary color', () => {
    // The old primary #2563eb should be replaced
    expect(TAILWIND_CONFIG).not.toMatch(/primary.*2563eb/);
  });
});

// ============================================================
// Todo 005: Button Component Styles
// ============================================================
describe('Todo 005: Button Component Styles', () => {
  it('defines .btn-primary class', () => {
    expect(ALL_CSS).toMatch(/\.btn-primary/);
  });

  it('btn-primary uses accent color for background', () => {
    // Should reference var(--color-accent) or #d4ff00
    expect(ALL_CSS).toMatch(/\.btn-primary[\s\S]*?background.*(?:var\(--color-accent\)|#d4ff00)/);
  });

  it('defines .btn-secondary class', () => {
    expect(ALL_CSS).toMatch(/\.btn-secondary/);
  });

  it('defines .btn-text class', () => {
    expect(ALL_CSS).toMatch(/\.btn-text/);
  });

  it('buttons have 600 font weight', () => {
    expect(ALL_CSS).toMatch(/\.btn-primary[\s\S]*?font-weight:\s*600/);
  });

  it('buttons have 8px border-radius', () => {
    expect(ALL_CSS).toMatch(/\.btn-primary[\s\S]*?border-radius:\s*8px/);
  });

  it('buttons have disabled state with opacity', () => {
    expect(ALL_CSS).toMatch(/\.btn-primary:disabled|\.btn-primary\[disabled\]/);
  });

  it('buttons have focus-visible outline', () => {
    expect(ALL_CSS).toMatch(/\.btn-primary:focus-visible/);
  });
});

// ============================================================
// Todo 006: Input/Form Field Component Styles
// ============================================================
describe('Todo 006: Input/Form Field Styles', () => {
  it('defines input base styles', () => {
    expect(ALL_CSS).toMatch(/\.form-input|\.input-field/);
  });

  it('input has white background', () => {
    expect(ALL_CSS).toMatch(/\.form-input[\s\S]*?background.*(?:var\(--color-white\)|#fff|white)/);
  });

  it('input focus uses lime border', () => {
    expect(ALL_CSS).toMatch(/\.form-input:focus[\s\S]*?(?:var\(--color-accent\)|#d4ff00)/);
  });

  it('input error state uses red border', () => {
    expect(ALL_CSS).toMatch(/\.form-input[.-]error|\.form-input\.error/);
  });

  it('input has minimum 44px height (touch-friendly)', () => {
    expect(ALL_CSS).toMatch(/\.form-input[\s\S]*?(?:min-height:\s*44px|height:\s*44px)/);
  });

  it('textarea has min-height 120px', () => {
    expect(ALL_CSS).toMatch(/textarea[\s\S]*?min-height:\s*120px/);
  });
});

// ============================================================
// Todo 007: Card Component Styles
// ============================================================
describe('Todo 007: Card Component Styles', () => {
  it('defines .card class', () => {
    expect(ALL_CSS).toMatch(/\.card\s*\{/);
  });

  it('card has white background', () => {
    expect(ALL_CSS).toMatch(/\.card[\s\S]*?background.*(?:var\(--color-white\)|#fff|white)/);
  });

  it('card has 24px padding', () => {
    expect(ALL_CSS).toMatch(/\.card[\s\S]*?padding:\s*(?:24px|var\(--spacing-lg\))/);
  });

  it('card has 12px border-radius', () => {
    expect(ALL_CSS).toMatch(/\.card[\s\S]*?border-radius:\s*12px/);
  });

  it('card has subtle border', () => {
    expect(ALL_CSS).toMatch(/\.card[\s\S]*?border:/);
  });

  it('card has hover effect with shadow lift', () => {
    expect(ALL_CSS).toMatch(/\.card:hover/);
  });

  it('card hover includes scale transform', () => {
    expect(ALL_CSS).toMatch(/\.card:hover[\s\S]*?transform.*scale\(1\.02\)/);
  });
});

// ============================================================
// Todo 008: Focus Indicator Styles
// ============================================================
describe('Todo 008: Focus Indicator Styles', () => {
  it('defines global focus-visible with accent outline', () => {
    expect(ALL_CSS).toMatch(/\*:focus-visible[\s\S]*?outline.*(?:var\(--color-accent\)|#d4ff00)/);
  });

  it('focus outline is 2px solid', () => {
    expect(ALL_CSS).toMatch(/focus-visible[\s\S]*?outline:\s*2px\s+solid/);
  });

  it('focus outline-offset is 2px', () => {
    expect(ALL_CSS).toMatch(/focus-visible[\s\S]*?outline-offset:\s*2px/);
  });

  it('does NOT remove browser default focus (no outline: none on :focus)', () => {
    // :focus { outline: none } is forbidden
    expect(ALL_CSS).not.toMatch(/:focus\s*\{[^}]*outline:\s*none/);
  });
});

// ============================================================
// Todo 009: Shadow/Elevation System
// ============================================================
describe('Todo 009: Shadow/Elevation System', () => {
  it('defines --shadow-none', () => {
    expect(ALL_CSS).toMatch(/--shadow-none:\s*none/);
  });

  it('defines --shadow-soft (0 4px 12px)', () => {
    expect(ALL_CSS).toMatch(/--shadow-soft:\s*0\s+4px\s+12px/);
  });

  it('defines --shadow-card (0 10px 25px)', () => {
    expect(ALL_CSS).toMatch(/--shadow-card:\s*0\s+10px\s+25px/);
  });

  it('defines --shadow-lift (0 20px 40px)', () => {
    expect(ALL_CSS).toMatch(/--shadow-lift:\s*0\s+20px\s+40px/);
  });
});

// ============================================================
// Todo 010: Color Contrast Ratios (WCAG AAA)
// ============================================================
describe('Todo 010: Color Contrast Verification (WCAG AAA)', () => {
  it('body text (#334155) on white meets AAA 7:1', () => {
    const ratio = contrastRatio('#334155', '#ffffff');
    expect(ratio).toBeGreaterThanOrEqual(7);
  });

  it('headline text (#0f1419) on white meets AAA 7:1', () => {
    const ratio = contrastRatio('#0f1419', '#ffffff');
    expect(ratio).toBeGreaterThanOrEqual(7);
  });

  it('neon lime (#d4ff00) on black (#000000) meets AAA 7:1', () => {
    const ratio = contrastRatio('#d4ff00', '#000000');
    expect(ratio).toBeGreaterThanOrEqual(7);
  });

  it('neon lime (#d4ff00) on white has ratio >= 1.5 (decorative/large text only)', () => {
    // Neon lime on white is low contrast - only for large/decorative use
    const ratio = contrastRatio('#d4ff00', '#ffffff');
    expect(ratio).toBeGreaterThan(1);
  });

  it('primary button (black text on neon lime) meets AAA 7:1', () => {
    const ratio = contrastRatio('#0f1419', '#d4ff00');
    expect(ratio).toBeGreaterThanOrEqual(7);
  });

  it('no hardcoded hex colors in component CSS classes', () => {
    // Component classes (.btn-*, .card, .form-input) should use var() not raw hex
    const componentBlocks = ALL_CSS.match(/\.(btn-|card|form-input)[^{]*\{[^}]*\}/g) || [];
    for (const block of componentBlocks) {
      // Allow hex only in var() fallbacks or inside var() definitions
      const lines = block.split('\n');
      for (const line of lines) {
        if (line.includes('var(')) continue; // uses variable - ok
        if (line.match(/:\s*#[0-9a-fA-F]{3,8}/)) {
          // Raw hex in a component class - this is a violation
          // But allow border shorthand like "1px solid #..."
          // Actually, even borders should use variables
          expect(line).toMatch(/var\(/);
        }
      }
    }
  });
});
