import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Integration tests for the full page flow (Tier 2 — component interactions)
// ---------------------------------------------------------------------------

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock CameraView with a controllable capture trigger
let capturedOnCapture: ((img: string) => Promise<void>) | null = null;
vi.mock('../components/CameraView', () => ({
  default: ({ onCapture, onHome }: { onCapture: (img: string) => Promise<void>; onHome: () => void }) => {
    capturedOnCapture = onCapture;
    return (
      <div data-testid="camera-view">
        <button onClick={() => onCapture('data:image/jpeg;base64,abc123')} data-testid="capture-btn">
          Capture
        </button>
        <button onClick={onHome} data-testid="camera-home-btn">Home</button>
      </div>
    );
  },
}));

// Mock ResultsView to expose the actual results data for verification
vi.mock('../components/ResultsView', () => ({
  default: ({ results, onRetry, onHome }: {
    results: { overall_reading: string; tip: string };
    onRetry: () => void;
    onHome: () => void;
  }) => (
    <div data-testid="results-view">
      <p data-testid="overall-reading">{results.overall_reading}</p>
      <p data-testid="tip">{results.tip}</p>
      <button onClick={onRetry} data-testid="retry-btn">Read Another Palm</button>
      <button onClick={onHome} data-testid="results-home-btn">Home</button>
    </div>
  ),
}));

// Mock shared layout components
vi.mock('@/app/components/Header', () => ({ default: () => <div data-testid="header" /> }));
vi.mock('../../lib/Footer', () => ({ default: () => <div data-testid="footer" /> }));

const VALID_API_RESPONSE = {
  success: true,
  data: {
    is_palm: true,
    confidence: 0.95,
    lines: {
      life: { description: 'Long life line', interpretation: 'Good health' },
      heart: { description: 'Deep heart line', interpretation: 'Emotional depth' },
      head: { description: 'Curved head line', interpretation: 'Creative mind' },
      fate: { description: 'Strong fate line', interpretation: 'Clear path' },
      sun: { description: 'Visible sun line', interpretation: 'Success ahead' },
    },
    overall_reading: 'Positive outlook',
    tip: 'Stay hydrated',
  },
};

describe('Palm Reader Integration — Full Page Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedOnCapture = null;
    global.fetch = vi.fn();
  });

  it('complete flow: camera -> capture -> loading -> results -> retry -> camera', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(VALID_API_RESPONSE),
    });

    const PalmReaderPage = (await import('../page')).default;
    render(<PalmReaderPage />);

    // Step 1: Camera view visible
    expect(screen.getByTestId('camera-view')).toBeTruthy();
    expect(screen.queryByTestId('results-view')).toBeNull();

    // Step 2: Trigger capture — loading state shows
    fireEvent.click(screen.getByTestId('capture-btn'));
    await waitFor(() => {
      expect(screen.getByText('Analyzing palm...')).toBeTruthy();
    });

    // Step 3: API response arrives — results view appears
    await waitFor(() => {
      expect(screen.getByTestId('results-view')).toBeTruthy();
    });

    // Step 4: Verify results data passed through correctly
    expect(screen.getByTestId('overall-reading').textContent).toBe('Positive outlook');
    expect(screen.getByTestId('tip').textContent).toBe('Stay hydrated');

    // Step 5: Click "Read Another Palm" — back to camera
    fireEvent.click(screen.getByTestId('retry-btn'));
    expect(screen.getByTestId('camera-view')).toBeTruthy();
    expect(screen.queryByTestId('results-view')).toBeNull();
  });

  it('API error displays user-friendly message, does not transition to results', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ success: false, error: 'Internal Server Error' }),
    });

    const PalmReaderPage = (await import('../page')).default;
    render(<PalmReaderPage />);

    fireEvent.click(screen.getByTestId('capture-btn'));

    await waitFor(() => {
      expect(screen.getByText(/Something went wrong/)).toBeTruthy();
    });

    // Should stay on camera view, not transition to results
    expect(screen.getByTestId('camera-view')).toBeTruthy();
    expect(screen.queryByTestId('results-view')).toBeNull();

    // Internal error details must NOT leak to the user
    expect(screen.queryByText(/Internal Server Error/)).toBeNull();
  });

  it('non-palm image shows appropriate message, stays on camera', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: { ...VALID_API_RESPONSE.data, is_palm: false },
      }),
    });

    const PalmReaderPage = (await import('../page')).default;
    render(<PalmReaderPage />);

    fireEvent.click(screen.getByTestId('capture-btn'));

    await waitFor(() => {
      expect(screen.getByText(/No palm detected/)).toBeTruthy();
    });
    expect(screen.getByTestId('camera-view')).toBeTruthy();
  });

  it('network error handled gracefully with user-facing message', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
      new TypeError('Failed to fetch'),
    );

    const PalmReaderPage = (await import('../page')).default;
    render(<PalmReaderPage />);

    fireEvent.click(screen.getByTestId('capture-btn'));

    await waitFor(() => {
      expect(screen.getByText(/Something went wrong/)).toBeTruthy();
    });

    // Network error details must NOT leak
    expect(screen.queryByText(/Failed to fetch/)).toBeNull();
  });

  it('"Home" navigation works from both views', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(VALID_API_RESPONSE),
    });

    const PalmReaderPage = (await import('../page')).default;
    render(<PalmReaderPage />);

    // Home from camera view
    fireEvent.click(screen.getByTestId('camera-home-btn'));
    expect(mockPush).toHaveBeenCalledWith('/tools');
    mockPush.mockClear();

    // Capture to get to results view
    fireEvent.click(screen.getByTestId('capture-btn'));
    await waitFor(() => expect(screen.getByTestId('results-view')).toBeTruthy());

    // Home from results view
    fireEvent.click(screen.getByTestId('results-home-btn'));
    expect(mockPush).toHaveBeenCalledWith('/tools');
  });

  it('fetch is called with correct endpoint, method, and body shape', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(VALID_API_RESPONSE),
    });

    const PalmReaderPage = (await import('../page')).default;
    render(<PalmReaderPage />);

    fireEvent.click(screen.getByTestId('capture-btn'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/tools/palm-reader',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: 'data:image/jpeg;base64,abc123' }),
        }),
      );
    });
  });
});
