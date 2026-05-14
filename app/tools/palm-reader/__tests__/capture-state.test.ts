import { describe, it, expect } from 'vitest';
import { determineOverlayState } from '../lib/capture-state';
import type { OverlayState } from '../lib/capture-state';
import {
  MOVEMENT_STABILITY_FRAMES,
  MIN_VISIBLE_LINES,
  CONFIDENCE_THRESHOLD,
} from '../lib/camera-constants';

/**
 * Tests for determineOverlayState — the color state function.
 *
 * State machine:
 *   RED    = any mandatory condition fails
 *   YELLOW = all conditions met except stable frame count still accumulating
 *   GREEN  = ALL conditions met (hand detected, centered, quality >= 85%,
 *            stableFrames >= MOVEMENT_STABILITY_FRAMES, hand open, lines visible)
 */

describe('determineOverlayState', () => {
  // Helper: all conditions met (GREEN)
  const greenParams = {
    hasHand: true,
    centered: true,
    quality: 90,
    stableFrames: MOVEMENT_STABILITY_FRAMES,
    isOpen: true,
    visibleLines: MIN_VISIBLE_LINES,
  };

  // ─── RED states: any single condition failing ───

  it('returns red when no hand detected', () => {
    const result: OverlayState = determineOverlayState({
      ...greenParams,
      hasHand: false,
    });
    expect(result).toBe('red');
  });

  it('returns red when hand not centered', () => {
    const result = determineOverlayState({
      ...greenParams,
      centered: false,
    });
    expect(result).toBe('red');
  });

  it('returns red when quality below confidence threshold', () => {
    const result = determineOverlayState({
      ...greenParams,
      quality: (CONFIDENCE_THRESHOLD * 100) - 1, // 84
    });
    expect(result).toBe('red');
  });

  it('returns red when hand is closed (not open)', () => {
    const result = determineOverlayState({
      ...greenParams,
      isOpen: false,
    });
    expect(result).toBe('red');
  });

  it('returns red when too few lines visible', () => {
    const result = determineOverlayState({
      ...greenParams,
      visibleLines: MIN_VISIBLE_LINES - 1, // 3
    });
    expect(result).toBe('red');
  });

  // ─── YELLOW state: all conditions met except stability still accumulating ───

  it('returns yellow when all conditions met but stableFrames below threshold', () => {
    const result = determineOverlayState({
      ...greenParams,
      stableFrames: MOVEMENT_STABILITY_FRAMES - 1, // 59
    });
    expect(result).toBe('yellow');
  });

  it('returns yellow when stableFrames is 0 but all other conditions met', () => {
    const result = determineOverlayState({
      ...greenParams,
      stableFrames: 0,
    });
    expect(result).toBe('yellow');
  });

  it('returns yellow at half the stability threshold', () => {
    const result = determineOverlayState({
      ...greenParams,
      stableFrames: Math.floor(MOVEMENT_STABILITY_FRAMES / 2),
    });
    expect(result).toBe('yellow');
  });

  // ─── GREEN state: all conditions fully met ───

  it('returns green when all conditions met exactly at threshold', () => {
    const result = determineOverlayState(greenParams);
    expect(result).toBe('green');
  });

  it('returns green when stableFrames exceeds threshold', () => {
    const result = determineOverlayState({
      ...greenParams,
      stableFrames: MOVEMENT_STABILITY_FRAMES + 100,
    });
    expect(result).toBe('green');
  });

  it('returns green when quality is well above threshold', () => {
    const result = determineOverlayState({
      ...greenParams,
      quality: 100,
    });
    expect(result).toBe('green');
  });

  it('returns green when all 5 lines visible', () => {
    const result = determineOverlayState({
      ...greenParams,
      visibleLines: 5,
    });
    expect(result).toBe('green');
  });

  // ─── Priority: RED overrides YELLOW ───

  it('returns red (not yellow) when multiple conditions fail', () => {
    const result = determineOverlayState({
      hasHand: true,
      centered: false,
      quality: 50,
      stableFrames: 10,
      isOpen: false,
      visibleLines: 2,
    });
    expect(result).toBe('red');
  });

  it('returns red when hand missing regardless of other params', () => {
    const result = determineOverlayState({
      hasHand: false,
      centered: true,
      quality: 100,
      stableFrames: 200,
      isOpen: true,
      visibleLines: 5,
    });
    expect(result).toBe('red');
  });

  // ─── Edge cases ───

  it('returns green when quality is exactly at confidence threshold boundary', () => {
    const result = determineOverlayState({
      ...greenParams,
      quality: CONFIDENCE_THRESHOLD * 100, // 85
    });
    expect(result).toBe('green');
  });

  it('returns green when visibleLines is exactly MIN_VISIBLE_LINES', () => {
    const result = determineOverlayState({
      ...greenParams,
      visibleLines: MIN_VISIBLE_LINES,
    });
    expect(result).toBe('green');
  });

  it('handles zero quality as red', () => {
    const result = determineOverlayState({
      ...greenParams,
      quality: 0,
    });
    expect(result).toBe('red');
  });

  it('handles negative stableFrames as yellow (not green)', () => {
    const result = determineOverlayState({
      ...greenParams,
      stableFrames: -1,
    });
    expect(result).toBe('yellow');
  });
});
