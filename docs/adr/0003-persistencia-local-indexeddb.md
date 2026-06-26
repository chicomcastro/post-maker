# 0003 — Persistência local (IndexedDB) + projeto em `.zip`

**Status:** Aceito · 2026-06-26

## Contexto

Sem backend, os projetos e as fotos precisam viver no dispositivo. Fotos são
binários grandes; `localStorage` é pequeno e só guarda strings.

## Decisão

- **IndexedDB** como armazenamento principal de projetos e imagens (Blobs).
  `localStorage` apenas para preferências leves (idioma, último projeto).
- **Export/Import de projeto em `.zip`**: manifest `project.json` + imagens
  originais como arquivos. Escolhido por ser mais leve que embutir imagens em
  base64 dentro de um JSON.

## Consequências

- Backup e migração entre dispositivos ficam manuais (export/import) — aceitável
  no MVP.
- Precisamos tratar erros de cota do IndexedDB e validar peso/abertura do `.zip`
  em mobile (risco registrado na especificação).
- Implementação detalhada virá no PR de modelo de dados/persistência.
