/**
 * Camera and hand detection constants for the Palm Reader tool.
 * Extracted to avoid magic numbers in component logic.
 */

/** Canvas resolution */
export const CANVAS_WIDTH = 640;
export const CANVAS_HEIGHT = 480;

/** Hand detection confidence threshold (0-1). Triggers quality scoring. */
export const MIN_DETECTION_CONFIDENCE = 0.7;

/** Quality threshold (0-100%). Below this, "Better lighting needed" status shown. */
export const QUALITY_THRESHOLD = 60;

/** Confidence threshold (0-1) for auto-capture readiness. Maps to 85% quality. */
export const CONFIDENCE_THRESHOLD = 0.85;

/** Center range for palm position. Palm must be within [MIN, MAX] on both axes. */
export const CENTER_RANGE_MIN = 0.25;
export const CENTER_RANGE_MAX = 0.75;

/**
 * Stability delta threshold. Sum of absolute x+y deltas across all landmarks
 * must be below this value to count as "stable".
 */
export const STABILITY_DELTA_THRESHOLD = 4;

/**
 * Number of consecutive stable frames required before auto-capture triggers.
 * At ~30fps, 60 frames = ~2 seconds of holding still. Ensures palm is stable
 * enough for Gemini to identify palm lines accurately.
 */
export const STABLE_FRAMES_REQUIRED = 60;

/** Delay (ms) between "Ready!" status and actual capture callback. */
export const CAPTURE_DELAY_MS = 300;

/** Landmark index used as palm center reference (middle finger MCP joint). */
export const PALM_CENTER_LANDMARK_INDEX = 9;

/** Max hands to detect simultaneously. */
export const MAX_NUM_HANDS = 1;

/** MediaPipe model complexity (0=lite, 1=full). */
export const MODEL_COMPLEXITY = 1;

/** Hand visualization colors */
export const LANDMARK_COLOR = '#ff0000';
export const CONNECTION_COLOR = '#00ff00';
export const LANDMARK_LINE_WIDTH = 1;
export const CONNECTION_LINE_WIDTH = 2;

/** Status messages */
export const STATUS_MESSAGES = {
  LOADING: 'Loading...',
  NO_HAND: 'Point palm at camera',
  NOT_CENTERED: 'Move palm to center',
  LOW_QUALITY: 'Better lighting needed',
  HOLD_STEADY: 'Hold steady...',
  CAPTURING: '✅ Ready! Capturing...',
  CAMERA_ERROR: 'Camera error',
} as const;
