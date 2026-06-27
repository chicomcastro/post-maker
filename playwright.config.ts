import { defineConfig, devices } from '@playwright/test'

const PORT = 4173
const BASE = `http://localhost:${PORT}`

// E2E smoke tests: sobem o app buildado (vite preview) e validam os fluxos
// principais num viewport de celular. Em CI, os browsers são instalados no job.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: BASE,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 7'], locale: 'pt-BR' },
    },
  ],
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: `${BASE}/post-maker/`,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
})
