/**
 * Palm line visibility detection — estimate visible lines from hand angle.
 *
 * Spec: Feature 4 (palm-reader-capture-ux.md lines 191-237)
 *
 * Algorithm:
 *   1. Estimate palm plane normal from wrist (landmark 0) + middle finger MCP (landmark 9)
 *   2. Calculate angle between palm plane and camera direction (z-axis)
 *      - 0 degrees = palm faces camera perfectly (best for reading)
 *      - 90 degrees = palm is edge-on to camera (no lines visible)
 *   3. Map angle to visible lines count:
 *      - 0-20 deg  -> 5 lines (palm flat toward camera, all lines visible)
 *      - 20-35 deg -> 4 lines (still mostly facing camera)
 *      - 35-50 deg -> 2-3 lines (significant tilt)
 *      - 50-70 deg -> 1 line (almost edge-on)
 *      - >70 deg   -> 0 lines (edge-on, cannot read)
 *   4. Adjust for hand size (larger hand in frame = better line visibility)
 *
 * Performance target: <3ms per frame.
 */

import {
  PALM_CENTER_LANDMARK_INDEX,
  MAX_VISIBLE_LINES,
} from './camera-constants';

interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
}

export interface PalmLineVisibility {
  /** Estimated number of visible palm lines (0-5) */
  visibleLines: number;
  /** Angle of palm relative to camera in degrees (0 = facing, 90 = edge-on) */
  palmAngle: number;
  /** Overall quality score for line visibility (0-1) */
  quality: number;
}

/** Wrist landmark index */
const WRIST_INDEX = 0;

/** Middle finger tip for extended palm plane estimation */
const MIDDLE_TIP_INDEX = 12;

/** Minimum landmarks required (full MediaPipe hand) */
const REQUIRED_LANDMARKS = 21;

/** Indices used for z-depth variance calculation */
const PALM_PLANE_INDICES = [0, 5, 9, 13, 17] as const;

/**
 * Angle thresholds mapping palm angle to visible line count.
 * Lower angle = more lines visible (palm facing camera).
 */
const ANGLE_TO_LINES: ReadonlyArray<{ maxAngle: number; lines: number }> = [
  { maxAngle: 20, lines: 5 },
  { maxAngle: 35, lines: 4 },
  { maxAngle: 50, lines: 3 },
  { maxAngle: 60, lines: 2 },
  { maxAngle: 70, lines: 1 },
  { maxAngle: 90, lines: 0 },
];

/**
 * Minimum hand size (wrist-to-middle-tip distance in normalized coords)
 * below which we apply no size bonus. Above this, larger hands get a +1 line bonus.
 */
const HAND_SIZE_BONUS_THRESHOLD = 0.5;

/**
 * Calculate the palm angle relative to the camera.
 *
 * Uses the z-depth difference between the wrist and palm center/middle finger
 * to estimate the angle of the palm plane relative to the camera's viewing direction.
 *
 * When the palm faces the camera directly, wrist and fingertips have similar z values.
 * When the palm is tilted or edge-on, there's a significant z-depth gradient.
 *
 * @returns Angle in degrees: 0 = facing camera, 90 = edge-on
 */
function calculatePalmAngle(
  landmarks: NormalizedLandmark[],
  palmCenterIndex: number
): number {
  const wrist = landmarks[WRIST_INDEX];
  const palmCenter = landmarks[palmCenterIndex];
  const middleTip = landmarks[MIDDLE_TIP_INDEX];

  // Calculate z-depth gradient across the palm
  // Use multiple landmarks to get a robust estimate
  const wristZ = wrist.z;
  const palmZ = palmCenter.z;
  const tipZ = middleTip.z;

  // The z-depth difference indicates how tilted the palm is
  // Average the z-gradient from wrist-to-palm and wrist-to-tip
  const zGradientPalm = Math.abs(palmZ - wristZ);
  const zGradientTip = Math.abs(tipZ - wristZ);
  const avgZGradient = (zGradientPalm + zGradientTip) / 2;

  // Also consider the x/y spread of palm landmarks
  // A flat palm facing camera has landmarks spread in x/y with minimal z-spread
  let zVariance = 0;
  for (const index of PALM_PLANE_INDICES) {
    const lm = landmarks[index];
    zVariance += Math.abs(lm.z - wristZ);
  }
  zVariance /= PALM_PLANE_INDICES.length;

  // Combine z-gradient and z-variance for a robust angle estimate
  // Scale factor: a z-gradient of ~0.5 corresponds to roughly 90 degrees
  const combinedZ = (avgZGradient * 0.6 + zVariance * 0.4);
  const normalizedAngle = Math.min(combinedZ / 0.35, 1.0);

  // Convert to degrees (0-90 range)
  const angleDegrees = normalizedAngle * 90;
  return Math.max(0, Math.min(90, angleDegrees));
}

/**
 * Map palm angle to number of visible lines.
 */
function angleToLineCount(angleDegrees: number): number {
  for (const { maxAngle, lines } of ANGLE_TO_LINES) {
    if (angleDegrees <= maxAngle) {
      return lines;
    }
  }
  return 0;
}

/**
 * Calculate hand size as wrist-to-middle-fingertip distance.
 * Used for size adjustment: larger hands show more detail.
 */
function calculateHandSize(landmarks: NormalizedLandmark[]): number {
  const wrist = landmarks[WRIST_INDEX];
  const middleTip = landmarks[MIDDLE_TIP_INDEX];
  const dx = middleTip.x - wrist.x;
  const dy = middleTip.y - wrist.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate quality score from palm angle (0-1).
 * Quality is highest when palm faces camera (angle near 0).
 */
function calculateQuality(angleDegrees: number): number {
  // Linear mapping: 0 degrees = quality 1.0, 90 degrees = quality 0.0
  return Math.max(0, 1.0 - (angleDegrees / 90));
}

/**
 * Detect palm line visibility based on hand pose and angle.
 *
 * @param landmarks - 21 MediaPipe hand landmarks in normalized [0,1] coordinates, or null
 * @param palmCenterIndex - Landmark index to use as palm center (default: 9)
 * @returns PalmLineVisibility with visible line count, palm angle, and quality
 */
export function detectPalmLines(
  landmarks: NormalizedLandmark[] | null,
  palmCenterIndex: number = PALM_CENTER_LANDMARK_INDEX
): PalmLineVisibility {
  // Null / insufficient landmarks
  if (!landmarks || landmarks.length < REQUIRED_LANDMARKS) {
    return {
      visibleLines: 0,
      palmAngle: 90,
      quality: 0,
    };
  }

  // Calculate palm angle relative to camera
  const palmAngle = calculatePalmAngle(landmarks, palmCenterIndex);

  // Map angle to visible lines
  let visibleLines = angleToLineCount(palmAngle);

  // Hand size bonus: larger hands in frame show more detail
  const handSize = calculateHandSize(landmarks);
  if (handSize >= HAND_SIZE_BONUS_THRESHOLD && visibleLines > 0 && visibleLines < MAX_VISIBLE_LINES) {
    visibleLines = Math.min(visibleLines + 1, MAX_VISIBLE_LINES);
  }

  // Calculate quality
  const quality = calculateQuality(palmAngle);

  return {
    visibleLines,
    palmAngle: Math.round(palmAngle * 10) / 10, // Round to 1 decimal
    quality: Math.round(quality * 1000) / 1000,  // Round to 3 decimals
  };
}
