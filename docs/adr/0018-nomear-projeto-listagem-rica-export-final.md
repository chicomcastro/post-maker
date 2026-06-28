# 0018 — Nomear projeto, listagem rica e ação final de exportar imagens

**Status:** Aceito · 2026-06-28

## Contexto

Três lacunas de produto apontadas em uso real:

1. **Sem como nomear o projeto.** O nome era fixo ("Novo carrossel"/"Novo post").
2. **Listagem pobre.** Os cards só mostravam nome e nº de páginas — faltava
   data de criação, template usado e quantas fotos o projeto tem.
3. **Ação final pouco clara.** O usuário tinha só o ícone de compartilhar no
   topo e interpretava como "compartilhar o projeto"; faltava uma ação evidente
   de **gerar/compartilhar as imagens** para postar.

## Decisão

- **Título editável.** Na barra do editor, o nome do projeto é um botão; tocar
  abre um campo inline (Enter confirma, Esc cancela, vazio mantém o anterior),
  chamando `rename` no store.
- **Persistência ao sair.** Ao tocar em "voltar", o editor faz `saveProject` do
  estado atual **antes** de navegar — evita a corrida com o debounce do autosave
  (renomear e voltar logo em seguida não perde a alteração). O autosave também
  passou a **descarregar** mudanças pendentes ao desmontar.
- **Cards ricos.** `ProjectCard` mostra miniatura da 1ª página (com o fundo
  contínuo), nome, **data de criação** (formatada por idioma), **template** (id)
  e **nº de fotos** (`assetPool`), além do nº de páginas.
- **Ação final no preview.** O overlay de pré-visualização do carrossel ganha um
  CTA destacado **"Salvar / compartilhar imagens"**. A lógica de exportação foi
  extraída para o hook `useProjectExport`, reutilizado pelo ícone da barra e pelo
  CTA — mesma geração de PNG/ZIP + Web Share/download.

## Consequências

- O fluxo fica completo: criar → editar → **nomear** → pré-visualizar →
  **exportar/compartilhar** para postar.
- A listagem ajuda a distinguir projetos (data, template, fotos) e mostra uma
  prévia real.
- A exportação de imagens fica óbvia no momento natural (depois de revisar o
  carrossel), sem confundir com "compartilhar o projeto".
