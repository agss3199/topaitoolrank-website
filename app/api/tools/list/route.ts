/**
 * API Endpoint: GET /api/tools/list
 *
 * Returns a list of all discovered tools from their manifests.
 * Results are cached for 1 hour (revalidate on file changes).
 */

import { NextResponse } from 'next/server';
import { loadAllTools } from '@/app/lib/tool-registry';

/**
 * GET /api/tools/list
 *
 * Returns all discovered tools as a JSON array
 * Includes caching headers for 1 hour TTL
 *
 * @returns {Promise<NextResponse>} JSON response with tool manifests
 */
export async function GET() {
  try {
    const tools = await loadAllTools();

    const response = NextResponse.json(tools);

    // Cache the response for 1 hour
    // revalidate: 3600 seconds = 1 hour
    response.headers.set('Cache-Control', 'public, max-age=3600');

    return response;
  } catch (error) {
    console.error('Failed to load tools:', error);
    return NextResponse.json(
      { error: 'Failed to load tools' },
      { status: 500 }
    );
  }
}

/**
 * Revalidation configuration
 * This tells Next.js to revalidate the cache every hour
 */
export const revalidate = 3600; // 1 hour in seconds
