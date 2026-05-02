/**
 * Tool Registry Tests
 *
 * Tests for:
 * - Tool discovery from manifest files
 * - Manifest validation
 * - Invalid manifest handling (logged warnings, no crashes)
 * - Tool lookup by ID
 * - Tool lookup by route
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { validateManifest, loadAllTools, getToolById, getToolByRoute } from '@/app/lib/tool-registry';
import { ToolManifest } from '@/app/lib/types';
import path from 'path';
import fs from 'fs';
import os from 'os';

/**
 * Creates a complete valid tool manifest for testing
 */
function createValidManifest(overrides?: Partial<ToolManifest>): ToolManifest {
  return {
    id: 'test-tool',
    name: 'Test Tool',
    version: '1.0.0',
    description: 'A test tool',
    icon: '/tools/test-tool/icon.svg',
    route: '/tools/test-tool',
    auth_required: true,
    scope: ['test-tool:read', 'test-tool:write'],
    navigation: [
      { label: 'Dashboard', href: '/tools/test-tool', icon: 'dashboard' },
    ],
    database_tables: ['test_tool_data'],
    api_endpoints: ['/api/test-tool/data'],
    environment_variables: ['TEST_TOOL_API_KEY'],
    deployment: {
      independent: true,
      can_deploy_without_core: true,
      requires_migration: false,
    },
    ...overrides,
  };
}

describe('Tool Registry - validateManifest', () => {
  it('should accept a valid manifest', () => {
    const manifest = createValidManifest();
    const result = validateManifest(manifest);

    expect(result.valid).toBe(true);
    expect(result.manifest).toEqual(manifest);
    expect(result.error).toBeUndefined();
  });

  it('should reject null manifest', () => {
    const result = validateManifest(null);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('non-null object');
  });

  it('should reject non-object manifest', () => {
    const result = validateManifest('not an object');

    expect(result.valid).toBe(false);
    expect(result.error).toContain('object');
  });

  it('should reject manifest missing id', () => {
    const manifest = createValidManifest();
    const { id, ...incomplete } = manifest;

    const result = validateManifest(incomplete);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('id');
  });

  it('should reject manifest with empty id', () => {
    const manifest = createValidManifest({ id: '' });

    const result = validateManifest(manifest);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('id');
  });

  it('should reject manifest with non-string id', () => {
    const manifest = createValidManifest({ id: 123 as any });

    const result = validateManifest(manifest);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('id');
  });

  it('should reject manifest missing name', () => {
    const manifest = createValidManifest();
    const { name, ...incomplete } = manifest;

    const result = validateManifest(incomplete);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('name');
  });

  it('should reject manifest with empty scope array', () => {
    const manifest = createValidManifest({ scope: [] });

    const result = validateManifest(manifest);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('scope');
  });

  it('should reject manifest with non-string scope elements', () => {
    const manifest = createValidManifest({ scope: ['valid', 123 as any] });

    const result = validateManifest(manifest);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('scope');
  });

  it('should reject manifest with non-boolean auth_required', () => {
    const manifest = createValidManifest({ auth_required: 'true' as any });

    const result = validateManifest(manifest);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('auth_required');
  });

  it('should reject manifest with non-object deployment', () => {
    const manifest = createValidManifest({ deployment: 'not an object' as any });

    const result = validateManifest(manifest);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('deployment');
  });

  it('should reject manifest with non-boolean deployment.independent', () => {
    const manifest = createValidManifest({
      deployment: {
        independent: 'true' as any,
        can_deploy_without_core: true,
        requires_migration: false,
      },
    });

    const result = validateManifest(manifest);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('Deployment');
  });

  it('should accept manifest with optional deprecated and deprecation fields', () => {
    const manifest = createValidManifest({
      deprecated: true,
      deprecation: {
        reason: 'Replaced by new tool',
        sunset_date: '2026-12-31',
        replacement_tool_id: 'new-tool',
      },
    });

    const result = validateManifest(manifest);

    expect(result.valid).toBe(true);
    expect(result.manifest?.deprecated).toBe(true);
  });
});

describe('Tool Registry - loadAllTools', () => {
  let tempToolsDir: string;

  beforeEach(() => {
    // Create a temporary directory for test tools
    tempToolsDir = path.join(os.tmpdir(), `tool-registry-test-${Date.now()}`);
    fs.mkdirSync(tempToolsDir, { recursive: true });

    // Mock process.cwd to point to temp directory
    vi.spyOn(process, 'cwd').mockReturnValue(tempToolsDir);
  });

  afterEach(() => {
    // Cleanup
    if (fs.existsSync(tempToolsDir)) {
      fs.rmSync(tempToolsDir, { recursive: true, force: true });
    }
    vi.restoreAllMocks();
  });

  it('should return empty array when tools directory does not exist', async () => {
    vi.spyOn(process, 'cwd').mockReturnValue('/nonexistent/path');

    const tools = await loadAllTools();

    expect(tools).toEqual([]);
  });

  it('should discover a valid tool manifest', async () => {
    // Create tool directory and manifest
    const toolDir = path.join(tempToolsDir, 'app', 'tools', 'test-tool');
    fs.mkdirSync(toolDir, { recursive: true });

    const manifest = createValidManifest({ id: 'test-tool' });
    fs.writeFileSync(
      path.join(toolDir, 'tool.manifest.json'),
      JSON.stringify(manifest)
    );

    const tools = await loadAllTools();

    expect(tools).toHaveLength(1);
    expect(tools[0].id).toBe('test-tool');
    expect(tools[0].name).toBe('Test Tool');
  });

  it('should discover multiple valid tool manifests', async () => {
    // Create first tool
    const tool1Dir = path.join(tempToolsDir, 'app', 'tools', 'tool-1');
    fs.mkdirSync(tool1Dir, { recursive: true });
    fs.writeFileSync(
      path.join(tool1Dir, 'tool.manifest.json'),
      JSON.stringify(createValidManifest({ id: 'tool-1', name: 'Tool 1' }))
    );

    // Create second tool
    const tool2Dir = path.join(tempToolsDir, 'app', 'tools', 'tool-2');
    fs.mkdirSync(tool2Dir, { recursive: true });
    fs.writeFileSync(
      path.join(tool2Dir, 'tool.manifest.json'),
      JSON.stringify(createValidManifest({ id: 'tool-2', name: 'Tool 2' }))
    );

    const tools = await loadAllTools();

    expect(tools).toHaveLength(2);
    expect(tools.map((t) => t.id).sort()).toEqual(['tool-1', 'tool-2']);
  });

  it('should skip directories without tool.manifest.json', async () => {
    // Create tool directory without manifest
    const toolDir = path.join(tempToolsDir, 'app', 'tools', 'no-manifest');
    fs.mkdirSync(toolDir, { recursive: true });
    fs.writeFileSync(path.join(toolDir, 'readme.md'), 'This tool has no manifest');

    // Create valid tool
    const validToolDir = path.join(tempToolsDir, 'app', 'tools', 'valid-tool');
    fs.mkdirSync(validToolDir, { recursive: true });
    fs.writeFileSync(
      path.join(validToolDir, 'tool.manifest.json'),
      JSON.stringify(createValidManifest({ id: 'valid-tool' }))
    );

    const tools = await loadAllTools();

    expect(tools).toHaveLength(1);
    expect(tools[0].id).toBe('valid-tool');
  });

  it('should log warning for invalid manifest but continue discovery', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Create tool with invalid manifest
    const invalidToolDir = path.join(tempToolsDir, 'app', 'tools', 'invalid-tool');
    fs.mkdirSync(invalidToolDir, { recursive: true });
    fs.writeFileSync(
      path.join(invalidToolDir, 'tool.manifest.json'),
      JSON.stringify({ id: 'invalid-tool' }) // missing required fields
    );

    // Create valid tool
    const validToolDir = path.join(tempToolsDir, 'app', 'tools', 'valid-tool');
    fs.mkdirSync(validToolDir, { recursive: true });
    fs.writeFileSync(
      path.join(validToolDir, 'tool.manifest.json'),
      JSON.stringify(createValidManifest({ id: 'valid-tool' }))
    );

    const tools = await loadAllTools();

    // Should have loaded valid tool only
    expect(tools).toHaveLength(1);
    expect(tools[0].id).toBe('valid-tool');

    // Should have logged warning about invalid manifest
    expect(warnSpy).toHaveBeenCalled();
    const calls = warnSpy.mock.calls;
    const invalidToolWarning = calls.find((call: any[]) =>
      call[0]?.includes?.('Invalid tool manifest')
    );
    expect(invalidToolWarning).toBeDefined();

    warnSpy.mockRestore();
  });

  it('should log warning for malformed JSON but continue discovery', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Create tool with invalid JSON
    const invalidToolDir = path.join(tempToolsDir, 'app', 'tools', 'broken-json');
    fs.mkdirSync(invalidToolDir, { recursive: true });
    fs.writeFileSync(
      path.join(invalidToolDir, 'tool.manifest.json'),
      'invalid { json }'
    );

    // Create valid tool
    const validToolDir = path.join(tempToolsDir, 'app', 'tools', 'valid-tool');
    fs.mkdirSync(validToolDir, { recursive: true });
    fs.writeFileSync(
      path.join(validToolDir, 'tool.manifest.json'),
      JSON.stringify(createValidManifest({ id: 'valid-tool' }))
    );

    const tools = await loadAllTools();

    // Should have loaded valid tool only
    expect(tools).toHaveLength(1);
    expect(tools[0].id).toBe('valid-tool');

    // Should have logged warning about failed load
    expect(warnSpy).toHaveBeenCalled();
    const calls2 = warnSpy.mock.calls;
    const failedLoadWarning = calls2.find((call: any[]) =>
      call[0]?.includes?.('Failed to load tool manifest')
    );
    expect(failedLoadWarning).toBeDefined();

    warnSpy.mockRestore();
  });
});

describe('Tool Registry - getToolById', () => {
  let tempToolsDir: string;

  beforeEach(() => {
    tempToolsDir = path.join(os.tmpdir(), `tool-registry-test-${Date.now()}`);
    fs.mkdirSync(tempToolsDir, { recursive: true });
    vi.spyOn(process, 'cwd').mockReturnValue(tempToolsDir);
  });

  afterEach(() => {
    if (fs.existsSync(tempToolsDir)) {
      fs.rmSync(tempToolsDir, { recursive: true, force: true });
    }
    vi.restoreAllMocks();
  });

  it('should find tool by id', async () => {
    const toolDir = path.join(tempToolsDir, 'app', 'tools', 'wa-sender');
    fs.mkdirSync(toolDir, { recursive: true });
    fs.writeFileSync(
      path.join(toolDir, 'tool.manifest.json'),
      JSON.stringify(createValidManifest({ id: 'wa-sender', name: 'WhatsApp Sender' }))
    );

    const tool = await getToolById('wa-sender');

    expect(tool).toBeDefined();
    expect(tool?.id).toBe('wa-sender');
    expect(tool?.name).toBe('WhatsApp Sender');
  });

  it('should return null when tool not found', async () => {
    const toolDir = path.join(tempToolsDir, 'app', 'tools', 'wa-sender');
    fs.mkdirSync(toolDir, { recursive: true });
    fs.writeFileSync(
      path.join(toolDir, 'tool.manifest.json'),
      JSON.stringify(createValidManifest({ id: 'wa-sender' }))
    );

    const tool = await getToolById('nonexistent-tool');

    expect(tool).toBeNull();
  });
});

describe('Tool Registry - getToolByRoute', () => {
  let tempToolsDir: string;

  beforeEach(() => {
    tempToolsDir = path.join(os.tmpdir(), `tool-registry-test-${Date.now()}`);
    fs.mkdirSync(tempToolsDir, { recursive: true });
    vi.spyOn(process, 'cwd').mockReturnValue(tempToolsDir);
  });

  afterEach(() => {
    if (fs.existsSync(tempToolsDir)) {
      fs.rmSync(tempToolsDir, { recursive: true, force: true });
    }
    vi.restoreAllMocks();
  });

  it('should find tool by route', async () => {
    const toolDir = path.join(tempToolsDir, 'app', 'tools', 'wa-sender');
    fs.mkdirSync(toolDir, { recursive: true });
    fs.writeFileSync(
      path.join(toolDir, 'tool.manifest.json'),
      JSON.stringify(
        createValidManifest({
          id: 'wa-sender',
          route: '/tools/wa-sender',
        })
      )
    );

    const tool = await getToolByRoute('/tools/wa-sender');

    expect(tool).toBeDefined();
    expect(tool?.route).toBe('/tools/wa-sender');
  });

  it('should return null when route not found', async () => {
    const tool = await getToolByRoute('/tools/nonexistent');

    expect(tool).toBeNull();
  });
});
