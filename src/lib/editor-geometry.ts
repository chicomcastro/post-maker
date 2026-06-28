// Geometria pura do editor: conversões entre coordenadas normalizadas (0–1) do
// modelo e pixels do palco Konva, e cálculo de recorte "cover". Sem dependência
// de Konva/DOM — fácil de testar e reutilizável na exportação.

import type { AspectRatio, CollagePhoto } from '../types/project'

export interface Size {
  width: number
  height: number
}

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

/** Tamanho do palco para uma proporção, dada uma largura. */
export function stageSizeFor(aspect: AspectRatio, width: number): Size {
  const [w, h] = aspect.split(':').map(Number)
  return { width, height: (width * h) / w }
}

/** Posição/tamanho em pixels de uma foto de colagem no palco. */
export function photoPixelRect(photo: CollagePhoto, stage: Size): Rect {
  return {
    x: photo.transform.x * stage.width,
    y: photo.transform.y * stage.height,
    width: photo.frame.width * stage.width,
    height: photo.frame.height * stage.height,
  }
}

/** Converte atributos de um nó Konva de volta para o transform normalizado. */
export function nodeToTransform(
  node: { x: number; y: number; rotation: number; scaleX: number },
  stage: Size,
): { x: number; y: number; rotation: number; scale: number } {
  return {
    x: node.x / stage.width,
    y: node.y / stage.height,
    rotation: node.rotation,
    scale: node.scaleX,
  }
}

/**
 * Recorte (em pixels de origem) para preencher um frame com "cover", centrado.
 * Depende só das proporções, então serve para qualquer resolução de exibição.
 */
export function coverRect(natural: Size, frame: Size): Rect {
  if (natural.width <= 0 || natural.height <= 0 || frame.width <= 0 || frame.height <= 0) {
    return { x: 0, y: 0, width: Math.max(0, natural.width), height: Math.max(0, natural.height) }
  }
  const ratio = Math.max(frame.width / natural.width, frame.height / natural.height)
  const cropW = frame.width / ratio
  const cropH = frame.height / ratio
  return {
    x: (natural.width - cropW) / 2,
    y: (natural.height - cropH) / 2,
    width: cropW,
    height: cropH,
  }
}

/**
 * Recorte do background com zoom (scale >= 1) e pan (panX/panY em [-0.5, 0.5]).
 * scale = 1 e pan = 0 equivalem ao "cover" centrado.
 */
export function backgroundCropRect(
  natural: Size,
  stage: Size,
  scale: number,
  panX: number,
  panY: number,
): Rect {
  const base = coverRect(natural, stage)
  const z = Math.max(1, scale)
  const cw = base.width / z
  const ch = base.height / z
  // A folga de pan é o que o "cover" (e o zoom) deixam de fora da imagem natural.
  const roomX = Math.max(0, natural.width - cw)
  const roomY = Math.max(0, natural.height - ch)
  const px = clamp(0.5 + panX, 0, 1)
  const py = clamp(0.5 + panY, 0, 1)
  return {
    x: roomX * px,
    y: roomY * py,
    width: cw,
    height: ch,
  }
}

/**
 * Recorte do background para UMA página de um carrossel "contínuo": a imagem
 * cobre uma faixa virtual de `pageCount` páginas lado a lado, e cada página
 * mostra a sua fatia horizontal. Com `pageCount = 1` é igual ao
 * `backgroundCropRect` (post/página única). Dá a sensação de panorama contínuo
 * ao deslizar o carrossel.
 */
export function continuousBackgroundCropRect(
  natural: Size,
  stage: Size,
  scale: number,
  panX: number,
  panY: number,
  pageIndex: number,
  pageCount: number,
): Rect {
  const pages = Math.max(1, Math.floor(pageCount))
  const index = clamp(Math.floor(pageIndex), 0, pages - 1)
  const strip = { width: stage.width * pages, height: stage.height }
  const full = backgroundCropRect(natural, strip, scale, panX, panY)
  const sliceWidth = full.width / pages
  return {
    x: full.x + sliceWidth * index,
    y: full.y,
    width: sliceWidth,
    height: full.height,
  }
}

/**
 * Aplica um deslocamento (em frações do slot) ao enquadramento da foto, ao
 * arrastar dentro do slot. Arrastar a imagem para a direita revela o conteúdo à
 * esquerda, então o recorte anda no sentido oposto. Resultado clampado a [0,1].
 */
export function panCrop(
  crop: { x: number; y: number; scale: number },
  dxFraction: number,
  dyFraction: number,
): { x: number; y: number; scale: number } {
  return {
    ...crop,
    x: clamp(crop.x - dxFraction, 0, 1),
    y: clamp(crop.y - dyFraction, 0, 1),
  }
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max)
}

/** Filtro CSS equivalente aos ajustes (usado em previews e export via canvas). */
export function adjustmentsToFilter(a: {
  brightness: number
  contrast: number
  saturation: number
}): string {
  return `brightness(${a.brightness}) contrast(${a.contrast}) saturate(${a.saturation})`
}
