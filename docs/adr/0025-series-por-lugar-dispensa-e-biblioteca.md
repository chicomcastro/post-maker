# 0025 — Séries por lugar, dispensa de sugestões e gestão da biblioteca

**Status:** Aceito · 2026-07-05

## Contexto

Evoluções aprovadas sobre as sugestões automáticas (ADR 0024): sugerir "mesmo
lugar em datas diferentes", permitir dispensar sugestões indesejadas e
gerenciar/limpar a biblioteca de fotos.

## Decisão

- **Séries por lugar** (`clusterByPlaceAcrossDays`): fotos com GPS agrupadas por
  proximidade (≤ 2km) **ignorando o dia**; só vira sugestão o cluster que cobre
  **2+ dias distintos** (revisitas). Seção própria — "Mesmo lugar, outras
  datas" — com rótulo "N dias"; o projeto criado se chama "Lugar — várias
  datas".
- **Chaves estáveis por conteúdo.** As chaves dos grupos deixam de usar índice e
  passam a ser `dia@lat,lon` (centro arredondado a 2 casas, ~1km),
  `dia@nogps` e `place@lat,lon`. Assim a dispensa persiste mesmo quando novas
  fotos entram no grupo.
- **Dispensar sugestões.** Um "X" em cada card oculta o grupo; as chaves ficam em
  `localStorage` (preferência leve, tolerante a perda). Um botão "Restaurar N
  sugestões dispensadas" desfaz tudo de uma vez.
- **Gerenciar biblioteca.** Botão "Gerenciar" na barra alterna para uma grade da
  biblioteca com remoção por foto e **"Limpar tudo"** (com `confirm`). Remoções
  disparam `pruneOrphanAssets` — que preserva assets usados por projetos, então
  limpar a biblioteca **não afeta projetos existentes**.

## Consequências

- Revisitas a um mesmo lugar viram uma sugestão narrativa própria.
- O usuário controla o feed de sugestões (dispensa/restaura) e o armazenamento
  (biblioteca), sem risco para projetos já criados.
- Dispensas não sincronizam entre aparelhos (localStorage) — aceitável para uma
  preferência de exibição.
