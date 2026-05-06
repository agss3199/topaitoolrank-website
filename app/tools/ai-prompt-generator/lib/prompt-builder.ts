/**
 * Prompt Builder - Variable substitution and validation logic
 */

import type { Template } from "./templates";

/**
 * Build the final prompt by replacing all {variable_name} placeholders
 * with user-provided values
 */
export function buildPrompt(template: Template, variables: Record<string, string>): string {
  let prompt = template.prompt;

  // Replace each variable placeholder with user input
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{${key}}`;
    prompt = prompt.replaceAll(placeholder, value);
  }

  return prompt;
}

/**
 * Validate that all required variables have been filled in
 */
export function validateVariables(
  template: Template,
  variables: Record<string, string>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check each required field
  for (const field of template.variables) {
    const value = variables[field.name];

    // Empty or missing value
    if (!value || !value.trim()) {
      errors.push(`${field.label} is required`);
      continue;
    }

    // For textarea fields, warn if too short (< 5 chars)
    if (field.type === "textarea" && value.trim().length < 5) {
      errors.push(`${field.label} should be at least 5 characters`);
    }

    // For select fields, ensure a valid option is selected
    if (field.type === "select" && field.options && !field.options.includes(value)) {
      errors.push(`${field.label} must be a valid selection`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if there are any unreplaced placeholders in the final prompt
 * (indicates missing variables)
 */
export function hasUnreplacedPlaceholders(prompt: string): boolean {
  return /{[a-zA-Z_][a-zA-Z0-9_]*}/.test(prompt);
}

/**
 * Get list of unreplaced placeholders for debugging
 */
export function getUnreplacedPlaceholders(prompt: string): string[] {
  const regex = /{([a-zA-Z_][a-zA-Z0-9_]*)}/g;
  const matches: string[] = [];
  let match;

  while ((match = regex.exec(prompt)) !== null) {
    matches.push(match[1]);
  }

  return Array.from(new Set(matches)); // Remove duplicates
}

/**
 * Calculate statistics about the generated prompt
 */
export function getPromptStats(prompt: string): {
  wordCount: number;
  charCount: number;
  lineCount: number;
  estimatedReadTime: number;
} {
  const words = prompt.trim().split(/\s+/).filter((w) => w.length > 0);
  const wordCount = words.length;
  const charCount = prompt.length;
  const lineCount = prompt.split("\n").length;

  // Assuming average reading speed of 150 words per minute
  const estimatedReadTime = Math.ceil(wordCount / 150);

  return {
    wordCount,
    charCount,
    lineCount,
    estimatedReadTime: Math.max(1, estimatedReadTime),
  };
}

/**
 * Generate a preview of the prompt (first N characters)
 */
export function getPromptPreview(prompt: string, maxLength: number = 200): string {
  if (prompt.length <= maxLength) {
    return prompt;
  }

  return prompt.substring(0, maxLength).trim() + "...";
}

/**
 * Initialize variables object with empty strings for all template fields
 */
export function initializeVariables(template: Template): Record<string, string> {
  const variables: Record<string, string> = {};

  for (const field of template.variables) {
    variables[field.name] = "";
  }

  return variables;
}
