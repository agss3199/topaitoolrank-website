/**
 * UTM Link Builder - URL parameter construction and validation
 */

export interface UTMParams {
  url: string;
  source: string;
  medium: string;
  campaign: string;
  content?: string;
  term?: string;
}

export interface UTMValidation {
  valid: boolean;
  errors: string[];
}

/**
 * Validate UTM parameters
 */
export function validateUTMParams(params: UTMParams): UTMValidation {
  const errors: string[] = [];

  // URL validation
  if (!params.url || !params.url.trim()) {
    errors.push("URL is required");
  } else {
    try {
      new URL(params.url);
    } catch {
      errors.push("Invalid URL - must start with http:// or https://");
    }
  }

  // Source validation
  if (!params.source || !params.source.trim()) {
    errors.push("Traffic source (utm_source) is required");
  } else if (params.source.includes(" ")) {
    errors.push("utm_source cannot contain spaces (use underscores or hyphens)");
  }

  // Medium validation
  if (!params.medium || !params.medium.trim()) {
    errors.push("Medium (utm_medium) is required");
  } else if (params.medium.includes(" ")) {
    errors.push("utm_medium cannot contain spaces (use underscores or hyphens)");
  }

  // Campaign validation
  if (!params.campaign || !params.campaign.trim()) {
    errors.push("Campaign (utm_campaign) is required");
  } else if (params.campaign.includes(" ")) {
    errors.push("utm_campaign cannot contain spaces (use underscores or hyphens)");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Build UTM URL from parameters
 */
export function buildUTMURL(params: UTMParams): string {
  const url = new URL(params.url);
  const separator = url.search ? "&" : "?";

  const utmParams = [
    `utm_source=${encodeURIComponent(params.source.toLowerCase().trim())}`,
    `utm_medium=${encodeURIComponent(params.medium.toLowerCase().trim())}`,
    `utm_campaign=${encodeURIComponent(params.campaign.toLowerCase().trim())}`,
  ];

  if (params.content && params.content.trim()) {
    utmParams.push(`utm_content=${encodeURIComponent(params.content.toLowerCase().trim())}`);
  }

  if (params.term && params.term.trim()) {
    utmParams.push(`utm_term=${encodeURIComponent(params.term.toLowerCase().trim())}`);
  }

  return url.toString() + separator + utmParams.join("&");
}

/**
 * Parse UTM parameters from a URL
 */
export function parseUTMURL(fullUrl: string): Partial<UTMParams> {
  try {
    const url = new URL(fullUrl);
    return {
      url: `${url.protocol}//${url.host}${url.pathname}`,
      source: url.searchParams.get("utm_source") || "",
      medium: url.searchParams.get("utm_medium") || "",
      campaign: url.searchParams.get("utm_campaign") || "",
      content: url.searchParams.get("utm_content") || "",
      term: url.searchParams.get("utm_term") || "",
    };
  } catch {
    return {};
  }
}

/**
 * Get URL length including UTM parameters
 */
export function getURLLength(params: UTMParams): { original: number; withUTM: number; increase: number } {
  try {
    const originalUrl = new URL(params.url);
    const originalLength = originalUrl.toString().length;

    const utmUrl = buildUTMURL(params);
    const utmLength = utmUrl.length;

    return {
      original: originalLength,
      withUTM: utmLength,
      increase: utmLength - originalLength,
    };
  } catch {
    return { original: 0, withUTM: 0, increase: 0 };
  }
}

/**
 * Get URL shortening recommendation
 */
export function getShortenerRecommendation(urlLength: number): { recommended: boolean; reason: string } {
  // Most social media platforms have link character limits
  // Twitter: 280 chars total, so keep URL under 100-120
  // SMS: 160 chars per message
  // Email: generally OK, but shortened links look better
  // Direct mail/QR codes: no length limit but shorter is better

  if (urlLength > 150) {
    return {
      recommended: true,
      reason: "URL is quite long - consider using a shortener (bit.ly, TinyURL, etc.) for social media",
    };
  }

  if (urlLength > 100) {
    return {
      recommended: false,
      reason: "URL is acceptable for most uses, but shortening would improve social sharing",
    };
  }

  return {
    recommended: false,
    reason: "URL is concise and ready to share anywhere",
  };
}

/**
 * Get common UTM presets
 */
export const UTM_PRESETS = {
  sources: ["google", "facebook", "twitter", "linkedin", "email", "direct", "referral", "other"],
  mediums: ["cpc", "cpm", "organic", "email", "social", "referral", "display", "video", "paid_social"],
  campaigns: [],
  content: [],
};

/**
 * Format UTM parameter name with description
 */
export const UTM_DESCRIPTIONS: Record<string, string> = {
  source: "Traffic source (e.g., google, facebook, newsletter)",
  medium: "Marketing medium (e.g., cpc, organic, email, social)",
  campaign: "Campaign name or product name",
  content: "Ad variant or link position (optional)",
  term: "Paid keyword or search term (optional)",
};
