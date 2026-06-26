# 0005 — CI/CD com GitHub Actions e Pages

**Status:** Aceito · 2026-06-26

## Contexto

Precisamos de um CI confiável que evite regressões e meça progresso, e de um CD
que publique no GitHub Pages a cada merge na `main`.

## Decisão

- **CI** (`.github/workflows/ci.yml`) roda em PRs e pushes para `main`:
  `format:check` → `lint` → `typecheck` → `test:coverage` → `build`. Usa
  `npm ci` (lockfile) e cache de npm, com `concurrency` cancelando execuções
  obsoletas.
- **CD** (`.github/workflows/deploy.yml`) builda e publica `dist/` no Pages via
  `configure-pages` + `upload-pages-artifact` + `deploy-pages`, com as permissões
  `pages: write` e `id-token: write`.
- **Progresso** é medido pela cobertura de testes reportada no CI. Limiares de
  cobertura que reprovam o build serão introduzidos quando a lógica de domínio
  (modelo/templates/persistência) existir, para não engessar a fase de UI.

## Consequências

- Toda mudança passa pelos mesmos portões antes de mergear → menos regressões.
- Deploy automático e idempotente na `main`.
- Requer que o GitHub Pages esteja configurado para "GitHub Actions" como fonte
  (feito pelo dono do repositório).
