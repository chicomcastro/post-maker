# 0022 — Arrastar a foto para enquadrar (vs mover o slot)

**Status:** Aceito · 2026-06-28

## Contexto

O enquadramento da foto dentro do slot (ADR 0021) era só por sliders. O usuário
quer **arrastar a foto direto dentro do slot** para enquadrar, mantendo o mover/
redimensionar/girar do slot. Um mesmo gesto de arraste não pode significar duas
coisas ao mesmo tempo.

## Decisão

- **Modo de interação** (transiente, fora do histórico) no store:
  `interactionMode: 'frame' | 'move'`, **default `frame`** (o que foi pedido).
- **Arrastar a foto:**
  - `frame`: o nó fica fixo (via `dragBoundFunc`, que retorna sempre a posição
    do slot) e o movimento do ponteiro é convertido em **pan do recorte**
    (`panCrop`), desfazendo a rotação do slot e normalizando pelo tamanho
    exibido. Atualiza ao vivo.
  - `move`: comportamento anterior — arrastar **move o slot** (`transform.x/y`).
  - **Resize e rotação** continuam pelos handles do Transformer nos dois modos.
- **Seletor no painel da foto:** segmented **Enquadrar | Mover slot** (com o
  rótulo "Ao arrastar a foto"), só quando há imagem no slot.
- Slots **vazios** sempre usam arraste = mover (não há o que enquadrar).

## Consequências

- Enquadrar fica natural (arrastar a foto), como em apps de colagem, sem perder
  o reposicionamento do slot — basta alternar o seletor.
- Sem ambiguidade de gesto; comportamento explícito e testável.
- O pan ao vivo gera vários passos de histórico durante o arraste (igual aos
  sliders); aceitável por ora, pode ser agrupado depois.
