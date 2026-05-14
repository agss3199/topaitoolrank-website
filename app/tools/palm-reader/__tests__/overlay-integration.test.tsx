import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  MOVEMENT_STABILITY_FRAMES,
  DETECTION_STABILITY_FRAMES,
  MIN_VISIBLE_LINES,
  COLOR_RED,
  COLOR_YELLOW,
  COLOR_GREEN,
  STATUS_MESSAGES,
} from '../lib/camera-constants';

// Mock MediaPipe modules
vi.mock('@mediapipe/hands', () => ({
  Hands: vi.fn().mockImplementation(() => ({
    setOptions: vi.fn(),
    onResults: vi.fn(),
    send: vi.fn(),
  })),
  HAND_CONNECTIONS: [],
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

// Mock CSS module
vi.mock('../../lib/css-module-safe', () => ({
  cls: (_styles: unknown, className: string) => className,
  clsx: (_styles: unknown, ...classNames: string[]) => classNames.join(' '),
}));

vi.mock('../styles/camera.module.css', () => ({
  default: {},
}));

/**
 * Integration tests — Todo 004.
 *
 * Verifies:
 * - CameraView renders PalmOverlay component
 * - Props flow correctly from CameraView state to PalmOverlay
 * - Overlay is present in the component tree
 * - determineOverlayState function is used correctly
 */

describe('CameraView + PalmOverlay integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the PalmOverlay SVG in the component tree', async () => {
    const CameraView = (await import('../components/CameraView')).default;
    const { container } = render(
      <CameraView onCapture={vi.fn()} onHome={vi.fn()} />
    );

    // PalmOverlay renders an SVG with aria-label
    const svg = container.querySelector('svg[aria-label]');
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute('aria-label')?.toLowerCase()).toContain('palm');
  });

  it('PalmOverlay SVG has correct viewBox matching canvas dimensions', async () => {
    const CameraView = (await import('../components/CameraView')).default;
    const { container } = render(
      <CameraView onCapture={vi.fn()} onHome={vi.fn()} />
    );

    const svg = container.querySelector('svg[aria-label]');
    expect(svg?.getAttribute('viewBox')).toBe(`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`);
  });

  it('PalmOverlay starts in red state (no hand detected initially)', async () => {
    const CameraView = (await import('../components/CameraView')).default;
    const { container } = render(
      <CameraView onCapture={vi.fn()} onHome={vi.fn()} />
    );

    // Boundary ring should have red stroke (initial state = no hand = red)
    const ring = container.querySelector('circle.boundary-ring');
    expect(ring).toBeTruthy();
    expect(ring?.getAttribute('stroke')).toBe(COLOR_RED);
  });

  it('does not render landmark circles when no hand is detected', async () => {
    const CameraView = (await import('../components/CameraView')).default;
    const { container } = render(
      <CameraView onCapture={vi.fn()} onHome={vi.fn()} />
    );

    const landmarks = container.querySelectorAll('circle.landmark');
    expect(landmarks.length).toBe(0);
  });

  it('does not show progress text in red state', async () => {
    const CameraView = (await import('../components/CameraView')).default;
    render(
      <CameraView onCapture={vi.fn()} onHome={vi.fn()} />
    );

    expect(screen.queryByText(/frames stable/)).toBeNull();
  });

  it('renders overlay as non-interactive (pointer-events none)', async () => {
    const CameraView = (await import('../components/CameraView')).default;
    const { container } = render(
      <CameraView onCapture={vi.fn()} onHome={vi.fn()} />
    );

    const svg = container.querySelector('svg[aria-label]');
    expect(svg?.style.pointerEvents).toBe('none');
  });

  it('overlay is positioned absolutely over the canvas', async () => {
    const CameraView = (await import('../components/CameraView')).default;
    const { container } = render(
      <CameraView onCapture={vi.fn()} onHome={vi.fn()} />
    );

    const svg = container.querySelector('svg[aria-label]');
    expect(svg?.style.position).toBe('absolute');
  });
});

describe('determineOverlayState integration', () => {
  // These tests verify the state function works correctly with the constants

  it('produces red for no hand', async () => {
    const { determineOverlayState } = await import('../lib/capture-state');
    expect(determineOverlayState({
      hasHand: false,
      centered: false,
      quality: 0,
      stableFrames: 0,
      isOpen: false,
      visibleLines: 0,
    })).toBe('red');
  });

  it('produces yellow when all conditions met but waiting on stability', async () => {
    const { determineOverlayState } = await import('../lib/capture-state');
    expect(determineOverlayState({
      hasHand: true,
      centered: true,
      quality: 90,
      stableFrames: 30,
      isOpen: true,
      visibleLines: MIN_VISIBLE_LINES,
    })).toBe('yellow');
  });

  it('produces green when fully ready', async () => {
    const { determineOverlayState } = await import('../lib/capture-state');
    expect(determineOverlayState({
      hasHand: true,
      centered: true,
      quality: 90,
      stableFrames: MOVEMENT_STABILITY_FRAMES,
      isOpen: true,
      visibleLines: MIN_VISIBLE_LINES,
    })).toBe('green');
  });
});

describe('PalmOverlay props flow', () => {
  it('PalmOverlay renders with all OverlayState values', async () => {
    const PalmOverlay = (await import('../components/PalmOverlay')).default;

    const landmarks = Array.from({ length: 21 }, (_, i) => ({
      x: 0.5, y: 0.5, z: 0,
    }));

    const states: Array<'red' | 'yellow' | 'green'> = ['red', 'yellow', 'green'];

    for (const state of states) {
      const { container, unmount } = render(
        <PalmOverlay
          landmarks={landmarks}
          overlayState={state}
          stableFrames={30}
          canvasWidth={CANVAS_WIDTH}
          canvasHeight={CANVAS_HEIGHT}
        />
      );

      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
      unmount();
    }
  });

  it('PalmOverlay receives correct canvas dimensions', async () => {
    const PalmOverlay = (await import('../components/PalmOverlay')).default;

    const { container } = render(
      <PalmOverlay
        landmarks={null}
        overlayState="red"
        stableFrames={0}
        canvasWidth={320}
        canvasHeight={240}
      />
    );

    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('viewBox')).toBe('0 0 320 240');
  });
});
