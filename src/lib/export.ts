import JSZip from 'jszip'

/** Nome de arquivo de um slide, com índice zero-padded quando há muitos. */
export function slideFileName(index: number, total: number, baseName = 'post-maker'): string {
  const slug = baseName.trim().replace(/\s+/g, '-').toLowerCase() || 'post-maker'
  if (total <= 1) return `${slug}.png`
  const width = String(total).length
  return `${slug}-${String(index + 1).padStart(width, '0')}.png`
}

/** Nome do arquivo .zip de imagens a partir do nome do projeto. */
export function zipFileName(baseName = 'post-maker'): string {
  const slug = baseName.trim().replace(/\s+/g, '-').toLowerCase() || 'post-maker'
  return `${slug}.zip`
}

/** Nome do arquivo de projeto (.postmaker.zip), para backup/transferência. */
export function projectFileName(baseName = 'post-maker'): string {
  const slug = baseName.trim().replace(/\s+/g, '-').toLowerCase() || 'post-maker'
  return `${slug}.postmaker.zip`
}

/** Empacota os PNGs num .zip. */
export async function pngsToZip(blobs: Blob[], baseName = 'post-maker'): Promise<Blob> {
  const zip = new JSZip()
  for (let i = 0; i < blobs.length; i++) {
    zip.file(slideFileName(i, blobs.length, baseName), await blobs[i].arrayBuffer())
  }
  const buffer = await zip.generateAsync({ type: 'arraybuffer' })
  return new Blob([buffer], { type: 'application/zip' })
}

/** Verifica se dá para compartilhar arquivos via Web Share API. */
export function canShareFiles(files: File[]): boolean {
  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean }
  return typeof navigator !== 'undefined' && typeof nav.canShare === 'function'
    ? nav.canShare({ files })
    : false
}

/**
 * Entrega o resultado: tenta o compartilhamento nativo (mobile) e cai para
 * download quando indisponível. Retorna o método usado.
 */
export async function shareOrDownload(
  files: File[],
  download: (file: File) => void = downloadFile,
): Promise<'share' | 'download'> {
  if (files.length > 0 && canShareFiles(files)) {
    try {
      await navigator.share({ files, title: 'Post Maker' })
      return 'share'
    } catch {
      // Usuário cancelou ou falhou: cai para download.
    }
  }
  files.forEach(download)
  return 'download'
}

function downloadFile(file: File): void {
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function blobToFile(blob: Blob, name: string): File {
  return new File([blob], name, { type: blob.type })
}
