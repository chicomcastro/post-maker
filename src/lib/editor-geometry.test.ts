import { describe, it, expect } from 'vitest'
import {
  stageSizeFor,
  photoPixelRect,
  nodeToTransform,
  coverRect,
  backgroundCropRect,
  continuousBackgroundCropRect,
  panCrop,
  clamp,
} from './editor-geometry'
import { createProjectFromTemplate } from './project-factory'

describe('editor-geometry', () => {
  it('calcula o tamanho do palco pela proporção', () => {
    expect(stageSizeFor('1:1', 400)).toEqual({ width: 400, height: 400 })
    expect(stageSizeFor('4:5', 400)).toEqual({ width: 400, height: 500 })
    expect(stageSizeFor('9:16', 360)).toEqual({ width: 360, height: 640 })
  })

  it('converte foto de colagem para pixels e de volta (round-trip)', () => {
    const photo = createProjectFromTemplate('post-solo').pages[0].collage[0]
    const stage = stageSizeFor('1:1', 1000)
    const rect = photoPixelRect(photo, stage)
    expect(rect.x).toBeCloseTo(photo.transform.x * 1000)
    expect(rect.width).toBeCloseTo(photo.frame.width * 1000)

    const back = nodeToTransform(
      { x: rect.x, y: rect.y, rotation: photo.transform.rotation, scaleX: 1 },
      stage,
    )
    expect(back.x).toBeCloseTo(photo.transform.x)
    expect(back.y).toBeCloseTo(photo.transform.y)
  })

  it('coverRect preenche o frame centrado (paisagem em frame quadrado)', () => {
    const crop = coverRect({ width: 200, height: 100 }, { width: 50, height: 50 })
    expect(crop.width).toBeCloseTo(100)
    expect(crop.height).toBeCloseTo(100)
    expect(crop.x).toBeCloseTo(50)
    expect(crop.y).toBeCloseTo(0)
  })

  it('coverRect lida com dimensões inválidas sem quebrar', () => {
    expect(coverRect({ width: 0, height: 0 }, { width: 10, height: 10 })).toEqual({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    })
  })

  it('backgroundCropRect: scale 1 = cover; zoom reduz o recorte', () => {
    const natural = { width: 400, height: 400 }
    const stage = { width: 100, height: 200 } // retrato
    const cover = backgroundCropRect(natural, stage, 1, 0, 0)
    expect(cover.width).toBeCloseTo(200)
    expect(cover.height).toBeCloseTo(400)

    const zoomed = backgroundCropRect(natural, stage, 2, 0, 0)
    expect(zoomed.width).toBeCloseTo(100)
    expect(zoomed.height).toBeCloseTo(200)
  })

  it('backgroundCropRect: pan desloca dentro dos limites', () => {
    const natural = { width: 400, height: 200 }
    const stage = { width: 100, height: 100 }
    const left = backgroundCropRect(natural, stage, 1, -0.5, 0)
    const right = backgroundCropRect(natural, stage, 1, 0.5, 0)
    expect(left.x).toBeCloseTo(0)
    expect(right.x).toBeCloseTo(200)
  })

  it('continuousBackgroundCropRect: pageCount 1 = backgroundCropRect', () => {
    const natural = { width: 400, height: 400 }
    const stage = { width: 100, height: 200 }
    const base = backgroundCropRect(natural, stage, 1.4, 0.1, -0.2)
    const cont = continuousBackgroundCropRect(natural, stage, 1.4, 0.1, -0.2, 0, 1)
    expect(cont).toEqual(base)
  })

  it('continuousBackgroundCropRect: fatia a imagem em faixas contíguas por página', () => {
    const natural = { width: 1200, height: 200 }
    const stage = { width: 100, height: 200 } // 2 páginas => faixa 200x200
    const p0 = continuousBackgroundCropRect(natural, stage, 1, 0, 0, 0, 2)
    const p1 = continuousBackgroundCropRect(natural, stage, 1, 0, 0, 1, 2)
    // mesma fatia de largura, alturas idênticas, sem buraco/sobreposição
    expect(p0.width).toBeCloseTo(p1.width)
    expect(p0.height).toBeCloseTo(p1.height)
    expect(p0.y).toBeCloseTo(p1.y)
    expect(p1.x).toBeCloseTo(p0.x + p0.width)
    // a união das fatias é exatamente o recorte da faixa inteira
    const full = backgroundCropRect(natural, { width: 200, height: 200 }, 1, 0, 0)
    expect(p0.x).toBeCloseTo(full.x)
    expect(p1.x + p1.width).toBeCloseTo(full.x + full.width)
  })

  it('continuousBackgroundCropRect: limita índice de página fora do intervalo', () => {
    const natural = { width: 1200, height: 200 }
    const stage = { width: 100, height: 200 }
    const last = continuousBackgroundCropRect(natural, stage, 1, 0, 0, 1, 2)
    const tooFar = continuousBackgroundCropRect(natural, stage, 1, 0, 0, 9, 2)
    expect(tooFar).toEqual(last)
  })

  it('panCrop desloca no sentido oposto ao arraste e clampa em [0,1]', () => {
    const base = { x: 0.5, y: 0.5, scale: 1 }
    // arrastar a foto para a direita (dx>0) move o recorte para a esquerda
    expect(panCrop(base, 0.2, 0).x).toBeCloseTo(0.3)
    expect(panCrop(base, 0, 0.2).y).toBeCloseTo(0.3)
    // clamp nos limites
    expect(panCrop(base, -1, 0).x).toBe(1)
    expect(panCrop(base, 2, 0).x).toBe(0)
    // preserva o zoom
    expect(panCrop({ x: 0.5, y: 0.5, scale: 2 }, 0.1, 0).scale).toBe(2)
  })

  it('clamp limita o valor', () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-1, 0, 10)).toBe(0)
    expect(clamp(99, 0, 10)).toBe(10)
  })
})
