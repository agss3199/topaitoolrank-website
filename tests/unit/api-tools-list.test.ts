/**
 * API Endpoint Tests: GET /api/tools/list
 *
 * Tests for:
 * - Endpoint returns list of tools
 * - Correct response format
 * - Cache headers are set
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from '@/app/api/tools/list/route';
import { loadAllTools } from '@/app/lib/tool-registry';
import { ToolManifest } from '@/app/lib/types';

// Mock the tool registry
vi.mock('@/app/lib/tool-registry', () => ({
  loadAllTools: vi.fn(),
}));

describe('API: GET /api/tools/list', () => {
  const mockToolManifest: ToolManifest = {
    id: 'wa-sender',
    name: 'WhatsApp Sender',
    version: '1.0.0',
    description: 'Send bulk WhatsApp messages',
    icon: '/tools/wa-sender/icon.svg',
    route: '/tools/wa-sender',
    auth_required: true,
    scope: ['wa-sender:read', 'wa-sender:write'],
    navigation: [
      { label: 'Dashboard', href: '/tools/wa-sender', icon: 'dashboard' },
    ],
    database_tables: ['wa_sender_messages'],
    api_endpoints: ['/api/wa-sender/messages'],
    environment_variables: ['WHATSAPP_API_KEY'],
    deployment: {
      independent: true,
      can_deploy_without_core: true,
      requires_migration: true,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty array when no tools are loaded', async () => {
    vi.mocked(loadAllTools).mockResolvedValue([]);

    const response = await GET();

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(0);
  });

  it('should return all discovered tools', async () => {
    const tools = [mockToolManifest];
    vi.mocked(loadAllTools).mockResolvedValue(tools);

    const response = await GET();

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(1);
    expect(data[0]).toEqual(mockToolManifest);
  });

  it('should return multiple tools', async () => {
    const tools = [
      mockToolManifest,
      {
        ...mockToolManifest,
        id: 'tool-b',
        name: 'Tool B',
        route: '/tools/tool-b',
      },
    ];
    vi.mocked(loadAllTools).mockResolvedValue(tools);

    const response = await GET();

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveLength(2);
    expect(data[0].id).toBe('wa-sender');
    expect(data[1].id).toBe('tool-b');
  });

  it('should set cache control headers for 1 hour', async () => {
    vi.mocked(loadAllTools).mockResolvedValue([mockToolManifest]);

    const response = await GET();

    // Check cache control header
    const cacheControl = response.headers.get('Cache-Control');
    expect(cacheControl).toBe('public, max-age=3600');
  });

  it('should return content type application/json', async () => {
    vi.mocked(loadAllTools).mockResolvedValue([mockToolManifest]);

    const response = await GET();

    const contentType = response.headers.get('content-type');
    expect(contentType).toContain('application/json');
  });

  it('should handle errors gracefully', async () => {
    vi.mocked(loadAllTools).mockRejectedValue(new Error('Failed to read tools'));

    const response = await GET();

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Failed to load tools');
  });

  it('should include all required manifest fields in response', async () => {
    vi.mocked(loadAllTools).mockResolvedValue([mockToolManifest]);

    const response = await GET();
    const data = await response.json();
    const tool = data[0];

    // Check required fields
    expect(tool).toHaveProperty('id');
    expect(tool).toHaveProperty('name');
    expect(tool).toHaveProperty('version');
    expect(tool).toHaveProperty('description');
    expect(tool).toHaveProperty('icon');
    expect(tool).toHaveProperty('route');
    expect(tool).toHaveProperty('auth_required');
    expect(tool).toHaveProperty('scope');
    expect(tool).toHaveProperty('navigation');
    expect(tool).toHaveProperty('database_tables');
    expect(tool).toHaveProperty('api_endpoints');
    expect(tool).toHaveProperty('environment_variables');
    expect(tool).toHaveProperty('deployment');
  });

  it('should return correct field types in response', async () => {
    vi.mocked(loadAllTools).mockResolvedValue([mockToolManifest]);

    const response = await GET();
    const data = await response.json();
    const tool = data[0];

    expect(typeof tool.id).toBe('string');
    expect(typeof tool.name).toBe('string');
    expect(typeof tool.version).toBe('string');
    expect(typeof tool.auth_required).toBe('boolean');
    expect(Array.isArray(tool.scope)).toBe(true);
    expect(Array.isArray(tool.navigation)).toBe(true);
    expect(Array.isArray(tool.database_tables)).toBe(true);
    expect(Array.isArray(tool.api_endpoints)).toBe(true);
    expect(Array.isArray(tool.environment_variables)).toBe(true);
    expect(typeof tool.deployment).toBe('object');
  });
});
