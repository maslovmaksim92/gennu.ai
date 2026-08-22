import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['libs/**/*.spec.ts', 'apps/**/*.spec.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
});
