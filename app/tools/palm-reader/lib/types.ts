/**
 * Type definitions for Palm Reader API responses.
 * Matches the response shape from /api/tools/palm-reader (route.ts).
 */

export interface PalmLine {
  description: string;
  interpretation: string;
}

export interface PalmReadingResponse {
  is_palm: boolean;
  confidence: number;
  lines: {
    life: PalmLine;
    heart: PalmLine;
    head: PalmLine;
    fate: PalmLine;
    sun: PalmLine;
  };
  overall_reading: string;
  tip: string;
}

export interface PalmReadingApiResult {
  success: boolean;
  data?: PalmReadingResponse;
  error?: string;
}
