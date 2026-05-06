/**
 * Phone Number Validation for WhatsApp Link Generator
 *
 * Validates and formats international phone numbers
 * Returns phone number suitable for wa.me URL
 */

export interface PhoneValidationResult {
  valid: boolean;
  formatted: string;
  error: string | null;
}

/**
 * Validate and format international phone number
 *
 * Accepts formats:
 * - +1234567890 (with country code)
 * - 1234567890 (auto-add +)
 * - +1 (234) 567-8900 (with formatting)
 *
 * Returns: +[country][number]
 */
export function validatePhoneNumber(phone: string): PhoneValidationResult {
  if (!phone) {
    return { valid: false, formatted: "", error: "Phone number is required" };
  }

  // Remove all non-digit characters except leading +
  let cleaned = phone.replace(/\D/g, "");

  // If doesn't start with +, add it
  if (!phone.includes("+")) {
    // If it's 10 digits (US), add country code 1
    if (cleaned.length === 10) {
      cleaned = "1" + cleaned;
    }
  } else {
    // Extract digits after +
    const match = phone.match(/\+(\d+)/);
    if (match) {
      cleaned = match[1];
    }
  }

  // Validate length (most countries: 7-15 digits)
  if (cleaned.length < 7) {
    return {
      valid: false,
      formatted: "",
      error: "Phone number too short (minimum 7 digits)",
    };
  }

  if (cleaned.length > 15) {
    return {
      valid: false,
      formatted: "",
      error: "Phone number too long (maximum 15 digits)",
    };
  }

  // Check if starts with 0 (local format indicator)
  if (cleaned.startsWith("0")) {
    return {
      valid: false,
      formatted: "",
      error: "Remove leading 0 and include country code",
    };
  }

  return {
    valid: true,
    formatted: "+" + cleaned,
    error: null,
  };
}

/**
 * Get country code from phone number
 */
export function extractCountryCode(phone: string): string | null {
  const match = phone.match(/\+?(\d{1,3})\d+/);
  return match ? match[1] : null;
}

/**
 * Common country codes for reference
 */
export const COUNTRY_CODES: { [key: string]: string } = {
  US: "1",
  GB: "44",
  CA: "1",
  AU: "61",
  DE: "49",
  FR: "33",
  IT: "39",
  ES: "34",
  IN: "91",
  JP: "81",
  BR: "55",
  MX: "52",
  ZA: "27",
  KE: "254",
  NG: "234",
  EG: "20",
  SG: "65",
  PH: "63",
  TH: "66",
};
