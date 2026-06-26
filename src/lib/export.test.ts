// @vitest-environment node
import { describe, it, expect } from 'vitest'
import JSZip from 'jszip'
import { slideFileName, zipFileName, pngsToZip } from './export'

describe('nomes de arquivo', () => {
  it('slideFileName: único vs múltiplos (zero-padded)', () => {
    expect(slideFileName(0, 1, 'Minha Viagem')).toBe('minha-viagem.png')
    expect(slideFileName(0, 3, 'Bali')).toBe('bali-1.png')
    expect(slideFileName(9, 12, 'Bali')).toBe('bali-10.png')
    expect(slideFileName(0, 1, '   ')).toBe('post-maker.png')
  })

  it('zipFileName usa o nome do projeto', () => {
    expect(zipFileName('Viagem 2024')).toBe('viagem-2024.zip')
    expect(zipFileName('')).toBe('post-maker.zip')
  })
})

describe('pngsToZip', () => {
  it('empacota os PNGs com nomes ordenados', async () => {
    const blobs = [new Blob(['A'], { type: 'image/png' }), new Blob(['B'], { type: 'image/png' })]
    const zipBlob = await pngsToZip(blobs, 'Trip')
    expect(zipBlob.type).toBe('application/zip')

    const zip = await JSZip.loadAsync(await zipBlob.arrayBuffer())
    const names = Object.keys(zip.files).sort()
    expect(names).toEqual(['trip-1.png', 'trip-2.png'])
    expect(await zip.file('trip-1.png')!.async('string')).toBe('A')
  })
})
