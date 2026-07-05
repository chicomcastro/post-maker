# 0024 — Sugestões automáticas por dia e lugar (biblioteca + EXIF)

**Status:** Aceito · 2026-06-29

## Contexto

O usuário quer mais automação: dar acesso às fotos ou subir em massa e o app
**agrupar por dia e por localidade**, sugerindo posts prontos. Restrições da
plataforma web:

- Nenhum site lê a biblioteca de fotos em background; o caminho é o **seletor
  nativo com multi-seleção** (no iOS/Android abre a galeria e permite marcar
  muitas fotos) — isso é o "acesso à biblioteca" possível.
- **Data e GPS** vêm do **EXIF**, extraível 100% no aparelho. O downscale via
  canvas (ADR 0020) **descarta EXIF**, então os metadados precisam ser extraídos
  do arquivo original, antes da conversão.
- Nomear o lugar exige um geocoder online.

## Decisão

- **Biblioteca de fotos** (novo store `library`, DB v2): `{assetId, takenAt,
lat?, lon?, place?, addedAt}`. `pruneOrphanAssets` passa a preservar assets
  referenciados pela biblioteca. Migração de schema incremental (`oldVersion`).
- **Extração EXIF no aparelho** com `exifr` (import dinâmico), no arquivo
  original: `DateTimeOriginal`/`CreateDate` + GPS. Fallback: `lastModified`.
  Nunca lança.
- **Agrupamento** (`clusterByDayAndPlace`, lógica pura): por **dia local** e,
  dentro do dia, clusters por proximidade (**haversine ≤ 2km** do centro médio).
  Fotos sem GPS formam grupo próprio por dia. Grupos mais recentes primeiro.
- **Sugestão de template** (`chooseTemplateFor`): reserva 1 foto para o fundo e
  escolhe o template cujos slots de colagem melhor casam com o restante
  (desempate: menos páginas).
- **Tela "Sugestões"** (`/suggestions`, botão secundário na home): dropzone de
  importação em massa com progresso, cards de "momentos" (data, lugar,
  miniaturas, nº de fotos) e **"Criar carrossel"** — cria o projeto já nomeado
  ("Lugar — data"), com o pool preenchido e fotos distribuídas, e abre o editor.
- **Privacidade**: análise 100% local (mensagem explícita na tela). A
  geocodificação é **opt-in por ação** ("Nomear lugares"): envia **apenas
  coordenadas** (nunca fotos) ao BigDataCloud (client-api gratuita, sem chave);
  nomes ficam cacheados na biblioteca.

## Consequências

- Fluxo automatizado: subir fotos em massa → momentos por dia/lugar → carrossel
  pronto em um toque, com nome contextual.
- A biblioteca persiste entre visitas; novos uploads se agregam aos grupos.
- Sem EXIF (ex.: screenshots, WhatsApp), o agrupamento cai para o dia do
  arquivo e "Sem local" — degrada de forma honesta.
- Próximos passos naturais (fora deste ADR): sugestões "mesmo lugar em datas
  diferentes", gerenciar/limpar biblioteca, dispensar sugestões.
