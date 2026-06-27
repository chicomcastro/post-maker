import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Publicado em https://<usuario>.github.io/post-maker/ — o base precisa casar
// com o nome do repositório no GitHub Pages (domínio padrão).
const BASE = '/post-maker/'

export default defineConfig({
  base: BASE,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      workbox: {
        // heic2any (~1.3MB) é carregado sob demanda; não vale precachear no SW.
        globIgnores: ['**/heic2any-*.js'],
      },
      manifest: {
        name: 'Post Maker',
        short_name: 'Post Maker',
        description: 'Crie carrosséis de fotos lindos para o Instagram em minutos.',
        theme_color: '#111827',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: BASE,
        scope: BASE,
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: false,
    // Apenas testes unitários (Vitest); os specs e2e rodam no Playwright.
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/test/**',
        'src/main.tsx',
        'src/App.tsx',
        'src/**/*.d.ts',
        // Canvas Konva: depende de <canvas>, validado por teste manual no app.
        'src/features/editor/canvas/**',
        // Render para PNG: usa <canvas>, fora do alcance do jsdom.
        'src/lib/export-render.ts',
      ],
      // Guarda contra regressão (com folga sobre os números atuais). A lógica de
      // domínio (lib, store, templates) deve ficar bem coberta; componentes de
      // view pesados em canvas são excluídos pontualmente.
      thresholds: {
        statements: 80,
        lines: 80,
        functions: 75,
        branches: 70,
      },
    },
  },
})
