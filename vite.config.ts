import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => ({
  plugins: [vue()],
  base: './',
  build: {
    // The embedded build is one self-contained page, so images are inlined as data URIs.
    assetsInlineLimit: mode === 'embedded' ? 10_000_000 : 4096,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
}))
