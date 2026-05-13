import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock CameraView
vi.mock('../components/CameraView', () => ({
  default: ({ onCapture, onHome }: { onCapture: (img: string) => Promise<void>; onHome: () => void }) => (
    <div data-testid="camera-view">
      <button onClick={() => onCapture('data:image/jpeg;base64,abc123')}>Capture</button>
      <button onClick={onHome}>CameraHome</button>
    </div>
  ),
}));

// Mock ResultsView
vi.mock('../components/ResultsView', () => ({
  default: ({ onRetry, onHome }: { onRetry: () => void; onHome: () => void }) => (
    <div data-testid="results-view">
      <button onClick={onRetry}>Retry</button>
      <button onClick={onHome}>ResultsHome</button>
    </div>
  ),
}));

// Mock Header/Footer
vi.mock('@/app/components/Header', () => ({ default: () => <div data-testid="header" /> }));
vi.mock('../../lib/Footer', () => ({ default: () => <div data-testid="footer" /> }));

const MOCK_RESPONSE = {
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

describe('PalmReaderPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('renders camera view initially', async () => {
    const PalmReaderPage = (await import('../page')).default;
    render(<PalmReaderPage />);
    expect(screen.getByTestId('camera-view')).toBeTruthy();
    expect(screen.queryByTestId('results-view')).toBeNull();
  });

  it('shows loading state during API call', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(() => {}) // never resolves
    );
    const PalmReaderPage = (await import('../page')).default;
    render(<PalmReaderPage />);

    fireEvent.click(screen.getByText('Capture'));

    await waitFor(() => {
      expect(screen.getByText('Analyzing palm...')).toBeTruthy();
    });
  });

  it('transitions to results view on API success', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_RESPONSE),
    });
    const PalmReaderPage = (await import('../page')).default;
    render(<PalmReaderPage />);

    fireEvent.click(screen.getByText('Capture'));

    await waitFor(() => {
      expect(screen.getByTestId('results-view')).toBeTruthy();
    });
  });

  it('shows error on API failure and stays on camera', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ success: false, error: 'Server error' }),
    });
    const PalmReaderPage = (await import('../page')).default;
    render(<PalmReaderPage />);

    fireEvent.click(screen.getByText('Capture'));

    await waitFor(() => {
      expect(screen.getByText(/Something went wrong/)).toBeTruthy();
      expect(screen.getByTestId('camera-view')).toBeTruthy();
    });
  });

  it('shows error on network failure', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));
    const PalmReaderPage = (await import('../page')).default;
    render(<PalmReaderPage />);

    fireEvent.click(screen.getByText('Capture'));

    await waitFor(() => {
      expect(screen.getByText(/Something went wrong/)).toBeTruthy();
    });
  });

  it('shows error when no palm detected', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: { ...MOCK_RESPONSE.data, is_palm: false },
      }),
    });
    const PalmReaderPage = (await import('../page')).default;
    render(<PalmReaderPage />);

    fireEvent.click(screen.getByText('Capture'));

    await waitFor(() => {
      expect(screen.getByText(/No palm detected/)).toBeTruthy();
      expect(screen.getByTestId('camera-view')).toBeTruthy();
    });
  });

  it('handles retry: results -> camera', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_RESPONSE),
    });
    const PalmReaderPage = (await import('../page')).default;
    render(<PalmReaderPage />);

    fireEvent.click(screen.getByText('Capture'));
    await waitFor(() => expect(screen.getByTestId('results-view')).toBeTruthy());

    fireEvent.click(screen.getByText('Retry'));
    expect(screen.getByTestId('camera-view')).toBeTruthy();
  });

  it('navigates home from camera view', async () => {
    const PalmReaderPage = (await import('../page')).default;
    render(<PalmReaderPage />);

    fireEvent.click(screen.getByText('CameraHome'));
    expect(mockPush).toHaveBeenCalledWith('/tools');
  });

  it('navigates home from results view', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_RESPONSE),
    });
    const PalmReaderPage = (await import('../page')).default;
    render(<PalmReaderPage />);

    fireEvent.click(screen.getByText('Capture'));
    await waitFor(() => expect(screen.getByTestId('results-view')).toBeTruthy());

    fireEvent.click(screen.getByText('ResultsHome'));
    expect(mockPush).toHaveBeenCalledWith('/tools');
  });
});

// XSS prevention and QualityMeter tests are in results-quality.test.tsx
// (separate file to avoid vi.mock hoisting conflicts)
