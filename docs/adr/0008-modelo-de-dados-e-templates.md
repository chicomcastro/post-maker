# 0008 — Modelo de dados, templates e estado

**Status:** Aceito · 2026-06-26

## Contexto

Precisamos de um modelo de dados que represente posts/carrosséis (páginas com
background + colagem), suporte customização livre e exportação fiel, e que seja
fácil de testar e persistir.

## Decisão

- **Coordenadas normalizadas (0–1):** posição/tamanho de fotos são frações da
  página, então o mesmo projeto escala para qualquer resolução de export.
- **Templates como dados, não código:** 9 arranjos reutilizáveis
  (`arrangements.ts`) + 25 templates (`catalog.ts`) que referenciam arranjos por
  página. Um `project-factory` instancia um `Project` a partir do template.
- **Estado com Zustand + zundo:** store do editor com **undo/redo** via histórico
  (`zundo`), rastreando apenas o `project` (limite de 50 passos).
- **Persistência (idb):** `IndexedDB` guarda projetos e assets (Blobs)
  separadamente; `pruneOrphanAssets` limpa imagens não referenciadas.
- **Export/Import (`jszip`):** projeto vira um `.zip` com `project.json` +
  `assets/<id>.<ext>`. A conversão Blob↔ArrayBuffer é explícita para funcionar
  igual no browser e em testes Node.

## Consequências

- Lógica de domínio é pura e altamente testável (cobertura com piso no CI).
- O modelo já comporta texto/stickers no futuro (novos tipos de camada).
- Limite de 4 páginas por projeto aplicado no store (regra do MVP).
