/**
 * Phone Number Normalization - Unit Tests
 * Tests libphonenumber-js integration for E.164 formatting
 *
 * Run with: npm test -- contacts-phone-normalization.test --run
 */

import { describe, test, expect } from 'vitest';
import {
  normalizePhone,
  detectCountryCode,
  normalizePhoneWithFallback,
  normalizePhoneBatch,
} from '@/app/lib/contacts';

describe('Phone Number Normalization', () => {
  describe('normalizePhone - US numbers', () => {
    test('normalizes US number without country code', () => {
      const result = normalizePhone('212-555-0173', 'US');

      expect(result.valid).toBe(true);
      expect(result.normalized).toBe('+12125550173');
      expect(result.original).toBe('212-555-0173');
      expect(result.error).toBeUndefined();
    });

    test('normalizes US number with +1', () => {
      const result = normalizePhone('+1-415-555-0173', 'US');

      expect(result.valid).toBe(true);
      expect(result.normalized).toBe('+14155550173');
    });

    test('normalizes US number with parentheses', () => {
      const result = normalizePhone('(310) 555-0173', 'US');

      expect(result.valid).toBe(true);
      expect(result.normalized).toBe('+13105550173');
    });

    test('normalizes US number without formatting', () => {
      const result = normalizePhone('5125550173', 'US');

      expect(result.valid).toBe(true);
      expect(result.normalized).toBe('+15125550173');
    });
  });

  describe('normalizePhone - International numbers', () => {
    test('normalizes UK number with +44', () => {
      const result = normalizePhone('+44 207 946 0958', 'GB');

      expect(result.valid).toBe(true);
      expect(result.normalized).toBe('+442079460958');
    });

    test('normalizes UK number without +', () => {
      const result = normalizePhone('0207946 0958', 'GB');

      expect(result.valid).toBe(true);
      expect(result.normalized).toBe('+442079460958');
    });

    test('normalizes India number', () => {
      const result = normalizePhone('+91 98765 43210', 'IN');

      expect(result.valid).toBe(true);
      expect(result.normalized).toBe('+919876543210');
    });

    test('normalizes Canada number', () => {
      const result = normalizePhone('613-555-1212', 'CA');

      expect(result.valid).toBe(true);
      expect(result.normalized).toBe('+16135551212');
    });
  });

  describe('normalizePhone - Error cases', () => {
    test('returns valid false for random string', () => {
      const result = normalizePhone('not-a-phone', 'US');

      expect(result.valid).toBe(false);
      expect(result.normalized).toBeNull();
      expect(result.error).toBeDefined();
    });

    test('returns valid false for too short number', () => {
      const result = normalizePhone('123', 'US');

      expect(result.valid).toBe(false);
      expect(result.normalized).toBeNull();
    });

    test('returns valid false for empty string', () => {
      const result = normalizePhone('', 'US');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('empty');
    });

    test('returns valid false for wrong country code', () => {
      const result = normalizePhone('0207946 0958', 'US');

      expect(result.valid).toBe(false);
      expect(result.normalized).toBeNull();
    });

    test('returns original in error case', () => {
      const original = 'invalid-phone-123';
      const result = normalizePhone(original, 'US');

      expect(result.original).toBe(original);
      expect(result.valid).toBe(false);
    });
  });

  describe('detectCountryCode', () => {
    test('detects US from +1', () => {
      const code = detectCountryCode('+12125550173');
      expect(code).toBe('US');
    });

    test('detects UK from +44', () => {
      const code = detectCountryCode('+442079460958');
      expect(code).toBe('GB');
    });

    test('detects India from +91', () => {
      const code = detectCountryCode('+919876543210');
      expect(code).toBe('IN');
    });

    test('returns null for local number without +', () => {
      const code = detectCountryCode('2125550173');
      expect(code).toBeNull();
    });

    test('returns null for non-international format', () => {
      const code = detectCountryCode('(212) 555-0173');
      expect(code).toBeNull();
    });

    test('returns null for invalid format', () => {
      const code = detectCountryCode('not-a-phone');
      expect(code).toBeNull();
    });
  });

  describe('normalizePhoneWithFallback', () => {
    test('uses detected country when available', () => {
      const result = normalizePhoneWithFallback('+442079460958', 'US');

      expect(result.valid).toBe(true);
      expect(result.normalized).toBe('+442079460958');
    });

    test('uses fallback for local number', () => {
      const result = normalizePhoneWithFallback('2125550173', 'US');

      expect(result.valid).toBe(true);
      expect(result.normalized).toBe('+12125550173');
    });

    test('uses fallback when no country detected', () => {
      const result = normalizePhoneWithFallback('0207946 0958', 'GB');

      expect(result.valid).toBe(true);
      expect(result.normalized).toBe('+442079460958');
    });

    test('defaults to US when no fallback provided', () => {
      const result = normalizePhoneWithFallback('2125550173');

      expect(result.valid).toBe(true);
      expect(result.normalized).toBe('+12125550173');
    });
  });

  describe('normalizePhoneBatch', () => {
    test('normalizes multiple numbers', () => {
      const phones = ['212-555-0173', '+44 1632 960000', '0207946 0958'];
      const results = normalizePhoneBatch(phones, 'US');

      expect(results).toHaveLength(3);
      expect(results[0].normalized).toBe('+12125550173');
      expect(results[1].valid).toBe(false); // Wrong country for second
      expect(results[2].valid).toBe(false); // Wrong country for third without +
    });

    test('batch handles mixed valid and invalid', () => {
      const phones = ['212-555-0173', 'invalid', '+12125559876'];
      const results = normalizePhoneBatch(phones, 'US');

      expect(results[0].valid).toBe(true);
      expect(results[1].valid).toBe(false);
      expect(results[2].valid).toBe(true);
    });

    test('batch preserves original values', () => {
      const phones = ['212-555-0173', 'invalid'];
      const results = normalizePhoneBatch(phones, 'US');

      expect(results[0].original).toBe('212-555-0173');
      expect(results[1].original).toBe('invalid');
    });
  });

  describe('E.164 format compliance', () => {
    test('always includes country code', () => {
      const result = normalizePhone('2125550173', 'US');
      expect(result.normalized).toMatch(/^\+\d+$/);
    });

    test('never includes spaces', () => {
      const result = normalizePhone('+44 207 946 0958', 'GB');
      expect(result.normalized).not.toContain(' ');
    });

    test('never includes dashes', () => {
      const result = normalizePhone('+1-415-555-0173', 'US');
      expect(result.normalized).not.toContain('-');
    });

    test('never includes parentheses', () => {
      const result = normalizePhone('(212) 555-0173', 'US');
      expect(result.normalized).not.toContain('(');
      expect(result.normalized).not.toContain(')');
    });
  });
});
