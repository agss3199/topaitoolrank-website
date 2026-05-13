'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createSSEManager } from '../lib/sse-manager';
import type { SSEManager } from '../lib/sse-manager';
import type { AgentStatus } from '../lib/types';

/**
 * GenerationState — the latest known state of the BMC generation pipeline.
 * Updated on every SSE 'progress' event from the server.
 */
export interface GenerationState {
  phase: number;
  activeAgent: string;
  progress: number;
  elapsedMs: number;
  tokensUsed: { input: number; output: number };
  costUSD: number;
  timestamp: string;
}

export interface UseSSEListenerReturn {
  state: GenerationState | null;
  error: string | null;
  isConnected: boolean;
  isComplete: boolean;
  completeData: unknown;
  lastHeartbeat: string | null;
  disconnect: () => void;
}

/**
 * useSSEListener — React hook wrapping SSEManager for real-time generation status.
 *
 * Connects to /stream/status on mount, auto-reconnects via SSEManager,
 * and exposes parsed GenerationState to the consuming component.
 *
 * @param sessionId - Session ID from /start response. Empty string skips connection.
 */
export function useSSEListener(sessionId: string): UseSSEListenerReturn {
  const sseRef = useRef<SSEManager | null>(null);
  const [state, setState] = useState<GenerationState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [completeData, setCompleteData] = useState<unknown>(null);
  const [lastHeartbeat, setLastHeartbeat] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const disconnect = useCallback(() => {
    sseRef.current?.disconnect();
  }, []);

  useEffect(() => {
    if (!sessionId) return;

    const sse = createSSEManager();
    sseRef.current = sse;

    const handleProgress = (event: { data?: unknown }) => {
      const data = event.data as AgentStatus | undefined;
      if (!data) return;

      setState({
        phase: data.phase,
        activeAgent: data.activeAgent,
        progress: data.progress,
        elapsedMs: data.elapsedMs,
        tokensUsed: data.tokensUsed,
        costUSD: data.costUSD,
        timestamp: data.timestamp,
      });

      // Sync connected state
      setIsConnected(sse.getState().connected);
    };

    const handleComplete = (event: { data?: unknown }) => {
      setIsComplete(true);
      setCompleteData(event.data ?? null);
    };

    const handleError = (event: { data?: unknown }) => {
      const data = event.data as { error?: string; message?: string } | undefined;

      if (data?.error === 'session_expired') {
        setError('Session expired. Please log in again.');
        return;
      }

      const message = data?.message || data?.error || 'Generation failed';
      setError(message);
    };

    const handleHeartbeat = () => {
      setLastHeartbeat(new Date().toISOString());
      setIsConnected(sse.getState().connected);
    };

    sse.on('progress', handleProgress);
    sse.on('complete', handleComplete);
    sse.on('error', handleError);
    sse.on('heartbeat', handleHeartbeat);

    sse.connect(sessionId);
    setIsConnected(sse.getState().connected);

    return () => {
      sse.off('progress', handleProgress);
      sse.off('complete', handleComplete);
      sse.off('error', handleError);
      sse.off('heartbeat', handleHeartbeat);
      sse.disconnect();
    };
  }, [sessionId]);

  return {
    state,
    error,
    isConnected,
    isComplete,
    completeData,
    lastHeartbeat,
    disconnect,
  };
}
