# 0028 — Biblioteca como tela inicial (app centrado em fotos)

**Status:** Aceito · 2026-07-05

## Contexto

Até aqui a home era centrada em _projetos_: o CTA principal era "Criar novo
projeto" e a criação começava por uma etapa de seleção de fotos (ADRs 0019,
0027). Mas o caminho mais valioso do produto é a biblioteca: importar as fotos
da viagem e deixar o app agrupar por dia/lugar e sugerir posts prontos (ADRs
0024–0025). Pedir "criar projeto" antes de ter fotos inverte a ordem natural —
primeiro se traz o material, depois se decide o que virar post.

## Decisão

- **A biblioteca vira a tela inicial.** A home passa a ser `LibraryHome`, com o
  CTA principal **"Importar fotos"**. `Home` e a `SuggestionsPage` dedicada foram
  removidas — a rota `/suggestions` deixou de existir.
- **Abas Biblioteca | Projetos.** Os projetos salvos continuam acessíveis, agora
  numa segunda aba (com contagem), mantendo a home focada nas fotos.
- **Sugestões prontas no topo.** As mesmas sugestões automáticas (dia+lugar e
  séries por lugar, com dispensar/restaurar e nomear lugares) aparecem como
  cards de "Prontos para postar" — criam o carrossel em um toque.
- **Grade agrupada com alternador Dia | Lugar.** Abaixo, a biblioteca inteira em
  grade, agrupada por dia (padrão) ou por lugar. `groupByDay`/`groupByPlace` são
  helpers puros (diferentes dos clusterizadores de _sugestão_: agrupam **todas**
  as fotos, não só as que rendem um post).
- **Toque e segure → seleção → criar.** Segurar uma foto (ou o botão
  "Selecionar") entra em modo de seleção; a barra flutuante oferece **"Criar
  projeto (N)"** e **"Remover N"**. Criar leva ao menu de criação existente
  **sem a etapa de fotos** (`NewProject` aceita `assetIds` via route state e
  pula direto para formato → template/automático).
- **Gerenciar via seleção.** Remover fotos deixou de ser um "modo gerenciar"
  separado: é a própria seleção múltipla + "Remover".

## Consequências

- Toda criação de projeto passa a nascer de fotos da biblioteca (seleção manual
  ou sugestão pronta); não há mais "criar do zero" sem fotos.
- `NewProject` ganhou um modo pré-selecionado; o fluxo com etapa de fotos
  continua no código, mas sem entrada pela UI.
- A barra de seleção usa `createPortal` no `body` (a transição de rota do
  framer-motion cria _containing block_ para `position: fixed`).
- Testes e e2e foram reescritos para o fluxo importar → selecionar → criar.
