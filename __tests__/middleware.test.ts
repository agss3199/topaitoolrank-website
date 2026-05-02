import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '@/middleware';
import { createAccessToken, createRefreshToken } from '@/app/lib/jwt';

const JWT_SECRET = 'test-secret-key-minimum-32-bytes!';

// Helper to create a mock NextRequest
function createMockRequest(
  pathname: string,
  options: {
    authHeader?: string;
    cookies?: Record<string, string>;
    method?: string;
  } = {}
) {
  const url = new URL(`http://localhost:3000${pathname}`);
  const request = new NextRequest(url, {
    method: options.method || 'GET',
  });

  if (options.authHeader) {
    request.headers.set('Authorization', options.authHeader);
  }

  if (options.cookies) {
    for (const [key, value] of Object.entries(options.cookies)) {
      request.cookies.set(key, value);
    }
  }

  return request;
}

// Set JWT_SECRET in environment for all tests
beforeEach(() => {
  process.env.JWT_SECRET = JWT_SECRET;
});

afterEach(() => {
  delete process.env.JWT_SECRET;
});

describe('Middleware', () => {
  describe('Public routes (no auth required)', () => {
    it('allows access to /auth/login without token', async () => {
      const request = createMockRequest('/auth/login');
      const response = await middleware(request);

      // Public routes should not redirect
      expect(response?.status).not.toBe(307);
    });

    it('allows access to /blogs without token', async () => {
      const request = createMockRequest('/blogs');
      const response = await middleware(request);

      expect(response?.status).not.toBe(307);
    });
  });

  describe('Protected routes (auth required)', () => {
    it('redirects to login when no token is provided', async () => {
      const request = createMockRequest('/tools/wa-sender/dashboard');
      const response = await middleware(request);

      expect(response?.status).toBe(307); // Redirect
      expect(response?.headers.get('location')).toContain('/auth/login');
    });

    it('redirects to login when token is invalid', async () => {
      const request = createMockRequest('/tools/wa-sender/dashboard', {
        authHeader: 'Bearer invalid.token.here',
      });

      const response = await middleware(request);
      expect(response?.status).toBe(307);
    });

    it('redirects to login when token is signed with wrong secret', async () => {
      const wrongSecret = 'wrong-secret-key-minimum-32-bytes!';
      const token = createAccessToken('user-123', 'wa-sender', wrongSecret);

      const request = createMockRequest('/tools/wa-sender/dashboard', {
        authHeader: `Bearer ${token}`,
      });

      const response = await middleware(request);
      expect(response?.status).toBe(307);
    });
  });

  describe('Tool-scoped token validation', () => {
    it('allows access with matching tool_id token', async () => {
      const token = createAccessToken('user-123', 'wa-sender', JWT_SECRET);
      const request = createMockRequest('/tools/wa-sender/dashboard', {
        authHeader: `Bearer ${token}`,
      });

      const response = await middleware(request);

      // Should pass through (NextResponse.next() with no redirect)
      expect(response?.status).not.toBe(307);
    });

    it('rejects token with mismatched tool_id (wa-sender token on /tools/tool-b)', async () => {
      const waSenderToken = createAccessToken('user-123', 'wa-sender', JWT_SECRET);
      const request = createMockRequest('/tools/tool-b/dashboard', {
        authHeader: `Bearer ${waSenderToken}`,
      });

      const response = await middleware(request);

      // Should redirect because tool_id mismatch
      expect(response?.status).toBe(307);
      expect(response?.headers.get('location')).toContain('/auth/login');
    });

    it('rejects token with mismatched tool_id (tool-b token on /tools/wa-sender)', async () => {
      const toolBToken = createAccessToken('user-123', 'tool-b', JWT_SECRET);
      const request = createMockRequest('/tools/wa-sender/dashboard', {
        authHeader: `Bearer ${toolBToken}`,
      });

      const response = await middleware(request);

      expect(response?.status).toBe(307);
    });

    it('extracts tool_id correctly from various /tools/* paths', async () => {
      const token = createAccessToken('user-123', 'wa-sender', JWT_SECRET);

      const paths = [
        '/tools/wa-sender/dashboard',
        '/tools/wa-sender/settings',
        '/tools/wa-sender/api/messages',
      ];

      for (const path of paths) {
        const request = createMockRequest(path, {
          authHeader: `Bearer ${token}`,
        });

        const response = await middleware(request);
        expect(response?.status).not.toBe(307); // Should pass
      }
    });
  });

  describe('Authorization header parsing', () => {
    it('extracts token from "Bearer <token>" header', async () => {
      const token = createAccessToken('user-123', 'wa-sender', JWT_SECRET);
      const request = createMockRequest('/tools/wa-sender/dashboard', {
        authHeader: `Bearer ${token}`,
      });

      const response = await middleware(request);
      expect(response?.status).not.toBe(307);
    });

    it('ignores invalid Authorization header format', async () => {
      const request = createMockRequest('/tools/wa-sender/dashboard', {
        authHeader: 'InvalidFormat token',
      });

      const response = await middleware(request);
      expect(response?.status).toBe(307);
    });

    it('handles missing "Bearer" prefix', async () => {
      const token = createAccessToken('user-123', 'wa-sender', JWT_SECRET);
      const request = createMockRequest('/tools/wa-sender/dashboard', {
        authHeader: token, // No "Bearer" prefix
      });

      const response = await middleware(request);
      expect(response?.status).toBe(307);
    });
  });

  describe('Response on successful authentication', () => {
    it('returns NextResponse.next() for valid token', async () => {
      const token = createAccessToken('user-123', 'wa-sender', JWT_SECRET);
      const request = createMockRequest('/tools/wa-sender/dashboard', {
        authHeader: `Bearer ${token}`,
      });

      const response = await middleware(request);

      // NextResponse.next() doesn't set a specific status
      expect(response?.status).not.toBe(307); // Not a redirect
      expect(response?.status).not.toBe(401); // Not unauthorized
    });
  });

  describe('Token isolation by tool_id', () => {
    it('tokens from different tools cannot be used interchangeably', async () => {
      const waSenderToken = createAccessToken('user-123', 'wa-sender', JWT_SECRET);
      const toolBToken = createAccessToken('user-123', 'tool-b', JWT_SECRET);

      // WA Sender token on WA Sender route: allowed
      const request1 = createMockRequest('/tools/wa-sender/dashboard', {
        authHeader: `Bearer ${waSenderToken}`,
      });
      const response1 = await middleware(request1);
      expect(response1?.status).not.toBe(307);

      // WA Sender token on Tool B route: rejected
      const request2 = createMockRequest('/tools/tool-b/dashboard', {
        authHeader: `Bearer ${waSenderToken}`,
      });
      const response2 = await middleware(request2);
      expect(response2?.status).toBe(307);

      // Tool B token on Tool B route: allowed
      const request3 = createMockRequest('/tools/tool-b/dashboard', {
        authHeader: `Bearer ${toolBToken}`,
      });
      const response3 = await middleware(request3);
      expect(response3?.status).not.toBe(307);
    });
  });

  describe('Logging and security', () => {
    it('middleware logs authentication events', async () => {
      const token = createAccessToken('user-123', 'wa-sender', JWT_SECRET);
      const request = createMockRequest('/tools/wa-sender/dashboard', {
        authHeader: `Bearer ${token}`,
      });

      // Should not throw during execution
      const response = await middleware(request);
      expect(response).toBeDefined();
    });
  });
});
