import { describe, it, expect } from 'vitest';
import {
  DETECTION_STABILITY_FRAMES,
  MOVEMENT_STABILITY_FRAMES,
  STABILITY_DELTA_THRESHOLD,
} from '../lib/camera-constants';

/**
 * Two-tier stability validation tests — Todo 008.
 *
 * Spec: Feature 5 (palm-reader-capture-ux.md lines 240-283)
 *
 * Tier 1 (Detection): 20 consecutive frames with hand visible
 * Tier 2 (Movement):  60 consecutive frames with delta < 4px
 * Both must be satisfied before capture
 *
 * These tests validate the two-tier logic in isolation (same algorithm
 * used inside CameraView.onResults). The logic is extracted here to
 * verify correctness without needing to render the full component.
 */

/**
 * Simulate the two-tier stability state machine.
 * Mirrors the exact logic inside CameraView.useEffect.
 */
interface StabilityFrame {
  handDetected: boolean;
  movementDelta: number; // sum of absolute x+y deltas across landmarks
}

interface StabilityState {
  detectionCounter: number;
  movementCounter: number;
  detectionStable: boolean;
  movementStable: boolean;
  readyForCapture: boolean;
}

function simulateStability(frames: StabilityFrame[]): StabilityState {
  let detectionCounter = 0;
  let movementCounter = 0;

  for (const frame of frames) {
    if (!frame.handDetected) {
      // No hand: reset both counters
      detectionCounter = 0;
      movementCounter = 0;
      continue;
    }

    // Tier 1: increment detection (cap at threshold)
    detectionCounter = Math.min(detectionCounter + 1, DETECTION_STABILITY_FRAMES);
    const detectionStable = detectionCounter >= DETECTION_STABILITY_FRAMES;

    // Tier 2: only count movement once detection is stable
    if (detectionStable) {
      if (frame.movementDelta < STABILITY_DELTA_THRESHOLD) {
        movementCounter = Math.min(movementCounter + 1, MOVEMENT_STABILITY_FRAMES);
      } else {
        movementCounter = 0;
      }
    } else {
      movementCounter = 0;
    }
  }

  const detectionStable = detectionCounter >= DETECTION_STABILITY_FRAMES;
  const movementStable = movementCounter >= MOVEMENT_STABILITY_FRAMES;

  return {
    detectionCounter,
    movementCounter,
    detectionStable,
    movementStable,
    readyForCapture: detectionStable && movementStable,
  };
}

/** Helper: create N frames with hand detected and low movement */
function stableFrames(n: number): StabilityFrame[] {
  return Array.from({ length: n }, () => ({
    handDetected: true,
    movementDelta: 1, // well below 4px threshold
  }));
}

/** Helper: create N frames with hand detected and high movement */
function movingFrames(n: number): StabilityFrame[] {
  return Array.from({ length: n }, () => ({
    handDetected: true,
    movementDelta: 10, // well above 4px threshold
  }));
}

/** Helper: create N frames with no hand detected */
function noHandFrames(n: number): StabilityFrame[] {
  return Array.from({ length: n }, () => ({
    handDetected: false,
    movementDelta: 0,
  }));
}

describe('Two-tier stability validation', () => {
  // ─── Constants verification ───

  it('uses correct tier thresholds from spec', () => {
    expect(DETECTION_STABILITY_FRAMES).toBe(20);
    expect(MOVEMENT_STABILITY_FRAMES).toBe(60);
    expect(STABILITY_DELTA_THRESHOLD).toBe(4);
  });

  // ─── Tier 1: Detection stability ───

  describe('Tier 1: Detection stability', () => {
    it('increments detection counter on each frame with hand detected', () => {
      const result = simulateStability(stableFrames(10));
      expect(result.detectionCounter).toBe(10);
      expect(result.detectionStable).toBe(false);
    });

    it('reaches detection stable after exactly 20 frames', () => {
      const result = simulateStability(stableFrames(20));
      expect(result.detectionCounter).toBe(DETECTION_STABILITY_FRAMES);
      expect(result.detectionStable).toBe(true);
    });

    it('caps detection counter at threshold (does not exceed 20)', () => {
      const result = simulateStability(stableFrames(50));
      expect(result.detectionCounter).toBe(DETECTION_STABILITY_FRAMES);
    });

    it('resets detection counter when hand disappears', () => {
      const frames = [
        ...stableFrames(15),
        ...noHandFrames(1),
        ...stableFrames(5),
      ];
      const result = simulateStability(frames);
      // After 15 frames, reset, then 5 more = 5
      expect(result.detectionCounter).toBe(5);
      expect(result.detectionStable).toBe(false);
    });

    it('resets detection counter on every no-hand frame', () => {
      const frames = [
        ...stableFrames(19),
        ...noHandFrames(1),
      ];
      const result = simulateStability(frames);
      expect(result.detectionCounter).toBe(0);
      expect(result.detectionStable).toBe(false);
    });

    it('does not consider movement-only hand loss as detection reset', () => {
      // Hand is still detected but moving wildly — detection counter increments
      const frames = movingFrames(25);
      const result = simulateStability(frames);
      expect(result.detectionCounter).toBe(DETECTION_STABILITY_FRAMES);
      expect(result.detectionStable).toBe(true);
    });
  });

  // ─── Tier 2: Movement stability ───

  describe('Tier 2: Movement stability', () => {
    it('does not count movement frames before detection is stable', () => {
      // 10 stable frames: detection not yet met
      const result = simulateStability(stableFrames(10));
      expect(result.movementCounter).toBe(0);
      expect(result.movementStable).toBe(false);
    });

    it('starts counting movement after detection reaches 20', () => {
      // 25 stable frames: first 19 build detection (no movement),
      // frame 20 reaches detection threshold AND starts first movement count,
      // frames 21-25 add 5 more movement = 6 total
      const result = simulateStability(stableFrames(25));
      expect(result.detectionStable).toBe(true);
      expect(result.movementCounter).toBe(6);
      expect(result.movementStable).toBe(false);
    });

    it('reaches movement stable after 60 frames of stability (post-detection)', () => {
      // 20 detection + 60 movement = 80 total
      const result = simulateStability(stableFrames(80));
      expect(result.detectionStable).toBe(true);
      expect(result.movementCounter).toBe(MOVEMENT_STABILITY_FRAMES);
      expect(result.movementStable).toBe(true);
    });

    it('caps movement counter at threshold', () => {
      const result = simulateStability(stableFrames(100));
      expect(result.movementCounter).toBe(MOVEMENT_STABILITY_FRAMES);
    });

    it('resets movement counter on large delta (hand moves)', () => {
      const frames = [
        ...stableFrames(50), // 20 detection + 30 movement
        ...movingFrames(1),  // reset movement
        ...stableFrames(10), // 10 more movement
      ];
      const result = simulateStability(frames);
      expect(result.detectionStable).toBe(true);
      expect(result.movementCounter).toBe(10);
      expect(result.movementStable).toBe(false);
    });

    it('resets movement counter when hand disappears mid-stability', () => {
      const frames = [
        ...stableFrames(50),  // 20 detection + 31 movement (frame 20 counts for both)
        ...noHandFrames(1),   // reset both
        ...stableFrames(25),  // 20 detection again, frame 20 starts movement = 6 movement
      ];
      const result = simulateStability(frames);
      expect(result.detectionCounter).toBe(DETECTION_STABILITY_FRAMES);
      expect(result.movementCounter).toBe(6);
      expect(result.readyForCapture).toBe(false);
    });

    it('resets movement to 0 when movement exceeds threshold exactly at delta=4', () => {
      const frames = [
        ...stableFrames(25), // 20 det + 5 move
        { handDetected: true, movementDelta: STABILITY_DELTA_THRESHOLD }, // exactly at threshold = NOT stable
        ...stableFrames(3),
      ];
      const result = simulateStability(frames);
      expect(result.movementCounter).toBe(3);
    });

    it('counts frame as stable when delta is just below threshold', () => {
      const frames = [
        ...stableFrames(20), // detection (frame 20 also counts first movement)
        { handDetected: true, movementDelta: STABILITY_DELTA_THRESHOLD - 0.001 },
      ];
      const result = simulateStability(frames);
      // Frame 20 = first movement frame (from stableFrames), frame 21 = second
      expect(result.movementCounter).toBe(2);
    });
  });

  // ─── readyForCapture ───

  describe('readyForCapture', () => {
    it('is false when neither tier is stable', () => {
      const result = simulateStability(stableFrames(5));
      expect(result.readyForCapture).toBe(false);
    });

    it('is false when only detection is stable', () => {
      // 20 detection frames met, but 0 movement frames
      const frames = [
        ...stableFrames(20),
        ...movingFrames(10), // hand shaking — movement never accumulates
      ];
      const result = simulateStability(frames);
      expect(result.detectionStable).toBe(true);
      expect(result.movementStable).toBe(false);
      expect(result.readyForCapture).toBe(false);
    });

    it('is true when both tiers are complete (20 + 60 frames)', () => {
      const result = simulateStability(stableFrames(80));
      expect(result.readyForCapture).toBe(true);
    });

    it('returns to false after hand loss even if previously ready', () => {
      const frames = [
        ...stableFrames(80),  // ready
        ...noHandFrames(1),   // lost
      ];
      const result = simulateStability(frames);
      expect(result.readyForCapture).toBe(false);
    });

    it('returns to false after movement even if previously ready', () => {
      const frames = [
        ...stableFrames(80),  // ready
        ...movingFrames(1),   // moved
      ];
      const result = simulateStability(frames);
      // Detection stays stable (hand still detected), but movement resets
      expect(result.detectionStable).toBe(true);
      expect(result.movementStable).toBe(false);
      expect(result.readyForCapture).toBe(false);
    });

    it('can re-achieve readyForCapture after reset', () => {
      const frames = [
        ...stableFrames(80),  // ready
        ...movingFrames(1),   // movement lost
        ...stableFrames(60),  // 60 more stable movement frames
      ];
      const result = simulateStability(frames);
      expect(result.readyForCapture).toBe(true);
    });
  });

  // ─── Status message progression ───

  describe('status message progression', () => {
    it('detecting phase: 0-19 frames', () => {
      const result = simulateStability(stableFrames(10));
      expect(result.detectionStable).toBe(false);
      // Status should be "Detecting hand..." during this phase
    });

    it('hold steady phase: detection complete, movement accumulating', () => {
      const result = simulateStability(stableFrames(40));
      expect(result.detectionStable).toBe(true);
      expect(result.movementStable).toBe(false);
      // Status should be "Hold steady... 20/60"
    });

    it('ready phase: both tiers complete', () => {
      const result = simulateStability(stableFrames(80));
      expect(result.readyForCapture).toBe(true);
      // Status should be "Ready! Capturing..."
    });
  });

  // ─── Edge cases ───

  describe('edge cases', () => {
    it('handles empty frame array', () => {
      const result = simulateStability([]);
      expect(result.detectionCounter).toBe(0);
      expect(result.movementCounter).toBe(0);
      expect(result.readyForCapture).toBe(false);
    });

    it('handles single frame', () => {
      const result = simulateStability(stableFrames(1));
      expect(result.detectionCounter).toBe(1);
      expect(result.movementCounter).toBe(0);
    });

    it('handles alternating detection/no-detection', () => {
      const frames: StabilityFrame[] = [];
      for (let i = 0; i < 40; i++) {
        frames.push({
          handDetected: i % 2 === 0, // alternates
          movementDelta: 1,
        });
      }
      const result = simulateStability(frames);
      // Can never get past detectionCounter=1 because it resets every other frame
      expect(result.detectionStable).toBe(false);
    });

    it('handles zero movement delta (perfectly still)', () => {
      const frames = Array.from({ length: 80 }, () => ({
        handDetected: true,
        movementDelta: 0,
      }));
      const result = simulateStability(frames);
      expect(result.readyForCapture).toBe(true);
    });

    it('handles very large movement delta', () => {
      const frames = [
        ...stableFrames(20),
        { handDetected: true, movementDelta: 10000 },
        ...stableFrames(60),
      ];
      const result = simulateStability(frames);
      expect(result.readyForCapture).toBe(true);
    });
  });
});
