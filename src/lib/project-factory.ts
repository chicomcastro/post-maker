import { getArrangement, type ArrangementSlot } from '../templates/arrangements'
import { getTemplate, type Template } from '../templates/catalog'
import {
  DEFAULT_BG_COLOR,
  DEFAULT_CORNER_RADIUS,
  DEFAULT_PHOTO_STYLE,
  NEUTRAL_ADJUSTMENTS,
  type AspectRatio,
  type Background,
  type CollagePhoto,
  type Page,
  type Project,
} from '../types/project'
import { createId } from './id'

export function makeBackground(): Background {
  return {
    assetId: null,
    transform: { x: 0.5, y: 0.5, scale: 1, rotation: 0 },
    adjustments: { ...NEUTRAL_ADJUSTMENTS },
  }
}

function makeCollagePhoto(slot: ArrangementSlot): CollagePhoto {
  return {
    id: createId(),
    assetId: null,
    transform: { x: slot.x, y: slot.y, scale: 1, rotation: slot.rotation },
    frame: { width: slot.w, height: slot.h, cornerRadius: DEFAULT_CORNER_RADIUS },
    style: { ...DEFAULT_PHOTO_STYLE },
    adjustments: { ...NEUTRAL_ADJUSTMENTS },
  }
}

/** Cria uma página vazia a partir de um arranjo. */
export function createPageFromArrangement(arrangementId: string): Page {
  const arrangement = getArrangement(arrangementId)
  return {
    id: createId(),
    collage: arrangement.slots.map(makeCollagePhoto),
  }
}

export interface CreateProjectOptions {
  name?: string
  aspectRatio?: AspectRatio
  now?: number
}

/** Cria um projeto vazio a partir de um template. */
export function createProjectFromTemplate(
  templateOrId: string | Template,
  options: CreateProjectOptions = {},
): Project {
  const template = typeof templateOrId === 'string' ? getTemplate(templateOrId) : templateOrId
  const now = options.now ?? Date.now()
  return {
    id: createId(),
    name: options.name ?? defaultName(template),
    createdAt: now,
    updatedAt: now,
    aspectRatio: options.aspectRatio ?? template.preferredAspect,
    templateId: template.id,
    background: makeBackground(),
    bgColor: DEFAULT_BG_COLOR,
    pages: template.pages.map(createPageFromArrangement),
  }
}

function defaultName(template: Template): string {
  return template.kind === 'post' ? 'Novo post' : 'Novo carrossel'
}

/**
 * Distribui uma lista de fotos (assetIds) pelo projeto, em ordem: a PRIMEIRA
 * foto vira o background compartilhado do carrossel; as seguintes preenchem os
 * frames de colagem, página a página. Retorna um novo projeto e o que sobrou.
 */
export function distributePhotos(
  project: Project,
  assetIds: string[],
): { project: Project; leftover: string[] } {
  const queue = [...assetIds]
  const background: Background = {
    ...project.background,
    assetId: queue.length ? (queue.shift() ?? null) : project.background.assetId,
  }
  const pages = project.pages.map((page) => {
    const collage = page.collage.map((photo) => ({
      ...photo,
      assetId: queue.length ? (queue.shift() ?? null) : photo.assetId,
    }))
    return { ...page, collage }
  })
  return { project: { ...project, background, pages }, leftover: queue }
}
