import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import PalmOverlay from '../components/PalmOverlay';
import type { PalmOverlayProps } from '../components/PalmOverlay';
import {
  COLOR_RED,
  COLOR_YELLOW,
  COLOR_GREEN,
  DETECTION_STABILITY_FRAMES,
  MOVEMENT_STABILITY_FRAMES,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
} from '../lib/camera-constants';

// Mock CSS module
vi.mock('../../lib/css-module-safe', () => ({
  cls: (_styles: unknown, className: string) => className,
  clsx: (_styles: unknown, ...classNames: string[]) => classNames.join(' '),
}));

vi.mock('../styles/camera.module.css', () => ({
  default: {},
}));

/**
 * PalmOverlay component tests — Todo 001.
 *
 * Requirements from spec Feature 1 (lines 42-87):
 * - Render 21 landmarks as circles
 * - Connect landmarks with lines (hand skeleton)
 * - Show boundary ring indicating center zone
 * - Semi-transparent overlay (does NOT block camera view)
 * - Color-coded states (red/yellow/green)
 * - Progress indicator for stable frames
 */

describe('PalmOverlay', () => {
  // 21 MediaPipe hand landmarks in normalized [0,1] coordinates
  const mockLandmarks = Array.from({ length: 21 }, (_, i) => ({
    x: 0.3 + (i * 0.02),
    y: 0.3 + (i * 0.015),
    z: 0,
  }));

  const defaultProps: PalmOverlayProps = {
    landmarks: mockLandmarks,
    overlayState: 'red',
    stableFrames: 0,
    canvasWidth: CANVAS_WIDTH,
    canvasHeight: CANVAS_HEIGHT,
  };

  // ─── Rendering basics ───

  it('renders an SVG overlay element', () => {
    const { container } = render(<PalmOverlay {...defaultProps} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('renders SVG with correct viewBox dimensions', () => {
    const { container } = render(<PalmOverlay {...defaultProps} />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('viewBox')).toBe(`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`);
  });

  it('renders with pointer-events none so camera view is not blocked', () => {
    const { container } = render(<PalmOverlay {...defaultProps} />);
    const svg = container.querySelector('svg');
    expect(svg?.style.pointerEvents).toBe('none');
  });

  // ─── Null / empty landmark handling ───

  it('renders empty overlay when landmarks is null', () => {
    const { container } = render(
      <PalmOverlay {...defaultProps} landmarks={null} />
    );
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    // No landmark circles should be rendered
    const circles = svg?.querySelectorAll('circle.landmark');
    expect(circles?.length ?? 0).toBe(0);
  });

  it('renders empty overlay when landmarks is empty array', () => {
    const { container } = render(
      <PalmOverlay {...defaultProps} landmarks={[]} />
    );
    const svg = container.querySelector('svg');
    const circles = svg?.querySelectorAll('circle.landmark');
    expect(circles?.length ?? 0).toBe(0);
  });

  // ─── Landmark rendering ───

  it('renders 21 landmark circles when all landmarks provided', () => {
    const { container } = render(<PalmOverlay {...defaultProps} />);
    const circles = container.querySelectorAll('circle.landmark');
    expect(circles.length).toBe(21);
  });

  it('positions landmark circles based on normalized coordinates', () => {
    const { container } = render(<PalmOverlay {...defaultProps} />);
    const circles = container.querySelectorAll('circle.landmark');
    const first = circles[0];
    // Landmark 0: x=0.3, y=0.3 -> pixel: 0.3*640=192, 0.3*480=144
    expect(first.getAttribute('cx')).toBe(String(mockLandmarks[0].x * CANVAS_WIDTH));
    expect(first.getAttribute('cy')).toBe(String(mockLandmarks[0].y * CANVAS_HEIGHT));
  });

  // ─── Skeleton connections ───

  it('renders connection lines between landmarks (hand skeleton)', () => {
    const { container } = render(<PalmOverlay {...defaultProps} />);
    const lines = container.querySelectorAll('line.connection');
    // MediaPipe hand skeleton has 21 connections
    expect(lines.length).toBeGreaterThan(0);
  });

  // ─── Boundary ring ───

  it('renders a boundary ring circle', () => {
    const { container } = render(<PalmOverlay {...defaultProps} />);
    const ring = container.querySelector('circle.boundary-ring');
    expect(ring).toBeTruthy();
  });

  it('positions boundary ring at center of canvas', () => {
    const { container } = render(<PalmOverlay {...defaultProps} />);
    const ring = container.querySelector('circle.boundary-ring');
    expect(ring?.getAttribute('cx')).toBe(String(CANVAS_WIDTH / 2));
    expect(ring?.getAttribute('cy')).toBe(String(CANVAS_HEIGHT / 2));
  });

  // ─── Color state support ───

  it('applies red color when overlayState is red', () => {
    const { container } = render(
      <PalmOverlay {...defaultProps} overlayState="red" />
    );
    const circles = container.querySelectorAll('circle.landmark');
    if (circles.length > 0) {
      expect(circles[0].getAttribute('fill')).toBe(COLOR_RED);
    }
  });

  it('applies yellow color when overlayState is yellow', () => {
    const { container } = render(
      <PalmOverlay {...defaultProps} overlayState="yellow" />
    );
    const circles = container.querySelectorAll('circle.landmark');
    if (circles.length > 0) {
      expect(circles[0].getAttribute('fill')).toBe(COLOR_YELLOW);
    }
  });

  it('applies green color when overlayState is green', () => {
    const { container } = render(
      <PalmOverlay {...defaultProps} overlayState="green" />
    );
    const circles = container.querySelectorAll('circle.landmark');
    if (circles.length > 0) {
      expect(circles[0].getAttribute('fill')).toBe(COLOR_GREEN);
    }
  });

  it('applies same color to boundary ring as overlay state', () => {
    const { container } = render(
      <PalmOverlay {...defaultProps} overlayState="green" />
    );
    const ring = container.querySelector('circle.boundary-ring');
    expect(ring?.getAttribute('stroke')).toBe(COLOR_GREEN);
  });

  it('applies same color to connection lines as overlay state', () => {
    const { container } = render(
      <PalmOverlay {...defaultProps} overlayState="yellow" />
    );
    const lines = container.querySelectorAll('line.connection');
    if (lines.length > 0) {
      expect(lines[0].getAttribute('stroke')).toBe(COLOR_YELLOW);
    }
  });

  // ─── Progress indicator (Todo 003) ───

  it('shows movement progress text when overlayState is yellow and detection complete', () => {
    const stableFrames = 30;
    render(
      <PalmOverlay
        {...defaultProps}
        overlayState="yellow"
        stableFrames={stableFrames}
        detectionFrames={DETECTION_STABILITY_FRAMES}
      />
    );
    expect(screen.getByText(`${stableFrames}/${MOVEMENT_STABILITY_FRAMES} frames stable`)).toBeTruthy();
  });

  it('shows detection progress when overlayState is yellow and detection incomplete', () => {
    render(
      <PalmOverlay
        {...defaultProps}
        overlayState="yellow"
        stableFrames={0}
        detectionFrames={10}
      />
    );
    expect(screen.getByText(`Detecting... 10/${DETECTION_STABILITY_FRAMES}`)).toBeTruthy();
  });

  it('does not show progress text when overlayState is red', () => {
    render(
      <PalmOverlay
        {...defaultProps}
        overlayState="red"
        stableFrames={10}
        detectionFrames={10}
      />
    );
    expect(screen.queryByText(/frames stable/)).toBeNull();
    expect(screen.queryByText(/Detecting/)).toBeNull();
  });

  it('does not show progress text when overlayState is green', () => {
    render(
      <PalmOverlay
        {...defaultProps}
        overlayState="green"
        stableFrames={MOVEMENT_STABILITY_FRAMES}
        detectionFrames={DETECTION_STABILITY_FRAMES}
      />
    );
    expect(screen.queryByText(/frames stable/)).toBeNull();
    expect(screen.queryByText(/Detecting/)).toBeNull();
  });

  it('shows movement progress at zero when detection just completed', () => {
    render(
      <PalmOverlay
        {...defaultProps}
        overlayState="yellow"
        stableFrames={0}
        detectionFrames={DETECTION_STABILITY_FRAMES}
      />
    );
    expect(screen.getByText(`0/${MOVEMENT_STABILITY_FRAMES} frames stable`)).toBeTruthy();
  });

  // ─── Accessibility ───

  it('has aria-label describing the overlay purpose', () => {
    const { container } = render(<PalmOverlay {...defaultProps} />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('aria-label')?.toLowerCase()).toContain('palm');
  });
});
