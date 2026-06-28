// Renderização de páginas para PNG via Canvas 2D (headless, sem Konva).
// Reusa a mesma geometria do editor para fidelidade. Roda só no browser
// (precisa de <canvas>), por isso fica fora da cobertura de testes.

import { ASPECT_DIMENSIONS, type Adjustments, type Page, type Project } from '../types/project'
import { getAsset } from './storage'
import {
  adjustmentsToFilter,
  continuousBackgroundCropRect,
  photoPixelRect,
  stageSizeFor,
} from './editor-geometry'

function loadImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Falha ao carregar imagem para exportação.'))
    }
    img.src = url
  })
}

async function imagesFor(project: Project): Promise<Map<string, HTMLImageElement>> {
  const ids = new Set<string>()
  if (project.background.assetId) ids.add(project.background.assetId)
  for (const page of project.pages) {
    for (const photo of page.collage) if (photo.assetId) ids.add(photo.assetId)
  }
  const map = new Map<string, HTMLImageElement>()
  await Promise.all(
    [...ids].map(async (id) => {
      const blob = await getAsset(id)
      if (blob) map.set(id, await loadImage(blob))
    }),
  )
  return map
}

function withFilter(ctx: CanvasRenderingContext2D, adj: Adjustments, draw: () => void) {
  ctx.save()
  ctx.filter = adjustmentsToFilter(adj)
  draw()
  ctx.restore()
}

function roundedPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, radius)
}

/** Desenha uma página num canvas na resolução nominal da proporção. */
export function renderPage(
  page: Page,
  project: Project,
  images: Map<string, HTMLImageElement>,
  pageIndex = 0,
): HTMLCanvasElement {
  const { width, height } = ASPECT_DIMENSIONS[project.aspectRatio]
  const stage = stageSizeFor(project.aspectRatio, width)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!

  // Fundo (compartilhado pelo projeto)
  const background = project.background
  ctx.fillStyle = project.bgColor
  ctx.fillRect(0, 0, width, height)

  // Background (cover + zoom/pan)
  const bgImg = background.assetId ? images.get(background.assetId) : undefined
  if (bgImg) {
    const crop = continuousBackgroundCropRect(
      { width: bgImg.naturalWidth, height: bgImg.naturalHeight },
      stage,
      background.transform.scale,
      background.transform.x - 0.5,
      background.transform.y - 0.5,
      pageIndex,
      project.pages.length,
    )
    withFilter(ctx, background.adjustments, () => {
      ctx.drawImage(bgImg, crop.x, crop.y, crop.width, crop.height, 0, 0, width, height)
    })
  }

  // Fotos de colagem (em ordem de z-index)
  for (const photo of page.collage) {
    const rect = photoPixelRect(photo, stage)
    const cornerPx = photo.frame.cornerRadius * Math.min(rect.width, rect.height)
    ctx.save()
    ctx.translate(rect.x, rect.y)
    ctx.rotate((photo.transform.rotation * Math.PI) / 180)
    ctx.scale(photo.transform.scale, photo.transform.scale)

    const x = -rect.width / 2
    const y = -rect.height / 2
    const img = photo.assetId ? images.get(photo.assetId) : undefined

    // Sombra (desenhada num preenchimento atrás do recorte)
    if (photo.style.shadow) {
      ctx.save()
      ctx.shadowColor = 'rgba(0,0,0,0.3)'
      ctx.shadowBlur = 16
      ctx.fillStyle = '#000'
      roundedPath(ctx, x, y, rect.width, rect.height, cornerPx)
      ctx.fill()
      ctx.restore()
    }

    // Imagem recortada (cover) dentro do frame
    ctx.save()
    roundedPath(ctx, x, y, rect.width, rect.height, cornerPx)
    ctx.clip()
    if (img) {
      const crop = continuousBackgroundCropRect(
        { width: img.naturalWidth, height: img.naturalHeight },
        { width: rect.width, height: rect.height },
        photo.crop.scale,
        photo.crop.x - 0.5,
        photo.crop.y - 0.5,
        0,
        1,
      )
      withFilter(ctx, photo.adjustments, () => {
        ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, x, y, rect.width, rect.height)
      })
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.fill()
    }
    ctx.restore()

    // Borda
    if (photo.style.borderWidth > 0) {
      roundedPath(ctx, x, y, rect.width, rect.height, cornerPx)
      ctx.lineWidth = photo.style.borderWidth
      ctx.strokeStyle = photo.style.borderColor
      ctx.stroke()
    }

    ctx.restore()
  }

  return canvas
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Falha ao gerar PNG.'))
    }, 'image/png')
  })
}

/**
 * Renderiza todas as páginas como data URLs (PNG), com a MESMA geometria do
 * editor/exportação. Usado no preview de carrossel (fundo contínuo fiel).
 */
export async function renderProjectToDataUrls(project: Project): Promise<string[]> {
  const images = await imagesFor(project)
  return project.pages.map((page, i) => renderPage(page, project, images, i).toDataURL('image/png'))
}

/** Renderiza todas as páginas do projeto como PNGs (Blobs). */
export async function renderProjectToPngs(
  project: Project,
  onProgress?: (done: number, total: number) => void,
): Promise<Blob[]> {
  const images = await imagesFor(project)
  const blobs: Blob[] = []
  for (let i = 0; i < project.pages.length; i++) {
    const canvas = renderPage(project.pages[i], project, images, i)
    blobs.push(await canvasToBlob(canvas))
    onProgress?.(i + 1, project.pages.length)
  }
  return blobs
}
