/**
 * Vitest Setup
 *
 * Configures browser API globals for unit and integration tests.
 * happy-dom provides a lightweight DOM implementation for localStorage, fetch, etc.
 */

import { expect, afterEach, beforeEach } from "vitest";

// Mock fetch if needed (happy-dom provides basic fetch, but tests may need specific behavior)
if (typeof global.fetch === "undefined") {
  global.fetch = async () => {
    throw new Error("fetch not available");
  };
}

// Mock navigator if needed
if (typeof global.navigator === "undefined") {
  Object.defineProperty(global, "navigator", {
    value: {
      clipboard: {
        writeText: async (text: string) => {
          // Mock clipboard implementation
          return Promise.resolve();
        },
        readText: async () => {
          return Promise.resolve("");
        },
      },
      userAgent: "Node.js/vitest",
    },
    writable: true,
    configurable: true,
  });
}

// Ensure happy-dom's localStorage is available
beforeEach(() => {
  // happy-dom automatically provides localStorage when using happy-dom environment
  if (typeof localStorage !== "undefined") {
    localStorage.clear();
  }
});

afterEach(() => {
  if (typeof localStorage !== "undefined") {
    localStorage.clear();
  }
});
