# Post Maker

Web app (SPA) para criar **colagens de fotos prontas para Instagram** a partir
de templates, rodando 100% no navegador e hospedado no GitHub Pages.

Caso de uso central: *"voltou da viagem e não postou nada?"* — escolha um
template, encaixe suas fotos, ajuste e exporte um carrossel em menos de 2 minutos.

## Status

📋 **Em especificação.** A definição completa do MVP (produto, técnica e
marketing) está em **[`docs/ESPECIFICACAO.md`](docs/ESPECIFICACAO.md)**.

## Resumo das decisões do MVP

- **Conceito:** uma foto vira o **background** da página e outras 2–3 são coladas
  por cima, em posições/ângulos variados (colagem sobre fundo)
- **Editor:** templates pré-prontos e **customizáveis** (mover/inclinar/redimensionar)
- **Template:** **post de 1 página** ou **carrossel de 2–4 páginas** (25 no MVP —
  ver [`docs/TEMPLATES.md`](docs/TEMPLATES.md))
- **Proporções:** 4:5, 1:1, 9:16 — carrossel multi-página
- **Stack:** React + Vite + TypeScript + Konva (SPA estática)
- **Dados:** 100% local (IndexedDB) + exportar/importar projeto (`.zip`)
- **Export:** PNGs por página + ZIP
- **Extras:** undo/redo, conversão HEIC, zero analytics
- **Plataforma:** mobile-first + PWA (instalável, offline)
- **Idiomas:** pt-BR + EN
- **Hospedagem:** GitHub Pages (domínio padrão)
- **Modelo:** grátis total
