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
 * Converte um arquivo de imagem em um Blob exibível pelo navegador. Arquivos
 * HEIC/HEIF são convertidos para JPEG via heic2any (carregado sob demanda, para
 * não pesar o bundle de quem não usa iPhone).
 */
export async function fileToDisplayBlob(file: File): Promise<Blob> {
  if (!isHeic(file)) return file
  const { default: heic2any } = await import('heic2any')
  const result = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 })
  return Array.isArray(result) ? result[0] : result
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
