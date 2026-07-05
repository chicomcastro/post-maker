// Agrupamento da biblioteca por dia + localidade e sugestão de template.
// Lógica pura (sem DOM/IO) para ser testável.

import type { LibraryPhoto } from './storage'
import { TEMPLATES, templateCollageCount, type Template } from '../templates/catalog'

/** Distância entre as fotos para pertencerem ao mesmo "lugar" (km). */
export const SAME_PLACE_KM = 2

export interface SuggestionGroup {
  /** Chave estável (dia + índice do cluster). */
  key: string
  /** Dia local no formato YYYY-MM-DD (ordena bem). */
  day: string
  /** Timestamp representativo (primeira foto do grupo). */
  takenAt: number
  /** Centro do cluster (média), quando há GPS. */
  lat?: number
  lon?: number
  /** Nome do lugar, se alguma foto do grupo já foi geocodificada. */
  place?: string
  photos: LibraryPhoto[]
}

/** Dia local (YYYY-MM-DD) de um timestamp. */
export function localDay(ts: number): string {
  const d = new Date(ts)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

/** Distância haversine em km. */
export function haversineKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const rad = Math.PI / 180
  const dLat = (bLat - aLat) * rad
  const dLon = (bLon - aLon) * rad
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(aLat * rad) * Math.cos(bLat * rad) * Math.sin(dLon / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(h))
}

/**
 * Agrupa a biblioteca em "momentos": mesmo dia local e, dentro do dia, fotos a
 * até SAME_PLACE_KM do centro do cluster. Fotos sem GPS formam um cluster
 * próprio por dia. Grupos mais recentes primeiro; fotos em ordem cronológica.
 */
export function clusterByDayAndPlace(
  photos: LibraryPhoto[],
  maxKm: number = SAME_PLACE_KM,
): SuggestionGroup[] {
  const byDay = new Map<string, LibraryPhoto[]>()
  for (const photo of photos) {
    const day = localDay(photo.takenAt)
    const list = byDay.get(day)
    if (list) list.push(photo)
    else byDay.set(day, [photo])
  }

  const groups: SuggestionGroup[] = []
  for (const [day, dayPhotos] of byDay) {
    const sorted = [...dayPhotos].sort((a, b) => a.takenAt - b.takenAt)
    const clusters: { latSum: number; lonSum: number; located: number; photos: LibraryPhoto[] }[] =
      []
    let noGps: LibraryPhoto[] | null = null

    for (const photo of sorted) {
      if (typeof photo.lat !== 'number' || typeof photo.lon !== 'number') {
        if (!noGps) noGps = []
        noGps.push(photo)
        continue
      }
      const home = clusters.find((c) => {
        const cLat = c.latSum / c.located
        const cLon = c.lonSum / c.located
        return haversineKm(cLat, cLon, photo.lat!, photo.lon!) <= maxKm
      })
      if (home) {
        home.latSum += photo.lat
        home.lonSum += photo.lon
        home.located++
        home.photos.push(photo)
      } else {
        clusters.push({ latSum: photo.lat, lonSum: photo.lon, located: 1, photos: [photo] })
      }
    }

    clusters.forEach((c, i) => {
      groups.push({
        key: `${day}#${i}`,
        day,
        takenAt: c.photos[0].takenAt,
        lat: c.latSum / c.located,
        lon: c.lonSum / c.located,
        place: c.photos.find((p) => p.place)?.place,
        photos: c.photos,
      })
    })
    if (noGps) {
      groups.push({
        key: `${day}#nogps`,
        day,
        takenAt: noGps[0].takenAt,
        place: noGps.find((p) => p.place)?.place,
        photos: noGps,
      })
    }
  }

  return groups.sort((a, b) => b.takenAt - a.takenAt)
}

/**
 * Sugere um template para N fotos: reserva 1 para o fundo e procura o template
 * cujo nº de slots de colagem melhor aproxima o restante (desempate: menos
 * páginas primeiro — carrosséis enxutos).
 */
export function chooseTemplateFor(photoCount: number): Template {
  const target = Math.max(1, photoCount - 1)
  let best: Template = TEMPLATES[0]
  let bestScore = Infinity
  for (const template of TEMPLATES) {
    const count = templateCollageCount(template)
    const score = Math.abs(count - target) * 10 + template.pages.length
    if (score < bestScore) {
      best = template
      bestScore = score
    }
  }
  return best
}
