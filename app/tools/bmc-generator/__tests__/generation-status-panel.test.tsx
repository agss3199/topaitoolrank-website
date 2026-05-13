import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import GenerationStatusPanel from '../components/GenerationStatusPanel';

// ---------------------------------------------------------------------------
// Mock SSEManager — same pattern as sse-manager.test.ts
// ---------------------------------------------------------------------------
type EventCallback = (event: { type: string; timestamp: string; data?: unknown }) => void;
const mockListeners: Map<string, Set<EventCallback>> = new Map();

const mockSSE = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  on: vi.fn((type: string, cb: EventCallback) => {
    if (!mockListeners.has(type)) mockListeners.set(type, new Set());
    mockListeners.get(type)!.add(cb);
  }),
  off: vi.fn(),
  getState: vi.fn(() => ({ connected: true, sessionId: null, lastEventId: null, reconnectAttempts: 0 })),
};

vi.mock('../lib/sse-manager', () => ({
  createSSEManager: () => mockSSE,
  SSEManager: vi.fn(),
}));

function emitEvent(type: string, data?: unknown) {
  const listeners = mockListeners.get(type);
  if (listeners) {
    listeners.forEach((cb) =>
      cb({ type, timestamp: new Date().toISOString(), data })
    );
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('GenerationStatusPanel', () => {
  const defaultProps = {
    sessionId: 'sess-test-123',
    estimatedCost: 0.035,
    onComplete: vi.fn(),
    onError: vi.fn(),
  };

  beforeEach(() => {
    mockListeners.clear();
    vi.clearAllMocks();
  });

  // === Rendering ===

  it('renders the panel with title', () => {
    render(<GenerationStatusPanel {...defaultProps} />);
    expect(screen.getByText('Generating Your Business Model Canvas')).toBeDefined();
  });

  it('renders "Do not refresh" warning', () => {
    render(<GenerationStatusPanel {...defaultProps} />);
    expect(screen.getByText('Do not refresh or leave this page')).toBeDefined();
  });

  it('renders 4 phase labels', () => {
    render(<GenerationStatusPanel {...defaultProps} />);
    expect(screen.getByText('Phase 1')).toBeDefined();
    expect(screen.getByText('Phase 2')).toBeDefined();
    expect(screen.getByText('Phase 3')).toBeDefined();
    expect(screen.getByText('Phase 4')).toBeDefined();
  });

  it('renders 4 progress bars', () => {
    render(<GenerationStatusPanel {...defaultProps} />);
    const bars = screen.getAllByRole('progressbar');
    expect(bars).toHaveLength(4);
  });

  it('renders Phase 1 at 100% initially', () => {
    render(<GenerationStatusPanel {...defaultProps} />);
    const bars = screen.getAllByRole('progressbar');
    expect(bars[0].getAttribute('aria-valuenow')).toBe('100');
  });

  it('renders phases 2-4 at 0% initially', () => {
    render(<GenerationStatusPanel {...defaultProps} />);
    const bars = screen.getAllByRole('progressbar');
    expect(bars[1].getAttribute('aria-valuenow')).toBe('0');
    expect(bars[2].getAttribute('aria-valuenow')).toBe('0');
    expect(bars[3].getAttribute('aria-valuenow')).toBe('0');
  });

  it('renders initial agent name', () => {
    render(<GenerationStatusPanel {...defaultProps} />);
    expect(screen.getByText('Initializing...')).toBeDefined();
  });

  it('renders estimated cost from props', () => {
    render(<GenerationStatusPanel {...defaultProps} />);
    expect(screen.getByText('estimated total: $0.035')).toBeDefined();
  });

  it('renders initial cost as $0.0000', () => {
    render(<GenerationStatusPanel {...defaultProps} />);
    expect(screen.getByText('$0.0000')).toBeDefined();
  });

  // === Accessibility ===

  it('has accessible section landmark', () => {
    render(<GenerationStatusPanel {...defaultProps} />);
    expect(screen.getByLabelText('Generation progress')).toBeDefined();
  });

  it('has aria-live polite on agent name', () => {
    render(<GenerationStatusPanel {...defaultProps} />);
    const agentEl = screen.getByLabelText('Active agent');
    expect(agentEl.getAttribute('aria-live')).toBe('polite');
  });

  it('progress bars have aria-valuemin and aria-valuemax', () => {
    render(<GenerationStatusPanel {...defaultProps} />);
    const bars = screen.getAllByRole('progressbar');
    bars.forEach((bar) => {
      expect(bar.getAttribute('aria-valuemin')).toBe('0');
      expect(bar.getAttribute('aria-valuemax')).toBe('100');
    });
  });

  // === SSE connection ===

  it('connects SSEManager with sessionId', () => {
    render(<GenerationStatusPanel {...defaultProps} />);
    expect(mockSSE.connect).toHaveBeenCalledWith('sess-test-123');
  });

  // === Error display ===

  it('does not render error box initially', () => {
    render(<GenerationStatusPanel {...defaultProps} />);
    expect(screen.queryByLabelText('Generation error')).toBeNull();
  });

  it('calls onComplete when complete event fires', () => {
    render(<GenerationStatusPanel {...defaultProps} />);
    emitEvent('complete', {});
    expect(defaultProps.onComplete).toHaveBeenCalled();
  });

  it('calls onError when error event fires', () => {
    render(<GenerationStatusPanel {...defaultProps} />);
    emitEvent('error', { message: 'Something broke' });
    expect(defaultProps.onError).toHaveBeenCalledWith('Something broke');
  });

  it('calls onError with session expired message', () => {
    render(<GenerationStatusPanel {...defaultProps} />);
    emitEvent('error', { error: 'session_expired' });
    expect(defaultProps.onError).toHaveBeenCalledWith('Session expired. Please log in again.');
  });
});
