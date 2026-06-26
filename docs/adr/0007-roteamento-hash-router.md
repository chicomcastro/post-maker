# 0007 — Roteamento via Hash Router

**Status:** Aceito · 2026-06-26

## Contexto

O GitHub Pages serve arquivos estáticos e não reescreve rotas para `index.html`.
Com history routing, dar refresh numa rota profunda (ex.: `/editor`) resultaria
em 404.

## Decisão

Usar **HashRouter** (`react-router-dom`). As rotas ficam após o `#`
(ex.: `/post-maker/#/editor`), que o Pages sempre resolve para `index.html`.

## Consequências

- Zero configuração extra de fallback (`404.html`) e sem 404 em refresh.
- URLs com `#` são menos "limpas" — aceitável para um app, não um site de
  conteúdo. Se quisermos URLs limpas no futuro, migrar para history router + um
  `404.html` de fallback (novo ADR).
