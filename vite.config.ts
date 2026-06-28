import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Publicado em https://<usuario>.github.io/post-maker/ — o base precisa casar
// com o nome do repositório no GitHub Pages (domínio padrão).
const BASE = '/post-maker/'

// NOTA: o PWA/service worker foi REMOVIDO. O service worker estava causando
// telas brancas (cache antigo apontando para chunks removidos) e, na tentativa
// de resgate com SW autodestrutivo, um loop de reload. Por ora servimos uma SPA
// simples, sem SW. O index.html ainda desregistra SWs remanescentes na carga.
// Reativar offline depois exige cuidado (navegação NetworkFirst + sem loop).
export default defineConfig({
  base: BASE,
  // Alvo conservador para suportar Safari/iOS mais antigos.
  build: { target: ['es2019', 'safari13', 'chrome80', 'firefox72', 'edge88'] },
  plugins: [react()],
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
