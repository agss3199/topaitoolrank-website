/**
 * Hand orientation detection — identify left/right hand from MediaPipe handedness.
 *
 * Spec: Feature 3 (palm-reader-capture-ux.md lines 141-188)
 *
 * Primary path: Parse MediaPipe multiHandedness[0] directly.
 *   - Uses MediaPipe's own confidence score (0-1).
 *   - Only trusted when confidence > 0.6.
 *
 * Fallback path: Derive handedness from landmark x-positions.
 *   - Left hand (palm facing camera): thumb (4) at higher x than pinky (20)
 *   - Right hand (palm facing camera): thumb (4) at lower x than pinky (20)
 *
 * Bonus: Detect palm-facing-away (back of hand) via z-axis analysis.
 *   - When fingertip z-values are significantly higher (further from camera)
 *     than the wrist z-value, the back of the hand faces the camera.
 *
 * Performance target: <2ms per frame.
 */

interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
}

export interface MediaPipeHandedness {
  score: number;
  label: 'Left' | 'Right';
}

export interface HandOrientation {
  /** Detected hand: Left or Right */
  handedness: 'Left' | 'Right';
  /** Confidence score (0-1). Higher for MediaPipe primary path, lower for fallback. */
  confidence: number;
  /** Whether the back of the hand faces the camera (palm away) */
  isBackOfHand: boolean;
}

/** Minimum MediaPipe confidence to trust its handedness label */
const MEDIAPIPE_CONFIDENCE_FLOOR = 0.6;

/** Thumb tip landmark index */
const THUMB_TIP_INDEX = 4;

/** Pinky tip landmark index */
const PINKY_TIP_INDEX = 20;

/** Wrist landmark index */
const WRIST_INDEX = 0;

/** Fingertip indices for z-axis analysis */
const FINGERTIP_INDICES = [8, 12, 16, 20] as const;

/** Minimum landmarks required (full MediaPipe hand) */
const REQUIRED_LANDMARKS = 21;

/**
 * Z-depth threshold for back-of-hand detection.
 * If the average fingertip z exceeds the wrist z by more than this,
 * the back of the hand is likely facing the camera.
 */
const BACK_OF_HAND_Z_THRESHOLD = 0.04;

/** Default confidence for landmark-based fallback detection */
const FALLBACK_CONFIDENCE = 0.5;

/**
 * Detect whether the back of the hand faces the camera using z-axis analysis.
 *
 * When the palm faces the camera, fingertips have z <= wrist z (or similar).
 * When the back of the hand faces the camera, fingertips have z > wrist z
 * because they are further from the camera than the knuckles/wrist.
 */
function detectBackOfHand(landmarks: NormalizedLandmark[]): boolean {
  const wristZ = landmarks[WRIST_INDEX].z;

  let totalFingertipZ = 0;
  for (const index of FINGERTIP_INDICES) {
    totalFingertipZ += landmarks[index].z;
  }
  const avgFingertipZ = totalFingertipZ / FINGERTIP_INDICES.length;

  // If fingertips are significantly further from camera than wrist,
  // the back of the hand is likely facing the camera.
  return (avgFingertipZ - wristZ) > BACK_OF_HAND_Z_THRESHOLD;
}

/**
 * Determine handedness from landmark x-positions (fallback).
 *
 * For a left hand with palm facing camera:
 *   - Thumb (4) is on the RIGHT side of the image (higher x)
 *   - Pinky (20) is on the LEFT side (lower x)
 *
 * For a right hand with palm facing camera:
 *   - Thumb (4) is on the LEFT side (lower x)
 *   - Pinky (20) is on the RIGHT side (higher x)
 */
function detectHandednessFromLandmarks(landmarks: NormalizedLandmark[]): 'Left' | 'Right' {
  const thumbX = landmarks[THUMB_TIP_INDEX].x;
  const pinkyX = landmarks[PINKY_TIP_INDEX].x;

  // If thumb x > pinky x, thumb is on right side of image -> Left hand
  return thumbX > pinkyX ? 'Left' : 'Right';
}

/**
 * Calculate confidence for landmark-based detection.
 * Based on how far apart thumb and pinky are (more separation = more confidence).
 */
function calculateFallbackConfidence(landmarks: NormalizedLandmark[]): number {
  const thumbX = landmarks[THUMB_TIP_INDEX].x;
  const pinkyX = landmarks[PINKY_TIP_INDEX].x;
  const separation = Math.abs(thumbX - pinkyX);

  // Scale: separation of 0.4+ => full confidence (0.5 max for fallback)
  // separation near 0 => low confidence
  const rawConfidence = Math.min(separation / 0.4, 1.0) * FALLBACK_CONFIDENCE;
  return Math.max(0.1, rawConfidence); // minimum 0.1 if we have landmarks
}

/**
 * Detect hand orientation (left/right hand) and palm facing direction.
 *
 * @param landmarks - 21 MediaPipe hand landmarks in normalized [0,1] coordinates, or null
 * @param mediapipeHandedness - Optional MediaPipe handedness result with score and label
 * @returns HandOrientation with handedness, confidence, and back-of-hand flag
 */
export function detectHandOrientation(
  landmarks: NormalizedLandmark[] | null,
  mediapipeHandedness?: MediaPipeHandedness
): HandOrientation {
  // Default response for null/invalid input
  if (!landmarks || landmarks.length < REQUIRED_LANDMARKS) {
    return {
      handedness: 'Right',
      confidence: 0,
      isBackOfHand: false,
    };
  }

  // Detect back of hand from z-axis
  const isBackOfHand = detectBackOfHand(landmarks);

  // Primary path: use MediaPipe handedness if confidence is sufficient
  if (
    mediapipeHandedness &&
    mediapipeHandedness.score >= MEDIAPIPE_CONFIDENCE_FLOOR
  ) {
    return {
      handedness: mediapipeHandedness.label,
      confidence: mediapipeHandedness.score,
      isBackOfHand,
    };
  }

  // Fallback path: derive from landmark positions
  const handedness = detectHandednessFromLandmarks(landmarks);
  const confidence = calculateFallbackConfidence(landmarks);

  return {
    handedness,
    confidence,
    isBackOfHand,
  };
}
