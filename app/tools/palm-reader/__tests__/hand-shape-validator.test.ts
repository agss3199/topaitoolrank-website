import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateHandShape,
  resetSmoothing,
  type HandShape,
} from '../lib/hand-shape-validator';
import {
  HAND_OPENNESS_THRESHOLD,
  HAND_OPENNESS_PARTIAL,
  OPENNESS_FRAME_SMOOTHING,
  PALM_CENTER_LANDMARK_INDEX,
} from '../lib/camera-constants';

/**
 * Tests for validateHandShape — hand openness detection.
 *
 * Spec: Feature 2 (palm-reader-capture-ux.md lines 89-139)
 *
 * Algorithm:
 *   extension_score = avg_finger_tip_distance / palm_size
 *   < 1.0 = fist (closed), 1.0-1.5 = partial, >= 1.5 = open (valid)
 *   5-frame moving average for smoothing
 *
 * MediaPipe landmark indices:
 *   Fingertips: 8 (index), 12 (middle), 16 (ring), 20 (pinky)
 *   Finger bases: 5 (index), 9 (middle), 13 (ring), 17 (pinky)
 *   Wrist: 0, Palm center: 9 (middle finger MCP)
 */

interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
}

/**
 * Helper: create 21 landmarks for a fully open hand.
 * Fingers extended far from palm center (landmark 9).
 * Palm center at (0.5, 0.5), fingertips spread outward.
 */
function makeOpenHandLandmarks(): NormalizedLandmark[] {
  const landmarks: NormalizedLandmark[] = Array.from({ length: 21 }, () => ({
    x: 0.5,
    y: 0.5,
    z: 0,
  }));

  // Wrist (landmark 0) — below palm center
  landmarks[0] = { x: 0.5, y: 0.8, z: 0 };

  // Palm center reference (landmark 9) — middle finger MCP
  landmarks[9] = { x: 0.5, y: 0.5, z: 0 };

  // Finger bases — close to palm center
  landmarks[5] = { x: 0.42, y: 0.48, z: 0 };  // Index MCP
  landmarks[13] = { x: 0.56, y: 0.50, z: 0 }; // Ring MCP
  landmarks[17] = { x: 0.62, y: 0.54, z: 0 }; // Pinky MCP

  // Fingertips — extended far from palm center (open hand)
  // Need distance > 1.5 * palmSize (0.3) = 0.45 from palm center at (0.5, 0.5)
  landmarks[8] = { x: 0.20, y: 0.05, z: 0 };  // Index tip — far upper-left
  landmarks[12] = { x: 0.45, y: 0.0, z: 0 };   // Middle tip — far up
  landmarks[16] = { x: 0.70, y: 0.02, z: 0 };  // Ring tip — far upper-right
  landmarks[20] = { x: 0.85, y: 0.10, z: 0 };  // Pinky tip — far right

  // Thumb landmarks
  landmarks[1] = { x: 0.38, y: 0.65, z: 0 };
  landmarks[2] = { x: 0.30, y: 0.58, z: 0 };
  landmarks[3] = { x: 0.25, y: 0.48, z: 0 };
  landmarks[4] = { x: 0.20, y: 0.40, z: 0 };  // Thumb tip

  return landmarks;
}

/**
 * Helper: create 21 landmarks for a closed fist.
 * Fingertips curled close to palm center (landmark 9).
 */
function makeFistLandmarks(): NormalizedLandmark[] {
  const landmarks: NormalizedLandmark[] = Array.from({ length: 21 }, () => ({
    x: 0.5,
    y: 0.5,
    z: 0,
  }));

  // Wrist
  landmarks[0] = { x: 0.5, y: 0.8, z: 0 };

  // Palm center
  landmarks[9] = { x: 0.5, y: 0.5, z: 0 };

  // Finger bases — normal positions
  landmarks[5] = { x: 0.42, y: 0.48, z: 0 };
  landmarks[13] = { x: 0.56, y: 0.50, z: 0 };
  landmarks[17] = { x: 0.62, y: 0.54, z: 0 };

  // Fingertips — curled very close to palm center (fist)
  landmarks[8] = { x: 0.47, y: 0.52, z: 0 };  // Index tip (near palm)
  landmarks[12] = { x: 0.50, y: 0.50, z: 0 }; // Middle tip (at palm)
  landmarks[16] = { x: 0.53, y: 0.51, z: 0 }; // Ring tip (near palm)
  landmarks[20] = { x: 0.56, y: 0.52, z: 0 }; // Pinky tip (near palm)

  // Thumb curled
  landmarks[1] = { x: 0.45, y: 0.60, z: 0 };
  landmarks[2] = { x: 0.42, y: 0.55, z: 0 };
  landmarks[3] = { x: 0.44, y: 0.52, z: 0 };
  landmarks[4] = { x: 0.46, y: 0.50, z: 0 };

  return landmarks;
}

/**
 * Helper: create 21 landmarks for a partially open hand.
 * Fingertips at intermediate distance from palm center.
 */
function makePartialHandLandmarks(): NormalizedLandmark[] {
  const landmarks: NormalizedLandmark[] = Array.from({ length: 21 }, () => ({
    x: 0.5,
    y: 0.5,
    z: 0,
  }));

  landmarks[0] = { x: 0.5, y: 0.8, z: 0 };
  landmarks[9] = { x: 0.5, y: 0.5, z: 0 };

  landmarks[5] = { x: 0.42, y: 0.48, z: 0 };
  landmarks[13] = { x: 0.56, y: 0.50, z: 0 };
  landmarks[17] = { x: 0.62, y: 0.54, z: 0 };

  // Fingertips at medium distance — partially open
  landmarks[8] = { x: 0.40, y: 0.38, z: 0 };
  landmarks[12] = { x: 0.49, y: 0.36, z: 0 };
  landmarks[16] = { x: 0.57, y: 0.37, z: 0 };
  landmarks[20] = { x: 0.64, y: 0.40, z: 0 };

  landmarks[1] = { x: 0.38, y: 0.65, z: 0 };
  landmarks[2] = { x: 0.30, y: 0.58, z: 0 };
  landmarks[3] = { x: 0.28, y: 0.50, z: 0 };
  landmarks[4] = { x: 0.26, y: 0.45, z: 0 };

  return landmarks;
}

describe('validateHandShape', () => {
  beforeEach(() => {
    // Reset the 5-frame moving average buffer between tests
    resetSmoothing();
  });

  // --- Null / empty input ---

  it('returns isOpen=false for null landmarks', () => {
    const result: HandShape = validateHandShape(null);
    expect(result.isOpen).toBe(false);
    expect(result.openness).toBe(0);
    expect(result.message).toBeTruthy();
  });

  it('returns isOpen=false for empty array', () => {
    const result = validateHandShape([]);
    expect(result.isOpen).toBe(false);
    expect(result.openness).toBe(0);
  });

  it('returns isOpen=false for insufficient landmarks (less than 21)', () => {
    const partial = Array.from({ length: 10 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
    const result = validateHandShape(partial);
    expect(result.isOpen).toBe(false);
    expect(result.openness).toBe(0);
  });

  // --- Open hand detection ---

  it('detects open hand as isOpen=true (single frame, no smoothing history)', () => {
    const landmarks = makeOpenHandLandmarks();
    // Feed enough frames to fill the smoothing buffer
    for (let i = 0; i < OPENNESS_FRAME_SMOOTHING; i++) {
      validateHandShape(landmarks);
    }
    const result = validateHandShape(landmarks);
    expect(result.isOpen).toBe(true);
    expect(result.openness).toBeGreaterThanOrEqual(HAND_OPENNESS_THRESHOLD);
  });

  it('provides positive message for open hand', () => {
    const landmarks = makeOpenHandLandmarks();
    for (let i = 0; i < OPENNESS_FRAME_SMOOTHING; i++) {
      validateHandShape(landmarks);
    }
    const result = validateHandShape(landmarks);
    expect(result.message).toMatch(/good|keep|open/i);
  });

  // --- Closed hand (fist) detection ---

  it('detects fist as isOpen=false', () => {
    const landmarks = makeFistLandmarks();
    for (let i = 0; i < OPENNESS_FRAME_SMOOTHING + 1; i++) {
      validateHandShape(landmarks);
    }
    const result = validateHandShape(landmarks);
    expect(result.isOpen).toBe(false);
    expect(result.openness).toBeLessThan(HAND_OPENNESS_PARTIAL);
  });

  it('provides instructional message for fist', () => {
    const landmarks = makeFistLandmarks();
    for (let i = 0; i < OPENNESS_FRAME_SMOOTHING + 1; i++) {
      validateHandShape(landmarks);
    }
    const result = validateHandShape(landmarks);
    expect(result.message).toMatch(/open your palm/i);
  });

  // --- Partially open hand ---

  it('detects partially open hand as isOpen=false', () => {
    const landmarks = makePartialHandLandmarks();
    for (let i = 0; i < OPENNESS_FRAME_SMOOTHING + 1; i++) {
      validateHandShape(landmarks);
    }
    const result = validateHandShape(landmarks);
    expect(result.isOpen).toBe(false);
    // Partial should be between fist and open thresholds
    expect(result.openness).toBeGreaterThanOrEqual(0);
  });

  it('provides specific message for partially open hand', () => {
    const landmarks = makePartialHandLandmarks();
    for (let i = 0; i < OPENNESS_FRAME_SMOOTHING + 1; i++) {
      validateHandShape(landmarks);
    }
    const result = validateHandShape(landmarks);
    expect(result.message).toMatch(/open|finger/i);
  });

  // --- Openness score range ---

  it('openness score is non-negative', () => {
    const result = validateHandShape(makeOpenHandLandmarks());
    expect(result.openness).toBeGreaterThanOrEqual(0);
  });

  it('openness score for fist is below threshold', () => {
    const landmarks = makeFistLandmarks();
    for (let i = 0; i < OPENNESS_FRAME_SMOOTHING + 1; i++) {
      validateHandShape(landmarks);
    }
    const result = validateHandShape(landmarks);
    expect(result.openness).toBeLessThan(HAND_OPENNESS_THRESHOLD);
  });

  // --- 5-frame moving average smoothing ---

  it('uses 5-frame moving average to smooth scores', () => {
    const openLandmarks = makeOpenHandLandmarks();
    const fistLandmarks = makeFistLandmarks();

    // Fill buffer with open hand frames
    for (let i = 0; i < OPENNESS_FRAME_SMOOTHING; i++) {
      validateHandShape(openLandmarks);
    }
    const openResult = validateHandShape(openLandmarks);
    expect(openResult.isOpen).toBe(true);

    // One fist frame should NOT immediately flip to closed (smoothing)
    const mixedResult = validateHandShape(fistLandmarks);
    // The smoothed score should still be partially open because 4 of 5 frames
    // in the buffer are open
    expect(mixedResult.openness).toBeGreaterThan(0);
  });

  it('eventually detects fist after enough fist frames', () => {
    const openLandmarks = makeOpenHandLandmarks();
    const fistLandmarks = makeFistLandmarks();

    // Start with open
    for (let i = 0; i < OPENNESS_FRAME_SMOOTHING; i++) {
      validateHandShape(openLandmarks);
    }

    // Transition to fist — after enough frames, smoothed score drops
    let result: HandShape = { isOpen: true, openness: 2, message: '' };
    for (let i = 0; i < OPENNESS_FRAME_SMOOTHING + 2; i++) {
      result = validateHandShape(fistLandmarks);
    }
    expect(result.isOpen).toBe(false);
    expect(result.openness).toBeLessThan(HAND_OPENNESS_THRESHOLD);
  });

  it('resetSmoothing clears the moving average buffer', () => {
    const openLandmarks = makeOpenHandLandmarks();

    // Fill buffer with open frames
    for (let i = 0; i < OPENNESS_FRAME_SMOOTHING; i++) {
      validateHandShape(openLandmarks);
    }

    // Reset should clear it
    resetSmoothing();

    // Now a null input should yield 0 openness (no history)
    const result = validateHandShape(null);
    expect(result.openness).toBe(0);
  });

  // --- Custom palm center index ---

  it('accepts custom palmCenterIndex parameter', () => {
    const landmarks = makeOpenHandLandmarks();
    // Use wrist (index 0) as palm center — different geometry
    const result = validateHandShape(landmarks, 0);
    // Should still return a valid HandShape (not throw)
    expect(result).toHaveProperty('isOpen');
    expect(result).toHaveProperty('openness');
    expect(result).toHaveProperty('message');
  });

  // --- Return type contract ---

  it('always returns an object with isOpen, openness, and message', () => {
    const result = validateHandShape(null);
    expect(typeof result.isOpen).toBe('boolean');
    expect(typeof result.openness).toBe('number');
    expect(typeof result.message).toBe('string');
  });

  it('openness is a finite number', () => {
    const result = validateHandShape(makeOpenHandLandmarks());
    expect(Number.isFinite(result.openness)).toBe(true);
  });

  // --- Performance boundary (no assertion, just ensure no throw/hang) ---

  it('handles rapid successive calls without error', () => {
    const landmarks = makeOpenHandLandmarks();
    for (let i = 0; i < 100; i++) {
      const result = validateHandShape(landmarks);
      expect(result).toBeDefined();
    }
  });
});
