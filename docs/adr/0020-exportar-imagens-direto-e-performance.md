# 0020 — Exportar imagens direto (sem zip) e performance ao abrir projeto

**Status:** Aceito · 2026-06-28

## Contexto

1. **`.zip` de imagens pouco útil.** Ao exportar um carrossel, as imagens vinham
   empacotadas num `.zip` — ruim para postar no celular, onde o usuário quer as
   imagens prontas para compartilhar direto.
2. **Lag ao abrir um projeto.** O editor decodificava as fotos em **resolução
   cheia** (12MP+ de celular), uma por nó Konva, sem cache — travava ao abrir,
   sobretudo com várias fotos ou quando a mesma foto era fundo e colagem.

## Decisão

- **Imagens direto, sem zip.** `exportImages` entrega os PNGs como `File[]`:
  - **Mobile**: Web Share com vários arquivos (`navigator.share({ files })`) —
    dá pra mandar todos de uma vez pra rede social.
  - **Desktop**: download de cada PNG individualmente.
    O `.zip` deixa de ser usado para imagens; continua só no **export do projeto**
    (backup `.postmaker.zip`), onde faz sentido.
- **Downscale na importação.** `fileToDisplayBlob` reduz a imagem para caber em
  `MAX_DISPLAY_DIM = 2048px` (maior lado), reencodando via canvas. A exportação é
  nominalmente 1080px, então 2048 dá folga pra zoom sem o custo da resolução
  cheia. É só otimização: sem canvas (testes/SSR) ou em qualquer erro, devolve o
  blob original.
- **Cache de imagens decodificadas.** `useAssetImage` usa um cache em memória
  por `assetId` (imutável) + _dedupe_ de cargas concorrentes e `img.decode()`
  fora do caminho de render. A mesma foto não é decodificada duas vezes e
  reabrir um projeto na mesma sessão é instantâneo.
- **Prefetch do editor.** A Home pré-carrega o chunk do `EditorStage` (Konva) em
  _idle_, para abrir um projeto sem esperar o download/parse no clique.

## Consequências

- Exportar entrega imagens prontas pra postar (e o backup do projeto continua em
  `.zip`).
- Abrir projetos novos fica leve (fotos já reduzidas) e reabrir é instantâneo
  (cache). Projetos antigos com fotos em resolução cheia se beneficiam do cache e
  do `decode()`, mas só novas importações são reduzidas no armazenamento.
- Pequena perda de resolução de origem (cap 2048), irrelevante para a saída de
  1080px.
