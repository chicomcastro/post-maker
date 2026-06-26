# 0004 — Editor: templates customizáveis com Konva

**Status:** Aceito · 2026-06-26

## Contexto

O coração do produto: cada página tem uma foto de **background** (cobre a tela)
e 2–3 fotos de **colagem** por cima, que o usuário pode **mover, inclinar
(rotacionar) e redimensionar**. Templates dão o ponto de partida, mas não devem
engessar.

## Decisão

- Usar **Konva (react-konva)** para o canvas de edição: suporta nativamente
  arrastar, escalar, **rotacionar**, ordem de camadas (z-index), clipping e
  export para imagem — encaixa direto no modelo background + colagem.
- **Template = preset** que gera os valores iniciais das páginas; tudo é
  editável depois. Templates são definidos por arranjos reutilizáveis em
  coordenadas normalizadas (0–1) — ver `docs/TEMPLATES.md`.
- O export full-res reusa o mesmo pipeline Konva para fidelidade pixel-a-pixel.

## Consequências

- Ganhamos rotação/camadas sem reimplementar manipulação de canvas.
- O modelo de dados já comporta texto/stickers no futuro (novos tipos de camada).
- Atenção a memória em mobile: trabalhar com imagens reduzidas na tela e render
  full-res só na exportação.
