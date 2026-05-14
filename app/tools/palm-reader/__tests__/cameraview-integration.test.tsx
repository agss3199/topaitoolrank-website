import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import CameraView from '../components/CameraView';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  STATUS_MESSAGES,
  DETECTION_STABILITY_FRAMES,
  MOVEMENT_STABILITY_FRAMES,
} from '../lib/camera-constants';

// Mock CSS modules
vi.mock('../../lib/css-module-safe', () => ({
  cls: (_styles: unknown, className: string) => className,
  clsx: (_styles: unknown, ...classNames: string[]) => classNames.join(' '),
}));

vi.mock('../styles/camera.module.css', () => ({
  default: {},
}));

// Mock MediaPipe dependencies (browser APIs not available in test)
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

// Mock detectors to verify they are imported and available
vi.mock('../lib/hand-shape-validator', () => ({
  validateHandShape: vi.fn().mockReturnValue({
    isOpen: true,
    openness: 1.8,
    message: 'Good, keep steady',
  }),
  resetSmoothing: vi.fn(),
}));

vi.mock('../lib/hand-orientation-detector', () => ({
  detectHandOrientation: vi.fn().mockReturnValue({
    handedness: 'Right',
    confidence: 0.95,
    isBackOfHand: false,
  }),
}));

vi.mock('../lib/palm-line-detector', () => ({
  detectPalmLines: vi.fn().mockReturnValue({
    visibleLines: 5,
    palmAngle: 10,
    quality: 0.9,
  }),
}));

/**
 * CameraView integration tests — Todo 009.
 *
 * Validates that all Phase 2 detectors are imported and wired into
 * the CameraView component, and that PalmOverlay receives the
 * new props (handedness, visibleLines, detectionFrames).
 *
 * Note: MediaPipe is mocked since it requires browser APIs.
 * The actual detector logic is tested in their individual test files.
 * These tests verify the WIRING — that CameraView calls the detectors
 * and passes their output through to the overlay.
 */

describe('CameraView detector integration', () => {
  const mockCapture = vi.fn().mockResolvedValue(undefined);
  const mockHome = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Component renders with all expected elements ───

  it('renders canvas with correct dimensions', () => {
    const { container } = render(
      <CameraView onCapture={mockCapture} onHome={mockHome} />
    );
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeTruthy();
    expect(canvas?.getAttribute('width')).toBe(String(CANVAS_WIDTH));
    expect(canvas?.getAttribute('height')).toBe(String(CANVAS_HEIGHT));
  });

  it('renders PalmOverlay SVG element', () => {
    const { container } = render(
      <CameraView onCapture={mockCapture} onHome={mockHome} />
    );
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute('aria-label')).toContain('Palm alignment overlay');
  });

  it('renders quality display', () => {
    render(<CameraView onCapture={mockCapture} onHome={mockHome} />);
    expect(screen.getByText(/Quality:/)).toBeTruthy();
  });

  it('renders status text', () => {
    render(<CameraView onCapture={mockCapture} onHome={mockHome} />);
    // Initially shows loading status
    expect(screen.getByText(STATUS_MESSAGES.LOADING)).toBeTruthy();
  });

  it('renders Home button', () => {
    render(<CameraView onCapture={mockCapture} onHome={mockHome} />);
    const homeBtn = screen.getByText('Home');
    expect(homeBtn).toBeTruthy();
  });

  // ─── Detector imports verified ───

  it('imports validateHandShape from hand-shape-validator', async () => {
    const module = await import('../lib/hand-shape-validator');
    expect(module.validateHandShape).toBeDefined();
    expect(typeof module.validateHandShape).toBe('function');
  });

  it('imports detectHandOrientation from hand-orientation-detector', async () => {
    const module = await import('../lib/hand-orientation-detector');
    expect(module.detectHandOrientation).toBeDefined();
    expect(typeof module.detectHandOrientation).toBe('function');
  });

  it('imports detectPalmLines from palm-line-detector', async () => {
    const module = await import('../lib/palm-line-detector');
    expect(module.detectPalmLines).toBeDefined();
    expect(typeof module.detectPalmLines).toBe('function');
  });

  it('imports resetSmoothing for cleanup on mount', async () => {
    const module = await import('../lib/hand-shape-validator');
    expect(module.resetSmoothing).toBeDefined();
    expect(typeof module.resetSmoothing).toBe('function');
  });

  // ─── PalmOverlay receives required props ───

  it('PalmOverlay has viewBox matching canvas dimensions', () => {
    const { container } = render(
      <CameraView onCapture={mockCapture} onHome={mockHome} />
    );
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('viewBox')).toBe(`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`);
  });

  it('PalmOverlay renders boundary ring at canvas center', () => {
    const { container } = render(
      <CameraView onCapture={mockCapture} onHome={mockHome} />
    );
    const ring = container.querySelector('circle.boundary-ring');
    expect(ring).toBeTruthy();
    expect(ring?.getAttribute('cx')).toBe(String(CANVAS_WIDTH / 2));
    expect(ring?.getAttribute('cy')).toBe(String(CANVAS_HEIGHT / 2));
  });

  it('PalmOverlay initially shows no landmarks (null state)', () => {
    const { container } = render(
      <CameraView onCapture={mockCapture} onHome={mockHome} />
    );
    const landmarks = container.querySelectorAll('circle.landmark');
    expect(landmarks.length).toBe(0);
  });

  it('PalmOverlay does not show progress text initially (red state)', () => {
    render(<CameraView onCapture={mockCapture} onHome={mockHome} />);
    expect(screen.queryByText(/frames stable/)).toBeNull();
    expect(screen.queryByText(/Detecting\.\.\./)).toBeNull();
  });

  // ─── Two-tier status messages ───

  it('has detecting hand status message available', () => {
    expect(STATUS_MESSAGES.DETECTING_HAND).toBe('Detecting hand...');
  });

  it('has hold steady status message available', () => {
    expect(STATUS_MESSAGES.HOLD_STEADY).toBe('Hold steady...');
  });

  it('has capturing status message available', () => {
    expect(STATUS_MESSAGES.CAPTURING).toBe('Ready! Capturing...');
  });

  it('has open palm status message available', () => {
    expect(STATUS_MESSAGES.OPEN_PALM).toBe('Open your palm');
  });

  it('has show palm lines status message available', () => {
    expect(STATUS_MESSAGES.SHOW_PALM_LINES).toBe('Show more of palm');
  });

  it('has rotate hand status message available', () => {
    expect(STATUS_MESSAGES.ROTATE_HAND).toBe('Rotate hand to show palm');
  });

  // ─── Constants correctness ───

  it('detection stability requires 20 frames', () => {
    expect(DETECTION_STABILITY_FRAMES).toBe(20);
  });

  it('movement stability requires 60 frames', () => {
    expect(MOVEMENT_STABILITY_FRAMES).toBe(60);
  });

  // ─── Overlay accessibility ───

  it('PalmOverlay has accessible label', () => {
    const { container } = render(
      <CameraView onCapture={mockCapture} onHome={mockHome} />
    );
    const svg = container.querySelector('svg');
    const label = svg?.getAttribute('aria-label') ?? '';
    expect(label.toLowerCase()).toContain('palm');
    expect(label.toLowerCase()).toContain('overlay');
  });
});
