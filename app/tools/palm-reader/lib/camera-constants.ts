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
export const STABILITY_DELTA_THRESHOLD = 12;

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

/** Hand shape validation — openness score thresholds */
export const HAND_OPENNESS_THRESHOLD = 1.1;
export const HAND_OPENNESS_PARTIAL = 0.9;

/** Number of frames to average for openness score smoothing */
export const OPENNESS_FRAME_SMOOTHING = 5;

/** Two-tier stability: detection stability (hand consistently visible) */
export const DETECTION_STABILITY_FRAMES = 15;

/** Two-tier stability: movement stability (hand stopped moving) */
export const MOVEMENT_STABILITY_FRAMES = 40;

/** Palm line visibility thresholds */
export const MIN_VISIBLE_LINES = 2;
export const MAX_VISIBLE_LINES = 5;

/** Overlay color palette for capture readiness */
export const COLOR_RED = '#FF0000';
export const COLOR_YELLOW = '#FFFF00';
export const COLOR_GREEN = '#00FF00';

/** Smooth CSS transition duration (ms) for overlay color changes */
export const COLOR_TRANSITION_MS = 300;

/** Maximum acceptable hand rotation in degrees before capture blocked */
export const ACCEPTABLE_HAND_ROTATION = 5;

/** Hand skeleton rendering — landmark circle radius */
export const LANDMARK_RADIUS = 4;

/** Hand skeleton rendering — boundary ring radius as fraction of canvas size */
export const BOUNDARY_RING_RADIUS_FRACTION = 0.35;

/** Pre-capture validation time in ms (final check before capture triggers) */
export const FINAL_VALIDATION_MS = 200;

/** Status messages */
export const STATUS_MESSAGES = {
  LOADING: 'Loading...',
  NO_HAND: 'Point palm at camera',
  NOT_CENTERED: 'Move palm to center',
  LOW_QUALITY: 'Better lighting needed',
  DETECTING_HAND: 'Detecting hand...',
  HOLD_STEADY: 'Hold steady...',
  CAPTURING: 'Ready! Capturing...',
  OPEN_PALM: 'Open your palm',
  SHOW_PALM_LINES: 'Show more of palm',
  ROTATE_HAND: 'Rotate hand to show palm',
  CAMERA_ERROR: 'Camera error',
} as const;
