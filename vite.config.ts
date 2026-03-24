/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'serve' ? '/' : '/probable-computing-machine/',
  test: {
    environment: 'jsdom',
    exclude: ['e2e/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      include: ['src/data/**/*.ts', 'src/services/**/*.ts'],
      exclude: ['node_modules/**'],
      thresholds: {
        statements: 60,
        branches: 70,
        functions: 60,
        lines: 60,
      },
    },
  },
}))
