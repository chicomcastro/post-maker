// Catálogo de templates do MVP (25 templates). Ver docs/TEMPLATES.md.
// Um template é uma sequência de arranjos (um por página).

import type { AspectRatio } from '../types/project'

export type TemplateKind = 'post' | 'carousel'

export interface Template {
  id: string
  kind: TemplateKind
  /** Arranjos por página (1 entrada = 1 página). */
  pages: string[]
  /** Proporção sugerida (o template funciona em qualquer uma). */
  preferredAspect: AspectRatio
}

export const TEMPLATES: Template[] = [
  // Posts (1 página)
  { id: 'post-solo', kind: 'post', pages: ['A1'], preferredAspect: '4:5' },
  { id: 'post-duo-cross', kind: 'post', pages: ['A2'], preferredAspect: '1:1' },
  { id: 'post-diagonal', kind: 'post', pages: ['A3'], preferredAspect: '4:5' },
  { id: 'post-trio-scatter', kind: 'post', pages: ['A5'], preferredAspect: '4:5' },
  { id: 'post-trio-fan', kind: 'post', pages: ['A9'], preferredAspect: '1:1' },
  { id: 'post-corner', kind: 'post', pages: ['A7'], preferredAspect: '9:16' },

  // Carrosséis "uma foto por página" (mesmo arranjo em todas as páginas)
  { id: 'carousel2-solo', kind: 'carousel', pages: ['A1', 'A1'], preferredAspect: '4:5' },
  { id: 'carousel3-solo', kind: 'carousel', pages: ['A1', 'A1', 'A1'], preferredAspect: '4:5' },
  {
    id: 'carousel4-solo',
    kind: 'carousel',
    pages: ['A1', 'A1', 'A1', 'A1'],
    preferredAspect: '4:5',
  },

  // Carrosséis de 2 páginas
  { id: 'carousel2-solo-duo', kind: 'carousel', pages: ['A1', 'A2'], preferredAspect: '4:5' },
  { id: 'carousel2-diagonal', kind: 'carousel', pages: ['A3', 'A3'], preferredAspect: '4:5' },
  { id: 'carousel2-duo-trio', kind: 'carousel', pages: ['A2', 'A5'], preferredAspect: '1:1' },
  { id: 'carousel2-fan', kind: 'carousel', pages: ['A9', 'A9'], preferredAspect: '1:1' },
  { id: 'carousel2-vertical', kind: 'carousel', pages: ['A6', 'A6'], preferredAspect: '9:16' },

  // Carrosséis de 3 páginas
  {
    id: 'carousel3-crescendo',
    kind: 'carousel',
    pages: ['A1', 'A2', 'A5'],
    preferredAspect: '4:5',
  },
  { id: 'carousel3-diagonal', kind: 'carousel', pages: ['A3', 'A3', 'A3'], preferredAspect: '4:5' },
  { id: 'carousel3-scatter', kind: 'carousel', pages: ['A5', 'A5', 'A5'], preferredAspect: '1:1' },
  { id: 'carousel3-mix', kind: 'carousel', pages: ['A2', 'A7', 'A2'], preferredAspect: '4:5' },
  {
    id: 'carousel3-vertical',
    kind: 'carousel',
    pages: ['A6', 'A6', 'A6'],
    preferredAspect: '9:16',
  },
  { id: 'carousel3-fan', kind: 'carousel', pages: ['A9', 'A2', 'A9'], preferredAspect: '1:1' },
  { id: 'carousel3-side', kind: 'carousel', pages: ['A8', 'A8', 'A8'], preferredAspect: '4:5' },
  { id: 'carousel3-corner', kind: 'carousel', pages: ['A7', 'A1', 'A7'], preferredAspect: '9:16' },

  // Carrosséis de 4 páginas
  {
    id: 'carousel4-crescendo',
    kind: 'carousel',
    pages: ['A1', 'A2', 'A5', 'A7'],
    preferredAspect: '4:5',
  },
  {
    id: 'carousel4-diagonal',
    kind: 'carousel',
    pages: ['A3', 'A3', 'A3', 'A3'],
    preferredAspect: '4:5',
  },
  {
    id: 'carousel4-scatter',
    kind: 'carousel',
    pages: ['A5', 'A5', 'A5', 'A5'],
    preferredAspect: '1:1',
  },
  {
    id: 'carousel4-vertical',
    kind: 'carousel',
    pages: ['A6', 'A6', 'A6', 'A6'],
    preferredAspect: '9:16',
  },
  {
    id: 'carousel4-mix',
    kind: 'carousel',
    pages: ['A2', 'A5', 'A8', 'A9'],
    preferredAspect: '4:5',
  },
  {
    id: 'carousel4-bookend',
    kind: 'carousel',
    pages: ['A1', 'A5', 'A5', 'A1'],
    preferredAspect: '1:1',
  },
]

export function getTemplate(id: string): Template {
  const t = TEMPLATES.find((tpl) => tpl.id === id)
  if (!t) throw new Error(`Template desconhecido: ${id}`)
  return t
}

/** Total de slots de colagem do template (= fotos sugeridas). */
export function templateCollageCount(template: Template): number {
  return template.pages.reduce((sum, arrId) => sum + (ARRANGEMENT_COUNTS[arrId] ?? 0), 0)
}

/** Total de fotos que um template comporta: 1 background compartilhado + colagens. */
export function templatePhotoCapacity(template: Template): number {
  return 1 + templateCollageCount(template)
}

// Pequeno mapa de contagem para evitar import circular pesado; validado em teste.
const ARRANGEMENT_COUNTS: Record<string, number> = {
  A1: 1,
  A2: 2,
  A3: 2,
  A4: 2,
  A5: 3,
  A6: 3,
  A7: 3,
  A8: 2,
  A9: 3,
}
