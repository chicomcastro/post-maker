# 0023 — Adicionar fotos a qualquer momento e contagem sem fração

**Status:** Aceito · 2026-06-28

## Contexto

Só dava para escolher fotos na criação do projeto; depois não havia como
adicionar mais. Além disso, o passo de fotos mostrava uma fração `selecionadas/N`
que sugeria um máximo — mas, como uma foto pode virar o fundo e o usuário pode
subir várias e escolher quais entram nos slots durante a edição, esse máximo não
faz sentido.

## Decisão

- **Adicionar fotos no editor.** A tira de miniaturas (`AssetThumbs`, usada nos
  painéis de fundo e de foto) ganha um tile **"+"** que importa novos arquivos
  (mesma pipeline: HEIC + downscale) e os acrescenta ao `assetPool` via a nova
  ação `addAssetsToPool`. Vale a qualquer momento; as fotos ficam disponíveis
  para qualquer slot ou para o fundo.
- **Contagem sem fração.** No passo de criação:
  - A orientação some o numerador: em vez de `selecionadas/N`, mostra só
    **"X fotos selecionadas"**.
  - A dica usa a **capacidade** do template como denominador informativo —
    `templatePhotoCapacity = nº de slots + 1` (o +1 é o fundo opcional) — com o
    texto deixando claro que dá para **adicionar mais e escolher quais entram**
    durante a edição. Não há mínimo/máximo imposto além de "ao menos uma foto".

## Consequências

- O usuário sobe fotos quando quiser (na criação e no editor) e decide o uso
  delas (slot/fundo) na edição, sem ficar preso à quantidade inicial.
- A comunicação de quantidade fica honesta: um teto sugerido (n+1), sem fração
  que dê ideia de limite rígido.
