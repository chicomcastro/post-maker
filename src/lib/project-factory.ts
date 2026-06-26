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

function makeBackground(): Background {
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
    background: makeBackground(),
    bgColor: DEFAULT_BG_COLOR,
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
    pages: template.pages.map(createPageFromArrangement),
  }
}

function defaultName(template: Template): string {
  return template.kind === 'post' ? 'Novo post' : 'Novo carrossel'
}

/**
 * Distribui uma lista de fotos (assetIds) pelas páginas do projeto, em ordem:
 * a primeira foto de cada página vira o background, as seguintes preenchem os
 * frames de colagem. Retorna um novo projeto e os assetIds que sobraram.
 */
export function distributePhotos(
  project: Project,
  assetIds: string[],
): { project: Project; leftover: string[] } {
  const queue = [...assetIds]
  const pages = project.pages.map((page) => {
    const background: Background = {
      ...page.background,
      assetId: queue.length ? (queue.shift() ?? null) : page.background.assetId,
    }
    const collage = page.collage.map((photo) => ({
      ...photo,
      assetId: queue.length ? (queue.shift() ?? null) : photo.assetId,
    }))
    return { ...page, background, collage }
  })
  return { project: { ...project, pages }, leftover: queue }
}
