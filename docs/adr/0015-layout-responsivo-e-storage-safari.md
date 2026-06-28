# 0015 — Layout responsivo amplo (tablet/desktop) e correção de storage no Safari

**Status:** Aceito · 2026-06-28

## Contexto

Dois problemas surgiram no uso real em **iPad (Safari)**:

1. **Tela branca**: em telas ≥480px o `body` virava flex e o `.app-shell` (cujo
   conteúdo `.route` é `position:absolute`) **colapsava para largura 0**. Toda a
   reprodução anterior tinha sido em viewport de celular, então passou batido.
2. **Falha ao criar projeto**: o Safari/WebKit lança `UnknownError: Error
preparing Blob/File data to be stored in object store` ao gravar **Blob/File**
   no IndexedDB — limitação conhecida do WebKit.

Além disso, o produto só tinha layout de celular (moldura centralizada) em
qualquer tela; a decisão de produto foi ter um **layout amplo** no tablet/desktop.

## Decisão

- **Sem "moldura"/card**: o `.app-shell` ocupa a **viewport inteira** em qualquer
  tamanho (`position: fixed; inset: 0`) — elimina o card centralizado e qualquer
  risco de colapso de tamanho. Mobile = app nativo full-screen; tablet/desktop =
  web app full-screen.
- **Breakpoints de conteúdo**:
  - `<768px`: layout de celular (full-bleed), com cara de app nativo.
  - `≥768px` (inclui iPad): **layout amplo** — home/criação com conteúdo
    centralizado e legível (coluna ~820px, CTA com largura natural); editor em
    **duas colunas** (canvas + filmstrip à esquerda, painel fixo à direita, sem
    bottom sheet); galeria de templates com mais colunas.
- As regras do bloco `@media (min-width:768px)` ficam no **final do CSS** para
  vencer as regras-base por ordem de cascata.
- **Storage de assets**: gravar `{ type, ArrayBuffer }` no IndexedDB (não Blob) e
  reconstruir `Blob` na leitura — compatível com Safari/WebKit. Blobs antigos
  (de versões anteriores) são tolerados na leitura.

## Consequências

- iPad/desktop ganham um layout que aproveita a tela; celular permanece igual.
- Criar projeto volta a funcionar no Safari.
- Testes e2e passam a cobrir **viewport de tablet** (moldura com largura e editor
  em duas colunas), evitando regressões que só apareciam fora do tamanho de
  celular.
