// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { clusterByDayAndPlace, chooseTemplateFor, haversineKm, localDay } from './suggestions'
import { templateCollageCount } from '../templates/catalog'
import type { LibraryPhoto } from './storage'

function photo(
  id: string,
  takenAt: number,
  lat?: number,
  lon?: number,
  place?: string,
): LibraryPhoto {
  return { assetId: id, takenAt, lat, lon, place, addedAt: 0 }
}

// Dois momentos de referência (dias locais diferentes, meio-dia p/ evitar fuso).
const DAY1 = new Date(2026, 5, 27, 12, 0).getTime()
const DAY2 = new Date(2026, 5, 28, 12, 0).getTime()

describe('localDay / haversineKm', () => {
  it('formata o dia local como YYYY-MM-DD', () => {
    expect(localDay(DAY1)).toBe('2026-06-27')
  })

  it('calcula distâncias plausíveis', () => {
    // Manaus <-> ponto ~1km ao norte
    const d = haversineKm(-3.1, -60.02, -3.091, -60.02)
    expect(d).toBeGreaterThan(0.9)
    expect(d).toBeLessThan(1.1)
    expect(haversineKm(-3.1, -60.02, -3.1, -60.02)).toBe(0)
  })
})

describe('clusterByDayAndPlace', () => {
  it('separa por dia local', () => {
    const groups = clusterByDayAndPlace([
      photo('a', DAY1, -3.1, -60.02),
      photo('b', DAY2, -3.1, -60.02),
    ])
    expect(groups).toHaveLength(2)
    // mais recente primeiro
    expect(groups[0].day).toBe('2026-06-28')
    expect(groups[1].day).toBe('2026-06-27')
  })

  it('agrupa fotos próximas (<2km) e separa lugares distantes no mesmo dia', () => {
    const groups = clusterByDayAndPlace([
      photo('a', DAY1, -3.1, -60.02),
      photo('b', DAY1 + 3600e3, -3.105, -60.021), // ~600m => mesmo lugar
      photo('c', DAY1 + 7200e3, -3.8, -60.5), // ~90km => outro lugar
    ])
    expect(groups).toHaveLength(2)
    const big = groups.find((g) => g.photos.length === 2)!
    expect(big.photos.map((p) => p.assetId)).toEqual(['a', 'b'])
    // centro do cluster é a média
    expect(big.lat).toBeCloseTo(-3.1025)
  })

  it('fotos sem GPS formam um grupo próprio por dia', () => {
    const groups = clusterByDayAndPlace([
      photo('a', DAY1, -3.1, -60.02),
      photo('b', DAY1),
      photo('c', DAY1),
    ])
    expect(groups).toHaveLength(2)
    const noGps = groups.find((g) => g.lat == null)!
    expect(noGps.photos).toHaveLength(2)
  })

  it('propaga o nome do lugar já geocodificado', () => {
    const groups = clusterByDayAndPlace([
      photo('a', DAY1, -3.1, -60.02),
      photo('b', DAY1, -3.1, -60.02, 'Manaus, Amazonas'),
    ])
    expect(groups[0].place).toBe('Manaus, Amazonas')
  })
})

describe('chooseTemplateFor', () => {
  it('1 foto => post de 1 slot', () => {
    const t = chooseTemplateFor(1)
    expect(templateCollageCount(t)).toBe(1)
    expect(t.pages).toHaveLength(1)
  })

  it('reserva 1 foto para o fundo e casa os slots com o restante', () => {
    for (const n of [3, 5, 7, 10]) {
      const t = chooseTemplateFor(n)
      expect(templateCollageCount(t)).toBeGreaterThanOrEqual(Math.max(1, n - 1) - 1)
      expect(templateCollageCount(t)).toBeLessThanOrEqual(n)
    }
  })

  it('4 fotos => 3 slots (ex.: carrossel 3x solo ou post trio)', () => {
    expect(templateCollageCount(chooseTemplateFor(4))).toBe(3)
  })
})
