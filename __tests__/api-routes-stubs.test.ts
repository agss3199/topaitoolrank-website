import { describe, test, expect, beforeEach, beforeAll, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { loadEnvConfig } from '@next/env';
import { GET as templatesGet, POST as templatesPost } from '@/app/api/wa-sender/templates/route';
import { GET as contactsGet, POST as contactsPost } from '@/app/api/wa-sender/contacts/route';
import { GET as messagesGet, POST as messagesPost } from '@/app/api/wa-sender/messages/route';
import { POST as contactsImportPost } from '@/app/api/wa-sender/contacts/import/route';
import { GET as contactsExportGet } from '@/app/api/wa-sender/contacts/export/route';
import { createAccessToken } from '@/app/lib/jwt';

// Load .env variables into process.env
loadEnvConfig(process.cwd());

// Test setup: ensure JWT_SECRET is set before tests run
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here-change-in-production-at-least-32-bytes';
const TEST_USER_ID = 'test-user-123';
const TEST_TOOL_ID = 'wa-sender';

beforeAll(() => {
  // Set JWT_SECRET in environment for the test suite
  process.env.JWT_SECRET = JWT_SECRET;
});

/**
 * Create a mock NextRequest with optional authorization token and body
 */
function createMockRequest(
  method: string = 'GET',
  url: string = 'http://localhost:3000/api/wa-sender/templates',
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

describe('API Routes Stubs', () => {
  let validToken: string;

  beforeEach(() => {
    // Create a valid token for authenticated tests
    validToken = createAccessToken(TEST_USER_ID, TEST_TOOL_ID, JWT_SECRET);
  });

  describe('Templates Routes', () => {
    test('GET /api/wa-sender/templates returns 401 without auth', async () => {
      const req = createMockRequest('GET', 'http://localhost:3000/api/wa-sender/templates');
      const response = await templatesGet(req);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    test('GET /api/wa-sender/templates returns 200 with empty array when authenticated', async () => {
      const req = createMockRequest(
        'GET',
        'http://localhost:3000/api/wa-sender/templates',
        validToken
      );
      const response = await templatesGet(req);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.templates).toEqual([]);
    });

    test('POST /api/wa-sender/templates returns 400 without body', async () => {
      const req = createMockRequest(
        'POST',
        'http://localhost:3000/api/wa-sender/templates',
        validToken
      );
      const response = await templatesPost(req);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    test('POST /api/wa-sender/templates returns 201 with valid body', async () => {
      const req = createMockRequest(
        'POST',
        'http://localhost:3000/api/wa-sender/templates',
        validToken,
        {
          name: 'Test Template',
          content: 'Hello {name}, welcome!',
          category: 'greeting',
        }
      );
      const response = await templatesPost(req);

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.id).toBeDefined();
      expect(data.name).toBe('Test Template');
    });

    test('POST /api/wa-sender/templates returns 401 without auth', async () => {
      const req = createMockRequest('POST', 'http://localhost:3000/api/wa-sender/templates');
      const response = await templatesPost(req);

      expect(response.status).toBe(401);
    });
  });

  describe('Contacts Routes', () => {
    test('GET /api/wa-sender/contacts returns 401 without auth', async () => {
      const req = createMockRequest('GET', 'http://localhost:3000/api/wa-sender/contacts');
      const response = await contactsGet(req);

      expect(response.status).toBe(401);
    });

    test('GET /api/wa-sender/contacts returns 200 with paginated response when authenticated', async () => {
      const req = createMockRequest(
        'GET',
        'http://localhost:3000/api/wa-sender/contacts?page=1&limit=50',
        validToken
      );
      const response = await contactsGet(req);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.contacts).toEqual([]);
      expect(data.total).toBe(0);
      expect(data.page).toBe(1);
      expect(data.limit).toBe(50);
    });

    test('POST /api/wa-sender/contacts returns 501 when authenticated', async () => {
      const req = createMockRequest(
        'POST',
        'http://localhost:3000/api/wa-sender/contacts',
        validToken
      );
      const response = await contactsPost(req);

      expect(response.status).toBe(501);
    });

    test('POST /api/wa-sender/contacts/import returns 501 when authenticated', async () => {
      const req = createMockRequest(
        'POST',
        'http://localhost:3000/api/wa-sender/contacts/import',
        validToken
      );
      const response = await contactsImportPost(req);

      expect(response.status).toBe(501);
    });

    test('GET /api/wa-sender/contacts/export returns 200 CSV when authenticated', async () => {
      const req = createMockRequest(
        'GET',
        'http://localhost:3000/api/wa-sender/contacts/export',
        validToken
      );
      const response = await contactsExportGet(req);

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/csv');
      const csv = await response.text();
      expect(csv).toContain('name,phone,email,company');
    });
  });

  describe('Messages Routes', () => {
    test('GET /api/wa-sender/messages returns 401 without auth', async () => {
      const req = createMockRequest('GET', 'http://localhost:3000/api/wa-sender/messages');
      const response = await messagesGet(req);

      expect(response.status).toBe(401);
    });

    test('GET /api/wa-sender/messages returns 200 with stats when authenticated', async () => {
      const req = createMockRequest(
        'GET',
        'http://localhost:3000/api/wa-sender/messages?page=1&limit=50',
        validToken
      );
      const response = await messagesGet(req);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.messages).toEqual([]);
      expect(data.total).toBe(0);
      expect(data.stats).toEqual({
        sent_count: 0,
        failed_count: 0,
        pending_count: 0,
        read_count: 0,
      });
    });

    test('POST /api/wa-sender/messages returns 501 when authenticated', async () => {
      const req = createMockRequest(
        'POST',
        'http://localhost:3000/api/wa-sender/messages',
        validToken
      );
      const response = await messagesPost(req);

      expect(response.status).toBe(501);
    });
  });

  describe('Payload Size Limits', () => {
    test('POST /api/wa-sender/contacts/import rejects oversized payloads', async () => {
      const req = new NextRequest('http://localhost:3000/api/wa-sender/contacts/import', {
        method: 'POST',
        headers: {
          'content-length': (5 * 1024 * 1024).toString(), // 5MB
          'authorization': `Bearer ${validToken}`,
        },
      });
      const response = await contactsImportPost(req);

      expect(response.status).toBe(413);
      const data = await response.json();
      expect(data.error).toContain('exceeds');
    });

    test('POST /api/wa-sender/messages rejects oversized payloads', async () => {
      const req = new NextRequest('http://localhost:3000/api/wa-sender/messages', {
        method: 'POST',
        headers: {
          'content-length': (200 * 1024).toString(), // 200KB
          'authorization': `Bearer ${validToken}`,
        },
      });
      const response = await messagesPost(req);

      expect(response.status).toBe(413);
      const data = await response.json();
      expect(data.error).toContain('exceeds');
    });
  });

  describe('Dynamic Route Parameters', () => {
    test('GET /api/wa-sender/templates/[id] returns 401 without auth', async () => {
      const { GET: templateIdGet } = await import('@/app/api/wa-sender/templates/[id]/route');
      const req = createMockRequest('GET', 'http://localhost:3000/api/wa-sender/templates/test-id');
      const response = await templateIdGet(req, { params: Promise.resolve({ id: 'test-id' }) });

      expect(response.status).toBe(401);
    });

    test('GET /api/wa-sender/templates/[id] returns 404 when authenticated', async () => {
      const { GET: templateIdGet } = await import('@/app/api/wa-sender/templates/[id]/route');
      const req = createMockRequest(
        'GET',
        'http://localhost:3000/api/wa-sender/templates/test-id',
        validToken
      );
      const response = await templateIdGet(req, { params: Promise.resolve({ id: 'test-id' }) });

      expect(response.status).toBe(404);
    });
  });
});
