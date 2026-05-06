/**
 * SEO Analyzer - Core Logic
 * Analyze URL for SEO metrics
 */

export interface SEOMetrics {
  title?: {
    text: string;
    length: number;
    optimal: boolean;
    status: string;
  };
  description?: {
    text: string;
    length: number;
    optimal: boolean;
    status: string;
  };
  headings?: {
    h1Count: number;
    h2Count: number;
    h3Count: number;
    optimal: boolean;
  };
  content?: {
    wordCount: number;
    readabilityScore: number;
    status: string;
  };
  technical?: {
    hasCanonical: boolean;
    hasMobileViewport: boolean;
    hasSSL: boolean;
    loadTime?: number;
  };
  score: number;
}

/**
 * Validate URL format
 */
export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if URL is HTTPS
 */
export function checkSSL(url: string): boolean {
  return url.startsWith("https://");
}

/**
 * Analyze title tag
 */
export function analyzeTitle(title: string): {
  length: number;
  optimal: boolean;
  status: string;
} {
  const length = title.length;
  let status = "";
  let optimal = false;

  if (length === 0) {
    status = "Missing - Add a title tag";
  } else if (length < 30) {
    status = "Too short (aim for 30-60 chars)";
  } else if (length <= 60) {
    status = "Good length";
    optimal = true;
  } else if (length <= 70) {
    status = "Slightly long (aim for ≤60 chars)";
  } else {
    status = "Too long (may be cut off in search)";
  }

  return { length, optimal, status };
}

/**
 * Analyze meta description
 */
export function analyzeDescription(description: string): {
  length: number;
  optimal: boolean;
  status: string;
} {
  const length = description.length;
  let status = "";
  let optimal = false;

  if (length === 0) {
    status = "Missing - Add a description";
  } else if (length < 120) {
    status = "Too short (aim for 120-160 chars)";
  } else if (length <= 160) {
    status = "Good length";
    optimal = true;
  } else {
    status = "Too long (may be cut off)";
  }

  return { length, optimal, status };
}

/**
 * Estimate readability score (0-100)
 */
export function calculateReadabilityScore(wordCount: number, avgSentenceLength: number): number {
  // Simple flesch kincaid estimate
  let score = 100;

  if (wordCount < 300) score -= 20;
  if (wordCount > 3000) score -= 10;
  if (avgSentenceLength > 20) score -= 15;
  if (avgSentenceLength < 10) score -= 5;

  return Math.max(0, Math.min(100, score));
}

/**
 * Generate SEO score (0-100)
 */
export function generateSEOScore(metrics: Partial<SEOMetrics>): number {
  let score = 0;
  let maxScore = 0;

  // Title (20 points)
  if (metrics.title) {
    maxScore += 20;
    if (metrics.title.optimal) score += 20;
    else if (metrics.title.length > 0) score += 10;
  }

  // Description (20 points)
  if (metrics.description) {
    maxScore += 20;
    if (metrics.description.optimal) score += 20;
    else if (metrics.description.length > 0) score += 10;
  }

  // Headings (15 points)
  if (metrics.headings) {
    maxScore += 15;
    if (metrics.headings.optimal) score += 15;
  }

  // Content (15 points)
  if (metrics.content) {
    maxScore += 15;
    if (metrics.content.wordCount > 300) score += 15;
    else if (metrics.content.wordCount > 150) score += 10;
  }

  // Technical (30 points)
  if (metrics.technical) {
    maxScore += 30;
    let techScore = 0;
    if (metrics.technical.hasSSL) techScore += 10;
    if (metrics.technical.hasMobileViewport) techScore += 10;
    if (metrics.technical.hasCanonical) techScore += 10;
    score += techScore;
  }

  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
}

/**
 * Get SEO improvement suggestions
 */
export function getSuggestions(metrics: Partial<SEOMetrics>): string[] {
  const suggestions: string[] = [];

  if (!metrics.title || metrics.title.length === 0) {
    suggestions.push("Add a meta title tag (30-60 characters)");
  } else if (!metrics.title.optimal) {
    suggestions.push(`Adjust title length (current: ${metrics.title.length}, target: 30-60)`);
  }

  if (!metrics.description || metrics.description.length === 0) {
    suggestions.push("Add a meta description (120-160 characters)");
  } else if (!metrics.description.optimal) {
    suggestions.push(
      `Adjust description length (current: ${metrics.description.length}, target: 120-160)`
    );
  }

  if (!metrics.headings?.optimal) {
    suggestions.push("Use exactly one H1 tag, multiple H2/H3 tags");
  }

  if (metrics.content && metrics.content.wordCount < 300) {
    suggestions.push(`Add more content (current: ${metrics.content.wordCount} words, target: 300+)`);
  }

  if (metrics.technical && !metrics.technical.hasSSL) {
    suggestions.push("Implement HTTPS (SSL/TLS certificate)");
  }

  if (metrics.technical && !metrics.technical.hasMobileViewport) {
    suggestions.push("Add mobile viewport meta tag");
  }

  if (metrics.technical && !metrics.technical.hasCanonical) {
    suggestions.push("Add canonical tag to prevent duplicate content issues");
  }

  return suggestions;
}

/**
 * Parse metadata from HTML
 */
export function parseMetadata(html: string): {
  title: string;
  description: string;
  h1Count: number;
  h2Count: number;
  h3Count: number;
  wordCount: number;
  hasCanonical: boolean;
  hasMobileViewport: boolean;
} {
  // Title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : "";

  // Description
  const descMatch = html.match(/<meta\s+name=["']?description["']?\s+content=["']([^"']+)/i);
  const description = descMatch ? descMatch[1].trim() : "";

  // Headings
  const h1Count = (html.match(/<h1[^>]*>/gi) || []).length;
  const h2Count = (html.match(/<h2[^>]*>/gi) || []).length;
  const h3Count = (html.match(/<h3[^>]*>/gi) || []).length;

  // Word count
  const textOnly = html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const wordCount = textOnly.split(" ").filter(w => w.length > 0).length;

  // Canonical
  const hasCanonical = /<link\s+rel=["']?canonical["']?\s+href=/i.test(html);

  // Mobile viewport
  const hasMobileViewport = /<meta\s+name=["']?viewport["']?/i.test(html);

  return {
    title,
    description,
    h1Count,
    h2Count,
    h3Count,
    wordCount,
    hasCanonical,
    hasMobileViewport,
  };
}
