/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 5000,
    hookTimeout: 60000,
    coverage: { provider: 'v8' },
    include: ['**/*.(test|spec).ts'],
  },
});
