import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

/**
 * ErrorBoundary component for invoice generator.
 * Catches React rendering errors and shows fallback UI.
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackMessage?: string;
  onRetry?: () => void;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught:', error, errorInfo);
    }
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div data-testid="error-fallback" role="alert">
          <h2>Something went wrong</h2>
          <p data-testid="error-message">
            {this.props.fallbackMessage || this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button data-testid="retry-btn" onClick={this.handleRetry}>
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Component that throws during render
function ThrowingComponent({ shouldThrow = true }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('Test render error');
  }
  return <div data-testid="child-content">Rendered successfully</div>;
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('catches React rendering errors and shows fallback UI', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('error-fallback')).toBeTruthy();
    expect(screen.queryByTestId('child-content')).toBeNull();
  });

  it('shows fallback UI with error message', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('error-message').textContent).toBe('Test render error');
  });

  it('shows retry button that resets error state', () => {
    const onRetry = vi.fn();

    const { rerender } = render(
      <ErrorBoundary onRetry={onRetry}>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('retry-btn')).toBeTruthy();

    // After clicking retry, the boundary resets - but ThrowingComponent will throw again
    fireEvent.click(screen.getByTestId('retry-btn'));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('logs to console in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    // React itself logs errors + our componentDidCatch logs
    const errorCalls = consoleSpy.mock.calls;
    const hasBoundaryLog = errorCalls.some(
      (call) => typeof call[0] === 'string' && call[0].includes('ErrorBoundary caught:')
    );
    expect(hasBoundaryLog).toBe(true);

    process.env.NODE_ENV = originalEnv;
  });
});
