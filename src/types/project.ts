// Modelo de dados do Post Maker.
//
// Conceito: cada página tem uma foto de BACKGROUND (cobre a página) e N fotos
// de COLAGEM por cima, livremente posicionáveis/rotacionáveis. Coordenadas de
// posição/tamanho são NORMALIZADAS (0–1) sobre a caixa da página, então o mesmo
// projeto escala para qualquer resolução de exportação.

export type AspectRatio = '4:5' | '1:1' | '9:16'

/** Resolução nominal de exportação por proporção (px). */
export const ASPECT_DIMENSIONS: Record<AspectRatio, { width: number; height: number }> = {
  '4:5': { width: 1080, height: 1350 },
  '1:1': { width: 1080, height: 1080 },
  '9:16': { width: 1080, height: 1920 },
}

export const ASPECT_RATIOS: AspectRatio[] = ['4:5', '1:1', '9:16']

/** Posição (centro), escala e rotação de uma foto sobre a página. */
export interface Transform {
  /** Centro X normalizado (0–1). */
  x: number
  /** Centro Y normalizado (0–1). */
  y: number
  /** Multiplicador de escala (1 = tamanho do frame). */
  scale: number
  /** Rotação em graus (positivo = horário). */
  rotation: number
}

/** Ajustes de imagem. 1 = neutro para brightness/contrast/saturation. */
export interface Adjustments {
  brightness: number
  contrast: number
  saturation: number
  /** Id de um filtro pré-definido (opcional). */
  filter?: string
}

export const NEUTRAL_ADJUSTMENTS: Adjustments = {
  brightness: 1,
  contrast: 1,
  saturation: 1,
}

/** Estilo visual de uma foto de colagem. */
export interface PhotoStyle {
  borderWidth: number
  borderColor: string
  shadow: boolean
}

export const DEFAULT_PHOTO_STYLE: PhotoStyle = {
  borderWidth: 0,
  borderColor: '#ffffff',
  shadow: true,
}

/** Uma foto de colagem (sobreposta ao background). */
export interface CollagePhoto {
  id: string
  assetId: string | null
  transform: Transform
  /** Tamanho do frame normalizado (fração da página). */
  frame: { width: number; height: number; cornerRadius: number }
  style: PhotoStyle
  adjustments: Adjustments
}

/** Foto de fundo (cobre tudo, modo "cover"). Compartilhada pelo carrossel. */
export interface Background {
  assetId: string | null
  transform: Transform
  adjustments: Adjustments
}

/** Uma página do projeto (um slide do carrossel, ou o post inteiro). */
export interface Page {
  id: string
  /** Fotos de colagem, em ordem de z-index (última = mais à frente). */
  collage: CollagePhoto[]
}

/** Um projeto = post (1 página) ou carrossel (2–4 páginas). */
export interface Project {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  aspectRatio: AspectRatio
  /** Template de origem (informativo). */
  templateId: string
  /** Background compartilhado por todas as páginas do carrossel. */
  background: Background
  /** Cor de fundo visível quando o background não cobre a página. */
  bgColor: string
  pages: Page[]
}

export const DEFAULT_BG_COLOR = '#111827'
export const DEFAULT_CORNER_RADIUS = 0.02
