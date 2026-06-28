# 0021 — Orientação do slot e enquadramento da foto

**Status:** Aceito · 2026-06-28

## Contexto

Os slots de colagem herdavam a proporção fixa do arranjo (quase todos retrato) e
a foto era recortada em "cover" **centrado**, sem como reposicionar. O usuário
pediu para (1) escolher a orientação do slot — retrato, quadrado ou paisagem — e
(2) mover a foto dentro do slot para enquadrar.

## Decisão

- **Enquadramento no modelo.** `CollagePhoto` ganha `crop: { x, y, scale }`
  (default `{0.5, 0.5, 1}` = cover centrado). É o mesmo conceito do pan/zoom do
  background, agora por foto, dentro do slot.
- **Geometria reaproveitada.** O recorte da colagem passa a usar a MESMA função
  do background (`continuousBackgroundCropRect` com `pageCount = 1`) aplicada ao
  tamanho do slot — cover + zoom + pan. Vale para editor (Konva), exportação
  (canvas) e, de forma aproximada (só pan), para o preview/miniaturas em CSS.
- **Orientação por chips.** No painel da foto, _chips_ **Retrato / Quadrado /
  Paisagem** remodelam o `frame` do slot mantendo o lado maior (`L`): retrato
  `L*0.8 × L`, quadrado `L × L`, paisagem `L × L*0.8`. O usuário ainda pode
  redimensionar pelos handles depois.
- **Sliders de enquadramento.** Grupo "Enquadrar a foto" com **Zoom / Posição X
  / Posição Y** ligados ao `crop`. Optou-se por sliders (em vez de arrastar
  dentro do slot) para não conflitar com o arraste que move o slot, e por
  consistência com o painel do background.
- **Migração.** `normalizeProject` preenche `crop` padrão em fotos antigas
  (evita `NaN`/tela branca ao ler `crop` inexistente).

## Consequências

- Slots podem ser retrato, quadrado ou paisagem; a foto é enquadrável (mover +
  zoom) dentro do slot, com fidelidade total no editor e na exportação.
- O preview/miniatura reflete o pan; o zoom do recorte fica para o
  editor/export (limitação aceitável do thumbnail em CSS sem o tamanho natural).
- Sem novas ações no store: o painel usa `updateCollagePhoto`.
