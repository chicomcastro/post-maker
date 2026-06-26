# 0010 — Editor interativo com Konva

**Status:** Aceito · 2026-06-26

## Contexto

O editor precisa permitir manipular o background (zoom/pan) e as fotos de
colagem (mover, rotacionar, redimensionar, ordem de camadas), além de ajustes e
estilo — tudo fluido no mobile.

## Decisão

- **Canvas com Konva/react-konva.** Cada foto de colagem é um `Konva.Image`
  centrado (offset = metade), com `crop` "cover", arrastável e ligada a um
  `Transformer` (rotação + escala). O background é um `Image` cobrindo o palco
  com recorte calculado por zoom/pan.
- **Geometria pura separada** (`lib/editor-geometry.ts`): conversões
  normalizado↔pixel, `coverRect` e `backgroundCropRect`. Sem dependência de
  Konva/DOM → testável e reutilizável na exportação.
- **Ajustes via filtros Konva** (Brighten/Contrast/HSL) com `cache()` por nó.
- **Carregamento sob demanda:** o `EditorStage` (que importa Konva) é
  `React.lazy`, então a Home não baixa Konva. As imagens vêm do IndexedDB.
- **Auto-save** debounced: cada mudança no projeto persiste sozinha.
- **Cobertura:** o componente de canvas é excluído da cobertura (depende de
  `<canvas>`, fora do alcance do jsdom); a lógica de geometria e o store têm
  testes; os painéis têm testes de interação.

## Consequências

- Rotação/escala/camadas saem "de graça" do Konva.
- O canvas em si é validado por teste manual no app publicado; a regressão é
  contida pela geometria e store testados.
- Exportação (próximo PR) reusa `coverRect`/`backgroundCropRect` para
  fidelidade pixel-a-pixel.
