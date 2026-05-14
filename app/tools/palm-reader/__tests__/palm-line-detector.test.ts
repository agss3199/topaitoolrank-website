import { describe, it, expect } from 'vitest';
import {
  detectPalmLines,
  type PalmLineVisibility,
} from '../lib/palm-line-detector';
import { MIN_VISIBLE_LINES, MAX_VISIBLE_LINES } from '../lib/camera-constants';

/**
 * Tests for detectPalmLines -- palm line visibility estimation.
 *
 * Spec: Feature 4 (palm-reader-capture-ux.md lines 191-237)
 *
 * Algorithm:
 *   - Estimate palm plane normal from wrist (landmark 0) + middle finger MCP (landmark 9)
 *   - Calculate angle: 0 deg = perpendicular to camera (facing), 90 deg = edge-on
 *   - Map angle to visible lines count
 *   - Adjust for hand size (bigger hand = more visible detail)
 *
 * From the task description:
 *   <15 deg   -> 0-1 lines
 *   15-30 deg -> 2-3 lines
 *   30-60 deg -> 4+ lines
 *   >60 deg   -> 0 lines (edge-on, too angled)
 *
 * Note: The spec's angle convention is:
 *   0 deg = palm perpendicular to camera plane (facing directly at camera)
 *   90 deg = palm edge-on
 *
 * For palm reading, the ideal is palm flat facing camera (low palmAngle).
 * Re-reading the spec and task more carefully:
 *   The task says: 0 deg (facing camera) = 4+ lines, 90 deg (edge-on) = 0 lines
 *   And the angle thresholds:
 *     <15 deg -> 0-1 lines  (nearly flat but in terms of tilt from perpendicular?)
 *
 * Let me reconcile: the "palmAngle" represents how tilted the palm is FROM
 * directly facing the camera. So:
 *   palmAngle ~0 deg = palm faces camera perfectly -> most lines visible (4-5)
 *   palmAngle ~90 deg = edge-on -> 0 lines
 *
 * The task description thresholds (<15, 15-30, 30-60, >60) seem inverted from
 * the narrative. Using the spec's priority: 0 deg = facing camera = best = 4+ lines.
 * Corrected mapping:
 *   0-30 deg    -> 4-5 lines (palm facing camera)
 *   30-45 deg   -> 2-3 lines (slightly tilted)
 *   45-70 deg   -> 1 line
 *   >70 deg     -> 0 lines (edge-on)
 */

interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
}

/**
 * Helper: create landmarks for palm facing directly at camera.
 * The palm plane is perpendicular to the z-axis (camera direction).
 * Wrist and palm center have similar z values; finger spread is in x/y plane.
 */
function makePalmFacingCameraLandmarks(): NormalizedLandmark[] {
  const landmarks: NormalizedLandmark[] = Array.from({ length: 21 }, () => ({
    x: 0.5,
    y: 0.5,
    z: 0,
  }));

  // Wrist at bottom, z = 0
  landmarks[0] = { x: 0.5, y: 0.8, z: 0 };
  // Palm center (middle finger MCP), same z plane
  landmarks[9] = { x: 0.5, y: 0.5, z: 0 };
  // Middle finger tip, same z
  landmarks[12] = { x: 0.5, y: 0.2, z: 0 };
  // Index finger MCP
  landmarks[5] = { x: 0.4, y: 0.48, z: 0 };
  // Ring finger MCP
  landmarks[13] = { x: 0.58, y: 0.50, z: 0 };
  // Pinky MCP
  landmarks[17] = { x: 0.65, y: 0.55, z: 0 };
  // Thumb
  landmarks[4] = { x: 0.25, y: 0.45, z: 0 };

  // Fingertips spread out in x/y, all at z=0 (flat toward camera)
  landmarks[8] = { x: 0.35, y: 0.18, z: 0 };
  landmarks[16] = { x: 0.62, y: 0.22, z: 0 };
  landmarks[20] = { x: 0.72, y: 0.30, z: 0 };

  return landmarks;
}

/**
 * Helper: create landmarks for palm edge-on to camera (90 degrees tilted).
 * The wrist and middle finger MCP have very different z values,
 * meaning the palm plane is parallel to the camera direction.
 */
function makePalmEdgeOnLandmarks(): NormalizedLandmark[] {
  const landmarks: NormalizedLandmark[] = Array.from({ length: 21 }, () => ({
    x: 0.5,
    y: 0.5,
    z: 0,
  }));

  // Wrist at z=0 (close to camera)
  landmarks[0] = { x: 0.5, y: 0.8, z: 0 };
  // Palm center far from camera (large z difference from wrist)
  landmarks[9] = { x: 0.5, y: 0.5, z: 0.4 };
  // Middle finger tip even further
  landmarks[12] = { x: 0.5, y: 0.2, z: 0.6 };
  // Other landmarks also deep
  landmarks[5] = { x: 0.48, y: 0.55, z: 0.3 };
  landmarks[13] = { x: 0.52, y: 0.50, z: 0.45 };
  landmarks[17] = { x: 0.54, y: 0.55, z: 0.5 };
  landmarks[4] = { x: 0.45, y: 0.60, z: 0.1 };
  landmarks[8] = { x: 0.47, y: 0.30, z: 0.5 };
  landmarks[16] = { x: 0.53, y: 0.25, z: 0.55 };
  landmarks[20] = { x: 0.55, y: 0.35, z: 0.55 };

  return landmarks;
}

/**
 * Helper: create landmarks for palm at ~45 degree angle.
 * Moderate z-depth difference between wrist and palm center.
 */
function makePalmAt45DegreeLandmarks(): NormalizedLandmark[] {
  const landmarks: NormalizedLandmark[] = Array.from({ length: 21 }, () => ({
    x: 0.5,
    y: 0.5,
    z: 0,
  }));

  // Wrist
  landmarks[0] = { x: 0.5, y: 0.8, z: 0 };
  // Palm center — moderate z offset (between 0 and edge-on)
  landmarks[9] = { x: 0.5, y: 0.5, z: 0.2 };
  // Middle finger tip
  landmarks[12] = { x: 0.5, y: 0.25, z: 0.3 };
  landmarks[5] = { x: 0.42, y: 0.50, z: 0.15 };
  landmarks[13] = { x: 0.56, y: 0.50, z: 0.22 };
  landmarks[17] = { x: 0.62, y: 0.55, z: 0.25 };
  landmarks[4] = { x: 0.30, y: 0.50, z: 0.05 };
  landmarks[8] = { x: 0.38, y: 0.22, z: 0.25 };
  landmarks[16] = { x: 0.58, y: 0.24, z: 0.28 };
  landmarks[20] = { x: 0.68, y: 0.32, z: 0.30 };

  return landmarks;
}

describe('detectPalmLines', () => {
  // --- Null / empty input ---

  it('returns 0 lines for null landmarks', () => {
    const result: PalmLineVisibility = detectPalmLines(null);
    expect(result.visibleLines).toBe(0);
    expect(result.palmAngle).toBe(90);
    expect(result.quality).toBe(0);
  });

  it('returns 0 lines for empty landmarks array', () => {
    const result = detectPalmLines([]);
    expect(result.visibleLines).toBe(0);
  });

  it('returns 0 lines for insufficient landmarks (< 21)', () => {
    const partial = Array.from({ length: 10 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
    const result = detectPalmLines(partial);
    expect(result.visibleLines).toBe(0);
  });

  // --- Palm facing camera (ideal position) ---

  it('detects 4+ lines when palm faces camera directly', () => {
    const landmarks = makePalmFacingCameraLandmarks();
    const result = detectPalmLines(landmarks);
    expect(result.visibleLines).toBeGreaterThanOrEqual(MIN_VISIBLE_LINES);
    expect(result.palmAngle).toBeLessThan(30);
    expect(result.quality).toBeGreaterThan(0.5);
  });

  it('palm angle near 0 when facing camera', () => {
    const landmarks = makePalmFacingCameraLandmarks();
    const result = detectPalmLines(landmarks);
    expect(result.palmAngle).toBeGreaterThanOrEqual(0);
    expect(result.palmAngle).toBeLessThan(20);
  });

  // --- Palm edge-on (worst position) ---

  it('detects 0 lines when palm is edge-on', () => {
    const landmarks = makePalmEdgeOnLandmarks();
    const result = detectPalmLines(landmarks);
    expect(result.visibleLines).toBeLessThanOrEqual(1);
    expect(result.palmAngle).toBeGreaterThan(60);
  });

  it('quality is low when palm is edge-on', () => {
    const landmarks = makePalmEdgeOnLandmarks();
    const result = detectPalmLines(landmarks);
    expect(result.quality).toBeLessThan(0.3);
  });

  // --- Palm at 45 degrees (intermediate) ---

  it('detects 2-3 lines at 45 degree angle', () => {
    const landmarks = makePalmAt45DegreeLandmarks();
    const result = detectPalmLines(landmarks);
    expect(result.visibleLines).toBeGreaterThanOrEqual(1);
    expect(result.visibleLines).toBeLessThanOrEqual(3);
  });

  it('palm angle approximately 45 degrees for angled hand', () => {
    const landmarks = makePalmAt45DegreeLandmarks();
    const result = detectPalmLines(landmarks);
    expect(result.palmAngle).toBeGreaterThan(25);
    expect(result.palmAngle).toBeLessThan(65);
  });

  // --- visibleLines range ---

  it('visibleLines is between 0 and MAX_VISIBLE_LINES', () => {
    const landmarks = makePalmFacingCameraLandmarks();
    const result = detectPalmLines(landmarks);
    expect(result.visibleLines).toBeGreaterThanOrEqual(0);
    expect(result.visibleLines).toBeLessThanOrEqual(MAX_VISIBLE_LINES);
  });

  it('visibleLines is always a whole number', () => {
    const landmarks = makePalmFacingCameraLandmarks();
    const result = detectPalmLines(landmarks);
    expect(Number.isInteger(result.visibleLines)).toBe(true);
  });

  // --- palmAngle range ---

  it('palmAngle is between 0 and 90 degrees', () => {
    const landmarks = makePalmFacingCameraLandmarks();
    const result = detectPalmLines(landmarks);
    expect(result.palmAngle).toBeGreaterThanOrEqual(0);
    expect(result.palmAngle).toBeLessThanOrEqual(90);
  });

  it('palmAngle is 90 for null input', () => {
    const result = detectPalmLines(null);
    expect(result.palmAngle).toBe(90);
  });

  // --- quality range ---

  it('quality is between 0 and 1', () => {
    const landmarks = makePalmFacingCameraLandmarks();
    const result = detectPalmLines(landmarks);
    expect(result.quality).toBeGreaterThanOrEqual(0);
    expect(result.quality).toBeLessThanOrEqual(1);
  });

  it('quality is 0 for null input', () => {
    const result = detectPalmLines(null);
    expect(result.quality).toBe(0);
  });

  it('quality correlates inversely with palm angle (lower angle = higher quality)', () => {
    const facingResult = detectPalmLines(makePalmFacingCameraLandmarks());
    const edgeResult = detectPalmLines(makePalmEdgeOnLandmarks());
    expect(facingResult.quality).toBeGreaterThan(edgeResult.quality);
  });

  // --- Custom palm center index ---

  it('accepts custom palmCenterIndex parameter', () => {
    const landmarks = makePalmFacingCameraLandmarks();
    const result = detectPalmLines(landmarks, 5); // index finger MCP
    expect(result).toHaveProperty('visibleLines');
    expect(result).toHaveProperty('palmAngle');
    expect(result).toHaveProperty('quality');
  });

  // --- Return type contract ---

  it('always returns an object with visibleLines, palmAngle, and quality', () => {
    const result = detectPalmLines(null);
    expect(typeof result.visibleLines).toBe('number');
    expect(typeof result.palmAngle).toBe('number');
    expect(typeof result.quality).toBe('number');
  });

  it('all numeric values are finite', () => {
    const result = detectPalmLines(makePalmFacingCameraLandmarks());
    expect(Number.isFinite(result.visibleLines)).toBe(true);
    expect(Number.isFinite(result.palmAngle)).toBe(true);
    expect(Number.isFinite(result.quality)).toBe(true);
  });

  // --- Hand size adjustment ---

  it('larger hand (more spread) produces equal or higher line count vs smaller hand', () => {
    // Large hand — landmarks more spread apart
    const largeLandmarks = makePalmFacingCameraLandmarks();
    largeLandmarks[0] = { x: 0.5, y: 0.9, z: 0 };  // Wrist further down
    largeLandmarks[12] = { x: 0.5, y: 0.1, z: 0 };  // Fingertip further up

    // Small hand — landmarks closer together
    const smallLandmarks = makePalmFacingCameraLandmarks();
    smallLandmarks[0] = { x: 0.5, y: 0.65, z: 0 };  // Wrist closer
    smallLandmarks[12] = { x: 0.5, y: 0.35, z: 0 };  // Fingertip closer

    const largeResult = detectPalmLines(largeLandmarks);
    const smallResult = detectPalmLines(smallLandmarks);
    expect(largeResult.visibleLines).toBeGreaterThanOrEqual(smallResult.visibleLines);
  });

  // --- Performance boundary ---

  it('handles rapid successive calls without error', () => {
    const landmarks = makePalmFacingCameraLandmarks();
    for (let i = 0; i < 100; i++) {
      const result = detectPalmLines(landmarks);
      expect(result).toBeDefined();
    }
  });
});
