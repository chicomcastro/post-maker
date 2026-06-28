# 0017 — Fundo contínuo entre páginas, preview do carrossel e responsividade do canvas

**Status:** Aceito · 2026-06-28

## Contexto

Em uso real surgiram três problemas no editor:

1. **Canvas não atualizava na hora.** Ao mexer no zoom (e em borda/cantos/sombra),
   a imagem só re-renderizava depois de aplicar um filtro. Causa: os nós Konva
   usam `cache()` (necessário para filtros) e só re-cacheávamos quando os
   **ajustes** mudavam — então mudanças de recorte (zoom/pan) ou de estilo
   ficavam presas no cache antigo.
2. **Seleção não saía ao clicar no fundo.** O `Rect` da cor de fundo capturava o
   clique, então o evento não chegava ao `Stage` e a foto continuava
   selecionada.
3. **Fundo "compartilhado" ≠ contínuo.** O fundo do projeto aparecia **idêntico**
   em todas as páginas. O usuário queria um **panorama**: cada página mostra uma
   fatia diferente, dando a sensação de carrossel contínuo ao deslizar — e poder
   **pré-visualizar** o deslize como no Instagram.

## Decisão

- **Re-cache abrangente.** Os `useEffect` de cache no `EditorStage` passam a
  depender de tudo que altera o bitmap: ajustes, **zoom/pan/página** (fundo) e
  **borda/cor/cantos/sombra/tamanho** (colagem). Zoom e estilo agora renderizam
  imediatamente.
- **Clique no fundo deseleciona.** O `Rect` de cor e a imagem de fundo ficam
  `listening={false}`, então cliques em área vazia chegam ao `Stage` →
  `onSelect(null)` → painel volta a ser o de **Fundo**.
- **Fundo contínuo (panorama fatiado).** Nova geometria pura
  `continuousBackgroundCropRect(natural, stage, scale, panX, panY, pageIndex, pageCount)`:
  a imagem cobre uma faixa virtual de `pageCount` páginas e cada página recorta a
  sua fatia horizontal. Com `pageCount = 1` é idêntica ao recorte anterior (post/
  página única). Usada no editor (Konva), na exportação (canvas) e no preview.
  No filmstrip (`PagePreview`, CSS) o efeito é obtido com a imagem dimensionada
  para a faixa inteira e deslocada por página — sem precisar do tamanho natural.
- **Preview do carrossel.** Overlay full-screen com `scroll-snap` horizontal e
  indicadores de página. Renderiza com o **mesmo motor da exportação**
  (`renderProjectToDataUrls`), garantindo fidelidade total — inclusive o fundo
  contínuo — ao que será exportado.

## Consequências

- O editor fica responsivo: zoom/pan/estilo aparecem na hora.
- O fundo vira um recurso de carrossel de verdade (panorama), coerente entre
  editor, filmstrip, preview e PNG exportado.
- O usuário consegue validar o deslize antes de exportar.
- A geometria contínua é pura e testada; o preview reusa o renderer existente,
  sem duplicar a lógica de desenho.
