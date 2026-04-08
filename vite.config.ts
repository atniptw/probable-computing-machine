/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'serve' ? '/' : '/probable-computing-machine/',
  test: {
    environment: 'jsdom',
    setupFiles: ['src/tests/setup.ts'],
    exclude: ['e2e/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      include: [
        'src/data/**/*.ts',
        'src/services/**/*.ts',
        'src/hooks/**/*.ts',
      ],
      exclude: ['node_modules/**'],
      thresholds: {
        statements: 70,
        branches: 80,
        functions: 70,
        lines: 70,
      },
    },
  },
}))
