/**
 * Business Name Generator - Core Logic
 * Generate creative business names using Claude AI
 */

export interface GenerationRequest {
  keywords: string[];
  style: 'professional' | 'creative' | 'descriptive' | 'playful';
  industry: string;
  targetAudience?: string;
  maxResults?: number;
}

export interface GeneratedName {
  name: string;
  explanation: string;
  availability?: 'available' | 'taken' | 'unknown';
  tags: string[];
}

export interface GenerationResponse {
  success: boolean;
  names: GeneratedName[];
  error?: string;
  tokensUsed?: number;
}

/**
 * Generate business names using Claude AI
 * Calls the /api/business-names endpoint
 */
export async function generateBusinessNames(
  request: GenerationRequest
): Promise<GenerationResponse> {
  if (!request.keywords || request.keywords.length === 0) {
    return {
      success: false,
      names: [],
      error: 'Please provide at least one keyword',
    };
  }

  if (!request.industry || request.industry.trim() === '') {
    return {
      success: false,
      names: [],
      error: 'Please select an industry',
    };
  }

  if (request.keywords.some(k => k.trim().length === 0)) {
    return {
      success: false,
      names: [],
      error: 'Keywords cannot be empty',
    };
  }

  if (request.keywords.some(k => k.length > 50)) {
    return {
      success: false,
      names: [],
      error: 'Keywords must be 50 characters or less',
    };
  }

  try {
    const response = await fetch('/api/business-names', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        keywords: request.keywords,
        style: request.style,
        industry: request.industry,
        targetAudience: request.targetAudience,
        count: request.maxResults || 10,
      }),
    });

    if (!response.ok) {
      return {
        success: false,
        names: [],
        error: `API error: ${response.status} ${response.statusText}`,
      };
    }

    const data = await response.json();

    if (!data.names || !Array.isArray(data.names)) {
      return {
        success: false,
        names: [],
        error: 'Invalid response format from API',
      };
    }

    return {
      success: true,
      names: data.names.map((name: any) => ({
        name: name.name || '',
        explanation: name.explanation || '',
        availability: name.availability || 'unknown',
        tags: name.tags || [],
      })),
      tokensUsed: data.tokensUsed,
    };
  } catch (error) {
    return {
      success: false,
      names: [],
      error: error instanceof Error ? error.message : 'Failed to generate names',
    };
  }
}

/**
 * Get available styles for name generation
 */
export const GENERATION_STYLES = [
  {
    id: 'professional' as const,
    label: 'Professional',
    description: 'Formal, trustworthy, corporate names',
  },
  {
    id: 'creative' as const,
    label: 'Creative',
    description: 'Unique, memorable, artistic names',
  },
  {
    id: 'descriptive' as const,
    label: 'Descriptive',
    description: 'Clear, descriptive, straightforward names',
  },
  {
    id: 'playful' as const,
    label: 'Playful',
    description: 'Fun, catchy, creative names',
  },
];

/**
 * Get common industries
 */
export const INDUSTRIES = [
  'Technology',
  'Finance',
  'Healthcare',
  'E-commerce',
  'Education',
  'Consulting',
  'Marketing',
  'Real Estate',
  'Food & Beverage',
  'Fashion',
  'Entertainment',
  'Travel & Tourism',
  'Photography',
  'Design & Creative',
  'Legal Services',
  'Other',
];

/**
 * Validate generation request
 */
export function validateRequest(request: GenerationRequest): {
  valid: boolean;
  error?: string;
} {
  if (!request.keywords || request.keywords.length === 0) {
    return { valid: false, error: 'At least one keyword is required' };
  }

  if (request.keywords.length > 5) {
    return { valid: false, error: 'Maximum 5 keywords allowed' };
  }

  if (!request.industry) {
    return { valid: false, error: 'Industry is required' };
  }

  const totalLength = request.keywords.reduce((sum, k) => sum + k.length, 0);
  if (totalLength > 100) {
    return { valid: false, error: 'Total keyword length cannot exceed 100 characters' };
  }

  return { valid: true };
}

/**
 * Extract tags from generated name
 */
export function extractTags(
  name: string,
  style: string,
  industry: string
): string[] {
  const tags: string[] = [];

  // Add style tag
  if (style !== 'professional') {
    tags.push(style);
  }

  // Add length tag
  if (name.length < 5) {
    tags.push('short');
  } else if (name.length < 8) {
    tags.push('medium');
  } else {
    tags.push('long');
  }

  // Add word pattern tags
  if (name.includes(' ')) {
    tags.push('multi-word');
  } else {
    tags.push('single-word');
  }

  // Add character type tags
  if (/[0-9]/.test(name)) {
    tags.push('with-numbers');
  }
  if (/[a-z][A-Z]/.test(name)) {
    tags.push('camelCase');
  }

  return tags;
}

/**
 * Format a generated name for display
 */
export function formatNameForDisplay(name: GeneratedName): string {
  return name.name.trim();
}

/**
 * Check if a name is pronounceable (simple heuristic)
 */
export function isPronounceableScore(name: string): number {
  // Score 0-100 based on vowel/consonant balance
  const vowels = (name.match(/[aeiou]/gi) || []).length;
  const consonants = (name.match(/[bcdfghjklmnpqrstvwxyz]/gi) || []).length;
  const total = vowels + consonants;

  if (total === 0) return 50;

  const ratio = vowels / total;
  // Ideal ratio is around 40% vowels
  const score = Math.abs(ratio - 0.4) * 100;
  return Math.max(0, Math.min(100, 100 - score));
}

/**
 * Calculate domain availability likelihood
 * (This is a heuristic; real check would query a domain service)
 */
export function estimateDomainAvailability(name: string): 'likely' | 'uncertain' | 'unlikely' {
  // Shorter, unique names are more likely to be taken
  if (name.length < 5) {
    return 'unlikely';
  }

  if (name.includes(' ')) {
    return 'likely';
  }

  // Very simple names are usually taken
  if (/^[a-z]+$/.test(name) && name.length < 8) {
    return 'unlikely';
  }

  return 'uncertain';
}
