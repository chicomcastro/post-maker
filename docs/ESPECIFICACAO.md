# Post Maker — Especificação do Produto (MVP)

> Documento vivo. Status: **rascunho para implementação**.
> Última atualização: 2026-06-26.

---

## 1. Visão geral

**Post Maker** é um web app (SPA) para criar **colagens de fotos prontas para
Instagram** de forma rápida, a partir de **templates com encaixes (slots)**.
Inspirado no app de referência "scrl", mas com estética **limpa/minimalista**,
rodando **100% no navegador** e hospedado de graça no **GitHub Pages**.

O caso de uso central — e o gancho de marketing — é o do viajante que **voltou
da viagem com dezenas de fotos e não postou nada**: em poucos toques ele
escolhe um template, encaixa as fotos, ajusta e exporta um carrossel pronto.

### Princípios

1. **Sem fricção:** sem login, sem cadastro, sem espera. Abriu, criou, exportou.
2. **Privacidade por padrão:** as fotos nunca saem do dispositivo. Todo o
   processamento é client-side.
3. **Custo zero de operação:** hospedagem estática, sem backend, sem servidor de
   imagens.
4. **Mobile-first:** o fluxo principal é pensado para o celular; instalável como
   PWA e funcional offline.

---

## 2. Público-alvo e posicionamento

- **Persona primária:** *Viajante / lifestyle.* Pessoa comum (não-designer) que
  tira muitas fotos em viagens e no dia a dia e quer postar com aparência
  caprichada sem aprender ferramenta de design.
- **Dor:** "tenho fotos demais, não sei montar um post bonito e dá preguiça".
- **Promessa:** transformar um rolo de fotos em um carrossel bonito em menos de
  2 minutos, direto do celular.
- **Tom de marca:** leve, acolhedor, estético, "feito pra você que viaja".

---

## 3. Escopo do MVP

### 3.1 Dentro do escopo (MVP)

| Área | Decisão |
|------|---------|
| Tipo de editor | **Templates + slots** (sem posicionamento livre) |
| Estética | **Limpa / minimalista** (grids elegantes, cantos arredondados) |
| Proporções | **4:5** (1080×1350), **1:1** (1080×1080), **9:16** (1080×1920) |
| Multi-slide | Sim — carrossel com vários slides |
| Recursos por foto | Zoom / reposicionar dentro do slot, brilho/contraste e filtros básicos |
| Estilo do layout | Cor de fundo, espaçamento entre fotos, raio dos cantos |
| Persistência | **100% local** (IndexedDB) + **exportar/importar projeto** (`.json`) |
| Exportação | **PNGs por slide + `.zip`** quando houver múltiplos slides |
| Plataforma | **Mobile-first + PWA** (instalável, offline) |
| Idiomas | **pt-BR + EN** (i18n desde o início; pt-BR como padrão) |
| Monetização | **Grátis total** (sem cobrança nem login no MVP) |

### 3.2 Fora do escopo (MVP) — backlog futuro

- Editor freeform (arrastar/rotacionar/sobrepor livremente em camadas).
- Caixas de texto / tipografia sobre o layout.
- Biblioteca de stickers, formas e elementos decorativos.
- Estética scrapbook (papel rasgado, fitas, polaroids).
- Contas de usuário, sync em nuvem, login.
- Monetização (freemium, premium, pagamentos).
- Dimensões 100% personalizadas.
- Templates gerados/sugeridos automaticamente por IA.

> Decisão de arquitetura: o modelo de dados (ver §7) é desenhado para **suportar
> freeform e texto no futuro** sem reescrita — um slot é apenas um caso
> particular de "camada com transform".

---

## 4. Requisitos funcionais

### 4.1 Fluxo principal (happy path)

```
1. Tela inicial  →  "Criar novo" / "Continuar projeto"
2. Escolher proporção (4:5 / 1:1 / 9:16)
3. Escolher template (galeria de layouts por nº de fotos)
4. Selecionar fotos do dispositivo (múltiplas)
5. Auto-encaixe das fotos nos slots
6. Editar:
   - tocar num slot → zoom/reposicionar/filtros da foto
   - ajustar fundo, espaçamento e cantos do layout
   - navegar/adicionar/remover slides (carrossel)
7. Exportar → PNGs (+ ZIP) ou compartilhar
```

### 4.2 Requisitos detalhados

**RF-01 — Seleção de fotos.** Selecionar múltiplas imagens do dispositivo
(`<input type="file" accept="image/*" multiple>` + drag-and-drop no desktop).
Suporte a JPG, PNG, WebP, HEIC*. (*HEIC pode exigir conversão; ver §9 riscos.)

**RF-02 — Galeria de templates.** Templates organizados por **número de fotos**
(1, 2, 3, 4, 5, 6…) e por proporção. Cada template define a posição/tamanho dos
slots. MVP: ~20–30 templates curados.

**RF-03 — Auto-encaixe.** Ao escolher template e fotos, preencher os slots na
ordem; se houver mais fotos que slots, as excedentes ficam num "rolo" para
trocar; se houver menos, slots ficam vazios (placeholder).

**RF-04 — Ajuste por foto.** Dentro de um slot: pan/zoom (pinça no mobile),
 enquadramento via "cover", e ajustes básicos: brilho, contraste, saturação e
1 conjunto de filtros pré-definidos (ex.: P&B, quente, frio, vívido).

**RF-05 — Estilo do layout.** Cor de fundo (paleta + seletor), espaçamento entre
fotos (0–N px), raio dos cantos (0–N px). Aplicado ao slide atual; opção
"aplicar a todos os slides".

**RF-06 — Carrossel multi-slide.** Adicionar, duplicar, reordenar e remover
slides. Indicador de slide atual. Cada slide tem seu próprio template e fotos.

**RF-07 — Persistência local.** Salvar automaticamente o projeto em IndexedDB
(imagens como Blob). Listar/retomar projetos. Sem limite artificial além do
storage do navegador.

**RF-08 — Export/Import de projeto.** Exportar projeto como arquivo `.json`
(metadados + imagens embutidas em base64 ou empacotadas) para backup/migração.
Importar reidrata o projeto.

**RF-09 — Exportação de imagens.** Renderizar cada slide em canvas na resolução
nominal da proporção e exportar **PNG**. Múltiplos slides → empacotar em `.zip`
(client-side, ex. `jszip`). Botão de **Web Share** quando disponível, com
fallback para download.

**RF-10 — i18n.** Toda string via camada de tradução (pt-BR padrão, EN
disponível). Detecção pelo idioma do navegador + seletor manual persistido.

**RF-11 — PWA.** Manifest + service worker; instalável; assets em cache para uso
offline. O app deve abrir e editar sem rede.

---

## 5. UX / Telas

| Tela | Conteúdo |
|------|----------|
| **Home** | Logo, "Criar novo", lista de projetos salvos (thumb + data), seletor de idioma. |
| **Nova: proporção** | 3 cards (4:5, 1:1, 9:16) com preview do enquadramento. |
| **Nova: template** | Grade de templates filtrável por nº de fotos. |
| **Seleção de fotos** | Botão de upload + grade de fotos selecionadas (reordenável). |
| **Editor** | Canvas central (preview do slide), barra de ferramentas (Foto / Fundo / Slides), tira de slides na base, botão Exportar. |
| **Painel de foto** | Zoom/posição + sliders de ajuste + filtros. |
| **Exportar** | Escolha de slides, formato, botão baixar/compartilhar, progresso. |

Diretrizes visuais: tipografia limpa, muito espaço em branco, cantos
arredondados, paleta neutra com 1 cor de acento. Acessível (contraste AA, áreas
de toque ≥ 44px).

---

## 6. Arquitetura técnica

- **Stack:** React + Vite + TypeScript.
- **SPA estática** servida pelo **GitHub Pages**.
- **Renderização/edição de canvas:** biblioteca de canvas 2D (avaliar
  **Konva/react-konva** ou Canvas API direta) — slots são retângulos com clip e
  transform da imagem.
- **Estado:** store leve (Zustand) com o modelo de projeto; undo/redo desejável.
- **Persistência:** **IndexedDB** (via `idb` ou Dexie) para projetos e Blobs de
  imagem; `localStorage` só para preferências (idioma, último projeto).
- **Export ZIP:** `jszip` + `FileSaver`/anchor download.
- **i18n:** `i18next` + `react-i18next` (ou solução leve equivalente).
- **PWA:** `vite-plugin-pwa` (Workbox) — manifest + service worker + precache.
- **Sem backend, sem chamadas de rede com dados do usuário.** Todo o
  processamento de imagem é local.

### 6.1 Deploy (GitHub Pages)

- Build estático (`vite build`) publicado em GitHub Pages via **GitHub Actions**
  (`actions/deploy-pages`).
- **`base` do Vite** configurado para o subpath do repositório
  (`/post-maker/`) quando publicado em `usuario.github.io/post-maker`.
- **Roteamento SPA:** usar **hash router** (ou fallback `404.html`) para evitar
  404 em refresh de rotas no Pages.
- PWA + Pages: garantir escopo/`start_url` coerentes com o `base`.

---

## 7. Modelo de dados (rascunho)

```ts
type AspectRatio = "4:5" | "1:1" | "9:16";

interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  aspectRatio: AspectRatio;
  slides: Slide[];
  assets: Record<string, AssetRef>; // imagens importadas (Blob no IndexedDB)
}

interface Slide {
  id: string;
  templateId: string;
  background: { color: string };
  spacing: number;       // px entre fotos
  cornerRadius: number;  // px
  layers: Layer[];       // hoje só "photo"; futuro: text, sticker, freeform
}

// Slot preenchido = camada de foto com transform dentro de um frame do template
interface PhotoLayer {
  id: string;
  type: "photo";
  slotId: string;        // referência ao frame definido pelo template
  assetId: string | null;
  transform: { x: number; y: number; scale: number; rotation: number };
  adjustments: { brightness: number; contrast: number; saturation: number; filter?: string };
}

type Layer = PhotoLayer; // união extensível no futuro

interface Template {
  id: string;
  aspect: AspectRatio;
  photoCount: number;
  slots: Array<{ id: string; x: number; y: number; w: number; h: number }>; // 0..1 normalizado
}
```

> Os `slots` do template usam coordenadas **normalizadas (0–1)**, então o mesmo
> template escala para qualquer resolução de export.

---

## 8. Marketing e go-to-market (direção)

- **Gancho principal:** "Voltou da viagem e não postou nada?" → demonstra o app
  resolvendo isso em segundos.
- **Canais:** Reels/Stories no próprio Instagram e TikTok mostrando o fluxo
  (screen-recording), antes/depois de um feed.
- **Prova de valor:** velocidade (carrossel em < 2 min) + "suas fotos não saem
  do seu celular" (privacidade).
- **Distribuição:** link único do GitHub Pages; "instalar na tela inicial" (PWA)
  como CTA de retenção.
- **Métrica norte (sem backend):** difícil medir sem analytics; se quisermos,
  avaliar analytics privacy-friendly (Plausible/umami) — **decisão pendente**,
  pois adiciona dependência externa. Por padrão, **sem rastreamento** no MVP.
- **Crédito:** rodapé discreto "feito com Post Maker"; export **sem marca
  d'água** (modelo grátis total).

---

## 9. Riscos e pontos de atenção

1. **HEIC (iPhone):** fotos HEIC podem não decodificar nativamente em todos os
   navegadores. Mitigação: orientar/checar suporte e, se necessário, lib de
   conversão client-side (custo de bundle). **A validar cedo.**
2. **Memória em mobile:** processar várias fotos em alta resolução pode estourar
   memória. Mitigação: downscale para exibição, render full-res só no export,
   liberar Blobs/URLs.
3. **Limite do IndexedDB:** varia por dispositivo/navegador; tratar erros de
   cota e avisar o usuário; export de projeto como backup.
4. **Export de ZIP grande no mobile:** carrosséis longos geram arquivos pesados;
   considerar export incremental e feedback de progresso.
5. **GitHub Pages + roteamento/PWA:** atenção a `base`, hash routing e escopo do
   service worker (ver §6.1).
6. **Sem métricas:** sem backend, validar uso exige analytics externo (trade-off
   com privacidade) — pendente.

---

## 10. Decisões em aberto (a confirmar)

- [ ] Quantidade e quais templates entram no conjunto inicial.
- [ ] Conjunto exato de filtros pré-definidos.
- [ ] Incluir analytics privacy-friendly ou manter zero rastreamento.
- [ ] Formato exato do arquivo de projeto (`.json` com base64 vs `.zip` com
      imagens + manifest).
- [ ] Domínio próprio (CNAME) ou `usuario.github.io/post-maker`.
- [ ] Undo/redo entra no MVP ou no v1.1?

---

## 11. Roadmap sugerido

- **v0 (MVP):** fluxo completo deste documento — templates, ajuste por foto,
  fundo, carrossel, export PNG/ZIP, local + import/export, PWA, i18n.
- **v1.1:** texto/títulos, undo/redo, mais templates, filtros adicionais.
- **v1.2:** stickers/elementos e estética scrapbook (papel rasgado, polaroids).
- **v2:** editor freeform (camadas livres), possível freemium.
