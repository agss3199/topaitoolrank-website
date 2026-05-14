/**
 * Overlay color-state logic for palm reader capture UX.
 *
 * Determines the visual state (RED / YELLOW / GREEN) based on
 * all capture-readiness conditions defined in the spec
 * (Feature 1, lines 59-73 of palm-reader-capture-ux.md).
 *
 * RED:    One or more mandatory conditions NOT met.
 * YELLOW: All conditions met, but stability frames still accumulating.
 * GREEN:  ALL conditions met — capture ready.
 */

import {
  CONFIDENCE_THRESHOLD,
  MOVEMENT_STABILITY_FRAMES,
  MIN_VISIBLE_LINES,
} from './camera-constants';

export type OverlayState = 'red' | 'yellow' | 'green';

export interface OverlayStateParams {
  /** Whether a hand is detected in the current frame */
  hasHand: boolean;
  /** Whether the palm center is within the center zone */
  centered: boolean;
  /** Detection quality score (0-100) from MediaPipe confidence */
  quality: number;
  /** Consecutive frames the hand has been stable (movement delta below threshold) */
  stableFrames: number;
  /** Whether the hand is open (palm visible, not a fist) */
  isOpen: boolean;
  /** Number of palm lines estimated visible (0-5) */
  visibleLines: number;
}

/**
 * Determine the overlay color state from capture conditions.
 *
 * Priority order:
 * 1. If ANY mandatory condition fails -> RED
 * 2. If all mandatory conditions pass but stableFrames < threshold -> YELLOW
 * 3. If everything passes -> GREEN
 */
export function determineOverlayState(params: OverlayStateParams): OverlayState {
  const { hasHand, centered, quality, stableFrames, isOpen, visibleLines } = params;

  // Mandatory conditions — any failure is RED
  const mandatoryMet =
    hasHand &&
    centered &&
    quality >= CONFIDENCE_THRESHOLD * 100 &&
    isOpen &&
    visibleLines >= MIN_VISIBLE_LINES;

  if (!mandatoryMet) {
    return 'red';
  }

  // Stability accumulation — waiting is YELLOW
  if (stableFrames < MOVEMENT_STABILITY_FRAMES) {
    return 'yellow';
  }

  // All conditions met — GREEN
  return 'green';
}
