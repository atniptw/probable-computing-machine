/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/probable-computing-machine/',
  test: {
    environment: 'node',
    exclude: ['e2e/**', 'node_modules/**'],
  },
})
