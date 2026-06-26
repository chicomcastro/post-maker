import { createId } from './id'
import { fileToDisplayBlob, isImageFile } from './images'
import { putAsset } from './storage'

export interface ImportedAsset {
  id: string
  blob: Blob
}

/**
 * Importa arquivos selecionados: filtra imagens, converte HEIC, gera ids e
 * persiste cada blob no IndexedDB. Retorna os assets na ordem de entrada.
 */
export async function importFiles(
  files: File[],
  onProgress?: (done: number, total: number) => void,
): Promise<ImportedAsset[]> {
  const images = files.filter(isImageFile)
  const out: ImportedAsset[] = []
  for (let i = 0; i < images.length; i++) {
    const blob = await fileToDisplayBlob(images[i])
    const id = createId()
    await putAsset(id, blob)
    out.push({ id, blob })
    onProgress?.(i + 1, images.length)
  }
  return out
}
