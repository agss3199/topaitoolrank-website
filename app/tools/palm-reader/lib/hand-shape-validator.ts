/**
 * Hand shape validation — detect open palm vs fist.
 *
 * Spec: Feature 2 (palm-reader-capture-ux.md lines 89-139)
 *
 * Algorithm:
 *   1. For each of 4 fingers (index, middle, ring, pinky), calculate the
 *      distance from the fingertip to the palm center.
 *   2. Compute palm_size as the distance from wrist (landmark 0) to
 *      palm center (landmark 9, middle finger MCP).
 *   3. extension_score = average_fingertip_distance / palm_size
 *   4. Smoothed over a 5-frame moving average to avoid flicker.
 *   5. Threshold: < 1.0 = fist, 1.0-1.5 = partial, >= 1.5 = open (valid)
 *
 * Performance target: <2ms per frame.
 */

import {
  HAND_OPENNESS_THRESHOLD,
  HAND_OPENNESS_PARTIAL,
  OPENNESS_FRAME_SMOOTHING,
  PALM_CENTER_LANDMARK_INDEX,
} from './camera-constants';

interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
}

export interface HandShape {
  /** Whether the hand is sufficiently open for palm reading */
  isOpen: boolean;
  /** Smoothed openness score (0-2.0+ scale) */
  openness: number;
  /** User-facing status message */
  message: string;
}

/** Fingertip landmark indices (index, middle, ring, pinky) */
const FINGERTIP_INDICES = [8, 12, 16, 20] as const;

/** Wrist landmark index */
const WRIST_INDEX = 0;

/** Minimum number of landmarks required (full MediaPipe hand) */
const REQUIRED_LANDMARKS = 21;

/**
 * Moving average buffer for openness score smoothing.
 * Module-level state — persists across calls within a session.
 * Call resetSmoothing() to clear between sessions or tests.
 */
let smoothingBuffer: number[] = [];

/** Reset the smoothing buffer. Exported for testing. */
export function resetSmoothing(): void {
  smoothingBuffer = [];
}

/**
 * Calculate Euclidean distance between two 2D landmark points.
 * Uses only x/y (ignoring z) since we care about apparent distance in the image plane.
 */
function distance2D(a: NormalizedLandmark, b: NormalizedLandmark): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate raw openness score from landmarks.
 *
 * extension_score = avg_finger_tip_distance / palm_size
 *
 * palm_size = distance from wrist to palm center
 * avg_finger_tip_distance = average distance from each fingertip to palm center
 */
function calculateRawOpenness(
  landmarks: NormalizedLandmark[],
  palmCenterIndex: number
): number {
  const palmCenter = landmarks[palmCenterIndex];
  const wrist = landmarks[WRIST_INDEX];

  // Palm size: distance from wrist to palm center
  const palmSize = distance2D(wrist, palmCenter);

  // Guard against division by zero (palm center overlapping wrist)
  if (palmSize < 0.001) {
    return 0;
  }

  // Average fingertip distance from palm center
  let totalTipDistance = 0;
  for (const tipIndex of FINGERTIP_INDICES) {
    totalTipDistance += distance2D(landmarks[tipIndex], palmCenter);
  }
  const avgTipDistance = totalTipDistance / FINGERTIP_INDICES.length;

  return avgTipDistance / palmSize;
}

/**
 * Push a score into the smoothing buffer and return the moving average.
 */
function smoothScore(rawScore: number): number {
  smoothingBuffer.push(rawScore);

  // Keep only the last OPENNESS_FRAME_SMOOTHING frames
  if (smoothingBuffer.length > OPENNESS_FRAME_SMOOTHING) {
    smoothingBuffer = smoothingBuffer.slice(-OPENNESS_FRAME_SMOOTHING);
  }

  // Average across the buffer
  const sum = smoothingBuffer.reduce((acc, val) => acc + val, 0);
  return sum / smoothingBuffer.length;
}

/**
 * Determine user-facing message based on smoothed openness score.
 */
function getStatusMessage(smoothedScore: number): string {
  if (smoothedScore >= HAND_OPENNESS_THRESHOLD) {
    return 'Good, keep steady';
  }
  if (smoothedScore >= HAND_OPENNESS_PARTIAL) {
    return 'Open all fingers';
  }
  return 'Open your palm';
}

/**
 * Validate whether the detected hand is open (palm visible) or closed (fist).
 *
 * @param landmarks - 21 MediaPipe hand landmarks in normalized [0,1] coordinates, or null
 * @param palmCenterIndex - Landmark index to use as palm center (default: 9, middle finger MCP)
 * @returns HandShape with isOpen flag, smoothed openness score, and status message
 */
export function validateHandShape(
  landmarks: NormalizedLandmark[] | null,
  palmCenterIndex: number = PALM_CENTER_LANDMARK_INDEX
): HandShape {
  // Null / insufficient landmarks
  if (!landmarks || landmarks.length < REQUIRED_LANDMARKS) {
    // Push a 0 to the smoothing buffer so it reflects no-hand frames
    const smoothed = smoothScore(0);
    return {
      isOpen: false,
      openness: smoothed,
      message: 'Open your palm',
    };
  }

  const rawScore = calculateRawOpenness(landmarks, palmCenterIndex);
  const smoothedScore = smoothScore(rawScore);

  return {
    isOpen: smoothedScore >= HAND_OPENNESS_THRESHOLD,
    openness: smoothedScore,
    message: getStatusMessage(smoothedScore),
  };
}
