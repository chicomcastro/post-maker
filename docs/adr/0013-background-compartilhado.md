# 0013 — Background compartilhado pelo carrossel

**Status:** Aceito · 2026-06-27 · supersede parte do [0008](0008-modelo-de-dados-e-templates.md)

## Contexto

O conceito do produto é "**uma foto vira o background do carrossel** e colamos
outras por cima". A primeira implementação guardava `background` e `bgColor` por
**página**, e a distribuição usava a primeira foto de _cada página_ como fundo —
resultado: cada página do carrossel ficava com um fundo diferente, contrariando
a expectativa de um fundo único e contínuo.

## Decisão

Mover o **background (imagem + transform + ajustes) e a cor de fundo para o
nível do `Project`**, não da `Page`. A `Page` passa a conter apenas a `collage`.

- **Distribuição**: a 1ª foto selecionada vira o background compartilhado; as
  demais preenchem os frames de colagem, página a página.
- **Edição**: os controles de fundo (zoom/pan/ajustes/cor) agem no projeto, então
  qualquer ajuste reflete em todas as páginas automaticamente.
- **Render/preview/export** leem `project.background` e `project.bgColor` para
  todas as páginas.

## Consequências

- Comportamento alinhado ao conceito: fundo único em todo o carrossel.
- Capacidade de fotos de um template = **1 (background) + nº de colagens**.
- Simplifica o modelo (sem duplicação de fundo por página) ao custo de perder um
  eventual "fundo por página" — não desejado neste produto. Se algum dia quisermos
  fundos por página, entra como novo ADR.
