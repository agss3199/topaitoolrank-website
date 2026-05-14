'use client';

import type { OverlayState } from '../lib/capture-state';
import {
  COLOR_RED,
  COLOR_YELLOW,
  COLOR_GREEN,
  COLOR_TRANSITION_MS,
  LANDMARK_RADIUS,
  BOUNDARY_RING_RADIUS_FRACTION,
  DETECTION_STABILITY_FRAMES,
  MOVEMENT_STABILITY_FRAMES,
} from '../lib/camera-constants';

/**
 * MediaPipe hand skeleton connections.
 * Each pair [from, to] defines a line between two landmark indices.
 * 21 connections covering thumb, index, middle, ring, pinky chains + palm base.
 */
const HAND_CONNECTIONS: ReadonlyArray<readonly [number, number]> = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index finger
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle finger
  [5, 9], [9, 10], [10, 11], [11, 12],
  // Ring finger
  [9, 13], [13, 14], [14, 15], [15, 16],
  // Pinky
  [13, 17], [17, 18], [18, 19], [19, 20],
  // Palm base
  [0, 17],
];

interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
}

export interface PalmOverlayProps {
  /** 21 MediaPipe hand landmarks in normalized [0,1] coordinates, or null if no hand */
  landmarks: NormalizedLandmark[] | null;
  /** Current overlay color state from determineOverlayState */
  overlayState: OverlayState;
  /** Consecutive stable frames for movement progress display */
  stableFrames: number;
  /** Canvas width in pixels for coordinate mapping */
  canvasWidth: number;
  /** Canvas height in pixels for coordinate mapping */
  canvasHeight: number;
  /** Detection stability frame count (Tier 1, 0-20) */
  detectionFrames?: number;
  /** Detected handedness label */
  handedness?: 'Left' | 'Right';
  /** Number of visible palm lines (0-5) */
  visibleLines?: number;
}

/** Map overlay state to its corresponding color hex value */
function stateToColor(state: OverlayState): string {
  switch (state) {
    case 'red': return COLOR_RED;
    case 'yellow': return COLOR_YELLOW;
    case 'green': return COLOR_GREEN;
  }
}

/**
 * PalmOverlay — renders a hand skeleton overlay with color-coded capture readiness.
 *
 * Spec: Feature 1 (palm-reader-capture-ux.md lines 42-87)
 *
 * Visual elements:
 * - 21 landmark circles positioned at hand joint locations
 * - Connection lines forming the hand skeleton
 * - Boundary ring showing the center zone
 * - Two-tier progress text showing detection and movement stability
 * - Handedness badge and line visibility count
 *
 * The SVG is absolutely positioned over the camera canvas with pointer-events: none
 * so it does not block user interaction with the camera view.
 */
export default function PalmOverlay({
  landmarks,
  overlayState,
  stableFrames,
  canvasWidth,
  canvasHeight,
  detectionFrames,
  handedness,
  visibleLines,
}: PalmOverlayProps) {
  const color = stateToColor(overlayState);
  const hasLandmarks = landmarks && landmarks.length > 0;

  const ringRadius = Math.min(canvasWidth, canvasHeight) * BOUNDARY_RING_RADIUS_FRACTION;
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;

  // Determine which tier of progress to show
  const detectionComplete = (detectionFrames ?? 0) >= DETECTION_STABILITY_FRAMES;

  return (
    <svg
      viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        transition: `fill ${COLOR_TRANSITION_MS}ms ease, stroke ${COLOR_TRANSITION_MS}ms ease`,
      }}
      aria-label="Palm alignment overlay — shows hand skeleton and capture readiness"
    >
      {/* Boundary ring — center zone indicator */}
      <circle
        className="boundary-ring"
        cx={centerX}
        cy={centerY}
        r={ringRadius}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeDasharray="8 4"
        opacity={0.6}
      />

      {/* Hand skeleton: connection lines */}
      {hasLandmarks && HAND_CONNECTIONS.map(([from, to]) => {
        const fromLm = landmarks[from];
        const toLm = landmarks[to];
        if (!fromLm || !toLm) return null;
        return (
          <line
            key={`${from}-${to}`}
            className="connection"
            x1={fromLm.x * canvasWidth}
            y1={fromLm.y * canvasHeight}
            x2={toLm.x * canvasWidth}
            y2={toLm.y * canvasHeight}
            stroke={color}
            strokeWidth={2}
            opacity={0.7}
          />
        );
      })}

      {/* Hand skeleton: landmark circles */}
      {hasLandmarks && landmarks.map((lm, i) => (
        <circle
          key={i}
          className="landmark"
          cx={lm.x * canvasWidth}
          cy={lm.y * canvasHeight}
          r={LANDMARK_RADIUS}
          fill={color}
          opacity={0.9}
        />
      ))}

      {/* Handedness badge — top-right corner when hand detected */}
      {hasLandmarks && handedness && (
        <text
          className="handedness-badge"
          x={canvasWidth - 30}
          y={30}
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize={20}
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          fontWeight="bold"
          stroke="#000000"
          strokeWidth={0.5}
          aria-label={`${handedness} hand detected`}
        >
          {handedness === 'Left' ? 'L' : 'R'}
        </text>
      )}

      {/* Line visibility count — below handedness badge */}
      {hasLandmarks && visibleLines !== undefined && (
        <text
          className="line-count"
          x={canvasWidth - 30}
          y={55}
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize={13}
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          stroke="#000000"
          strokeWidth={0.3}
        >
          {visibleLines}/5
        </text>
      )}

      {/* Two-tier progress — shown during yellow state */}
      {overlayState === 'yellow' && (
        <text
          x={centerX}
          y={canvasHeight - 40}
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize={16}
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          stroke="#000000"
          strokeWidth={0.5}
        >
          {!detectionComplete
            ? `Detecting... ${detectionFrames ?? 0}/${DETECTION_STABILITY_FRAMES}`
            : `${stableFrames}/${MOVEMENT_STABILITY_FRAMES} frames stable`
          }
        </text>
      )}
    </svg>
  );
}
