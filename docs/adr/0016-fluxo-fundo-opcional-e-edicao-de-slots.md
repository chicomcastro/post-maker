# 0016 — Fundo opcional escolhido depois e edição direta de slots de colagem

**Status:** Aceito · 2026-06-28

## Contexto

Em teste de uso real, vários atritos de UX apareceram no fluxo de criação e no
editor:

1. **Background obrigatório e implícito**: a 1ª foto importada virava
   automaticamente o fundo compartilhado. Isso aumentava a carga cognitiva — o
   usuário não escolhia _se_ queria fundo, nem _qual_ foto seria o fundo.
2. **Quantidade de fotos sem clareza**: o template tem um número "certo" de
   slots, mas o passo de seleção não comunicava isso.
3. **Não dava para excluir uma foto da colagem**: ao tocar numa foto só era
   possível mover/redimensionar/rotacionar, nunca remover o slot.
4. **Zoom do painel não funcionava** e **cor de fundo aparecia mesmo com imagem**
   de fundo (onde não tem efeito), confundindo.

## Decisão

- **Fundo é opcional e escolhido no editor.** `distributePhotos` deixou de
  promover a 1ª foto a fundo; apenas preenche os slots de colagem em ordem.
  Todas as fotos importadas vão para um `assetPool` no projeto, de onde o usuário
  escolhe depois qual será o fundo (ou nenhum).
- **Seleção de fundo por miniaturas.** O painel "Fundo" lista as fotos do
  `assetPool` como miniaturas, com a opção **"Nenhum"**. Trocar/remover o fundo é
  um toque.
- **Cor de fundo contextual.** Os _swatches_ de cor só aparecem quando **não há**
  imagem de fundo (onde a cor é de fato visível). Com imagem de fundo, o painel
  mostra zoom/posição/ajustes + "Remover fundo".
- **Edição direta de slots de colagem.** Selecionar uma foto abre um painel com:
  miniaturas para **trocar/preencher** o slot, ajustes (brilho/contraste/
  saturação + filtros), estilo (sombra/borda/cantos), ordem de camadas e o botão
  **"Excluir foto"**. Slots vazios mostram um _hint_ e as miniaturas para
  preencher.
- **Clareza na criação.** O passo de seleção mostra quantas fotos o layout usa
  (`Este layout usa N fotos`) e um progresso `selecionadas/N`.

## Consequências

- Menos carga cognitiva: o usuário monta a colagem e decide o fundo por último,
  sem ordem imposta.
- Os bugs de zoom (painel) e de cor sem efeito desaparecem (cor só onde importa).
- Slots passam a ser totalmente gerenciáveis (preencher, trocar, excluir),
  resolvendo o caso "não consigo deletar o segundo espaço" em templates com
  arranjos diferentes por página.
- `assetPool` é persistido e migrado: projetos antigos derivam o pool a partir
  das fotos já usadas (fundo + colagem).
- Cobertura de testes ampliada: unidade para `distributePhotos`/painéis e e2e
  para escolher/remover fundo e excluir foto.
