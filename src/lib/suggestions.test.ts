// @vitest-environment node
import { describe, it, expect } from 'vitest'
import {
  clusterByDayAndPlace,
  clusterByPlaceAcrossDays,
  groupByDay,
  groupByPlace,
  chooseTemplateFor,
  haversineKm,
  localDay,
} from './suggestions'
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

describe('chaves estáveis (para dispensa persistente)', () => {
  it('mantém a chave quando novas fotos entram no mesmo dia/lugar', () => {
    const before = clusterByDayAndPlace([photo('a', DAY1, -3.1, -60.02)])
    const after = clusterByDayAndPlace([
      photo('a', DAY1, -3.1, -60.02),
      photo('b', DAY1 + 3600e3, -3.101, -60.021),
    ])
    expect(after[0].key).toBe(before[0].key)
  })
})

describe('clusterByPlaceAcrossDays', () => {
  it('sugere série quando o mesmo lugar aparece em 2+ dias', () => {
    const groups = clusterByPlaceAcrossDays([
      photo('a', DAY1, -3.1, -60.02),
      photo('b', DAY2, -3.101, -60.021),
      photo('c', DAY2, -9.0, -35.2), // outro lugar, um dia só => fora
    ])
    expect(groups).toHaveLength(1)
    expect(groups[0].days).toEqual(['2026-06-27', '2026-06-28'])
    expect(groups[0].photos.map((p) => p.assetId)).toEqual(['a', 'b'])
    expect(groups[0].key.startsWith('place@')).toBe(true)
  })

  it('não sugere série para lugar visitado num único dia', () => {
    const groups = clusterByPlaceAcrossDays([
      photo('a', DAY1, -3.1, -60.02),
      photo('b', DAY1 + 3600e3, -3.101, -60.021),
    ])
    expect(groups).toHaveLength(0)
  })

  it('ignora fotos sem GPS', () => {
    expect(clusterByPlaceAcrossDays([photo('a', DAY1), photo('b', DAY2)])).toHaveLength(0)
  })
})

describe('groupByDay', () => {
  it('um grupo por dia com TODAS as fotos do dia (independente do lugar)', () => {
    const groups = groupByDay([
      photo('a', DAY1, -3.1, -60.02),
      photo('b', DAY1 + 3600e3, -9.0, -35.2), // outro lugar, mesmo dia
      photo('c', DAY2, -3.1, -60.02),
    ])
    expect(groups).toHaveLength(2)
    const first = groups[0]
    expect(first.day).toBe('2026-06-28') // mais recente primeiro
    const older = groups[1]
    expect(older.photos).toHaveLength(2) // a + b juntas apesar de lugares distantes
  })

  it('ordena fotos mais recentes primeiro dentro do grupo', () => {
    const [group] = groupByDay([photo('a', DAY1), photo('b', DAY1 + 3600e3)])
    expect(group.photos.map((p) => p.assetId)).toEqual(['b', 'a'])
  })

  it('inclui dias sem GPS (lat/lon indefinidos)', () => {
    const [group] = groupByDay([photo('a', DAY1), photo('b', DAY1)])
    expect(group.lat).toBeUndefined()
    expect(group.photos).toHaveLength(2)
  })
})

describe('groupByPlace', () => {
  it('junta revisitas do mesmo lugar em dias diferentes (ignora o dia)', () => {
    const groups = groupByPlace([
      photo('a', DAY1, -3.1, -60.02),
      photo('b', DAY2, -3.101, -60.021),
      photo('c', DAY1, -9.0, -35.2), // outro lugar
    ])
    expect(groups).toHaveLength(2)
    const big = groups.find((g) => g.photos.length === 2)!
    expect(big.days).toEqual(['2026-06-27', '2026-06-28'])
  })

  it('agrupa fotos sem GPS num grupo "Sem local"', () => {
    const groups = groupByPlace([
      photo('a', DAY1),
      photo('b', DAY2),
      photo('c', DAY1, -3.1, -60.02),
    ])
    const noGps = groups.find((g) => g.key === 'place:nogps')!
    expect(noGps.photos).toHaveLength(2)
    expect(noGps.lat).toBeUndefined()
  })

  it('mantém séries de um único dia (ao contrário das sugestões)', () => {
    const groups = groupByPlace([
      photo('a', DAY1, -3.1, -60.02),
      photo('b', DAY1 + 3600e3, -3.101, -60.021),
    ])
    expect(groups).toHaveLength(1)
    expect(groups[0].photos).toHaveLength(2)
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
