# 0027 — Momentos recentes na home (quando há biblioteca)

**Status:** Aceito · 2026-07-05

## Contexto

Os momentos (sugestões por data/lugar) ficavam só atrás de um botão secundário
na home. Como são o caminho mais automatizado até um post — o coração do produto
—, enterrá-los reduz descoberta. Por outro lado, a home é minimalista de
propósito (ADR 0019) e mostrar momentos para quem nunca importou nada seria
ruído.

## Decisão

- **Faixa "Momentos recentes" na home, condicional à biblioteca.** Quando há
  fotos importadas, a home mostra os **3 momentos mais recentes** (dia/lugar +
  séries por lugar, já filtrando dispensados) com o mesmo card da tela dedicada
  e um **"Ver todos"** que leva a `/suggestions`.
- **Entrada única e contextual.** Sem biblioteca, mostra o botão "Sugestões por
  data e lugar" (entrada para importar). Com biblioteca, esse botão dá lugar à
  faixa + "Ver todos" — evita dois caminhos para a mesma tela.
- **Reúso, zero divergência.** O card virou `MomentCard` e a criação de projeto
  a partir de um grupo virou `createProjectFromGroup`/`momentDateLabel` em
  `features/suggestions/moment.ts` — compartilhados por home e tela de
  sugestões. Criar direto da home abre o editor com o projeto pronto.

## Consequências

- A home vira um hub de "o que postar hoje" sem perder o estado vazio limpo.
- Gerenciar biblioteca, dispensar/restaurar e ver todos os momentos continuam na
  tela dedicada.
- A home passou a carregar a biblioteca no mount (IndexedDB) além dos projetos —
  custo pequeno, assíncrono.
