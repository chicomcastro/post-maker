# Catálogo de Templates (conjunto inicial do MVP)

> Status: **proposta para revisão.** Acompanha `ESPECIFICACAO.md`.
> Conceito comum a todos: cada página tem **1 foto de background** (cobre a
> página) + **N fotos de colagem** por cima, em posições e ângulos variados.
> Tudo é **customizável** depois (mover/inclinar/redimensionar/trocar).

## Como ler este catálogo

- **Arranjo:** um padrão reutilizável que define posição, tamanho e inclinação
  das fotos de colagem em uma página. Um template é uma sequência de arranjos
  (um por página).
- **Coordenadas:** normalizadas `0–1` sobre a caixa da página. `x,y` = **centro**
  da foto; `w,h` = fração da largura/altura da página; `rot` = graus (+ horário).
  Valores são ponto de partida — afinados na implementação.

---

## 1. Biblioteca de arranjos

| Arranjo | Fotos | Descrição | Posições aproximadas (x, y, w, h, rot) |
|---------|:----:|-----------|----------------------------------------|
| **A1 · Solo** | 1 | Uma foto-destaque levemente torta, centro-baixo (cara de polaroid). | P1 (0.50, 0.58, 0.56, 0.50, +4) |
| **A2 · Dupla cruzada** | 2 | Duas fotos sobrepostas no centro, inclinações opostas. | P1 (0.42, 0.44, 0.50, 0.52, −7) · P2 (0.60, 0.60, 0.50, 0.52, +8) |
| **A3 · Diagonal** | 2 | Uma no topo-esquerda, outra na base-direita. | P1 (0.34, 0.30, 0.46, 0.48, −6) · P2 (0.66, 0.72, 0.46, 0.48, +6) |
| **A4 · Pilha central** | 2 | Duas empilhadas no centro, sobreposição forte. | P1 (0.48, 0.50, 0.52, 0.54, −4) · P2 (0.54, 0.54, 0.48, 0.50, +5) |
| **A5 · Trio espalhado** | 3 | Três fotos espalhadas, ângulos variados. | P1 (0.30, 0.32, 0.42, 0.42, −8) · P2 (0.66, 0.40, 0.40, 0.42, +7) · P3 (0.48, 0.70, 0.44, 0.44, −3) |
| **A6 · Trio coluna** | 3 | Três empilhadas na vertical, deslocamento alternado. | P1 (0.46, 0.26, 0.50, 0.30, −4) · P2 (0.54, 0.50, 0.50, 0.30, +4) · P3 (0.46, 0.74, 0.50, 0.30, −4) |
| **A7 · Cluster de canto** | 3 | Três agrupadas na base, leque para um canto. | P1 (0.34, 0.66, 0.40, 0.40, −10) · P2 (0.56, 0.70, 0.40, 0.40, +6) · P3 (0.48, 0.84, 0.38, 0.36, −2) |
| **A8 · Faixa lateral** | 2 | Duas alinhadas à direita, leve inclinação. | P1 (0.70, 0.34, 0.46, 0.40, +5) · P2 (0.70, 0.66, 0.46, 0.40, −5) |
| **A9 · Leque** | 3 | Três abertas como cartas na mão, base comum. | P1 (0.40, 0.58, 0.40, 0.46, −14) · P2 (0.50, 0.54, 0.40, 0.46, 0) · P3 (0.60, 0.58, 0.40, 0.46, +14) |

> Nota: para 9:16 (mais alto), arranjos verticais (A6) ficam melhores; para 1:1,
> os centrais (A2/A4/A5). A grade abaixo já sugere bons pares arranjo×proporção,
> mas todo template funciona em qualquer proporção.

---

## 2. Posts de página única (1 página)

Para quem quer um único post de feed (não carrossel).

| ID | Arranjo | Fotos | Proporção sugerida | Vibe |
|----|---------|:----:|:------------------:|------|
| `post-solo` | A1 | 1 | 4:5 / 1:1 | Minimalista, foco numa foto. |
| `post-duo-cross` | A2 | 2 | 1:1 | Dois momentos sobrepostos. |
| `post-diagonal` | A3 | 2 | 4:5 | Dinâmico, antes/depois. |
| `post-trio-scatter` | A5 | 3 | 4:5 | "Resumo" de 3 fotos. |
| `post-trio-fan` | A9 | 3 | 1:1 | Lúdico, tipo cartões. |
| `post-corner` | A7 | 3 | 9:16 | Foto de fundo respira no topo. |

**6 templates.**

---

## 3. Carrosséis de 2 páginas

| ID | Páginas (arranjos) | Fotos/pág. | Proporção | Vibe |
|----|--------------------|:----------:|:---------:|------|
| `carousel2-solo-duo` | A1 → A2 | 1, 2 | 4:5 | Abre com destaque, expande. |
| `carousel2-diagonal` | A3 → A3 | 2, 2 | 4:5 | Ritmo diagonal consistente. |
| `carousel2-duo-trio` | A2 → A5 | 2, 3 | 1:1 | Cresce em densidade. |
| `carousel2-fan` | A9 → A9 | 3, 3 | 1:1 | Lúdico do começo ao fim. |
| `carousel2-vertical` | A6 → A6 | 3, 3 | 9:16 | Stories/coluna. |

**5 templates.**

---

## 4. Carrosséis de 3 páginas

| ID | Páginas (arranjos) | Fotos/pág. | Proporção | Vibe |
|----|--------------------|:----------:|:---------:|------|
| `carousel3-crescendo` | A1 → A2 → A5 | 1, 2, 3 | 4:5 | Crescente: capa → dupla → trio. |
| `carousel3-diagonal` | A3 → A3 → A3 | 2, 2, 2 | 4:5 | Coeso e dinâmico. |
| `carousel3-scatter` | A5 → A5 → A5 | 3, 3, 3 | 1:1 | Álbum espalhado. |
| `carousel3-mix` | A2 → A7 → A2 | 2, 3, 2 | 4:5 | Variação ritmada. |
| `carousel3-vertical` | A6 → A6 → A6 | 3, 3, 3 | 9:16 | Coluna para stories/feed alto. |
| `carousel3-fan` | A9 → A2 → A9 | 3, 2, 3 | 1:1 | Lúdico com respiro no meio. |
| `carousel3-side` | A8 → A8 → A8 | 2, 2, 2 | 4:5 | Faixa lateral, espaço pra texto futuro. |
| `carousel3-corner` | A7 → A1 → A7 | 3, 1, 3 | 9:16 | Cluster, respiro, cluster. |

**8 templates.**

---

## 5. Carrosséis de 4 páginas

| ID | Páginas (arranjos) | Fotos/pág. | Proporção | Vibe |
|----|--------------------|:----------:|:---------:|------|
| `carousel4-crescendo` | A1 → A2 → A5 → A7 | 1, 2, 3, 3 | 4:5 | Abre simples, fecha cheio. |
| `carousel4-diagonal` | A3 → A3 → A3 → A3 | 2×4 | 4:5 | Consistente e dinâmico. |
| `carousel4-scatter` | A5 → A5 → A5 → A5 | 3×4 | 1:1 | Álbum de viagem completo. |
| `carousel4-vertical` | A6 → A6 → A6 → A6 | 3×4 | 9:16 | Sequência alta/stories. |
| `carousel4-mix` | A2 → A5 → A8 → A9 | 2, 3, 2, 3 | 4:5 | Variado, "editorial". |
| `carousel4-bookend` | A1 → A5 → A5 → A1 | 1, 3, 3, 1 | 1:1 | Capa e contracapa minimalistas. |

**6 templates.**

---

## Total

**6 (posts) + 5 + 8 + 6 = 25 templates** no conjunto inicial — dentro da faixa
de 20–30. Como todos compartilham 9 arranjos parametrizados, dá para gerar mais
variações trocando proporção, cor de fundo e estilo de borda sem novo código.

## A definir na implementação
- Ajuste fino das coordenadas/ângulos por arranjo e por proporção.
- Miniaturas/preview de cada template na galeria.
- Conjunto de filtros pré-definidos (referenciado na spec).
