import { importFiles } from './asset-import'
import { extractPhotoMeta } from './photo-meta'
import { isImageFile } from './images'
import { putLibraryPhotos, type LibraryPhoto } from './storage'

/**
 * Importa arquivos para a BIBLIOTECA: extrai os metadados (EXIF) do arquivo
 * original — antes do downscale, que descarta EXIF —, grava os assets e os
 * metadados. Retorna as fotos adicionadas.
 */
export async function importToLibrary(
  files: File[],
  onProgress?: (done: number, total: number) => void,
): Promise<LibraryPhoto[]> {
  const images = files.filter(isImageFile)
  if (!images.length) return []

  // Metadados do original + import (HEIC/downscale) na mesma ordem de entrada.
  const metas = await Promise.all(images.map(extractPhotoMeta))
  const assets = await importFiles(images, onProgress)

  const now = Date.now()
  const photos: LibraryPhoto[] = assets.map((asset, i) => ({
    assetId: asset.id,
    takenAt: metas[i].takenAt,
    lat: metas[i].lat,
    lon: metas[i].lon,
    addedAt: now,
  }))
  await putLibraryPhotos(photos)
  return photos
}
