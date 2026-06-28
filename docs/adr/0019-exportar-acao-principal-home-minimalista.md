# 0019 — Exportar como ação principal, home minimalista e renomear na listagem

**Status:** Aceito · 2026-06-28

## Contexto

Feedback de uso real:

1. **Exportar é A ação principal** do projeto e estava pouco evidente (só um ícone
   no topo + um CTA dentro do preview). O usuário quer clicar em "Exportar" na
   página do projeto e, aí sim, escolher **gerar imagens** (postar) ou
   **exportar o arquivo do projeto** (backup).
2. A **home** tinha texto de marketing (tagline + descrição) que tirava o foco; o
   ideal é minimalista, focado em **criar novo** e na **lista de projetos** com
   prévia.
3. **Renomear** só dava para fazer dentro do projeto; faltava renomear direto na
   **listagem**.

## Decisão

- **Exportar como ação principal.** Botão **"Exportar"** preenchido (accent) na
  barra do editor abre um _action sheet_ com duas opções:
  - **Gerar imagens para postar** — PNG por página / `.zip` no carrossel
    (Web Share no mobile, download no desktop).
  - **Exportar arquivo do projeto** — `.zip` (`.postmaker.zip`) com fotos,
    reimportável. Liga o `exportProjectZip` (até então só na lib).
    A lógica vive em `useProjectExport` (`exportImages` / `exportProject`),
    reutilizada pelo CTA do preview.
- **Overlays em portal.** O _action sheet_ e o preview são renderizados via
  `createPortal(..., document.body)`. O wrapper de transição (framer-motion)
  aplica `transform`, que cria _containing block_ para `position: fixed` — sem o
  portal, a folha inferior caía fora da viewport.
- **Home minimalista.** Sem tagline/descrição: barra com o nome do app, **CTA
  "Criar novo projeto"** em destaque e a **lista de projetos** com prévia como
  foco. (A landing page de marketing permanece no README.)
- **Renomear na listagem.** Cada `ProjectCard` tem um lápis que edita o nome
  inline (Enter confirma, Esc cancela), persistido na hora.

## Consequências

- O fluxo termina numa ação clara: **Exportar → escolher imagens ou projeto**.
- A home fica enxuta e centrada em retomar/criar projetos.
- Renomear é possível tanto no editor quanto na listagem.
- Overlays `fixed` ficam corretos mesmo sob ancestrais com `transform`.
