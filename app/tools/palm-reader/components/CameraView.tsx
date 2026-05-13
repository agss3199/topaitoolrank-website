'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { cls } from '../../lib/css-module-safe';
import styles from '../styles/camera.module.css';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  MIN_DETECTION_CONFIDENCE,
  QUALITY_THRESHOLD,
  CENTER_RANGE_MIN,
  CENTER_RANGE_MAX,
  STABILITY_DELTA_THRESHOLD,
  STABLE_FRAMES_REQUIRED,
  CAPTURE_DELAY_MS,
  PALM_CENTER_LANDMARK_INDEX,
  MAX_NUM_HANDS,
  MODEL_COMPLEXITY,
  LANDMARK_COLOR,
  CONNECTION_COLOR,
  LANDMARK_LINE_WIDTH,
  CONNECTION_LINE_WIDTH,
  STATUS_MESSAGES,
} from '../lib/camera-constants';

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

  const [quality, setQuality] = useState(0);
  const [status, setStatus] = useState<string>(STATUS_MESSAGES.LOADING);
  const [isHandCentered, setIsHandCentered] = useState(false);
  const [isHandStable, setIsHandStable] = useState(false);

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
    let stableCounter = 0;
    captureAttemptsRef.current = 0;

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

            // Stability check
            let currentlyStable = false;
            if (lastLandmarks) {
              let totalDelta = 0;
              for (let i = 0; i < landmarks.length; i++) {
                totalDelta += Math.abs(landmarks[i].x - lastLandmarks[i].x);
                totalDelta += Math.abs(landmarks[i].y - lastLandmarks[i].y);
              }
              currentlyStable = totalDelta < STABILITY_DELTA_THRESHOLD;

              if (currentlyStable) {
                stableCounter++;
              } else {
                stableCounter = 0;
              }
            }

            // Centering check
            const palmCenter = landmarks[PALM_CENTER_LANDMARK_INDEX];
            const centered =
              palmCenter.x > CENTER_RANGE_MIN &&
              palmCenter.x < CENTER_RANGE_MAX &&
              palmCenter.y > CENTER_RANGE_MIN &&
              palmCenter.y < CENTER_RANGE_MAX;

            // Quality score: handedness confidence * 100 (matches source app)
            const confidence = results.multiHandedness?.[0]?.score ?? 0;
            const qScore = confidence * 100;

            setQuality(qScore);
            setIsHandCentered(centered);
            setIsHandStable(currentlyStable);

            // Status determination
            if (!centered) {
              setStatus(STATUS_MESSAGES.NOT_CENTERED);
            } else if (qScore < CONFIDENCE_THRESHOLD * 100) {
              setStatus(STATUS_MESSAGES.LOW_QUALITY);
            } else if (
              stableCounter > STABLE_FRAMES_REQUIRED &&
              captureAttemptsRef.current === 0
            ) {
              setStatus(STATUS_MESSAGES.CAPTURING);
              captureAttemptsRef.current = 1;
              setTimeout(() => {
                if (!cancelled && canvasRef.current) {
                  handleCapture(canvasRef.current);
                }
              }, CAPTURE_DELAY_MS);
            } else {
              setStatus(STATUS_MESSAGES.HOLD_STEADY);
            }

            lastLandmarks = landmarks;
          } else {
            // No hand detected
            setStatus(STATUS_MESSAGES.NO_HAND);
            setQuality(0);
            setIsHandCentered(false);
            setIsHandStable(false);
            lastLandmarks = null;
            stableCounter = 0;
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
    };
  }, [handleCapture]);

  return (
    <div className={cls(styles, 'container')}>
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
