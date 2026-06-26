# Post Maker — Especificação do Produto (MVP)

> Documento vivo. Status: **rascunho para implementação**.
> Última atualização: 2026-06-26.

---

## 1. Visão geral

**Post Maker** é um web app (SPA) para criar **carrosséis de fotos prontos para
Instagram** de forma rápida, a partir de **templates pré-prontos e
customizáveis**. Inspirado no app de referência "scrl", com estética
**limpa/minimalista**, rodando **100% no navegador** e hospedado de graça no
**GitHub Pages**.

O conceito visual central: em cada página do carrossel, **uma foto vira o
background** (preenche a tela) e **outras 2–3 fotos são coladas por cima**, em
posições e angulações variadas — como um mosaico/colagem sobre a foto de fundo.
Um template define esse arranjo para um carrossel de **2, 3 ou 4 páginas**.

O caso de uso central — e o gancho de marketing — é o do viajante que **voltou
da viagem com dezenas de fotos e não postou nada**: em poucos toques ele
escolhe um template, joga as fotos, ajusta o que quiser e exporta o carrossel.

### Princípios

1. **Sem fricção:** sem login, sem cadastro, sem espera. Abriu, criou, exportou.
2. **Privacidade por padrão:** as fotos nunca saem do dispositivo. Todo o
   processamento é client-side. **Zero analytics/rastreamento.**
3. **Custo zero de operação:** hospedagem estática, sem backend.
4. **Mobile-first:** fluxo pensado para o celular; instalável como PWA e
   funcional offline.
5. **Pré-pronto, mas não engessado:** o template dá o ponto de partida; o
   usuário pode reposicionar, inclinar e redimensionar as fotos da colagem.

---

## 2. Público-alvo e posicionamento

- **Persona primária:** _Viajante / lifestyle._ Pessoa comum (não-designer) que
  tira muitas fotos em viagens e no dia a dia e quer postar com aparência
  caprichada sem aprender ferramenta de design.
- **Dor:** "tenho fotos demais, não sei montar um post bonito e dá preguiça".
- **Promessa:** transformar um rolo de fotos em um carrossel bonito em menos de
  2 minutos, direto do celular.
- **Tom de marca:** leve, acolhedor, estético, "feito pra você que viaja".

---

## 3. Escopo do MVP

### 3.1 Dentro do escopo (MVP)

| Área              | Decisão                                                                                                  |
| ----------------- | -------------------------------------------------------------------------------------------------------- |
| Modelo de edição  | **Templates pré-prontos + customização** (background + colagem)                                          |
| Estética          | **Limpa / minimalista**                                                                                  |
| Template          | **Post de 1 página** ou **carrossel de 2–4 páginas**; cada página = 1 background + 1–3 fotos sobrepostas |
| Customização      | Mover, **inclinar (rotacionar)** e redimensionar as fotos da colagem; reenquadrar o background           |
| Proporções        | **4:5** (1080×1350), **1:1** (1080×1080), **9:16** (1080×1920)                                           |
| Recursos por foto | Zoom/reposicionar dentro do frame, brilho/contraste/saturação, filtros básicos                           |
| Estilo do layout  | Cor de fundo (quando background não cobre tudo), borda/sombra das fotos da colagem, raio dos cantos      |
| Undo/redo         | **Sim** (no MVP)                                                                                         |
| Persistência      | **100% local** (IndexedDB) + **exportar/importar projeto** (`.zip`)                                      |
| Exportação        | **PNGs por página + `.zip`** quando houver múltiplas páginas                                             |
| Plataforma        | **Mobile-first + PWA** (instalável, offline)                                                             |
| Idiomas           | **pt-BR + EN** (i18n; pt-BR padrão)                                                                      |
| Analytics         | **Nenhum**                                                                                               |
| Hospedagem        | **GitHub Pages** em domínio padrão (`usuario.github.io/post-maker`)                                      |
| Monetização       | **Grátis total**                                                                                         |

### 3.2 Fora do escopo (MVP) — backlog futuro

- Caixas de texto / tipografia sobre o layout.
- Biblioteca de stickers, formas e elementos decorativos.
- Estética scrapbook explícita (papel rasgado, fitas, polaroids).
- Editor freeform "do zero" (criar layout sem template como base).
- Contas de usuário, sync em nuvem, login.
- Monetização (freemium, premium, pagamentos).
- Dimensões 100% personalizadas.
- Templates gerados/sugeridos por IA.

> Nota: a customização do MVP é um **freeform "leve"** aplicado às camadas de
> colagem de um template existente. O freeform "do zero" (montar a página sem
> partir de um template) fica para depois — mas o modelo de dados (§7) já
> suporta os dois.

---

## 4. Requisitos funcionais

### 4.1 Fluxo principal (happy path)

```
1. Home  →  "Criar novo" / "Continuar projeto"
2. Escolher proporção (4:5 / 1:1 / 9:16)
3. Escolher template de carrossel (2, 3 ou 4 páginas)
4. Selecionar fotos do dispositivo (múltiplas)
5. Auto-distribuição: 1 foto vira background de cada página + fotos da colagem
6. Editar:
   - tocar numa foto da colagem → mover / inclinar / redimensionar / trocar
   - tocar no background → reenquadrar (pan/zoom) / trocar / ajustes
   - estilo: cor de fundo, borda/sombra/cantos das fotos da colagem
   - navegar/adicionar/remover páginas; trocar fotos
   - undo/redo a qualquer momento
7. Exportar → PNGs (+ ZIP) ou compartilhar
```

### 4.2 Requisitos detalhados

**RF-01 — Seleção de fotos.** Selecionar múltiplas imagens do dispositivo
(`<input type="file" accept="image/*" multiple>` + drag-and-drop no desktop).
Suporte a JPG, PNG, WebP e **HEIC** (via conversão client-side; ver RF-12).

**RF-02 — Galeria de templates.** Templates são **presets de post (1 página) ou
carrossel (2–4 páginas)**, parametrizados por: nº de páginas, nº de fotos de
colagem por página (1–3), arranjo (posição/ângulo) e proporção. O conjunto
inicial tem **25 templates** sobre 9 arranjos reutilizáveis — ver
[`TEMPLATES.md`](TEMPLATES.md).

**RF-03 — Auto-distribuição.** Ao escolher template e fotos, distribuir na
ordem: primeira foto de cada página como background, demais como colagem.
Fotos excedentes ficam num "rolo" para troca; faltando fotos, frames ficam com
placeholder.

**RF-04 — Background da página.** Uma foto preenche a página inteira (cover).
Reenquadrar via pan/zoom; trocar a foto; aplicar ajustes (RF-06).

**RF-05 — Fotos da colagem (customização).** Cada foto sobreposta pode ser
**movida, rotacionada (inclinada) e redimensionada** livremente sobre o
background; trazer para frente/enviar para trás (ordem de camadas); trocar a
imagem; remover. O template define os valores iniciais, mas tudo é editável.

**RF-06 — Ajustes por foto.** Brilho, contraste, saturação e um conjunto de
filtros pré-definidos (ex.: P&B, quente, frio, vívido). Aplica tanto ao
background quanto às fotos da colagem.

**RF-07 — Estilo do layout.** Borda/contorno e sombra das fotos da colagem,
raio dos cantos, e cor de fundo da página (visível quando o background não
cobre tudo). Opção "aplicar a todas as páginas".

**RF-08 — Carrossel multi-página.** Adicionar, duplicar, reordenar e remover
páginas. Indicador de página atual. Cada página tem seu próprio arranjo.

**RF-09 — Undo / Redo.** Histórico de ações reversível (mover, ajustar, trocar
foto, mudar estilo etc.).

**RF-10 — Persistência local.** Salvar automaticamente o projeto em IndexedDB
(imagens como Blob). Listar/retomar projetos.

**RF-11 — Export/Import de projeto.** Exportar projeto como **`.zip`** (manifest
`project.json` + imagens originais como arquivos) para backup/migração. Importar
reidrata o projeto. (Formato `.zip` escolhido por ficar mais leve que base64
embutido; validar peso/abertura em mobile.)

**RF-12 — Conversão HEIC.** Ao importar HEIC, converter para JPEG/PNG no cliente
(lib tipo `heic2any`), idealmente sob detecção (só carrega a lib se houver HEIC,
para não pesar o bundle). Validar suporte/decodificação cedo (ver §9).

**RF-13 — Exportação de imagens.** Renderizar cada página em canvas na resolução
nominal da proporção e exportar **PNG**. Múltiplas páginas → empacotar em `.zip`
(`jszip`). Botão **Web Share** quando disponível, com fallback para download.

**RF-14 — i18n.** Toda string via camada de tradução (pt-BR padrão, EN
disponível). Detecção pelo idioma do navegador + seletor manual persistido.

**RF-15 — PWA.** Manifest + service worker; instalável; assets em cache para uso
offline. O app deve abrir e editar sem rede.

---

## 5. UX / Telas

| Tela                    | Conteúdo                                                                                                                          |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Home**                | Logo, "Criar novo", lista de projetos salvos (thumb + data), seletor de idioma.                                                   |
| **Nova: proporção**     | 3 cards (4:5, 1:1, 9:16) com preview do enquadramento.                                                                            |
| **Nova: template**      | Grade de templates (preview animado das páginas), filtrável por nº de páginas/fotos.                                              |
| **Seleção de fotos**    | Botão de upload + grade de fotos selecionadas (reordenável).                                                                      |
| **Editor**              | Canvas da página atual; barra de ferramentas (Colagem / Background / Estilo); tira de páginas na base; undo/redo; botão Exportar. |
| **Manipulação de foto** | Handles de mover/rotacionar/redimensionar (gestos no mobile) + ajustes + filtros.                                                 |
| **Exportar**            | Escolha de páginas, formato, baixar/compartilhar, progresso.                                                                      |

Diretrizes visuais: tipografia limpa, espaço em branco, cantos arredondados,
paleta neutra com 1 cor de acento. Acessível (contraste AA, alvos de toque
≥ 44px). Gestos no mobile: arrastar (mover), pinça (escala), dois dedos girando
(rotação).

---

## 6. Arquitetura técnica

- **Stack:** React + Vite + TypeScript. SPA estática no **GitHub Pages**.
- **Canvas/edição:** **Konva/react-konva** é boa escolha — suporta nativamente
  arrastar, escalar e **rotacionar** nós, ordem de camadas (z-index), clipping e
  export para imagem; encaixa direto no modelo background + colagem.
- **Estado:** store leve (Zustand) com o modelo de projeto; **undo/redo** via
  histórico de estados (ex.: middleware de histórico / zundo).
- **Persistência:** **IndexedDB** (via `idb` ou Dexie) para projetos e Blobs de
  imagem; `localStorage` só para preferências (idioma, último projeto).
- **HEIC:** `heic2any` (carregada sob demanda).
- **Export ZIP:** `jszip` + download/`Web Share`.
- **i18n:** `i18next` + `react-i18next`.
- **PWA:** `vite-plugin-pwa` (Workbox).
- **Sem backend, sem rede com dados do usuário, sem analytics.**

### 6.1 Deploy (GitHub Pages)

- Build estático (`vite build`) publicado via **GitHub Actions**
  (`actions/deploy-pages`).
- **`base` do Vite** = `/post-maker/` (domínio padrão do Pages).
- **Roteamento SPA:** hash router (ou fallback `404.html`) para evitar 404 em
  refresh.
- PWA + Pages: `scope`/`start_url` coerentes com o `base`.

---

## 7. Modelo de dados (rascunho)

```ts
type AspectRatio = '4:5' | '1:1' | '9:16'

interface Project {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  aspectRatio: AspectRatio
  templateId: string // template de origem (informativo)
  pages: Page[]
  assets: Record<string, AssetRef> // imagens (Blob no IndexedDB)
}

interface Page {
  id: string
  background: {
    assetId: string | null
    transform: Transform // pan/zoom do cover
    adjustments: Adjustments
  }
  bgColor: string // cor de fundo (quando a foto não cobre tudo)
  collage: CollagePhoto[] // fotos sobrepostas, em ordem de z-index
}

interface CollagePhoto {
  id: string
  assetId: string | null
  transform: Transform // posição, escala e ROTAÇÃO (inclinação)
  frame: { w: number; h: number; cornerRadius: number }
  style: { borderWidth: number; borderColor: string; shadow: boolean }
  adjustments: Adjustments
}

interface Transform {
  x: number
  y: number
  scale: number
  rotation: number
}
interface Adjustments {
  brightness: number
  contrast: number
  saturation: number
  filter?: string
}

// Template = preset de carrossel (gera os valores iniciais de Page[])
interface Template {
  id: string
  pages: number // 2..4
  aspect: AspectRatio | 'any'
  pageDefs: Array<{
    collageCount: number // 2..3
    collage: Array<{ x: number; y: number; scale: number; rotation: number; w: number; h: number }>
  }>
}
```

> Coordenadas de template em **normalizado (0–1)**, então o mesmo template
> escala para qualquer proporção/resolução de export. O modelo já comporta
> texto/stickers no futuro (basta novos tipos de camada na `collage`/página).

---

## 8. Marketing e go-to-market (direção)

- **Gancho principal:** "Voltou da viagem e não postou nada?" → vídeo mostrando
  o fluxo (foto vira fundo + colagem por cima) resolvendo isso em segundos.
- **Canais:** Reels/Stories no Instagram e TikTok (screen-recording do fluxo),
  antes/depois de um feed.
- **Prova de valor:** velocidade (carrossel em < 2 min) + privacidade ("suas
  fotos não saem do seu celular") + visual de colagem com fundo, que é o
  diferencial estético.
- **Distribuição:** link único do GitHub Pages; "instalar na tela inicial" (PWA)
  como CTA de retenção.
- **Crédito:** rodapé discreto "feito com Post Maker"; export **sem marca
  d'água**.
- **Métricas:** **sem analytics** no MVP (decisão tomada).

---

## 9. Riscos e pontos de atenção

1. **HEIC (iPhone):** principal risco técnico. Plano: integrar `heic2any` sob
   detecção e **validar cedo** num spike. Se a decodificação falhar em algum
   navegador, exibir mensagem orientando exportar como JPEG.
2. **Memória em mobile:** várias fotos full-res + rotação podem pesar. Mitigação:
   trabalhar com versões reduzidas na tela, render full-res só no export, liberar
   Blobs/ObjectURLs.
3. **Limite do IndexedDB:** tratar erros de cota e oferecer export `.zip` como
   backup.
4. **Export `.zip` em mobile:** validar peso e abertura do arquivo no iOS/Android
   (download e re-import). Feedback de progresso para carrosséis grandes.
5. **Rotação + export fiel:** garantir que o render de export reproduz exatamente
   posição/ângulo/escala do editor (mesmo pipeline Konva).
6. **GitHub Pages + roteamento/PWA:** atenção a `base`, hash routing e escopo do
   service worker.

---

## 10. Decisões tomadas

- ✅ Conjunto inicial: **25 templates** — posts de 1 página + carrosséis de 2–4
  páginas; cada página com background + 1–3 fotos de colagem em posições/ângulos
  variados. Catálogo nominal em [`TEMPLATES.md`](TEMPLATES.md).
- ✅ Templates **pré-prontos e customizáveis** (mover/inclinar/redimensionar).
- ✅ **Undo/redo no MVP.**
- ✅ **Zero analytics.**
- ✅ Arquivo de projeto em **`.zip`** (validar peso em mobile).
- ✅ HEIC: **engatilhar lib de conversão** (`heic2any`) e validar no spike.
- ✅ **Domínio padrão** do Pages.

- ✅ Lista nominal dos templates iniciais — ver [`TEMPLATES.md`](TEMPLATES.md).

### Ainda a definir

- [ ] Conjunto exato de filtros pré-definidos.
- [ ] Ajuste fino das coordenadas/ângulos de cada arranjo por proporção.
- [ ] Detalhes de gesto/UX da rotação no mobile.

---

## 11. Roadmap sugerido

- **v0 (MVP):** fluxo completo deste documento — templates customizáveis
  (background + colagem), ajustes por foto, estilo, carrossel multi-página,
  undo/redo, export PNG/ZIP, local + import/export `.zip`, HEIC, PWA, i18n.
- **v1.1:** texto/títulos, mais templates, filtros adicionais.
- **v1.2:** stickers/elementos e estética scrapbook (papel rasgado, polaroids).
- **v2:** freeform "do zero" (montar página sem template), possível freemium.
