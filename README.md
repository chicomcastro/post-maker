<div align="center">

# 📸 Post Maker

### Voltou da viagem e não postou nada?

Monte **carrosséis lindos para o Instagram** em poucos minutos —
escolha um template, jogue suas fotos e pronto. Direto do navegador,
de graça, e **suas fotos nunca saem do seu aparelho**.

[**▶ Abrir o app**](https://chicomcastro.github.io/post-maker/)

</div>

---

## ✨ O que dá pra fazer

- 🖼️ **Colagem com fundo opcional**: monte a colagem e, quando quiser, escolha
  qualquer foto como **fundo compartilhado** do carrossel — ou nenhuma.
- 🎠 **Posts e carrosséis** de 1 a 4 páginas, prontos para o feed.
- 🎨 **Templates lindos e personalizáveis** — mexa, incline e redimensione cada
  foto à vontade.
- 📐 Formatos certos pro Instagram: **4:5**, **1:1** e **9:16**.
- 💾 **Exporte tudo de uma vez** em imagens prontas pra postar.
- 📱 **Instale na tela inicial** e use **offline**.
- 🔒 **Privacidade total:** nada é enviado para servidor nenhum.

## 🚀 Como funciona

1. **Escolha o formato** (feed, quadrado ou stories).
2. **Escolha um template** de post ou carrossel.
3. **Selecione suas fotos** — elas se encaixam automaticamente.
4. **Ajuste o que quiser** — mova, incline, troque, dê zoom.
5. **Exporte** e poste. 🎉

## 🌍 Idiomas

Português 🇧🇷 e Inglês 🇺🇸.

---

<details>
<summary><strong>🛠️ Detalhes técnicos</strong> (para quem quer contribuir)</summary>

SPA 100% client-side, sem backend, hospedada no GitHub Pages.

- **Stack:** React + TypeScript + Vite, Konva (canvas), Zustand (estado),
  i18next (i18n), vite-plugin-pwa (PWA).
- **Dados:** IndexedDB no dispositivo; export/import de projeto em `.zip`.
- **Qualidade:** ESLint + Prettier + Vitest, com CI (lint, types, testes,
  build) e CD para o Pages via GitHub Actions.

### Rodando localmente

```bash
npm install
npm run dev          # ambiente de desenvolvimento
npm run test         # testes
npm run build        # build de produção
```

### Documentação

- [Especificação do produto](docs/ESPECIFICACAO.md)
- [Catálogo de templates](docs/TEMPLATES.md)
- [Decisões de arquitetura (ADRs)](docs/adr/README.md)

</details>

<div align="center">
<sub>Feito com ☕ e muitas fotos de viagem.</sub>
</div>
