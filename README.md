# Post Maker

Web app (SPA) para criar **colagens de fotos prontas para Instagram** a partir
de templates, rodando 100% no navegador e hospedado no GitHub Pages.

Caso de uso central: *"voltou da viagem e não postou nada?"* — escolha um
template, encaixe suas fotos, ajuste e exporte um carrossel em menos de 2 minutos.

## Status

📋 **Em especificação.** A definição completa do MVP (produto, técnica e
marketing) está em **[`docs/ESPECIFICACAO.md`](docs/ESPECIFICACAO.md)**.

## Resumo das decisões do MVP

- **Editor:** templates + slots (estética limpa/minimalista)
- **Proporções:** 4:5, 1:1, 9:16 — com carrossel multi-slide
- **Stack:** React + Vite + TypeScript (SPA estática)
- **Dados:** 100% local (IndexedDB) + exportar/importar projeto
- **Export:** PNGs por slide + ZIP
- **Plataforma:** mobile-first + PWA (instalável, offline)
- **Idiomas:** pt-BR + EN
- **Hospedagem:** GitHub Pages
- **Modelo:** grátis total
