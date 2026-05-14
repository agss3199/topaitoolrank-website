import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import PalmOverlay from '../components/PalmOverlay';
import type { PalmOverlayProps } from '../components/PalmOverlay';
import { determineOverlayState } from '../lib/capture-state';
import { validateHandShape, resetSmoothing } from '../lib/hand-shape-validator';
import { detectHandOrientation } from '../lib/hand-orientation-detector';
import { detectPalmLines } from '../lib/palm-line-detector';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  COLOR_RED,
  COLOR_YELLOW,
  COLOR_GREEN,
  DETECTION_STABILITY_FRAMES,
  MOVEMENT_STABILITY_FRAMES,
  MIN_VISIBLE_LINES,
  CONFIDENCE_THRESHOLD,
  STATUS_MESSAGES,
} from '../lib/camera-constants';

// Mock CSS modules
vi.mock('../../lib/css-module-safe', () => ({
  cls: (_styles: unknown, className: string) => className,
  clsx: (_styles: unknown, ...classNames: string[]) => classNames.join(' '),
}));

vi.mock('../styles/camera.module.css', () => ({
  default: {},
}));

/**
 * Palm Reader E2E validation — Todo 010.
 *
 * End-to-end tests that verify the complete integration:
 *   - All 3 detectors produce correct outputs for known inputs
 *   - PalmOverlay renders correct visual state for each scenario
 *   - Two-tier stability state machine transitions correctly
 *   - Color state system (determineOverlayState) reflects combined conditions
 *   - Rejection cases: fist, misaligned, unstable, back of hand
 *
 * Note: These are integration tests running detector + overlay + state machine
 * together, not against a live camera. Camera-level E2E requires Playwright.
 */

// 21 MediaPipe-like landmarks for an open palm facing camera
// Fingertips are far from palm center (landmark 9) to exceed openness threshold 1.5
// Palm size (wrist to palm center) ~0.27, avg tip distance ~0.45 -> score ~1.67
function makeOpenPalmLandmarks() {
  return [
    // 0: Wrist
    { x: 0.50, y: 0.85, z: 0.00 },
    // 1-4: Thumb (extended outward)
    { x: 0.65, y: 0.75, z: -0.02 },
    { x: 0.75, y: 0.65, z: -0.03 },
    { x: 0.82, y: 0.50, z: -0.03 },
    { x: 0.85, y: 0.40, z: -0.03 },
    // 5-8: Index finger (extended far up)
    { x: 0.58, y: 0.60, z: -0.01 },
    { x: 0.60, y: 0.40, z: -0.02 },
    { x: 0.61, y: 0.25, z: -0.02 },
    { x: 0.62, y: 0.12, z: -0.02 },
    // 9-12: Middle finger (palm center, extended far up)
    { x: 0.50, y: 0.58, z: -0.01 },
    { x: 0.50, y: 0.38, z: -0.02 },
    { x: 0.50, y: 0.22, z: -0.02 },
    { x: 0.50, y: 0.08, z: -0.02 },
    // 13-16: Ring finger (extended far up)
    { x: 0.42, y: 0.60, z: -0.01 },
    { x: 0.40, y: 0.40, z: -0.02 },
    { x: 0.39, y: 0.25, z: -0.02 },
    { x: 0.38, y: 0.12, z: -0.02 },
    // 17-20: Pinky (extended far up)
    { x: 0.35, y: 0.65, z: -0.01 },
    { x: 0.32, y: 0.48, z: -0.02 },
    { x: 0.30, y: 0.35, z: -0.02 },
    { x: 0.28, y: 0.22, z: -0.02 },
  ];
}

// Fist landmarks — fingertips near palm center
function makeFistLandmarks() {
  return [
    // 0: Wrist
    { x: 0.50, y: 0.85, z: 0.00 },
    // 1-4: Thumb (curled)
    { x: 0.55, y: 0.75, z: -0.01 },
    { x: 0.56, y: 0.72, z: -0.01 },
    { x: 0.55, y: 0.70, z: 0.00 },
    { x: 0.53, y: 0.68, z: 0.01 },
    // 5-8: Index (curled into fist)
    { x: 0.52, y: 0.68, z: -0.01 },
    { x: 0.52, y: 0.65, z: 0.02 },
    { x: 0.51, y: 0.68, z: 0.03 },
    { x: 0.50, y: 0.72, z: 0.02 },
    // 9-12: Middle (curled)
    { x: 0.50, y: 0.67, z: -0.01 },
    { x: 0.50, y: 0.64, z: 0.02 },
    { x: 0.49, y: 0.67, z: 0.03 },
    { x: 0.49, y: 0.71, z: 0.02 },
    // 13-16: Ring (curled)
    { x: 0.47, y: 0.68, z: -0.01 },
    { x: 0.47, y: 0.65, z: 0.02 },
    { x: 0.47, y: 0.68, z: 0.03 },
    { x: 0.47, y: 0.72, z: 0.02 },
    // 17-20: Pinky (curled)
    { x: 0.44, y: 0.70, z: -0.01 },
    { x: 0.44, y: 0.68, z: 0.01 },
    { x: 0.44, y: 0.70, z: 0.02 },
    { x: 0.44, y: 0.73, z: 0.01 },
  ];
}

// Edge-on hand landmarks (palm tilted 90 degrees — large z-gradient)
function makeEdgeOnLandmarks() {
  return [
    { x: 0.50, y: 0.85, z: 0.00 },
    { x: 0.55, y: 0.78, z: 0.15 },
    { x: 0.58, y: 0.70, z: 0.25 },
    { x: 0.60, y: 0.62, z: 0.30 },
    { x: 0.62, y: 0.55, z: 0.35 },
    { x: 0.52, y: 0.65, z: 0.18 },
    { x: 0.52, y: 0.55, z: 0.28 },
    { x: 0.52, y: 0.45, z: 0.35 },
    { x: 0.52, y: 0.38, z: 0.40 },
    { x: 0.50, y: 0.63, z: 0.18 },
    { x: 0.50, y: 0.50, z: 0.28 },
    { x: 0.50, y: 0.40, z: 0.35 },
    { x: 0.50, y: 0.33, z: 0.42 },
    { x: 0.47, y: 0.65, z: 0.18 },
    { x: 0.47, y: 0.55, z: 0.28 },
    { x: 0.47, y: 0.45, z: 0.35 },
    { x: 0.47, y: 0.38, z: 0.38 },
    { x: 0.44, y: 0.70, z: 0.15 },
    { x: 0.44, y: 0.62, z: 0.25 },
    { x: 0.44, y: 0.55, z: 0.32 },
    { x: 0.44, y: 0.48, z: 0.38 },
  ];
}

describe('Palm Reader E2E — Complete Integration', () => {

  beforeEach(() => {
    resetSmoothing();
  });

  // ─── Detector outputs for known poses ───

  describe('detector outputs for known hand poses', () => {
    it('validates open palm as open', () => {
      const landmarks = makeOpenPalmLandmarks();
      // Run through multiple frames to build up smoothing buffer
      for (let i = 0; i < 5; i++) {
        validateHandShape(landmarks);
      }
      const result = validateHandShape(landmarks);
      expect(result.isOpen).toBe(true);
      expect(result.openness).toBeGreaterThan(1.0);
    });

    it('validates fist as closed', () => {
      const landmarks = makeFistLandmarks();
      for (let i = 0; i < 5; i++) {
        validateHandShape(landmarks);
      }
      const result = validateHandShape(landmarks);
      expect(result.isOpen).toBe(false);
      expect(result.openness).toBeLessThan(1.5);
    });

    it('detects orientation for left hand (thumb right of pinky)', () => {
      const landmarks = makeOpenPalmLandmarks();
      // In makeOpenPalmLandmarks: thumb x=0.78, pinky x=0.35 -> thumb > pinky = Left
      const result = detectHandOrientation(landmarks);
      expect(result.handedness).toBe('Left');
    });

    it('detects good line visibility for flat palm', () => {
      const landmarks = makeOpenPalmLandmarks();
      const result = detectPalmLines(landmarks);
      expect(result.visibleLines).toBeGreaterThanOrEqual(4);
      expect(result.quality).toBeGreaterThan(0.5);
    });

    it('detects poor line visibility for edge-on hand', () => {
      const landmarks = makeEdgeOnLandmarks();
      const result = detectPalmLines(landmarks);
      expect(result.visibleLines).toBeLessThan(4);
      expect(result.palmAngle).toBeGreaterThan(30);
    });

    it('detects back of hand from z-depth analysis', () => {
      // Make a hand where fingertip z values are much higher than wrist z
      const backHandLandmarks = makeOpenPalmLandmarks().map((lm, i) => {
        // Fingertip indices: 8, 12, 16, 20
        if ([8, 12, 16, 20].includes(i)) {
          return { ...lm, z: 0.10 }; // much further from camera
        }
        return lm;
      });
      const result = detectHandOrientation(backHandLandmarks);
      expect(result.isBackOfHand).toBe(true);
    });

    it('null landmarks produce safe defaults', () => {
      const shape = validateHandShape(null);
      expect(shape.isOpen).toBe(false);

      const orientation = detectHandOrientation(null);
      expect(orientation.handedness).toBe('Right');
      expect(orientation.confidence).toBe(0);

      const lines = detectPalmLines(null);
      expect(lines.visibleLines).toBe(0);
      expect(lines.palmAngle).toBe(90);
    });
  });

  // ─── Color state machine with real detector outputs ───

  describe('color state machine with detector outputs', () => {
    it('GREEN when all conditions met: open palm, centered, quality, stability, lines visible', () => {
      const state = determineOverlayState({
        hasHand: true,
        centered: true,
        quality: 90,
        stableFrames: MOVEMENT_STABILITY_FRAMES,
        isOpen: true,
        visibleLines: 5,
      });
      expect(state).toBe('green');
    });

    it('RED when fist detected (isOpen=false)', () => {
      const state = determineOverlayState({
        hasHand: true,
        centered: true,
        quality: 90,
        stableFrames: MOVEMENT_STABILITY_FRAMES,
        isOpen: false,
        visibleLines: 5,
      });
      expect(state).toBe('red');
    });

    it('RED when insufficient lines visible', () => {
      const state = determineOverlayState({
        hasHand: true,
        centered: true,
        quality: 90,
        stableFrames: MOVEMENT_STABILITY_FRAMES,
        isOpen: true,
        visibleLines: 2,
      });
      expect(state).toBe('red');
    });

    it('YELLOW when all conditions met but stability accumulating', () => {
      const state = determineOverlayState({
        hasHand: true,
        centered: true,
        quality: 90,
        stableFrames: 30, // less than 60
        isOpen: true,
        visibleLines: 4,
      });
      expect(state).toBe('yellow');
    });

    it('RED overrides yellow when quality drops', () => {
      const state = determineOverlayState({
        hasHand: true,
        centered: true,
        quality: 80, // below 85 threshold
        stableFrames: 30,
        isOpen: true,
        visibleLines: 4,
      });
      expect(state).toBe('red');
    });
  });

  // ─── PalmOverlay with two-tier progress ───

  describe('PalmOverlay two-tier progress display', () => {
    const mockLandmarks = Array.from({ length: 21 }, (_, i) => ({
      x: 0.3 + (i * 0.02),
      y: 0.3 + (i * 0.015),
      z: 0,
    }));

    const baseProps: PalmOverlayProps = {
      landmarks: mockLandmarks,
      overlayState: 'yellow',
      stableFrames: 0,
      canvasWidth: CANVAS_WIDTH,
      canvasHeight: CANVAS_HEIGHT,
      detectionFrames: 0,
      handedness: 'Right',
      visibleLines: 5,
    };

    it('shows detection progress when detection not yet stable', () => {
      render(
        <PalmOverlay
          {...baseProps}
          detectionFrames={10}
        />
      );
      expect(screen.getByText(`Detecting... 10/${DETECTION_STABILITY_FRAMES}`)).toBeTruthy();
    });

    it('shows movement progress when detection is stable', () => {
      render(
        <PalmOverlay
          {...baseProps}
          detectionFrames={DETECTION_STABILITY_FRAMES}
          stableFrames={30}
        />
      );
      expect(screen.getByText(`30/${MOVEMENT_STABILITY_FRAMES} frames stable`)).toBeTruthy();
    });

    it('does not show progress text in red state', () => {
      render(
        <PalmOverlay
          {...baseProps}
          overlayState="red"
          detectionFrames={10}
          stableFrames={5}
        />
      );
      expect(screen.queryByText(/Detecting/)).toBeNull();
      expect(screen.queryByText(/frames stable/)).toBeNull();
    });

    it('does not show progress text in green state', () => {
      render(
        <PalmOverlay
          {...baseProps}
          overlayState="green"
          detectionFrames={DETECTION_STABILITY_FRAMES}
          stableFrames={MOVEMENT_STABILITY_FRAMES}
        />
      );
      expect(screen.queryByText(/Detecting/)).toBeNull();
      expect(screen.queryByText(/frames stable/)).toBeNull();
    });

    it('shows handedness badge', () => {
      const { container } = render(
        <PalmOverlay {...baseProps} handedness="Left" />
      );
      const badge = container.querySelector('.handedness-badge');
      expect(badge).toBeTruthy();
      expect(badge?.textContent).toBe('L');
    });

    it('shows Right handedness badge', () => {
      const { container } = render(
        <PalmOverlay {...baseProps} handedness="Right" />
      );
      const badge = container.querySelector('.handedness-badge');
      expect(badge?.textContent).toBe('R');
    });

    it('shows line visibility count', () => {
      const { container } = render(
        <PalmOverlay {...baseProps} visibleLines={4} />
      );
      const lineCount = container.querySelector('.line-count');
      expect(lineCount).toBeTruthy();
      expect(lineCount?.textContent).toBe('4/5');
    });

    it('shows 5/5 for full visibility', () => {
      const { container } = render(
        <PalmOverlay {...baseProps} visibleLines={5} />
      );
      const lineCount = container.querySelector('.line-count');
      expect(lineCount?.textContent).toBe('5/5');
    });

    it('does not render handedness badge when no landmarks', () => {
      const { container } = render(
        <PalmOverlay {...baseProps} landmarks={null} handedness="Right" />
      );
      const badge = container.querySelector('.handedness-badge');
      expect(badge).toBeNull();
    });

    it('does not render line count when no landmarks', () => {
      const { container } = render(
        <PalmOverlay {...baseProps} landmarks={null} visibleLines={5} />
      );
      const lineCount = container.querySelector('.line-count');
      expect(lineCount).toBeNull();
    });

    it('handedness badge has accessibility label', () => {
      const { container } = render(
        <PalmOverlay {...baseProps} handedness="Left" />
      );
      const badge = container.querySelector('.handedness-badge');
      expect(badge?.getAttribute('aria-label')).toContain('Left hand detected');
    });
  });

  // ─── Rejection scenarios ───

  describe('rejection scenarios', () => {
    it('fist rejected: closed hand does not produce green state', () => {
      resetSmoothing();
      const fistLandmarks = makeFistLandmarks();
      // Build up smoothing buffer
      for (let i = 0; i < 6; i++) {
        validateHandShape(fistLandmarks);
      }
      const shape = validateHandShape(fistLandmarks);

      const state = determineOverlayState({
        hasHand: true,
        centered: true,
        quality: 95,
        stableFrames: MOVEMENT_STABILITY_FRAMES,
        isOpen: shape.isOpen,
        visibleLines: 5,
      });
      expect(state).toBe('red');
    });

    it('edge-on hand rejected: poor angle blocks capture', () => {
      const edgeLandmarks = makeEdgeOnLandmarks();
      const lines = detectPalmLines(edgeLandmarks);

      const state = determineOverlayState({
        hasHand: true,
        centered: true,
        quality: 95,
        stableFrames: MOVEMENT_STABILITY_FRAMES,
        isOpen: true,
        visibleLines: lines.visibleLines,
      });
      // Edge-on should have < MIN_VISIBLE_LINES -> RED
      expect(lines.visibleLines).toBeLessThan(MIN_VISIBLE_LINES);
      expect(state).toBe('red');
    });

    it('off-center hand rejected', () => {
      const state = determineOverlayState({
        hasHand: true,
        centered: false,
        quality: 95,
        stableFrames: MOVEMENT_STABILITY_FRAMES,
        isOpen: true,
        visibleLines: 5,
      });
      expect(state).toBe('red');
    });

    it('low quality rejected', () => {
      const state = determineOverlayState({
        hasHand: true,
        centered: true,
        quality: 70, // below 85%
        stableFrames: MOVEMENT_STABILITY_FRAMES,
        isOpen: true,
        visibleLines: 5,
      });
      expect(state).toBe('red');
    });

    it('unstable hand stays yellow (never reaches green)', () => {
      const state = determineOverlayState({
        hasHand: true,
        centered: true,
        quality: 95,
        stableFrames: 45, // not yet 60
        isOpen: true,
        visibleLines: 5,
      });
      expect(state).toBe('yellow');
    });
  });

  // ─── Status message coverage ───

  describe('status messages available for all states', () => {
    it('no hand message', () => {
      expect(STATUS_MESSAGES.NO_HAND).toBe('Point palm at camera');
    });

    it('not centered message', () => {
      expect(STATUS_MESSAGES.NOT_CENTERED).toBe('Move palm to center');
    });

    it('low quality message', () => {
      expect(STATUS_MESSAGES.LOW_QUALITY).toBe('Better lighting needed');
    });

    it('detecting hand message', () => {
      expect(STATUS_MESSAGES.DETECTING_HAND).toBe('Detecting hand...');
    });

    it('hold steady message', () => {
      expect(STATUS_MESSAGES.HOLD_STEADY).toBe('Hold steady...');
    });

    it('capturing message', () => {
      expect(STATUS_MESSAGES.CAPTURING).toBe('Ready! Capturing...');
    });

    it('open palm message', () => {
      expect(STATUS_MESSAGES.OPEN_PALM).toBe('Open your palm');
    });

    it('show palm lines message', () => {
      expect(STATUS_MESSAGES.SHOW_PALM_LINES).toBe('Show more of palm');
    });

    it('rotate hand message', () => {
      expect(STATUS_MESSAGES.ROTATE_HAND).toBe('Rotate hand to show palm');
    });
  });

  // ─── Performance constants ───

  describe('performance constants verified', () => {
    it('confidence threshold is 0.85 (85%)', () => {
      expect(CONFIDENCE_THRESHOLD).toBe(0.85);
    });

    it('minimum visible lines is 4', () => {
      expect(MIN_VISIBLE_LINES).toBe(4);
    });

    it('detection stability is 20 frames', () => {
      expect(DETECTION_STABILITY_FRAMES).toBe(20);
    });

    it('movement stability is 60 frames', () => {
      expect(MOVEMENT_STABILITY_FRAMES).toBe(60);
    });
  });
});
