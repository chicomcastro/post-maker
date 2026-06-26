# 0012 — UI no estilo de app nativo

**Status:** Aceito · 2026-06-26

## Contexto

A primeira versão da UI parecia uma página web genérica (container centrado,
`<select>` de idioma, botões oval, sliders azuis do navegador, cabeçalho do
editor quebrando em várias linhas). O produto precisa parecer **muito próximo de
um app nativo** — mesmo formato, layout, navegação e animações.

## Decisão

- **Phone shell** (`.app-shell`): largura máxima de 460px, `100dvh`, com moldura
  arredondada e sombra no desktop; preenche a tela no mobile. `env(safe-area-*)`.
- **App bar** reutilizável (esquerda/título/direita) com ícones de linha (SVG
  inline), `IconButton` circular com feedback de toque; variante escura no editor.
- **Navegação com transição nativa**: rotas animadas com `framer-motion`
  (slide push/pop) via `AnimatePresence`.
- **Padrão "large title"** no fluxo de criação (título grande no conteúdo, app
  bar só com voltar + progresso em segmentos estilo stories) e **CTA fixo** na
  base.
- **Controles nativos**: sliders estilizados (trilho + thumb com a cor de
  acento), **toggle switch**, **segmented control**, **swatches de cor**.
- **Editor imersivo**: área escura, **bottom sheet** para os controles
  (background/foto), **filmstrip** de páginas com adicionar/duplicar/remover, e
  ações (desfazer/refazer/exportar) como ícones na app bar.

## Consequências

- Cara de app, não de site; coerente com o produto de referência.
- `framer-motion` adicionado às dependências (transições).
- Componentes de UI compartilhados (`ui.tsx`, `icons.tsx`) reaproveitados entre
  telas; testes ajustados para os novos controles (idioma vira botão; ações do
  editor viram ícones com `aria-label`).
