import {
  DEFAULT_BG_COLOR,
  DEFAULT_CROP,
  type Background,
  type CollagePhoto,
  type Crop,
  type Page,
  type Project,
} from '../types/project'
import { makeBackground } from './project-factory'

// Normaliza projetos vindos do armazenamento para o formato atual. Protege
// contra dados salvos por versões antigas (ex.: quando o background era por
// página) — evita telas brancas por acesso a campos inexistentes.

type LegacyPage = Partial<Page> & {
  background?: Background
  bgColor?: string
  collage?: CollagePhoto[]
}
type LegacyProject = Partial<Project> & {
  background?: Background
  bgColor?: string
  assetPool?: string[]
  pages?: LegacyPage[]
}

// Garante que a foto de colagem tenha um `crop` válido (formatos antigos não
// tinham enquadramento dentro do slot).
function normalizeCollagePhoto(photo: CollagePhoto): CollagePhoto {
  const c = (photo as Partial<CollagePhoto>).crop as Partial<Crop> | undefined
  const crop: Crop = {
    x: typeof c?.x === 'number' ? c.x : DEFAULT_CROP.x,
    y: typeof c?.y === 'number' ? c.y : DEFAULT_CROP.y,
    scale: typeof c?.scale === 'number' && c.scale >= 1 ? c.scale : DEFAULT_CROP.scale,
  }
  return { ...photo, crop }
}

export function normalizeProject(raw: unknown): Project {
  const p = (raw ?? {}) as LegacyProject
  const pages: LegacyPage[] = Array.isArray(p.pages) ? p.pages : []

  // Background a nível de projeto; se ausente, herda do 1º background de página
  // (formato antigo) ou cria um vazio.
  const legacyPageBg = pages.find((pg) => pg.background)?.background
  const background: Background = p.background ?? legacyPageBg ?? makeBackground()
  const bgColor = p.bgColor ?? pages.find((pg) => pg.bgColor)?.bgColor ?? DEFAULT_BG_COLOR

  const normalizedPages = pages.map((pg) => ({
    id: String(pg.id ?? ''),
    collage: (Array.isArray(pg.collage) ? pg.collage : []).map(normalizeCollagePhoto),
  }))

  // assetPool: usa o existente; senão deriva do que está em uso (bg + colagem).
  let assetPool: string[]
  if (Array.isArray(p.assetPool)) {
    assetPool = p.assetPool
  } else {
    const used = new Set<string>()
    if (background.assetId) used.add(background.assetId)
    for (const pg of normalizedPages) for (const c of pg.collage) if (c.assetId) used.add(c.assetId)
    assetPool = [...used]
  }

  return {
    id: String(p.id ?? ''),
    name: p.name ?? 'Projeto',
    createdAt: typeof p.createdAt === 'number' ? p.createdAt : 0,
    updatedAt: typeof p.updatedAt === 'number' ? p.updatedAt : 0,
    aspectRatio: p.aspectRatio ?? '4:5',
    templateId: p.templateId ?? '',
    background,
    bgColor,
    assetPool,
    pages: normalizedPages,
  }
}
