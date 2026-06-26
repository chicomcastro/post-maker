# 0011 — Exportação PNG/ZIP e compartilhamento

**Status:** Aceito · 2026-06-26

## Contexto

O usuário precisa exportar o resultado pronto para o Instagram: um PNG por
página, empacotados quando há mais de uma, e idealmente compartilhar direto do
celular.

## Decisão

- **Render headless via Canvas 2D** (`export-render.ts`), não via Konva: desenha
  cada página na resolução nominal da proporção reusando a mesma geometria do
  editor (`coverRect`, `backgroundCropRect`, `photoPixelRect`) e os ajustes via
  `ctx.filter`. Garante fidelidade sem montar componentes React.
- **Entrega**: 1 página → 1 PNG; várias → `.zip` (`jszip`) com nomes ordenados
  (`slide-1.png`…). **Web Share API** quando disponível (mobile), com **fallback
  para download**.
- **Cobertura**: o render de canvas fica fora da cobertura (precisa de
  `<canvas>`); o empacotamento, nomes e a lógica de share/download são testados
  (Node + jsdom com `navigator.share` mockado).

## Consequências

- Export fiel ao editor, 100% client-side.
- A renderização real do canvas é validada por teste manual no app publicado.
- Casa com a decisão de `.zip` para projetos (ADR 0003).
