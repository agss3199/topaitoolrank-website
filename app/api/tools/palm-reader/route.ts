import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { PALM_READING_PROMPT } from "./prompt";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PalmLine {
  description: string;
  interpretation: string;
}

interface PalmReadingResponse {
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

// ---------------------------------------------------------------------------
// Rate limiter — in-memory, 5 requests per IP per 60s window
// ---------------------------------------------------------------------------

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;

const ipRequestLog = new Map<string, number[]>();

/** Prune entries older than the window. Runs lazily per-request. */
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = ipRequestLog.get(ip) ?? [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (recent.length >= RATE_LIMIT_MAX) {
    ipRequestLog.set(ip, recent);
    return true;
  }

  recent.push(now);
  ipRequestLog.set(ip, recent);
  return false;
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

const VALID_MIME_REGEX = /^data:image\/(jpeg|png|webp);base64,/;
const MAX_BASE64_SIZE = 10 * 1024 * 1024; // 10 MB

function extractBase64(dataUrl: string): { mimeType: string; data: string } | null {
  const commaIndex = dataUrl.indexOf(",");
  if (commaIndex === -1) return null;
  const header = dataUrl.slice(0, commaIndex);
  const match = header.match(/^data:(image\/(jpeg|png|webp));base64$/);
  if (!match) return null;
  return { mimeType: match[1], data: dataUrl.slice(commaIndex + 1) };
}

// ---------------------------------------------------------------------------
// Empty response for non-palm images
// ---------------------------------------------------------------------------

const EMPTY_LINE: PalmLine = { description: "", interpretation: "" };

const NON_PALM_RESPONSE: PalmReadingResponse = {
  is_palm: false,
  confidence: 0,
  lines: {
    life: EMPTY_LINE,
    heart: EMPTY_LINE,
    head: EMPTY_LINE,
    fate: EMPTY_LINE,
    sun: EMPTY_LINE,
  },
  overall_reading: "",
  tip: "",
};

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: Request): Promise<NextResponse> {
  // --- Client IP for rate limiting ---
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { success: false, error: "Too many requests. Please wait a minute and try again." },
      { status: 429 },
    );
  }

  // --- Parse body ---
  let body: { image?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body." },
      { status: 400 },
    );
  }

  const { image } = body;

  if (!image || typeof image !== "string") {
    return NextResponse.json(
      { success: false, error: "Missing or invalid image data." },
      { status: 400 },
    );
  }

  // --- MIME type validation ---
  if (!VALID_MIME_REGEX.test(image)) {
    return NextResponse.json(
      { success: false, error: "Invalid image format. Accepted: JPEG, PNG, or WebP." },
      { status: 400 },
    );
  }

  // --- Size validation (base64 string length) ---
  if (image.length > MAX_BASE64_SIZE) {
    return NextResponse.json(
      { success: false, error: "Image is too large. Maximum size is 10 MB." },
      { status: 413 },
    );
  }

  // --- Extract base64 payload ---
  const extracted = extractBase64(image);
  if (!extracted) {
    return NextResponse.json(
      { success: false, error: "Could not decode image data." },
      { status: 400 },
    );
  }

  // --- Gemini API key ---
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("palm-reader.error: GEMINI_API_KEY is not configured");
    return NextResponse.json(
      { success: false, error: "Service temporarily unavailable." },
      { status: 500 },
    );
  }

  // --- Call Gemini ---
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1024,
        responseMimeType: "application/json",
      },
    });

    const result = await model.generateContent([
      { text: PALM_READING_PROMPT },
      {
        inlineData: {
          mimeType: extracted.mimeType,
          data: extracted.data,
        },
      },
    ]);

    const responseText = result.response.text();

    // --- Parse JSON (handle possible markdown fences) ---
    let parsed: PalmReadingResponse;
    try {
      const cleaned = responseText
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/g, "")
        .trim();
      parsed = JSON.parse(cleaned) as PalmReadingResponse;
    } catch {
      console.error("palm-reader.error: Failed to parse Gemini response as JSON");
      return NextResponse.json(
        { success: false, error: "Failed to analyze palm image. Please try again." },
        { status: 500 },
      );
    }

    // --- Validate structure ---
    if (typeof parsed.is_palm !== "boolean") {
      parsed = NON_PALM_RESPONSE;
    }

    if (!parsed.is_palm) {
      return NextResponse.json({ success: true, data: NON_PALM_RESPONSE });
    }

    // Ensure all expected line keys exist
    const lineKeys = ["life", "heart", "head", "fate", "sun"] as const;
    for (const key of lineKeys) {
      if (!parsed.lines?.[key]) {
        parsed.lines = { ...NON_PALM_RESPONSE.lines, ...parsed.lines };
        break;
      }
    }

    return NextResponse.json({ success: true, data: parsed });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("palm-reader.error: Gemini API call failed:", message);
    return NextResponse.json(
      { success: false, error: "Failed to analyze palm image. Please try again." },
      { status: 500 },
    );
  }
}
