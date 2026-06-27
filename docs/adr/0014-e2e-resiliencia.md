# 0014 — Testes e2e, error boundary e migração de dados

**Status:** Aceito · 2026-06-27

## Contexto

Uma mudança de modelo (background por página → por projeto, ADR 0013) deixou
projetos antigos salvos no IndexedDB incompatíveis: ao abrir o editor com um
desses, o acesso a `project.background` quebrava e o app exibia **tela branca**.
Testes unitários não pegaram porque o bug só aparece no app real, com dados
persistidos de versões anteriores.

## Decisão

Três camadas de proteção:

1. **Migração/normalização** (`lib/migrations.ts`): todo projeto lido do
   armazenamento (e importado de `.zip`) passa por `normalizeProject`, que
   preenche o formato atual a partir de dados antigos/parciais (ex.: herda o
   background da 1ª página). Defensivo contra qualquer dado fora do formato.
2. **ErrorBoundary** envolvendo o app: qualquer erro de render vira um fallback
   amigável com "voltar ao início" — **nunca mais uma tela branca**.
3. **Testes e2e (Playwright)** em `e2e/`, num viewport de celular, validando os
   fluxos ponta a ponta (home, criação → editor → exportação, persistência,
   seleção de foto) e incluindo um teste de **resiliência** que injeta um projeto
   no formato antigo e garante que o editor abre. Rodam como job separado no CI.

## Consequências

- Regressões que só aparecem no app real (não em unit tests) passam a ser
  cobertas por smoke tests automáticos.
- O CI ganha um job `e2e` (instala o Chromium e roda os specs); o build é
  reusado pelo `webServer` do Playwright.
- Dados antigos de usuários continuam abrindo sem quebrar.
