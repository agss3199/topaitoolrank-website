import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Tier 1 (Unit) tests for the login page component.
 *
 * These tests verify the source code structure of the login page
 * to ensure accessibility, security, and UX requirements are met.
 * Full render tests require a React test renderer setup which is
 * out of scope for this unit test file -- those belong in E2E.
 *
 * Using source-grep approach (per testing.md: acceptable for structural verification).
 */

const loginPagePath = join(
  __dirname,
  '..',
  'login',
  'page.tsx'
);

const loginPageSource = readFileSync(loginPagePath, 'utf-8');

describe('Login Page Component (structural verification)', () => {
  it('uses CSS Module safe accessor (cls helper)', () => {
    expect(loginPageSource).toContain("import { cls } from '@/app/tools/lib/css-module-safe'");
    expect(loginPageSource).toContain('cls(styles,');
  });

  it('exports force-dynamic for client-side rendering', () => {
    expect(loginPageSource).toContain("export const dynamic = 'force-dynamic'");
  });

  it('is a client component', () => {
    expect(loginPageSource).toContain("'use client'");
  });

  it('has accessible label-input associations', () => {
    // htmlFor attributes link labels to inputs
    expect(loginPageSource).toContain('htmlFor="bmc-username"');
    expect(loginPageSource).toContain('htmlFor="bmc-password"');
    expect(loginPageSource).toContain('id="bmc-username"');
    expect(loginPageSource).toContain('id="bmc-password"');
  });

  it('has password field with type="password" (masked)', () => {
    expect(loginPageSource).toContain('type="password"');
  });

  it('has error message with role="alert" for screen readers', () => {
    expect(loginPageSource).toContain('role="alert"');
    expect(loginPageSource).toContain('aria-live="assertive"');
  });

  it('submits to the correct API endpoint', () => {
    expect(loginPageSource).toContain('/api/bmc-generator/login');
  });

  it('redirects to /tools/bmc-generator/ on success', () => {
    expect(loginPageSource).toContain('/tools/bmc-generator/');
  });

  it('disables inputs during loading to prevent double submit', () => {
    // Both inputs and button check isLoading
    expect(loginPageSource).toContain('disabled={isLoading}');
  });

  it('does not hardcode credentials in the component', () => {
    // No hardcoded username/password values
    expect(loginPageSource).not.toContain('BMC_GENERATOR_USERNAME');
    expect(loginPageSource).not.toContain('BMC_GENERATOR_PASSWORD');
    expect(loginPageSource).not.toContain('process.env');
  });

  it('uses autoComplete attributes for browser password managers', () => {
    expect(loginPageSource).toContain('autoComplete="username"');
    expect(loginPageSource).toContain('autoComplete="current-password"');
  });
});

describe('Login CSS Module (structural verification)', () => {
  const cssPath = join(
    __dirname,
    '..',
    'styles',
    'login.module.css'
  );
  const cssSource = readFileSync(cssPath, 'utf-8');

  it('has mobile responsive styles for <600px', () => {
    expect(cssSource).toContain('max-width: 600px');
  });

  it('has login container, card, form, and error styles', () => {
    expect(cssSource).toContain('.loginContainer');
    expect(cssSource).toContain('.loginCard');
    expect(cssSource).toContain('.form');
    expect(cssSource).toContain('.errorMessage');
  });

  it('has input focus styles', () => {
    expect(cssSource).toContain('.input:focus');
  });

  it('has disabled button styles', () => {
    expect(cssSource).toContain('.submitButton:disabled');
  });
});
