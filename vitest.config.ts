import { defineConfig } from 'vitest/config'

// Kept separate from vite.config.ts so the geometry unit tests (plain TS, no
// Svelte) don't drag in the Svelte plugin — and so Vitest's bundled Vite types
// don't clash with the project's rolldown-based Vite 8.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
  },
})
