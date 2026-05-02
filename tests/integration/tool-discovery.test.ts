/**
 * Integration Test: Tool Discovery
 *
 * Tests tool discovery against real manifest files in the project
 */

import { describe, it, expect } from 'vitest';
import { loadAllTools, getToolById } from '@/app/lib/tool-registry';

describe('Tool Discovery Integration', () => {
  it('should discover the WA Sender tool from manifest file', async () => {
    const tools = await loadAllTools();

    // WA Sender should be discovered
    expect(tools.length).toBeGreaterThan(0);

    const waSender = tools.find((t) => t.id === 'wa-sender');
    expect(waSender).toBeDefined();
    expect(waSender?.name).toBe('WhatsApp Sender');
    expect(waSender?.version).toBe('1.0.0');
  });

  it('should get WA Sender tool by ID', async () => {
    const tool = await getToolById('wa-sender');

    expect(tool).toBeDefined();
    expect(tool?.id).toBe('wa-sender');
    expect(tool?.name).toBe('WhatsApp Sender');
    expect(tool?.description).toContain('WhatsApp');
  });

  it('should have correct WA Sender manifest structure', async () => {
    const tool = await getToolById('wa-sender');

    expect(tool).toBeDefined();
    expect(tool?.route).toBe('/tools/wa-sender');
    expect(tool?.auth_required).toBe(true);
    expect(tool?.scope).toContain('wa-sender:read');
    expect(tool?.scope).toContain('wa-sender:write');

    // Check navigation
    expect(tool?.navigation.length).toBeGreaterThan(0);
    const dashboardNav = tool?.navigation.find((n) => n.label === 'Dashboard');
    expect(dashboardNav?.href).toBe('/tools/wa-sender');

    // Check database tables
    expect(tool?.database_tables).toContain('wa_sender_messages');

    // Check API endpoints
    expect(tool?.api_endpoints).toContain('/api/wa-sender/messages');

    // Check deployment config
    expect(tool?.deployment.independent).toBe(true);
    expect(tool?.deployment.can_deploy_without_core).toBe(true);
    expect(tool?.deployment.requires_migration).toBe(true);
  });

  it('should have environment variables declared in WA Sender manifest', async () => {
    const tool = await getToolById('wa-sender');

    expect(tool?.environment_variables).toContain('WHATSAPP_API_KEY');
    expect(tool?.environment_variables).toContain('WHATSAPP_BUSINESS_ACCOUNT_ID');
  });
});
