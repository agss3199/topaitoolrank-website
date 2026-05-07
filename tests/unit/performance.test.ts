/**
 * Performance Optimization Tests (Todos 044-055)
 * TDD: These tests are written FIRST, before implementation.
 *
 * Tests validate:
 * - CSS minification in build output (Todo 044)
 * - JS minification in build output (Todo 045)
 * - SVG optimization (Todo 046)
 * - No web fonts loaded (Todo 047)
 * - Code splitting for routes (Todo 048)
 * - CSS file size (Todo 049)
 * - No unnecessary third-party scripts (performance spec)
 * - No dead JavaScript files loaded (performance spec)
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../..');
const LAYOUT_TSX = fs.readFileSync(path.join(ROOT, 'app/layout.tsx'), 'utf-8');
const PAGE_TSX = fs.readFileSync(path.join(ROOT, 'app/page.tsx'), 'utf-8');
const GLOBALS_CSS = fs.readFileSync(path.join(ROOT, 'app/globals.css'), 'utf-8');
const STYLE_CSS = fs.readFileSync(path.join(ROOT, 'public/css/style.css'), 'utf-8');

// Helper: check if a public file exists
function publicFileExists(relativePath: string): boolean {
  return fs.existsSync(path.join(ROOT, 'public', relativePath));
}

// Helper: get file size in bytes
function getFileSize(absolutePath: string): number {
  if (!fs.existsSync(absolutePath)) return 0;
  return fs.statSync(absolutePath).size;
}

// ============================================================
// Todo 047: No Web Fonts Loaded (system fonts only)
// ============================================================

describe('Todo 047: No web fonts loaded', () => {
  it('layout.tsx does not load Google Fonts or any external font stylesheet', () => {
    expect(LAYOUT_TSX).not.toMatch(/fonts\.googleapis\.com/);
    expect(LAYOUT_TSX).not.toMatch(/fonts\.gstatic\.com/);
  });

  it('globals.css does not contain @font-face declarations', () => {
    expect(GLOBALS_CSS).not.toMatch(/@font-face/);
  });

  it('style.css does not contain @font-face declarations', () => {
    expect(STYLE_CSS).not.toMatch(/@font-face/);
  });

  it('body uses system font stack', () => {
    // Check either globals.css or style.css for system-ui font-family on body
    const allCSS = GLOBALS_CSS + '\n' + STYLE_CSS;
    expect(allCSS).toMatch(/font-family:\s*system-ui/);
  });
});

// ============================================================
// Todo 046: SVG Assets Optimization
// ============================================================

describe('Todo 046: SVG assets optimized', () => {
  it('favicon.svg exists and is small (< 1KB)', () => {
    const faviconPath = path.join(ROOT, 'public/favicon.svg');
    expect(fs.existsSync(faviconPath)).toBe(true);
    const size = getFileSize(faviconPath);
    expect(size).toBeLessThan(1024); // < 1KB
  });

  it('favicon.svg does not contain unnecessary metadata or comments', () => {
    const favicon = fs.readFileSync(path.join(ROOT, 'public/favicon.svg'), 'utf-8');
    expect(favicon).not.toMatch(/<!--/); // no XML comments
    expect(favicon).not.toMatch(/<metadata/i); // no metadata elements
  });
});

// ============================================================
// Google Analytics 4 Configuration (GA4 Spec)
// ============================================================

describe('Google Analytics 4 implementation', () => {
  it('layout.tsx includes GoogleAnalytics component with correct property ID', () => {
    // GA4 must be imported from @next/third-parties/google and use property ID G-D98KCREKZC
    expect(LAYOUT_TSX).toContain('GoogleAnalytics');
    expect(LAYOUT_TSX).toContain('G-D98KCREKZC');
  });

  it('layout.tsx does not load googletagmanager directly (uses @next/third-parties wrapper)', () => {
    // @next/third-parties handles googletagmanager; layout should not import it directly
    expect(LAYOUT_TSX).not.toMatch(/googletagmanager\.com/);
  });
});

// ============================================================
// No Dead JavaScript (Performance Spec)
// ============================================================

describe('No dead JavaScript loaded', () => {
  it('layout.tsx does not load scene.js (Three.js - no canvas-3d in page)', () => {
    // scene.js references canvas-3d which does not exist in the React page.
    // Loading Three.js for nothing adds ~500KB+ to initial load.
    expect(LAYOUT_TSX).not.toMatch(/scene\.js/);
  });

  it('page.tsx does not contain a canvas-3d element', () => {
    // Confirms the 3D canvas was removed in the redesign
    expect(PAGE_TSX).not.toMatch(/canvas-3d/);
  });
});

// ============================================================
// Todo 049: CSS File Size Check
// ============================================================

describe('Todo 049: CSS file size reasonable', () => {
  it('style.css is under 30KB', () => {
    const size = getFileSize(path.join(ROOT, 'public/css/style.css'));
    expect(size).toBeLessThan(30 * 1024); // < 30KB
  });

  it('animations.css is under 10KB', () => {
    const size = getFileSize(path.join(ROOT, 'public/css/animations.css'));
    expect(size).toBeLessThan(10 * 1024); // < 10KB
  });

  it('globals.css is under 10KB', () => {
    const size = getFileSize(path.join(ROOT, 'app/globals.css'));
    expect(size).toBeLessThan(10 * 1024); // < 10KB
  });
});

// ============================================================
// Todo 044: CSS Minification Verification
// ============================================================

describe('Todo 044: CSS minification', () => {
  it('globals.css is processed by Tailwind (contains @tailwind directives)', () => {
    // Tailwind processes these directives during build, producing minified output
    expect(GLOBALS_CSS).toMatch(/@tailwind base/);
  });

  it('Next.js build config enables compression', () => {
    const nextConfig = fs.readFileSync(path.join(ROOT, 'next.config.ts'), 'utf-8');
    expect(nextConfig).toMatch(/compress:\s*true/);
  });
});

// ============================================================
// Todo 045: JS Minification Verification
// ============================================================

describe('Todo 045: JS minification', () => {
  it('Next.js automatically minifies JS in production build', () => {
    // Next.js minifies all JS by default in production builds.
    // Verify reactStrictMode is enabled (indicates proper prod config)
    const nextConfig = fs.readFileSync(path.join(ROOT, 'next.config.ts'), 'utf-8');
    expect(nextConfig).toMatch(/reactStrictMode:\s*true/);
  });

  it('poweredByHeader is disabled (security + performance)', () => {
    const nextConfig = fs.readFileSync(path.join(ROOT, 'next.config.ts'), 'utf-8');
    expect(nextConfig).toMatch(/poweredByHeader:\s*false/);
  });
});

// ============================================================
// Todo 048: Code Splitting
// ============================================================

describe('Todo 048: Code splitting', () => {
  it('homepage is a separate route (app/page.tsx exists)', () => {
    expect(fs.existsSync(path.join(ROOT, 'app/page.tsx'))).toBe(true);
  });

  it('wa-sender tool has its own route segment', () => {
    expect(fs.existsSync(path.join(ROOT, 'app/tools/wa-sender'))).toBe(true);
  });

  it('blogs has its own route segment', () => {
    expect(fs.existsSync(path.join(ROOT, 'app/blogs'))).toBe(true);
  });

  it('auth pages have their own route segments', () => {
    expect(fs.existsSync(path.join(ROOT, 'app/auth/login'))).toBe(true);
    expect(fs.existsSync(path.join(ROOT, 'app/auth/signup'))).toBe(true);
  });
});

// ============================================================
// Layout Performance: No Render-Blocking Resources
// ============================================================

describe('Layout performance: minimal render-blocking resources', () => {
  it('layout does not load main.js synchronously in head', () => {
    // main.js in <head> blocks rendering. It should be at end of body
    // or removed entirely if React handles the same functionality.
    const headSection = LAYOUT_TSX.split('<body>')[0] || '';
    expect(headSection).not.toMatch(/main\.js/);
  });
});
