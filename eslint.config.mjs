import js from '@eslint/js';
import typescriptParser from '@typescript-eslint/parser';

export default [
  {
    ignores: ['.next', 'node_modules', 'dist', 'build', 'public', 'vitest.config.ts', 'vitest.setup.ts'],
  },
  {
    files: ['**/*.js'],
    rules: js.configs.recommended.rules,
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': 'warn',
    },
  },
];
