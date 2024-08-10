import { defineConfig } from 'vitest/config';
import svelte from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts'
  }
});
