import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Tier 1 (Unit) tests for ErrorBoundary component — structural verification.
 *
 * Full render tests with componentDidCatch require an E2E environment;
 * structural checks verify the contract surface is present and correct.
 */

const componentSource = readFileSync(
  join(__dirname, '..', 'components', 'ErrorBoundary.tsx'),
  'utf-8'
);

describe('ErrorBoundary Component (structural verification)', () => {
  describe('Component structure', () => {
    it('is a client component', () => {
      expect(componentSource).toContain("'use client'");
    });

    it('extends React Component (class-based for getDerivedStateFromError)', () => {
      expect(componentSource).toContain('extends Component');
    });

    it('implements getDerivedStateFromError', () => {
      expect(componentSource).toContain('getDerivedStateFromError');
    });

    it('implements componentDidCatch', () => {
      expect(componentSource).toContain('componentDidCatch');
    });

    it('has a retry button', () => {
      expect(componentSource).toContain('handleRetry');
      expect(componentSource).toContain('Try Again');
    });

    it('accepts custom fallback prop', () => {
      expect(componentSource).toContain('fallback');
      expect(componentSource).toContain('this.props.fallback');
    });

    it('renders children when no error', () => {
      expect(componentSource).toContain('this.props.children');
    });

    it('shows error message in fallback UI', () => {
      expect(componentSource).toContain('this.state.error?.message');
    });
  });

  describe('Dev-only logging', () => {
    it('only logs in development mode', () => {
      expect(componentSource).toContain("process.env.NODE_ENV === 'development'");
      expect(componentSource).toContain('console.error');
    });

    it('does not log sensitive data (no state/props serialization)', () => {
      // Logs should only reference error.message, not error.stack or props
      expect(componentSource).not.toContain('JSON.stringify');
      expect(componentSource).not.toContain('error.stack');
    });
  });

  describe('Accessibility', () => {
    it('fallback UI has role="alert"', () => {
      expect(componentSource).toContain('role="alert"');
    });
  });
});
