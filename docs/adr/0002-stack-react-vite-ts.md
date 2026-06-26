# 0002 — Stack: React + Vite + TypeScript

**Status:** Aceito · 2026-06-26

## Contexto

Precisamos de uma stack madura para uma SPA com editor visual interativo, boa
DX, ecossistema de libs de canvas/drag, e build estático simples para o Pages.

## Decisão

- **React 18 + TypeScript** para a UI.
- **Vite 5** como bundler/dev server (HMR rápido, build estático). Fixado em v5
  por compatibilidade plena com `vitest` 2.1 e `vite-plugin-pwa` 0.21, evitando
  duplicação de versões de Vite no projeto.
- **Vitest + Testing Library** para testes unitários/componentes.
- **ESLint (flat config) + Prettier** para qualidade e formatação.
- **Zustand** para estado (escolha registrada com mais detalhe no ADR do editor).

## Consequências

- Ecossistema grande e libs prontas (Konva, i18next, jszip) reduzem esforço.
- Build estático direto compatível com Pages.
- Vite 5 (não 6) é uma escolha consciente de estabilidade; reavaliar quando o
  ecossistema de testes acompanhar o Vite 6.
