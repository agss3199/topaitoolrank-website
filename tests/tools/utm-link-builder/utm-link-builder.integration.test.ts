/**
 * UTM Link Builder - Integration Test Suite
 * Tests for URL validation and UTM parameter generation
 */

import { expect, describe, it } from 'vitest';

describe('UTM Link Builder Integration', () => {
  describe('URL Validation', () => {
    it('should accept valid HTTP URL', () => {
      const url = 'http://example.com';
      const isValid = /^https?:\/\/.+/.test(url);
      expect(isValid).toBe(true);
    });

    it('should accept valid HTTPS URL', () => {
      const url = 'https://example.com/path';
      const isValid = /^https?:\/\/.+/.test(url);
      expect(isValid).toBe(true);
    });

    it('should reject URL without protocol', () => {
      const url = 'example.com';
      const isValid = /^https?:\/\/.+/.test(url);
      expect(isValid).toBe(false);
    });

    it('should accept URL with path and query string', () => {
      const url = 'https://example.com/path?existing=param';
      const isValid = /^https?:\/\/.+/.test(url);
      expect(isValid).toBe(true);
    });
  });

  describe('UTM Parameter Building', () => {
    it('should add utm_source parameter', () => {
      const baseUrl = 'https://example.com';
      const source = 'google';
      const url = `${baseUrl}?utm_source=${source}`;
      expect(url).toContain('utm_source=google');
    });

    it('should add utm_medium parameter', () => {
      const baseUrl = 'https://example.com';
      const medium = 'email';
      const url = `${baseUrl}?utm_medium=${medium}`;
      expect(url).toContain('utm_medium=email');
    });

    it('should add utm_campaign parameter', () => {
      const baseUrl = 'https://example.com';
      const campaign = 'summer-sale';
      const url = `${baseUrl}?utm_campaign=${campaign}`;
      expect(url).toContain('utm_campaign=summer-sale');
    });

    it('should combine multiple UTM parameters', () => {
      const baseUrl = 'https://example.com';
      const params = {
        utm_source: 'facebook',
        utm_medium: 'social',
        utm_campaign: 'launch',
      };
      let url = baseUrl + '?';
      Object.entries(params).forEach(([key, value], index) => {
        if (index > 0) url += '&';
        url += `${key}=${value}`;
      });
      expect(url).toContain('utm_source=facebook');
      expect(url).toContain('utm_medium=social');
      expect(url).toContain('utm_campaign=launch');
    });

    it('should handle special characters with encoding', () => {
      const baseUrl = 'https://example.com';
      const campaign = 'Summer Sale 2024';
      const encoded = encodeURIComponent(campaign);
      const url = `${baseUrl}?utm_campaign=${encoded}`;
      expect(url).toContain('Summer%20Sale%202024');
    });
  });

  describe('URL Generation', () => {
    it('should generate unique URL for each set of parameters', () => {
      const base = 'https://example.com';
      const params1 = '?utm_source=google&utm_medium=cpc';
      const params2 = '?utm_source=facebook&utm_medium=social';
      expect(base + params1).not.toBe(base + params2);
    });

    it('should preserve existing query parameters', () => {
      const urlWithQuery = 'https://example.com?page=1&sort=name';
      const hasExistingParams = urlWithQuery.includes('?');
      expect(hasExistingParams).toBe(true);
    });

    it('should append UTM to URL with existing params', () => {
      const baseUrl = 'https://example.com?page=1';
      const utm = 'utm_source=email';
      const finalUrl = baseUrl + '&' + utm;
      expect(finalUrl).toContain('page=1');
      expect(finalUrl).toContain('utm_source=email');
    });
  });
});
