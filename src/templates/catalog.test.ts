import { describe, it, expect } from 'vitest'
import { ARRANGEMENTS, getArrangement } from './arrangements'
import { TEMPLATES, getTemplate, templatePhotoCapacity } from './catalog'

describe('arranjos', () => {
  it('cada arranjo tem slots coerentes com count e dentro dos limites', () => {
    for (const arr of Object.values(ARRANGEMENTS)) {
      expect(arr.slots.length).toBe(arr.count)
      for (const slot of arr.slots) {
        expect(slot.x).toBeGreaterThanOrEqual(0)
        expect(slot.x).toBeLessThanOrEqual(1)
        expect(slot.y).toBeGreaterThanOrEqual(0)
        expect(slot.y).toBeLessThanOrEqual(1)
        expect(slot.w).toBeGreaterThan(0)
        expect(slot.h).toBeGreaterThan(0)
        expect(Math.abs(slot.rotation)).toBeLessThanOrEqual(45)
      }
    }
  })
})

describe('catálogo de templates', () => {
  it('tem 25 templates com ids únicos', () => {
    expect(TEMPLATES).toHaveLength(25)
    const ids = new Set(TEMPLATES.map((t) => t.id))
    expect(ids.size).toBe(25)
  })

  it('todo template referencia arranjos válidos e respeita 1–4 páginas', () => {
    for (const t of TEMPLATES) {
      expect(t.pages.length).toBeGreaterThanOrEqual(1)
      expect(t.pages.length).toBeLessThanOrEqual(4)
      for (const arrId of t.pages) {
        expect(() => getArrangement(arrId)).not.toThrow()
      }
      if (t.kind === 'post') expect(t.pages.length).toBe(1)
      if (t.kind === 'carousel') expect(t.pages.length).toBeGreaterThanOrEqual(2)
    }
  })

  it('calcula a capacidade de fotos (background + colagem)', () => {
    // post-solo: A1 (1 colagem) => 1 bg compartilhado + 1 = 2
    expect(templatePhotoCapacity(getTemplate('post-solo'))).toBe(2)
    // carousel3-scatter: 3 páginas A5 (3 colagens) => 1 bg + 9 = 10
    expect(templatePhotoCapacity(getTemplate('carousel3-scatter'))).toBe(10)
  })

  it('lança erro para template/arranjo desconhecido', () => {
    expect(() => getTemplate('inexistente')).toThrow()
    expect(() => getArrangement('ZZ')).toThrow()
  })
})
