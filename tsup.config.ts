import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['index.ts'],
  target: 'node18',
  format: ['cjs', 'esm'],
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: true,
});
