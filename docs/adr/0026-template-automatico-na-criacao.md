# 0026 — Template automático na criação (pela quantidade de fotos)

**Status:** Aceito · 2026-07-05

## Contexto

Na criação, o usuário precisava escolher um template manualmente antes de saber
quantas fotos usaria. Pediu a opção de **seleção automática do template com base
na quantidade de fotos escolhidas** — o mesmo comportamento que as Sugestões já
faziam.

## Decisão

- **Opção "Automático"** em destaque no topo da etapa de template (acima do
  filtro e da grade). Ao escolhê-la, a seleção de layout é **adiada**: o fluxo
  vai direto para as fotos e o passo mostra uma dica contextual
  ("escolhemos o melhor layout com base em quantas fotos você selecionar").
- **Estado**: `auto: boolean` além de `template`. São mutuamente exclusivos —
  escolher um template manual zera `auto` e vice-versa.
- **Na finalização**: `chosen = auto ? chooseTemplateFor(files.length) :
template` — reaproveita o heurístico puro já existente (ADR 0024/0025), que
  reserva 1 foto para o fundo e casa os slots com o restante. `aspectRatio`
  continua vindo da etapa de formato, independentemente do template.

## Consequências

- Quem não quer decidir layout escolhe "Automático" e só seleciona as fotos.
- Zero divergência de lógica: a mesma função escolhe o template na criação e nas
  sugestões.
- A escolha automática pode deixar 1 foto fora dos slots (reservada como fundo em
  potencial) — coerente com o resto do app, onde o fundo é opcional e ajustável
  no editor.
