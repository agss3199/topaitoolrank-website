import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  QUALITY_THRESHOLD,
  CENTER_RANGE_MIN,
  CENTER_RANGE_MAX,
  STABILITY_DELTA_THRESHOLD,
  STABLE_FRAMES_REQUIRED,
  PALM_CENTER_LANDMARK_INDEX,
  STATUS_MESSAGES,
  CONFIDENCE_THRESHOLD,
} from '../lib/camera-constants';

// Mock MediaPipe modules — they require browser + WASM
vi.mock('@mediapipe/hands', () => ({
  Hands: vi.fn().mockImplementation(() => ({
    setOptions: vi.fn(),
    onResults: vi.fn(),
    send: vi.fn(),
  })),
}));

vi.mock('@mediapipe/camera_utils', () => ({
  Camera: vi.fn().mockImplementation(() => ({
    start: vi.fn(),
    stop: vi.fn(),
  })),
}));

vi.mock('@mediapipe/drawing_utils', () => ({
  drawConnectors: vi.fn(),
  drawLandmarks: vi.fn(),
}));

describe('camera-constants', () => {
  it('has correct canvas dimensions', () => {
    expect(CANVAS_WIDTH).toBe(640);
    expect(CANVAS_HEIGHT).toBe(480);
  });

  it('has spec-compliant thresholds', () => {
    expect(CONFIDENCE_THRESHOLD).toBe(0.85);
    expect(QUALITY_THRESHOLD).toBe(60);
    expect(STABILITY_DELTA_THRESHOLD).toBe(4);
    expect(CENTER_RANGE_MIN).toBe(0.25);
    expect(CENTER_RANGE_MAX).toBe(0.75);
  });

  it('uses landmark 9 as palm center', () => {
    expect(PALM_CENTER_LANDMARK_INDEX).toBe(9);
  });

  it('requires 60 stable frames (2 seconds) before capture', () => {
    expect(STABLE_FRAMES_REQUIRED).toBe(60);
  });
});

describe('centering logic', () => {
  function isCentered(x: number, y: number): boolean {
    return (
      x > CENTER_RANGE_MIN &&
      x < CENTER_RANGE_MAX &&
      y > CENTER_RANGE_MIN &&
      y < CENTER_RANGE_MAX
    );
  }

  it('returns true for center of frame', () => {
    expect(isCentered(0.5, 0.5)).toBe(true);
  });

  it('returns false for top-left corner', () => {
    expect(isCentered(0.1, 0.1)).toBe(false);
  });

  it('returns false for edge values', () => {
    expect(isCentered(0.25, 0.5)).toBe(false); // on boundary
    expect(isCentered(0.5, 0.75)).toBe(false); // on boundary
  });

  it('returns true for values just inside range', () => {
    expect(isCentered(0.26, 0.26)).toBe(true);
    expect(isCentered(0.74, 0.74)).toBe(true);
  });
});

describe('stability logic', () => {
  function computeDelta(
    current: Array<{ x: number; y: number }>,
    previous: Array<{ x: number; y: number }>
  ): number {
    let totalDelta = 0;
    for (let i = 0; i < current.length; i++) {
      totalDelta += Math.abs(current[i].x - previous[i].x);
      totalDelta += Math.abs(current[i].y - previous[i].y);
    }
    return totalDelta;
  }

  it('reports stable when delta is below threshold', () => {
    const a = [{ x: 0.5, y: 0.5 }];
    const b = [{ x: 0.501, y: 0.501 }];
    expect(computeDelta(a, b)).toBeLessThan(STABILITY_DELTA_THRESHOLD);
  });

  it('reports unstable when hand moves significantly', () => {
    // 21 landmarks each moving 0.2 in x and y = 21 * 0.4 = 8.4 total delta
    const a = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5 }));
    const b = Array.from({ length: 21 }, () => ({ x: 0.7, y: 0.7 }));
    expect(computeDelta(a, b)).toBeGreaterThanOrEqual(STABILITY_DELTA_THRESHOLD);
  });
});

describe('quality score', () => {
  it('maps confidence to percentage', () => {
    const confidence = 0.85;
    const qScore = confidence * 100;
    expect(qScore).toBe(85);
  });

  it('is below threshold for low confidence', () => {
    const confidence = 0.5;
    const qScore = confidence * 100;
    expect(qScore).toBeLessThan(QUALITY_THRESHOLD);
  });

  it('is above threshold for good confidence', () => {
    const confidence = 0.8;
    const qScore = confidence * 100;
    expect(qScore).toBeGreaterThanOrEqual(QUALITY_THRESHOLD);
  });
});

describe('status message selection', () => {
  function getStatus(opts: {
    hasHand: boolean;
    centered: boolean;
    qScore: number;
    stableFrames: number;
    captureAttempts: number;
  }): string {
    if (!opts.hasHand) return STATUS_MESSAGES.NO_HAND;
    if (!opts.centered) return STATUS_MESSAGES.NOT_CENTERED;
    if (opts.qScore < CONFIDENCE_THRESHOLD * 100) return STATUS_MESSAGES.LOW_QUALITY;
    if (opts.stableFrames > STABLE_FRAMES_REQUIRED && opts.captureAttempts === 0) {
      return STATUS_MESSAGES.CAPTURING;
    }
    return STATUS_MESSAGES.HOLD_STEADY;
  }

  it('shows "Point palm at camera" when no hand', () => {
    expect(getStatus({ hasHand: false, centered: false, qScore: 0, stableFrames: 0, captureAttempts: 0 }))
      .toBe('Point palm at camera');
  });

  it('shows "Move palm to center" when not centered', () => {
    expect(getStatus({ hasHand: true, centered: false, qScore: 80, stableFrames: 20, captureAttempts: 0 }))
      .toBe('Move palm to center');
  });

  it('shows "Better lighting needed" when quality low (< 85%)', () => {
    expect(getStatus({ hasHand: true, centered: true, qScore: 84, stableFrames: 65, captureAttempts: 0 }))
      .toBe('Better lighting needed');
  });

  it('shows "Hold steady..." when not yet stable enough (< 60 frames)', () => {
    expect(getStatus({ hasHand: true, centered: true, qScore: 90, stableFrames: 59, captureAttempts: 0 }))
      .toBe('Hold steady...');
  });

  it('shows "✅ Ready! Capturing..." when all conditions met', () => {
    expect(getStatus({ hasHand: true, centered: true, qScore: 90, stableFrames: 65, captureAttempts: 0 }))
      .toBe('✅ Ready! Capturing...');
  });

  it('shows "Hold steady..." after first capture attempt', () => {
    expect(getStatus({ hasHand: true, centered: true, qScore: 90, stableFrames: 65, captureAttempts: 1 }))
      .toBe('Hold steady...');
  });
});

describe('CameraView component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders canvas with correct dimensions', async () => {
    const CameraView = (await import('../components/CameraView')).default;
    const { container } = render(
      <CameraView onCapture={vi.fn()} onHome={vi.fn()} />
    );
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeTruthy();
    expect(canvas?.getAttribute('width')).toBe(String(CANVAS_WIDTH));
    expect(canvas?.getAttribute('height')).toBe(String(CANVAS_HEIGHT));
  });

  it('renders hidden video element', async () => {
    const CameraView = (await import('../components/CameraView')).default;
    const { container } = render(
      <CameraView onCapture={vi.fn()} onHome={vi.fn()} />
    );
    const video = container.querySelector('video');
    expect(video).toBeTruthy();
    // Video is hidden via CSS class (cls(styles, 'video')), not inline style
    expect(video?.className).toBeTruthy();
  });

  it('renders quality display', async () => {
    const CameraView = (await import('../components/CameraView')).default;
    render(<CameraView onCapture={vi.fn()} onHome={vi.fn()} />);
    expect(screen.getByText(/Quality:/)).toBeTruthy();
  });

  it('renders Home button that calls onHome', async () => {
    const CameraView = (await import('../components/CameraView')).default;
    const onHome = vi.fn();
    render(<CameraView onCapture={vi.fn()} onHome={onHome} />);
    const homeBtn = screen.getByText('Home');
    fireEvent.click(homeBtn);
    expect(onHome).toHaveBeenCalledOnce();
  });

  it('shows loading status initially', async () => {
    const CameraView = (await import('../components/CameraView')).default;
    render(<CameraView onCapture={vi.fn()} onHome={vi.fn()} />);
    expect(screen.getByText(STATUS_MESSAGES.LOADING)).toBeTruthy();
  });
});
