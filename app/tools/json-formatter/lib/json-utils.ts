/**
 * JSON Formatter - Parsing, validation, and transformation utilities
 */

export interface JSONStats {
  isValid: boolean;
  error?: string;
  size: number;
  lines: number;
  keys: number;
}

/**
 * Parse and validate JSON
 */
export function parseJSON(text: string): { valid: boolean; error?: string; data?: any } {
  if (!text.trim()) {
    return { valid: false, error: "JSON input is empty" };
  }

  try {
    const data = JSON.parse(text);
    return { valid: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid JSON";
    return { valid: false, error: message };
  }
}

/**
 * Format JSON with indentation
 */
export function formatJSON(text: string, indent: number = 2): string {
  const parsed = parseJSON(text);
  if (!parsed.valid || !parsed.data) return "";

  return JSON.stringify(parsed.data, null, indent);
}

/**
 * Minify JSON (remove whitespace)
 */
export function minifyJSON(text: string): string {
  const parsed = parseJSON(text);
  if (!parsed.valid || !parsed.data) return "";

  return JSON.stringify(parsed.data);
}

/**
 * Get JSON statistics
 */
export function getJSONStats(text: string): JSONStats {
  const trimmed = text.trim();
  const parsed = parseJSON(text);

  if (!parsed.valid) {
    return {
      isValid: false,
      error: parsed.error,
      size: trimmed.length,
      lines: trimmed.split("\n").length,
      keys: 0,
    };
  }

  const keys = countKeys(parsed.data);
  const formatted = JSON.stringify(parsed.data, null, 2);

  return {
    isValid: true,
    size: trimmed.length,
    lines: formatted.split("\n").length,
    keys,
  };
}

/**
 * Count total keys in JSON object (recursive)
 */
function countKeys(obj: any, depth = 0): number {
  if (depth > 100) return 0; // Prevent infinite recursion

  if (obj === null || typeof obj !== "object") {
    return 0;
  }

  let count = 0;

  if (Array.isArray(obj)) {
    for (const item of obj) {
      count += countKeys(item, depth + 1);
    }
  } else {
    count = Object.keys(obj).length;
    for (const value of Object.values(obj)) {
      count += countKeys(value, depth + 1);
    }
  }

  return count;
}

/**
 * Convert JSON to CSV (simple, for flat objects only)
 */
export function jsonToCSV(text: string): string {
  const parsed = parseJSON(text);
  if (!parsed.valid || !parsed.data) return "";

  const data = Array.isArray(parsed.data) ? parsed.data : [parsed.data];

  if (!data.length) return "";

  // Get all unique keys
  const keys = new Set<string>();
  for (const item of data) {
    if (typeof item === "object" && item !== null) {
      Object.keys(item).forEach((k) => keys.add(k));
    }
  }

  const keyArray = Array.from(keys);
  const header = keyArray.map((k) => `"${k.replace(/"/g, '""')}"`).join(",");

  const rows = data.map((item) => {
    return keyArray
      .map((key) => {
        const value = item[key];
        if (value === null || value === undefined) return "";
        const str = String(value);
        return `"${str.replace(/"/g, '""')}"`;
      })
      .join(",");
  });

  return [header, ...rows].join("\n");
}

/**
 * Sort JSON keys alphabetically
 */
export function sortJSONKeys(text: string): string {
  const parsed = parseJSON(text);
  if (!parsed.valid || !parsed.data) return "";

  const sorted = sortObject(parsed.data);
  return JSON.stringify(sorted, null, 2);
}

/**
 * Recursively sort object keys
 */
function sortObject(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map((item) => sortObject(item));
  }

  if (obj !== null && typeof obj === "object") {
    const sorted: any = {};
    Object.keys(obj)
      .sort()
      .forEach((key) => {
        sorted[key] = sortObject(obj[key]);
      });
    return sorted;
  }

  return obj;
}

/**
 * Estimate complexity of JSON
 */
export function getComplexity(text: string): string {
  const stats = getJSONStats(text);

  if (!stats.isValid) return "Invalid";

  if (stats.keys <= 10 && stats.lines <= 20) return "Simple";
  if (stats.keys <= 50 && stats.lines <= 100) return "Moderate";
  if (stats.keys <= 200 && stats.lines <= 500) return "Complex";
  return "Very Complex";
}
