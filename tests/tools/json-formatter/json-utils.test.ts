/**
 * JSON Formatter - Utility Functions Test Suite
 * Unit tests for JSON parsing, formatting, validation, and transformation
 */

import {
  parseJSON,
  formatJSON,
  minifyJSON,
  sortJSONKeys,
  jsonToCSV,
  getJSONStats,
  getComplexity,
} from '../../../app/tools/json-formatter/lib/json-utils';

describe('parseJSON', () => {
  it('should parse valid JSON object', () => {
    const json = '{"name":"John","age":30}';
    const result = parseJSON(json);
    expect(result.valid).toBe(true);
    expect(result.data).toEqual({ name: 'John', age: 30 });
  });

  it('should parse valid JSON array', () => {
    const json = '[1,2,3]';
    const result = parseJSON(json);
    expect(result.valid).toBe(true);
    expect(result.data).toEqual([1, 2, 3]);
  });

  it('should parse nested JSON', () => {
    const json = '{"user":{"name":"Alice","address":{"city":"NYC"}}}';
    const result = parseJSON(json);
    expect(result.valid).toBe(true);
    expect(result.data.user.address.city).toBe('NYC');
  });

  it('should reject invalid JSON', () => {
    const json = '{invalid}';
    const result = parseJSON(json);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should reject empty string', () => {
    const result = parseJSON('');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('empty');
  });

  it('should reject whitespace-only string', () => {
    const result = parseJSON('   \n\t  ');
    expect(result.valid).toBe(false);
  });

  it('should handle JSON with null values', () => {
    const json = '{"value":null}';
    const result = parseJSON(json);
    expect(result.valid).toBe(true);
    expect(result.data.value).toBeNull();
  });

  it('should handle JSON with boolean values', () => {
    const json = '{"active":true,"deleted":false}';
    const result = parseJSON(json);
    expect(result.valid).toBe(true);
    expect(result.data.active).toBe(true);
    expect(result.data.deleted).toBe(false);
  });
});

describe('formatJSON', () => {
  it('should format JSON with default indentation', () => {
    const json = '{"name":"John","age":30}';
    const result = formatJSON(json);
    expect(result).toContain('\n');
    expect(result).toContain('  ');
  });

  it('should format JSON with custom indentation', () => {
    const json = '{"a":1,"b":2}';
    const result = formatJSON(json, 4);
    expect(result).toContain('    '); // 4 spaces
  });

  it('should return empty string for invalid JSON', () => {
    const result = formatJSON('{invalid}');
    expect(result).toBe('');
  });

  it('should preserve nested structure', () => {
    const json = '{"user":{"name":"Alice","friends":["Bob","Carol"]}}';
    const result = formatJSON(json);
    expect(result).toContain('"user"');
    expect(result).toContain('"name"');
    expect(result).toContain('"Bob"');
  });

  it('should handle arrays at root level', () => {
    const json = '[1,2,3]';
    const result = formatJSON(json);
    expect(result).toContain('1');
    expect(result).toContain('2');
    expect(result).toContain('3');
  });
});

describe('minifyJSON', () => {
  it('should remove whitespace and newlines', () => {
    const json = '{\n  "name": "John",\n  "age": 30\n}';
    const result = minifyJSON(json);
    expect(result).not.toContain('\n');
    expect(result).not.toContain('  ');
  });

  it('should preserve string values with spaces', () => {
    const json = '{"message":"hello world"}';
    const result = minifyJSON(json);
    expect(result).toContain('hello world');
  });

  it('should return empty string for invalid JSON', () => {
    const result = minifyJSON('{invalid}');
    expect(result).toBe('');
  });

  it('should handle arrays in minify', () => {
    const json = '[\n  1,\n  2,\n  3\n]';
    const result = minifyJSON(json);
    expect(result).toBe('[1,2,3]');
  });
});

describe('sortJSONKeys', () => {
  it('should sort object keys alphabetically', () => {
    const json = '{"zebra":1,"apple":2,"banana":3}';
    const result = sortJSONKeys(json);
    expect(result.indexOf('"apple"')).toBeLessThan(result.indexOf('"banana"'));
    expect(result.indexOf('"banana"')).toBeLessThan(result.indexOf('"zebra"'));
  });

  it('should sort nested object keys', () => {
    const json = '{"z":{"y":1,"x":2},"a":1}';
    const result = sortJSONKeys(json);
    const parsed = JSON.parse(result);
    const keys = Object.keys(parsed);
    expect(keys[0]).toBe('a');
    expect(keys[1]).toBe('z');
    expect(Object.keys(parsed.z)[0]).toBe('x');
  });

  it('should preserve arrays without sorting', () => {
    const json = '{"items":[3,1,2]}';
    const result = sortJSONKeys(json);
    const parsed = JSON.parse(result);
    expect(parsed.items).toEqual([3, 1, 2]);
  });

  it('should return empty string for invalid JSON', () => {
    const result = sortJSONKeys('{invalid}');
    expect(result).toBe('');
  });

  it('should handle empty objects', () => {
    const json = '{}';
    const result = sortJSONKeys(json);
    expect(result).toBe('{}');
  });
});

describe('jsonToCSV', () => {
  it('should convert flat object array to CSV', () => {
    const json = '[{"name":"Alice","age":30},{"name":"Bob","age":25}]';
    const result = jsonToCSV(json);
    expect(result).toContain('name');
    expect(result).toContain('age');
    expect(result).toContain('Alice');
    expect(result).toContain('Bob');
  });

  it('should handle single object as array of one', () => {
    const json = '{"name":"Charlie","age":35}';
    const result = jsonToCSV(json);
    expect(result).toContain('name');
    expect(result).toContain('Charlie');
  });

  it('should escape quotes in CSV values', () => {
    const json = '[{"text":"Hello \\"World\\""}]';
    const result = jsonToCSV(json);
    expect(result).toContain('""');
  });

  it('should handle missing fields with empty cells', () => {
    const json = '[{"name":"Alice","age":30},{"name":"Bob"}]';
    const result = jsonToCSV(json);
    const lines = result.split('\n');
    expect(lines.length).toBe(3); // header + 2 rows
  });

  it('should return empty string for invalid JSON', () => {
    const result = jsonToCSV('{invalid}');
    expect(result).toBe('');
  });

  it('should return empty string for empty array', () => {
    const result = jsonToCSV('[]');
    expect(result).toBe('');
  });

  it('should handle special characters in CSV', () => {
    const json = '[{"name":"Alice, Bob","city":"NYC"}]';
    const result = jsonToCSV(json);
    expect(result).toContain('"Alice, Bob"');
  });
});

describe('getJSONStats', () => {
  it('should count bytes in JSON input', () => {
    const json = '{"name":"Alice"}';
    const stats = getJSONStats(json);
    expect(stats.size).toBe(json.length);
  });

  it('should count lines in formatted output', () => {
    const json = '{"name":"Alice","age":30}';
    const stats = getJSONStats(json);
    expect(stats.lines).toBeGreaterThan(1);
  });

  it('should count keys recursively', () => {
    const json = '{"user":{"name":"Alice","age":30},"active":true}';
    const stats = getJSONStats(json);
    expect(stats.keys).toBeGreaterThanOrEqual(4); // user, name, age, active
  });

  it('should mark invalid JSON', () => {
    const stats = getJSONStats('{invalid}');
    expect(stats.isValid).toBe(false);
    expect(stats.error).toBeDefined();
  });

  it('should include error message for invalid JSON', () => {
    const stats = getJSONStats('{missing}');
    expect(stats.isValid).toBe(false);
    expect(stats.error).toBeTruthy();
  });

  it('should handle empty object', () => {
    const stats = getJSONStats('{}');
    expect(stats.isValid).toBe(true);
    expect(stats.keys).toBe(0);
  });

  it('should handle arrays', () => {
    const stats = getJSONStats('[1,2,3]');
    expect(stats.isValid).toBe(true);
  });
});

describe('getComplexity', () => {
  it('should return Simple for small JSON', () => {
    const json = '{"name":"Alice"}';
    const complexity = getComplexity(json);
    expect(complexity).toBe('Simple');
  });

  it('should return Moderate for medium JSON', () => {
    const json = JSON.stringify({
      users: [
        { id: 1, name: 'Alice', email: 'alice@example.com', active: true },
        { id: 2, name: 'Bob', email: 'bob@example.com', active: false },
      ],
    });
    const complexity = getComplexity(json);
    expect(['Moderate', 'Complex']).toContain(complexity);
  });

  it('should return Complex for large JSON', () => {
    const largeObj = {};
    for (let i = 0; i < 100; i++) {
      largeObj[`key_${i}`] = {
        id: i,
        name: `Item ${i}`,
        description: `This is item ${i}`,
        metadata: { created: '2024-01-01', modified: '2024-12-31' },
      };
    }
    const json = JSON.stringify(largeObj);
    const complexity = getComplexity(json);
    expect(complexity).toBe('Complex');
  });

  it('should return Invalid for invalid JSON', () => {
    const complexity = getComplexity('{invalid}');
    expect(complexity).toBe('Invalid');
  });

  it('should handle empty input', () => {
    const complexity = getComplexity('');
    expect(complexity).toBe('Invalid');
  });
});
