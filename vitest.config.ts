import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vitest/config';

// Unit tests run in plain Node, without the Hydrogen/Oxygen Vite plugins.
export default defineConfig({
  resolve: {
    alias: {'~': fileURLToPath(new URL('./app', import.meta.url))},
  },
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
});
