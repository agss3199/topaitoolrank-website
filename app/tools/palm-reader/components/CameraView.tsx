'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { cls } from '../../lib/css-module-safe';
import styles from '../styles/camera.module.css';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  MIN_DETECTION_CONFIDENCE,
  CENTER_RANGE_MIN,
  CENTER_RANGE_MAX,
  STABILITY_DELTA_THRESHOLD,
  DETECTION_STABILITY_FRAMES,
  MOVEMENT_STABILITY_FRAMES,
  CAPTURE_DELAY_MS,
  FINAL_VALIDATION_MS,
  ACCEPTABLE_HAND_ROTATION,
  PALM_CENTER_LANDMARK_INDEX,
  MAX_NUM_HANDS,
  MODEL_COMPLEXITY,
  LANDMARK_COLOR,
  CONNECTION_COLOR,
  LANDMARK_LINE_WIDTH,
  CONNECTION_LINE_WIDTH,
  STATUS_MESSAGES,
  CONFIDENCE_THRESHOLD,
  MIN_VISIBLE_LINES,
} from '../lib/camera-constants';
import PalmOverlay from './PalmOverlay';
import { determineOverlayState } from '../lib/capture-state';
import type { OverlayState } from '../lib/capture-state';
import { validateHandShape, resetSmoothing } from '../lib/hand-shape-validator';
import { detectHandOrientation } from '../lib/hand-orientation-detector';
import { detectPalmLines } from '../lib/palm-line-detector';

export interface CameraViewProps {
  onCapture: (image: string) => Promise<void>;
  onHome: () => void;
}

interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
}

export default function CameraView({ onCapture, onHome }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraRef = useRef<{ stop: () => void } | null>(null);
  const captureAttemptsRef = useRef(0);

  // Pre-capture final validation state
  const stabilityAngleRef = useRef<number | null>(null);
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [quality, setQuality] = useState(0);
  const [status, setStatus] = useState<string>(STATUS_MESSAGES.LOADING);
  const [isHandCentered, setIsHandCentered] = useState(false);
  const [isHandStable, setIsHandStable] = useState(false);

  // PalmOverlay state
  const [currentLandmarks, setCurrentLandmarks] = useState<NormalizedLandmark[] | null>(null);
  const [overlayState, setOverlayState] = useState<OverlayState>('red');
  const [stableFrameCount, setStableFrameCount] = useState(0);

  // Two-tier stability state
  const [detectionFrameCount, setDetectionFrameCount] = useState(0);

  // Detector outputs
  const [handedness, setHandedness] = useState<'Left' | 'Right'>('Right');
  const [visibleLineCount, setVisibleLineCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  /**
   * Compute palm rotation angle from landmarks.
   * Uses vector from wrist (0) to middle finger base (9) to estimate palm angle.
   */
  const computePalmAngle = (landmarks: NormalizedLandmark[]): number => {
    if (landmarks.length < 10) return 0;
    const wrist = landmarks[0];
    const middleBase = landmarks[9];
    const dx = middleBase.x - wrist.x;
    const dy = middleBase.y - wrist.y;
    return Math.atan2(dy, dx) * (180 / Math.PI);
  };

  const handleCapture = useCallback(
    (canvas: HTMLCanvasElement) => {
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      onCapture(imageData);
    },
    [onCapture]
  );

  useEffect(() => {
    let cancelled = false;
    let lastLandmarks: NormalizedLandmark[] | null = null;

    // Two-tier stability counters (mutable refs for the callback closure)
    let detectionCounter = 0;
    let movementCounter = 0;

    captureAttemptsRef.current = 0;

    // Reset hand shape smoothing buffer on mount
    resetSmoothing();

    async function initCamera() {
      try {
        const { Hands, HAND_CONNECTIONS } = await import('@mediapipe/hands');
        const { Camera } = await import('@mediapipe/camera_utils');
        const { drawConnectors, drawLandmarks } = await import(
          '@mediapipe/drawing_utils'
        );

        if (cancelled) return;

        const hands = new Hands({
          locateFile: (file: string) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        hands.setOptions({
          maxNumHands: MAX_NUM_HANDS,
          modelComplexity: MODEL_COMPLEXITY,
          minDetectionConfidence: MIN_DETECTION_CONFIDENCE,
        });

        hands.onResults((results: {
          image: CanvasImageSource;
          multiHandLandmarks?: NormalizedLandmark[][];
          multiHandedness?: Array<{ score: number; label: string }>;
        }) => {
          const canvas = canvasRef.current;
          if (!canvas || cancelled) return;

          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

          const landmarks = results.multiHandLandmarks?.[0];

          if (landmarks && landmarks.length > 0) {
            // Draw hand visualization
            try {
              drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {
                color: CONNECTION_COLOR,
                lineWidth: CONNECTION_LINE_WIDTH,
              });
              drawLandmarks(ctx, landmarks, {
                color: LANDMARK_COLOR,
                lineWidth: LANDMARK_LINE_WIDTH,
              });
            } catch (e) {
              // Drawing errors are non-fatal; skip frame visualization
            }

            // --- Tier 1: Detection stability ---
            // Increment detection counter every frame hand is visible (cap at threshold)
            detectionCounter = Math.min(detectionCounter + 1, DETECTION_STABILITY_FRAMES);
            const detectionStable = detectionCounter >= DETECTION_STABILITY_FRAMES;

            // --- Tier 2: Movement stability ---
            // Only start counting movement once detection is stable
            let currentlyStable = false;
            if (lastLandmarks && detectionStable) {
              let totalDelta = 0;
              for (let i = 0; i < landmarks.length; i++) {
                totalDelta += Math.abs(landmarks[i].x - lastLandmarks[i].x);
                totalDelta += Math.abs(landmarks[i].y - lastLandmarks[i].y);
              }
              currentlyStable = totalDelta < STABILITY_DELTA_THRESHOLD;

              if (currentlyStable) {
                movementCounter = Math.min(movementCounter + 1, MOVEMENT_STABILITY_FRAMES);
              } else {
                movementCounter = 0;
              }
            } else if (!detectionStable) {
              // Keep movement counter at 0 until detection is stable
              movementCounter = 0;
              currentlyStable = false;
            }

            const movementStable = movementCounter >= MOVEMENT_STABILITY_FRAMES;
            const readyForCapture = detectionStable && movementStable;

            // --- Run all detectors ---

            // Hand shape validation (Feature 2)
            const handShape = validateHandShape(landmarks);

            // Hand orientation detection (Feature 3)
            const mediapipeHandedness = results.multiHandedness?.[0];
            const orientation = detectHandOrientation(
              landmarks,
              mediapipeHandedness
                ? { score: mediapipeHandedness.score, label: mediapipeHandedness.label as 'Left' | 'Right' }
                : undefined
            );

            // Palm line visibility detection (Feature 4)
            const lineVisibility = detectPalmLines(landmarks);

            // Centering check
            const palmCenter = landmarks[PALM_CENTER_LANDMARK_INDEX];
            const centered =
              palmCenter.x > CENTER_RANGE_MIN &&
              palmCenter.x < CENTER_RANGE_MAX &&
              palmCenter.y > CENTER_RANGE_MIN &&
              palmCenter.y < CENTER_RANGE_MAX;

            // Quality score: handedness confidence * 100
            const confidence = results.multiHandedness?.[0]?.score ?? 0;
            const qScore = confidence * 100;

            // --- Update React state ---
            setQuality(qScore);
            setIsHandCentered(centered);
            setIsHandStable(currentlyStable);
            setCurrentLandmarks(landmarks);
            setDetectionFrameCount(detectionCounter);
            setStableFrameCount(movementCounter);
            setIsOpen(handShape.isOpen);
            setHandedness(orientation.handedness);
            setVisibleLineCount(lineVisibility.visibleLines);

            // Compute overlay color state with real detector outputs
            const computedOverlay = determineOverlayState({
              hasHand: true,
              centered,
              quality: qScore,
              stableFrames: movementCounter,
              isOpen: handShape.isOpen,
              visibleLines: lineVisibility.visibleLines,
            });
            setOverlayState(computedOverlay);

            // --- Status determination with two-tier messaging ---
            if (!centered) {
              setStatus(STATUS_MESSAGES.NOT_CENTERED);
            } else if (qScore < CONFIDENCE_THRESHOLD * 100) {
              setStatus(STATUS_MESSAGES.LOW_QUALITY);
            } else if (!handShape.isOpen) {
              setStatus(STATUS_MESSAGES.OPEN_PALM);
            } else if (lineVisibility.visibleLines < MIN_VISIBLE_LINES) {
              setStatus(STATUS_MESSAGES.SHOW_PALM_LINES);
            } else if (orientation.isBackOfHand) {
              setStatus(STATUS_MESSAGES.ROTATE_HAND);
            } else if (!detectionStable) {
              // Tier 1: still detecting hand
              setStatus(STATUS_MESSAGES.DETECTING_HAND);
            } else if (
              readyForCapture &&
              captureAttemptsRef.current === 0
            ) {
              // Both tiers complete: store angle and do final validation
              setStatus(STATUS_MESSAGES.CAPTURING);
              captureAttemptsRef.current = 1;
              stabilityAngleRef.current = computePalmAngle(landmarks);

              // Final validation after FINAL_VALIDATION_MS
              if (validationTimeoutRef.current) {
                clearTimeout(validationTimeoutRef.current);
              }
              validationTimeoutRef.current = setTimeout(() => {
                if (!cancelled && canvasRef.current && landmarks) {
                  const currentAngle = computePalmAngle(landmarks);
                  const angleDelta = Math.abs(
                    currentAngle - (stabilityAngleRef.current ?? currentAngle)
                  );

                  // Check all validation criteria
                  const centerValid = isHandCentered;
                  const fingersValid = visibleLineCount >= MIN_VISIBLE_LINES;
                  const rotationValid = angleDelta <= ACCEPTABLE_HAND_ROTATION;
                  const qualityValid = quality >= CONFIDENCE_THRESHOLD * 100;

                  if (centerValid && fingersValid && rotationValid && qualityValid) {
                    // Validation passed: capture
                    handleCapture(canvasRef.current);
                  } else {
                    // Validation failed: reset and try again
                    captureAttemptsRef.current = 0;
                    setStatus(STATUS_MESSAGES.DETECTING_HAND);
                    stabilityAngleRef.current = null;
                  }
                }
              }, FINAL_VALIDATION_MS);
            } else {
              // Tier 2: accumulating movement stability
              setStatus(`${STATUS_MESSAGES.HOLD_STEADY} ${movementCounter}/${MOVEMENT_STABILITY_FRAMES}`);
            }

            lastLandmarks = landmarks;
          } else {
            // No hand detected — reset everything
            setStatus(STATUS_MESSAGES.NO_HAND);
            setQuality(0);
            setIsHandCentered(false);
            setIsHandStable(false);
            setCurrentLandmarks(null);
            setOverlayState('red');
            setStableFrameCount(0);
            setDetectionFrameCount(0);
            setIsOpen(false);
            setVisibleLineCount(0);
            lastLandmarks = null;
            detectionCounter = 0;
            movementCounter = 0;
            captureAttemptsRef.current = 0;
          }
        });

        const video = videoRef.current;
        if (video && !cancelled) {
          const camera = new Camera(video, {
            onFrame: async () => {
              await hands.send({ image: video });
            },
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
          });

          camera.start();
          cameraRef.current = camera;
        }
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        setStatus(`${STATUS_MESSAGES.CAMERA_ERROR}: ${message}`);
      }
    }

    initCamera();

    return () => {
      cancelled = true;
      if (cameraRef.current) {
        cameraRef.current.stop();
        cameraRef.current = null;
      }
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
        validationTimeoutRef.current = null;
      }
    };
  }, [handleCapture]);

  const containerClasses = overlayState === 'green'
    ? `${cls(styles, 'container')} ${cls(styles, 'pulsing')}`
    : cls(styles, 'container');

  return (
    <div className={containerClasses}>
      <video
        ref={videoRef}
        className={cls(styles, 'video')}
        playsInline
        autoPlay
        muted
      />
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className={cls(styles, 'canvas')}
      />

      {/* Palm alignment overlay — hand skeleton + color-coded readiness */}
      <PalmOverlay
        landmarks={currentLandmarks}
        overlayState={overlayState}
        stableFrames={stableFrameCount}
        canvasWidth={CANVAS_WIDTH}
        canvasHeight={CANVAS_HEIGHT}
        detectionFrames={detectionFrameCount}
        handedness={handedness}
        visibleLines={visibleLineCount}
      />

      {/* Overlay */}
      <div className={cls(styles, 'overlay')}>
        {/* Quality + Status (top-left) */}
        <div className={cls(styles, 'quality-block')}>
          <p className={cls(styles, 'quality-text')}>
            Quality: {quality.toFixed(0)}%
          </p>
          <p className={cls(styles, 'status-text')}>
            {status}
          </p>
        </div>

        {/* Home button (bottom-left) */}
        <div className={cls(styles, 'controls')}>
          <button
            onClick={onHome}
            type="button"
            className={cls(styles, 'home-button')}
          >
            Home
          </button>
        </div>
      </div>
    </div>
  );
}
