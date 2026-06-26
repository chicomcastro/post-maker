# 0001 — SPA estática client-side no GitHub Pages

**Status:** Aceito · 2026-06-26

## Contexto

O produto precisa ser hospedado de graça e sem operação de servidor. As fotos do
usuário são sensíveis (viagens, rotina). O requisito explícito é hospedar no
GitHub Pages, que serve apenas arquivos estáticos.

## Decisão

Construir o app como uma **Single Page Application 100% client-side**, sem
backend. Todo processamento de imagem, montagem de layout e exportação acontece
no navegador. Nenhum dado do usuário trafega pela rede.

## Consequências

- **Prós:** custo zero, privacidade por padrão, deploy trivial, funciona offline
  (com PWA).
- **Contras:** sem métricas de servidor (decidimos zero analytics no MVP), sem
  sync entre dispositivos (mitigado por export/import de projeto), limites de
  memória/armazenamento do navegador a respeitar.
- Persistência fica no dispositivo (ver ADR 0003).
