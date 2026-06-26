# 0009 — Fluxo de criação e suporte a HEIC

**Status:** Aceito · 2026-06-26

## Contexto

O usuário precisa, em poucos toques: escolher formato, escolher um template,
selecionar fotos (inclusive de iPhone, que produz HEIC) e cair num projeto
pronto para editar.

## Decisão

- **Fluxo em 3 passos** (`/new`): proporção → template → fotos. Componente único
  com estado local; ao finalizar, importa as fotos, cria o `Project`, distribui
  e persiste, e navega para `/editor/:id`.
- **Seleção de fotos** via `<input type="file" multiple>` + drag-and-drop.
- **HEIC:** detecção por mime/extensão; conversão para JPEG via **`heic2any`
  carregado sob demanda** (`import()` dinâmico) para não pesar o bundle de quem
  não usa iPhone. Validado por testes com a lib mockada.
- **Previews:** `TemplatePreview` (layout do template como retângulos) e
  `PagePreview` (render read-only de uma página a partir de coords normalizadas).
  `PagePreview` é puro (recebe URLs por prop) e será reaproveitado pela tira de
  slides do editor.
- **`/editor/:id` é um placeholder** que mostra a prévia do projeto; o editor
  interativo (Konva) vem no próximo PR.

## Consequências

- HEIC funciona sem custo de bundle para a maioria; se a decodificação falhar em
  algum navegador, o erro é tratado no fluxo (a validação real em dispositivo
  fica para o teste manual quando o app estiver no Pages).
- O fluxo já cria projetos reais e persistidos, navegáveis a partir da Home.
