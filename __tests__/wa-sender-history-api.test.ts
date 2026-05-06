/**
 * WA Sender History API Tests
 * Tests for GET /api/wa-sender/messages, POST, PUT, and database helpers
 *
 * Spec reference: specs/wa-sender-messages.md
 * Todo reference: 50-history-api-build.md
 */

import { describe, test, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { loadEnvConfig } from '@next/env';
import { createClient } from '@supabase/supabase-js';
import * as db from '@/app/lib/db/wa-sender';
import { createAccessToken } from '@/app/lib/jwt';
import { GET as messagesGet, POST as messagesPost } from '@/app/api/wa-sender/messages/route';
import { GET as messageIdGet, PUT as messageIdPut } from '@/app/api/wa-sender/messages/[id]/route';

// Load environment variables
loadEnvConfig(process.cwd());

const TEST_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const TEST_SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

describe('WA Sender History API', () => {
  let testClient: ReturnType<typeof createClient>;
  const testUserId = 'test-user-' + Math.random().toString(36).substr(2, 9);

  beforeAll(() => {
    // Create a test Supabase client
    testClient = createClient(TEST_SUPABASE_URL, TEST_SUPABASE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  });

  describe('Database Helpers', () => {
    describe('Create Message', () => {
      test('createMessage stores message with pending status', async () => {
        const message = await db.createMessage(testClient, {
          contact_id: 'test-contact-id',
          content: 'Hello {name}, this is a test',
          channel: 'whatsapp',
        });

        expect(message.id).toBeDefined();
        expect(message.status).toBe('pending');
        expect(message.content).toBe('Hello {name}, this is a test');
        expect(message.channel).toBe('whatsapp');
        expect(message.contact_id).toBe('test-contact-id');
      });

      test('createMessage accepts recipient_phone without contact_id', async () => {
        const message = await db.createMessage(testClient, {
          recipient_phone: '+1555123456',
          content: 'Direct message',
          channel: 'whatsapp',
        });

        expect(message.recipient_phone).toBe('+1555123456');
        expect(message.contact_id).toBeNull();
      });

      test('createMessage accepts recipient_email without contact_id', async () => {
        const message = await db.createMessage(testClient, {
          recipient_email: 'test@example.com',
          content: 'Email message',
          channel: 'email',
        });

        expect(message.recipient_email).toBe('test@example.com');
        expect(message.contact_id).toBeNull();
      });

      test('createMessage rejects missing recipient', async () => {
        await expect(
          db.createMessage(testClient, {
            content: 'No recipient',
            channel: 'whatsapp',
          })
        ).rejects.toThrow('Either contact_id or');
      });

      test('createMessage rejects invalid channel', async () => {
        await expect(
          db.createMessage(testClient, {
            recipient_phone: '+1555123456',
            content: 'Test',
            channel: 'sms' as any,
          })
        ).rejects.toThrow('Channel must be');
      });

      test('createMessage rejects empty content', async () => {
        await expect(
          db.createMessage(testClient, {
            recipient_phone: '+1555123456',
            content: '',
            channel: 'whatsapp',
          })
        ).rejects.toThrow('content is required');
      });
    });

    describe('Get Messages', () => {
      let message1: any, message2: any, message3: any;

      beforeEach(async () => {
        message1 = await db.createMessage(testClient, {
          recipient_phone: '+1555111111',
          content: 'First message',
          channel: 'whatsapp',
        });

        message2 = await db.createMessage(testClient, {
          recipient_phone: '+1555222222',
          content: 'Second message',
          channel: 'email',
        });

        message3 = await db.createMessage(testClient, {
          recipient_phone: '+1555333333',
          content: 'Third message',
          channel: 'whatsapp',
        });

        // Update statuses for testing
        await db.updateMessage(testClient, message1.id, { status: 'sent' });
        await db.updateMessage(testClient, message2.id, { status: 'failed' });
      });

      test('getMessages returns paginated list with global stats', async () => {
        const result = await db.getMessages(testClient);

        expect(result.messages.length).toBeGreaterThanOrEqual(3);
        expect(result.page).toBe(1);
        expect(result.limit).toBe(50);
        expect(result.stats).toHaveProperty('sent_count');
        expect(result.stats).toHaveProperty('failed_count');
        expect(result.stats).toHaveProperty('pending_count');
        expect(result.stats).toHaveProperty('read_count');
      });

      test('getMessages filters by status', async () => {
        const result = await db.getMessages(testClient, { status: 'sent' });

        expect(result.messages.some((m) => m.id === message1.id)).toBe(true);
        expect(result.messages.some((m) => m.id === message2.id)).toBe(false);
      });

      test('getMessages filters by channel', async () => {
        const result = await db.getMessages(testClient, { channel: 'email' });

        expect(result.messages.some((m) => m.id === message2.id)).toBe(true);
        expect(result.messages.every((m) => m.channel === 'email')).toBe(true);
      });

      test('getMessages filters by date range', async () => {
        const startDate = new Date();
        startDate.setHours(startDate.getHours() - 1);
        const endDate = new Date();
        endDate.setHours(endDate.getHours() + 1);

        const result = await db.getMessages(testClient, {
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        });

        expect(result.messages.length).toBeGreaterThanOrEqual(3);
      });

      test('getMessages searches by phone', async () => {
        const result = await db.getMessages(testClient, { search: '1555111' });

        expect(result.messages.some((m) => m.id === message1.id)).toBe(true);
      });

      test('getMessages respects pagination limit', async () => {
        const result = await db.getMessages(testClient, { page: 1, limit: 2 });

        expect(result.messages.length).toBeLessThanOrEqual(2);
        expect(result.limit).toBe(2);
      });

      afterEach(async () => {
        // Messages cannot be deleted (audit trail), cleanup via separate process
      });
    });

    describe('Get Single Message', () => {
      let message: any;

      beforeEach(async () => {
        message = await db.createMessage(testClient, {
          recipient_phone: '+1555123456',
          content: 'Single message test',
          channel: 'whatsapp',
        });
      });

      test('getMessage returns message by ID', async () => {
        const fetched = await db.getMessage(testClient, message.id);

        expect(fetched).toBeDefined();
        expect(fetched?.id).toBe(message.id);
        expect(fetched?.content).toBe('Single message test');
      });

      test('getMessage returns null for non-existent ID', async () => {
        const fetched = await db.getMessage(testClient, 'non-existent-id');

        expect(fetched).toBeNull();
      });

      afterEach(async () => {
        // Messages cannot be deleted (audit trail)
      });
    });

    describe('Update Message', () => {
      let message: any;

      beforeEach(async () => {
        message = await db.createMessage(testClient, {
          recipient_phone: '+1555123456',
          content: 'Update test',
          channel: 'whatsapp',
        });
      });

      test('updateMessage changes status', async () => {
        const updated = await db.updateMessage(testClient, message.id, {
          status: 'sent',
        });

        expect(updated?.status).toBe('sent');
      });

      test('updateMessage sets read_at when status is read', async () => {
        const now = new Date().toISOString();
        const updated = await db.updateMessage(testClient, message.id, {
          status: 'read',
          read_at: now,
        });

        expect(updated?.status).toBe('read');
        expect(updated?.read_at).toBe(now);
      });

      test('updateMessage rejects read status without read_at', async () => {
        await expect(
          db.updateMessage(testClient, message.id, {
            status: 'read',
          })
        ).rejects.toThrow('read_at is required');
      });

      test('updateMessage rejects invalid status', async () => {
        await expect(
          db.updateMessage(testClient, message.id, {
            status: 'queued' as any,
          })
        ).rejects.toThrow('Status must be');
      });

      test('updateMessage returns null for non-existent ID', async () => {
        const result = await db.updateMessage(testClient, 'non-existent-id', {
          status: 'sent',
        });

        expect(result).toBeNull();
      });

      afterEach(async () => {
        // Messages cannot be deleted (audit trail)
      });
    });
  });

  describe('API Routes', () => {
    const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-32-bytes-minimum!!!!!';
    let validToken: string;

    beforeAll(() => {
      validToken = createAccessToken('test-user-123', 'wa-sender', JWT_SECRET);
    });

    function createMockRequest(
      method: string = 'GET',
      url: string = 'http://localhost:3000/api/wa-sender/messages',
      token?: string,
      body?: Record<string, unknown>
    ): NextRequest {
      const headers = new Headers();
      headers.set('content-type', 'application/json');

      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }

      return new NextRequest(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
    }

    describe('GET /api/wa-sender/messages', () => {
      test('returns 401 without auth', async () => {
        const req = createMockRequest('GET', 'http://localhost:3000/api/wa-sender/messages');
        const response = await messagesGet(req);

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.error).toBe('Unauthorized');
      });

      test('returns 200 with paginated messages when authenticated', async () => {
        const req = createMockRequest(
          'GET',
          'http://localhost:3000/api/wa-sender/messages',
          validToken
        );
        const response = await messagesGet(req);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.messages).toBeDefined();
        expect(data.total).toBeDefined();
        expect(data.stats).toBeDefined();
      });

      test('respects pagination parameters', async () => {
        const req = createMockRequest(
          'GET',
          'http://localhost:3000/api/wa-sender/messages?page=1&limit=10',
          validToken
        );
        const response = await messagesGet(req);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.page).toBe(1);
        expect(data.limit).toBe(10);
      });
    });

    describe('POST /api/wa-sender/messages', () => {
      test('returns 401 without auth', async () => {
        const req = createMockRequest('POST', 'http://localhost:3000/api/wa-sender/messages');
        const response = await messagesPost(req);

        expect(response.status).toBe(401);
      });

      test('returns 400 without body', async () => {
        const req = createMockRequest(
          'POST',
          'http://localhost:3000/api/wa-sender/messages',
          validToken
        );
        const response = await messagesPost(req);

        expect(response.status).toBe(400);
      });

      test('returns 201 with valid body', async () => {
        const req = createMockRequest(
          'POST',
          'http://localhost:3000/api/wa-sender/messages',
          validToken,
          {
            recipient_phone: '+1555123456',
            content: 'Test message',
            channel: 'whatsapp',
          }
        );
        const response = await messagesPost(req);

        expect(response.status).toBe(201);
        const data = await response.json();
        expect(data.id).toBeDefined();
        expect(data.status).toBe('pending');
      });

      test('returns 413 for oversized payload', async () => {
        const req = new NextRequest('http://localhost:3000/api/wa-sender/messages', {
          method: 'POST',
          headers: {
            'content-length': (200 * 1024).toString(), // 200KB
            'authorization': `Bearer ${validToken}`,
          },
        });
        const response = await messagesPost(req);

        expect(response.status).toBe(413);
      });
    });

    describe('GET /api/wa-sender/messages/[id]', () => {
      test('returns 401 without auth', async () => {
        const req = createMockRequest('GET', 'http://localhost:3000/api/wa-sender/messages/test-id');
        const response = await messageIdGet(req, { params: Promise.resolve({ id: 'test-id' }) });

        expect(response.status).toBe(401);
      });

      test('returns 404 for non-existent message', async () => {
        const req = createMockRequest(
          'GET',
          'http://localhost:3000/api/wa-sender/messages/non-existent',
          validToken
        );
        const response = await messageIdGet(req, {
          params: Promise.resolve({ id: 'non-existent' }),
        });

        expect(response.status).toBe(404);
      });
    });

    describe('PUT /api/wa-sender/messages/[id]', () => {
      test('returns 401 without auth', async () => {
        const req = createMockRequest(
          'PUT',
          'http://localhost:3000/api/wa-sender/messages/test-id',
          undefined,
          { status: 'sent' }
        );
        const response = await messageIdPut(req, { params: Promise.resolve({ id: 'test-id' }) });

        expect(response.status).toBe(401);
      });

      test('returns 404 for non-existent message', async () => {
        const req = createMockRequest(
          'PUT',
          'http://localhost:3000/api/wa-sender/messages/non-existent',
          validToken,
          { status: 'sent' }
        );
        const response = await messageIdPut(req, {
          params: Promise.resolve({ id: 'non-existent' }),
        });

        expect(response.status).toBe(404);
      });

      test('rejects updating non-allowed fields', async () => {
        const req = createMockRequest(
          'PUT',
          'http://localhost:3000/api/wa-sender/messages/test-id',
          validToken,
          { content: 'new content' }
        );
        const response = await messageIdPut(req, {
          params: Promise.resolve({ id: 'test-id' }),
        });

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toContain('Cannot update fields');
      });
    });
  });
});
