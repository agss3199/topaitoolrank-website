import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @google/generative-ai before importing route
const mockGenerateContent = vi.fn();
vi.mock("@google/generative-ai", () => {
  class MockGoogleGenerativeAI {
    apiKey: string;
    constructor(apiKey: string) {
      this.apiKey = apiKey;
    }
    getGenerativeModel() {
      return { generateContent: mockGenerateContent };
    }
  }
  return { GoogleGenerativeAI: MockGoogleGenerativeAI };
});

// Must import after mock setup
import { POST } from "../route";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_IMAGE =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//2Q==";

function makeRequest(body: unknown, ip = "127.0.0.1"): Request {
  return new Request("http://localhost/api/tools/palm-reader", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(body),
  });
}

const VALID_GEMINI_RESPONSE = {
  is_palm: true,
  confidence: 0.9,
  lines: {
    life: { description: "Long curved line", interpretation: "Vitality" },
    heart: { description: "Deep line", interpretation: "Emotional depth" },
    head: { description: "Straight line", interpretation: "Analytical mind" },
    fate: { description: "Faint line", interpretation: "Self-made path" },
    sun: { description: "Short line", interpretation: "Creativity" },
  },
  overall_reading: "A balanced and creative individual.",
  tip: "Trust your instincts more often.",
};

const NON_PALM_RESPONSE = {
  is_palm: false,
  confidence: 0,
  lines: {
    life: { description: "", interpretation: "" },
    heart: { description: "", interpretation: "" },
    head: { description: "", interpretation: "" },
    fate: { description: "", interpretation: "" },
    sun: { description: "", interpretation: "" },
  },
  overall_reading: "",
  tip: "",
};

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.stubEnv("GEMINI_API_KEY", "test-key-for-unit-tests");
  mockGenerateContent.mockReset();
  mockGenerateContent.mockResolvedValue({
    response: { text: () => JSON.stringify(VALID_GEMINI_RESPONSE) },
  });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("POST /api/tools/palm-reader", () => {
  it("accepts valid image and returns formatted response", async () => {
    const res = await POST(makeRequest({ image: VALID_IMAGE }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.is_palm).toBe(true);
    expect(json.data.lines.life.description).toBe("Long curved line");
    expect(json.data.overall_reading).toBeTruthy();
    expect(json.data.tip).toBeTruthy();
  });

  it("rejects non-palm image with is_palm: false", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: { text: () => JSON.stringify(NON_PALM_RESPONSE) },
    });

    const res = await POST(makeRequest({ image: VALID_IMAGE }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.is_palm).toBe(false);
    expect(json.data.confidence).toBe(0);
  });

  it("returns 400 for missing image", async () => {
    const res = await POST(makeRequest({}));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error).toContain("Missing");
  });

  it("returns 413 for oversized image (>10MB base64)", async () => {
    // Build a data URL > 10MB
    const bigData = "A".repeat(11 * 1024 * 1024);
    const bigImage = `data:image/jpeg;base64,${bigData}`;

    const res = await POST(makeRequest({ image: bigImage }));
    const json = await res.json();

    expect(res.status).toBe(413);
    expect(json.success).toBe(false);
    expect(json.error).toContain("too large");
  });

  it("returns 400 for invalid MIME type", async () => {
    const gifImage = "data:image/gif;base64,R0lGODlhAQABAIAAAA==";
    const res = await POST(makeRequest({ image: gifImage }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error).toContain("Invalid image format");
  });

  it("returns 429 after rate limit exceeded (5 requests per minute)", async () => {
    const ip = `rate-limit-test-${Date.now()}`;

    // First 5 should succeed
    for (let i = 0; i < 5; i++) {
      const res = await POST(makeRequest({ image: VALID_IMAGE }, ip));
      expect(res.status).toBe(200);
    }

    // 6th should be rate-limited
    const res = await POST(makeRequest({ image: VALID_IMAGE }, ip));
    const json = await res.json();

    expect(res.status).toBe(429);
    expect(json.success).toBe(false);
    expect(json.error).toContain("Too many requests");
  });

  it("catches Gemini API errors and returns 500", async () => {
    mockGenerateContent.mockRejectedValueOnce(new Error("API quota exceeded"));

    const ip = `error-test-${Date.now()}`;
    const res = await POST(makeRequest({ image: VALID_IMAGE }, ip));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.error).toContain("Failed to analyze");
    // Must NOT expose internal error details
    expect(json.error).not.toContain("quota");
  });

  it("returns 500 when GEMINI_API_KEY is missing", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");

    const ip = `no-key-test-${Date.now()}`;
    const res = await POST(makeRequest({ image: VALID_IMAGE }, ip));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.error).toContain("unavailable");
    // Must NOT mention API key in error
    expect(json.error).not.toContain("GEMINI");
  });

  it("handles Gemini response wrapped in markdown code fences", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () =>
          "```json\n" + JSON.stringify(VALID_GEMINI_RESPONSE) + "\n```",
      },
    });

    const ip = `fence-test-${Date.now()}`;
    const res = await POST(makeRequest({ image: VALID_IMAGE }, ip));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.is_palm).toBe(true);
  });

  it("returns 400 for invalid JSON body", async () => {
    const req = new Request("http://localhost/api/tools/palm-reader", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": `bad-json-${Date.now()}`,
      },
      body: "not-json",
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
