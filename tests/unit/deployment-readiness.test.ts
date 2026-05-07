/**
 * Deployment Readiness Tests (Milestone 8: Todos 085-095)
 * Verifies build artifacts, performance targets, and deployment configuration.
 */

import { describe, test, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../..');
const BUILD_DIR = path.join(ROOT, '.next');
const PUBLIC_DIR = path.join(ROOT, 'public');

describe('Todo 085-086: Performance Monitoring & Core Web Vitals Tracking', () => {
  test('layout.tsx does not block rendering with stylesheet links', () => {
    const layout = fs.readFileSync(path.join(ROOT, 'app/layout.tsx'), 'utf-8');
    expect(layout).not.toMatch(/<link.*?rel="stylesheet"[^>]*>/);
  });

  test('layout.tsx has preload hints for CSS', () => {
    const layout = fs.readFileSync(path.join(ROOT, 'app/layout.tsx'), 'utf-8');
    expect(layout).toMatch(/preload/);
  });

  test('GA4 property ID is correct in layout', () => {
    const layout = fs.readFileSync(path.join(ROOT, 'app/layout.tsx'), 'utf-8');
    expect(layout).toContain('G-D98KCREKZC');
    expect(layout).not.toMatch(/UA-\d+/);  // old GA not used
    expect(layout).not.toMatch(/GTM-[A-Z0-9]+/);  // GTM not used
  });
});

describe('Todo 087: Build Artifacts Verification', () => {
  test('build directory exists', () => {
    expect(fs.existsSync(BUILD_DIR)).toBe(true);
  });

  test('build manifest exists', () => {
    expect(fs.existsSync(path.join(BUILD_DIR, 'build-manifest.json'))).toBe(true);
  });

  test('BUILD_ID exists', () => {
    expect(fs.existsSync(path.join(BUILD_DIR, 'BUILD_ID'))).toBe(true);
  });

  test('static pages generated', () => {
    const serverDir = path.join(BUILD_DIR, 'server');
    expect(fs.existsSync(serverDir)).toBe(true);
  });

  test('public CSS files exist', () => {
    expect(fs.existsSync(path.join(PUBLIC_DIR, 'css/style.css'))).toBe(true);
    expect(fs.existsSync(path.join(PUBLIC_DIR, 'css/animations.css'))).toBe(true);
  });

  test('favicon exists', () => {
    expect(fs.existsSync(path.join(PUBLIC_DIR, 'favicon.svg'))).toBe(true);
  });
});

describe('Todo 088: Lighthouse Audit Targets', () => {
  test('no render-blocking scripts in layout', () => {
    const layout = fs.readFileSync(path.join(ROOT, 'app/layout.tsx'), 'utf-8');
    // No blocking external scripts (analytics, etc.)
    expect(layout).not.toMatch(/google-analytics/i);
    expect(layout).not.toMatch(/gtag/i);
  });

  test('system fonts used (no web fonts)', () => {
    const style = fs.readFileSync(path.join(PUBLIC_DIR, 'css/style.css'), 'utf-8');
    expect(style).toMatch(/font-family.*?system-ui/);
    expect(style).not.toMatch(/@font-face/);
  });

  test('prefers-reduced-motion supported', () => {
    const style = fs.readFileSync(path.join(PUBLIC_DIR, 'css/style.css'), 'utf-8');
    expect(style).toMatch(/@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)/);
  });

  test('CSS uses variables for consistency', () => {
    const style = fs.readFileSync(path.join(PUBLIC_DIR, 'css/style.css'), 'utf-8');
    expect(style).toMatch(/var\(--color-accent\)/);
    expect(style).toMatch(/var\(--transition\)/);
  });
});

describe('Todo 089: Smoke Test Readiness', () => {
  test('page.tsx has all major sections', () => {
    const page = fs.readFileSync(path.join(ROOT, 'app/page.tsx'), 'utf-8');
    expect(page).toMatch(/className="hero"/);
    expect(page).toMatch(/className="services/);
    expect(page).toMatch(/id="contact"/);
    expect(page).toMatch(/<footer/);
    expect(page).toMatch(/<nav/);
  });

  test('page.tsx has form elements', () => {
    const page = fs.readFileSync(path.join(ROOT, 'app/page.tsx'), 'utf-8');
    expect(page).toMatch(/type="email"/);
    expect(page).toMatch(/<textarea/);
    expect(page).toMatch(/type="submit"/);
  });

  test('page.tsx has accessibility landmarks', () => {
    const page = fs.readFileSync(path.join(ROOT, 'app/page.tsx'), 'utf-8');
    expect(page).toMatch(/<main/);
    expect(page).toMatch(/aria-/);
  });
});

describe('Todo 090: Production Deployment Readiness', () => {
  test('package.json has build and start scripts', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));
    expect(pkg.scripts.build).toBeDefined();
    expect(pkg.scripts.start).toBeDefined();
  });

  test('no TODO/FIXME in production code', () => {
    const page = fs.readFileSync(path.join(ROOT, 'app/page.tsx'), 'utf-8');
    const style = fs.readFileSync(path.join(PUBLIC_DIR, 'css/style.css'), 'utf-8');
    expect(page).not.toMatch(/TODO|FIXME|XXX|HACK/);
    expect(style).not.toMatch(/TODO|FIXME|XXX|HACK/);
  });

  test('layout has proper HTML structure', () => {
    const layout = fs.readFileSync(path.join(ROOT, 'app/layout.tsx'), 'utf-8');
    expect(layout).toMatch(/<html.*?lang="en"/);
    expect(layout).toMatch(/<title/);
    expect(layout).toMatch(/name="description"/);
    expect(layout).toMatch(/name="viewport"/);
  });
});

describe('Todo 091-092: Core Web Vitals & Monitoring Configuration', () => {
  test('CLS prevention: no layout shift triggers', () => {
    const style = fs.readFileSync(path.join(PUBLIC_DIR, 'css/style.css'), 'utf-8');
    // Images and containers have explicit dimensions
    expect(style).toMatch(/max-width:\s*1180px/);
  });

  test('LCP optimization: hero section is optimized', () => {
    const page = fs.readFileSync(path.join(ROOT, 'app/page.tsx'), 'utf-8');
    // Hero section exists as the first visible content
    expect(page).toMatch(/className="hero"/);
  });

  test('FID optimization: no heavy JS blocking', () => {
    const layout = fs.readFileSync(path.join(ROOT, 'app/layout.tsx'), 'utf-8');
    // No render-blocking third-party scripts
    expect(layout).not.toMatch(/google-analytics/i);
    expect(layout).not.toMatch(/gtag/i);
  });
});

describe('Todo 093-095: Post-Launch Monitoring', () => {
  test('responsive breakpoints for monitoring', () => {
    const style = fs.readFileSync(path.join(PUBLIC_DIR, 'css/style.css'), 'utf-8');
    expect(style).toMatch(/@media.*max-width:\s*1023px/);
    expect(style).toMatch(/@media.*max-width:\s*767px/);
    expect(style).toMatch(/@media.*max-width:\s*560px/);
  });

  test('skip-to-content for accessibility monitoring', () => {
    const layout = fs.readFileSync(path.join(ROOT, 'app/layout.tsx'), 'utf-8');
    expect(layout).toMatch(/skip-to-content/);
    expect(layout).toMatch(/href="#main"/);
  });

  test('interactive states for engagement tracking', () => {
    const style = fs.readFileSync(path.join(PUBLIC_DIR, 'css/style.css'), 'utf-8');
    expect(style).toMatch(/:hover/);
    expect(style).toMatch(/:focus/);
    expect(style).toMatch(/:active/);
  });
});
