// Extração de metadados (data da captura + GPS) do EXIF, no aparelho.
// IMPORTANTE: deve rodar sobre o ARQUIVO ORIGINAL, antes do downscale/HEIC —
// o reencode via canvas descarta o EXIF.

export interface PhotoMeta {
  /** Momento da captura; fallback: lastModified do arquivo. */
  takenAt: number
  lat?: number
  lon?: number
}

/**
 * Lê EXIF via exifr (carregado sob demanda). Nunca lança: em qualquer falha
 * (sem EXIF, formato exótico, lib indisponível) cai para lastModified.
 */
export async function extractPhotoMeta(file: File): Promise<PhotoMeta> {
  const fallback: PhotoMeta = { takenAt: file.lastModified || Date.now() }
  try {
    const { default: exifr } = await import('exifr')
    const data = (await exifr.parse(file, {
      pick: ['DateTimeOriginal', 'CreateDate', 'GPSLatitude', 'GPSLongitude'],
      gps: true,
    })) as
      | {
          DateTimeOriginal?: Date
          CreateDate?: Date
          latitude?: number
          longitude?: number
        }
      | undefined
    if (!data) return fallback
    const date = data.DateTimeOriginal ?? data.CreateDate
    const takenAt =
      date instanceof Date && !Number.isNaN(date.getTime()) ? date.getTime() : fallback.takenAt
    const meta: PhotoMeta = { takenAt }
    if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
      meta.lat = data.latitude
      meta.lon = data.longitude
    }
    return meta
  } catch {
    return fallback
  }
}
