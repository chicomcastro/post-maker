// Utilidades de imagem do lado do cliente.

/** Detecta HEIC/HEIF por mime ou extensão (Safari/iPhone às vezes não preenche o mime). */
export function isHeic(file: File): boolean {
  return /image\/hei[cf]/i.test(file.type) || /\.(heic|heif)$/i.test(file.name)
}

const ACCEPTED = /^image\//

export function isImageFile(file: File): boolean {
  return ACCEPTED.test(file.type) || isHeic(file)
}

/**
 * Maior dimensão (px) que guardamos para exibição. A exportação é nominalmente
 * 1080px; 2048 dá folga para zoom sem o custo de decodificar fotos de celular
 * em resolução cheia (12MP+), o que deixava o editor lento ao abrir.
 */
export const MAX_DISPLAY_DIM = 2048

/**
 * Converte um arquivo de imagem em um Blob exibível pelo navegador. Arquivos
 * HEIC/HEIF são convertidos para JPEG via heic2any (carregado sob demanda, para
 * não pesar o bundle de quem não usa iPhone). Fotos grandes são reduzidas para
 * acelerar o carregamento do editor.
 */
export async function fileToDisplayBlob(file: File): Promise<Blob> {
  let blob: Blob = file
  if (isHeic(file)) {
    const { default: heic2any } = await import('heic2any')
    const result = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 })
    blob = Array.isArray(result) ? result[0] : result
  }
  return downscaleImage(blob, MAX_DISPLAY_DIM)
}

/**
 * Reduz a imagem para caber em `maxDim` (maior lado), reencodando via canvas.
 * É só uma otimização: em ambientes sem canvas (testes/SSR) ou em qualquer
 * falha, devolve o blob original intacto.
 */
export async function downscaleImage(blob: Blob, maxDim: number): Promise<Blob> {
  if (typeof document === 'undefined' || typeof createImageBitmap !== 'function') return blob
  try {
    const bitmap = await createImageBitmap(blob)
    const largest = Math.max(bitmap.width, bitmap.height)
    if (largest <= maxDim) {
      bitmap.close?.()
      return blob
    }
    const scale = maxDim / largest
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      bitmap.close?.()
      return blob
    }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close?.()
    const type = blob.type === 'image/png' ? 'image/png' : 'image/jpeg'
    const out = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.9))
    return out && out.size > 0 ? out : blob
  } catch {
    return blob
  }
}

/** Lê as dimensões intrínsecas de um Blob de imagem. */
export function readImageSize(blob: Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      const size = { width: img.naturalWidth, height: img.naturalHeight }
      URL.revokeObjectURL(url)
      resolve(size)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Não foi possível ler a imagem.'))
    }
    img.src = url
  })
}
