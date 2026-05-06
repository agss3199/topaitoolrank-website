/**
 * Utilities for [Tool Name]
 *
 * ISOLATION: This file is tool-specific. Do NOT import from shared lib/ at project root.
 * Copy this file into your tool's lib/ folder and implement tool-specific logic here.
 */

/**
 * Example utility function for the tool
 * Replace with actual tool logic
 */
export function exampleUtility(input: string): string {
  return input.toUpperCase();
}

/**
 * Download file helper — can be reused across all tools
 * Implemented locally in each tool's lib/
 */
export function downloadAsFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * localStorage helper — can be reused across all tools
 * Implemented locally in each tool's lib/
 */
export function saveTolocalStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error("localStorage save failed:", error);
  }
}

export function loadFromlocalStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error("localStorage load failed:", error);
    return null;
  }
}

export function removeFromlocalStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error("localStorage remove failed:", error);
  }
}

/**
 * Copy to clipboard helper — can be reused across all tools
 * Implemented locally in each tool's lib/
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("Copy to clipboard failed:", error);
    // Fallback for older browsers
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand("copy");
    document.body.removeChild(textarea);
    return success;
  }
}
