import { describe, it, expect } from 'vitest';
import {
  detectHandOrientation,
  type HandOrientation,
} from '../lib/hand-orientation-detector';

/**
 * Tests for detectHandOrientation -- hand left/right detection.
 *
 * Spec: Feature 3 (palm-reader-capture-ux.md lines 141-188)
 *
 * Primary: Parse MediaPipe handedness directly (if confidence > 0.6)
 * Fallback: Compare pinky (landmark 20) x-position to thumb (landmark 4) x-position
 * Bonus: Detect palm-facing-away via z-axis variance
 *
 * MediaPipe handedness format:
 *   { score: number, label: "Left" | "Right" }
 *
 * Note: MediaPipe reports handedness from the camera's perspective (mirrored).
 * A right hand in the image is labeled "Right" by MediaPipe.
 */

interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
}

/**
 * Helper: create landmarks for a left hand (palm facing camera).
 * In a left hand facing the camera, the thumb (landmark 4) is on the right side
 * of the image (higher x) and pinky (landmark 20) is on the left (lower x).
 */
function makeLeftHandLandmarks(): NormalizedLandmark[] {
  const landmarks: NormalizedLandmark[] = Array.from({ length: 21 }, () => ({
    x: 0.5,
    y: 0.5,
    z: 0,
  }));

  // Thumb tip at right side of image (higher x)
  landmarks[4] = { x: 0.7, y: 0.45, z: 0 };
  // Pinky tip at left side of image (lower x)
  landmarks[20] = { x: 0.3, y: 0.35, z: 0 };
  // Wrist
  landmarks[0] = { x: 0.5, y: 0.8, z: 0 };
  // Middle finger tip (for z-axis reference)
  landmarks[12] = { x: 0.48, y: 0.15, z: -0.05 };
  // Palm center
  landmarks[9] = { x: 0.5, y: 0.5, z: 0 };

  return landmarks;
}

/**
 * Helper: create landmarks for a right hand (palm facing camera).
 * In a right hand facing the camera, the thumb (landmark 4) is on the left side
 * of the image (lower x) and pinky (landmark 20) is on the right (higher x).
 */
function makeRightHandLandmarks(): NormalizedLandmark[] {
  const landmarks: NormalizedLandmark[] = Array.from({ length: 21 }, () => ({
    x: 0.5,
    y: 0.5,
    z: 0,
  }));

  // Thumb tip at left side of image (lower x)
  landmarks[4] = { x: 0.3, y: 0.45, z: 0 };
  // Pinky tip at right side of image (higher x)
  landmarks[20] = { x: 0.7, y: 0.35, z: 0 };
  // Wrist
  landmarks[0] = { x: 0.5, y: 0.8, z: 0 };
  // Middle finger tip
  landmarks[12] = { x: 0.52, y: 0.15, z: -0.05 };
  landmarks[9] = { x: 0.5, y: 0.5, z: 0 };

  return landmarks;
}

/**
 * Helper: create landmarks with palm facing away (back of hand to camera).
 * Z-axis values for fingertips are positive (further from camera than wrist).
 */
function makeBackOfHandLandmarks(): NormalizedLandmark[] {
  const landmarks: NormalizedLandmark[] = Array.from({ length: 21 }, () => ({
    x: 0.5,
    y: 0.5,
    z: 0,
  }));

  landmarks[4] = { x: 0.7, y: 0.45, z: 0.08 };
  landmarks[20] = { x: 0.3, y: 0.35, z: 0.08 };
  landmarks[0] = { x: 0.5, y: 0.8, z: 0 };
  // Fingertips have higher z (further from camera) compared to wrist
  landmarks[8] = { x: 0.40, y: 0.20, z: 0.10 };
  landmarks[12] = { x: 0.48, y: 0.15, z: 0.12 };
  landmarks[16] = { x: 0.56, y: 0.18, z: 0.10 };
  landmarks[9] = { x: 0.5, y: 0.5, z: 0.05 };

  return landmarks;
}

describe('detectHandOrientation', () => {
  // --- MediaPipe handedness (primary path) ---

  it('detects left hand from MediaPipe handedness with high confidence', () => {
    const landmarks = makeLeftHandLandmarks();
    const mediapipeHandedness = { score: 0.95, label: 'Left' as const };
    const result: HandOrientation = detectHandOrientation(landmarks, mediapipeHandedness);
    expect(result.handedness).toBe('Left');
    expect(result.confidence).toBeGreaterThanOrEqual(0.6);
  });

  it('detects right hand from MediaPipe handedness with high confidence', () => {
    const landmarks = makeRightHandLandmarks();
    const mediapipeHandedness = { score: 0.92, label: 'Right' as const };
    const result = detectHandOrientation(landmarks, mediapipeHandedness);
    expect(result.handedness).toBe('Right');
    expect(result.confidence).toBeGreaterThanOrEqual(0.6);
  });

  it('uses MediaPipe confidence score directly', () => {
    const landmarks = makeLeftHandLandmarks();
    const mediapipeHandedness = { score: 0.88, label: 'Left' as const };
    const result = detectHandOrientation(landmarks, mediapipeHandedness);
    expect(result.confidence).toBe(0.88);
  });

  // --- MediaPipe low confidence -> fallback ---

  it('falls back to landmark detection when MediaPipe confidence < 0.6', () => {
    const landmarks = makeLeftHandLandmarks();
    const mediapipeHandedness = { score: 0.3, label: 'Right' as const };
    const result = detectHandOrientation(landmarks, mediapipeHandedness);
    // Should use landmark-based detection, not the low-confidence MediaPipe result
    // Left hand: thumb (4) x > pinky (20) x
    expect(result.handedness).toBe('Left');
  });

  // --- Fallback detection (no MediaPipe handedness) ---

  it('detects left hand from landmarks when no MediaPipe data', () => {
    const landmarks = makeLeftHandLandmarks();
    const result = detectHandOrientation(landmarks);
    expect(result.handedness).toBe('Left');
  });

  it('detects right hand from landmarks when no MediaPipe data', () => {
    const landmarks = makeRightHandLandmarks();
    const result = detectHandOrientation(landmarks);
    expect(result.handedness).toBe('Right');
  });

  it('fallback confidence is lower than MediaPipe confidence', () => {
    const landmarks = makeLeftHandLandmarks();
    const fallbackResult = detectHandOrientation(landmarks);
    const mediapipeResult = detectHandOrientation(landmarks, {
      score: 0.95,
      label: 'Left',
    });
    expect(fallbackResult.confidence).toBeLessThan(mediapipeResult.confidence);
  });

  // --- Null / invalid input ---

  it('returns default for null landmarks', () => {
    const result = detectHandOrientation(null);
    expect(result.handedness).toBe('Right');
    expect(result.confidence).toBe(0);
    expect(result.isBackOfHand).toBe(false);
  });

  it('returns default for empty landmarks array', () => {
    const result = detectHandOrientation([]);
    expect(result.handedness).toBe('Right');
    expect(result.confidence).toBe(0);
  });

  it('returns default for insufficient landmarks (< 21)', () => {
    const partial = Array.from({ length: 10 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
    const result = detectHandOrientation(partial);
    expect(result.confidence).toBe(0);
  });

  // --- Back of hand detection ---

  it('detects back of hand from z-axis variance', () => {
    const landmarks = makeBackOfHandLandmarks();
    const result = detectHandOrientation(landmarks);
    expect(result.isBackOfHand).toBe(true);
  });

  it('detects palm facing camera as not back of hand', () => {
    const landmarks = makeLeftHandLandmarks();
    const result = detectHandOrientation(landmarks);
    expect(result.isBackOfHand).toBe(false);
  });

  // --- Return type contract ---

  it('always returns an object with handedness, confidence, and isBackOfHand', () => {
    const result = detectHandOrientation(null);
    expect(typeof result.handedness).toBe('string');
    expect(typeof result.confidence).toBe('number');
    expect(typeof result.isBackOfHand).toBe('boolean');
  });

  it('confidence is between 0 and 1', () => {
    const landmarks = makeLeftHandLandmarks();
    const result = detectHandOrientation(landmarks, { score: 0.95, label: 'Left' });
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it('handedness is either Left or Right', () => {
    const landmarks = makeLeftHandLandmarks();
    const result = detectHandOrientation(landmarks);
    expect(['Left', 'Right']).toContain(result.handedness);
  });

  // --- MediaPipe label validation ---

  it('handles MediaPipe returning undefined handedness', () => {
    const landmarks = makeLeftHandLandmarks();
    const result = detectHandOrientation(landmarks, undefined);
    // Should fall back to landmark detection
    expect(result.handedness).toBe('Left');
  });

  // --- Rapid successive calls ---

  it('handles rapid successive calls without error', () => {
    const landmarks = makeLeftHandLandmarks();
    for (let i = 0; i < 100; i++) {
      const result = detectHandOrientation(landmarks);
      expect(result).toBeDefined();
    }
  });
});
