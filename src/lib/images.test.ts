// @vitest-environment node
import { describe, it, expect, vi } from 'vitest'
import { isHeic, isImageFile, fileToDisplayBlob } from './images'

vi.mock('heic2any', () => ({
  default: vi.fn(async () => new Blob(['JPEG'], { type: 'image/jpeg' })),
}))

function file(name: string, type: string): File {
  return new File(['data'], name, { type })
}

describe('detecção de imagem', () => {
  it('reconhece HEIC por mime ou extensão', () => {
    expect(isHeic(file('foto.HEIC', ''))).toBe(true)
    expect(isHeic(file('foto.heif', ''))).toBe(true)
    expect(isHeic(file('x', 'image/heic'))).toBe(true)
    expect(isHeic(file('foto.jpg', 'image/jpeg'))).toBe(false)
  })

  it('aceita imagens e rejeita não-imagens', () => {
    expect(isImageFile(file('a.png', 'image/png'))).toBe(true)
    expect(isImageFile(file('a.heic', ''))).toBe(true)
    expect(isImageFile(file('a.txt', 'text/plain'))).toBe(false)
  })
})

describe('fileToDisplayBlob', () => {
  it('devolve o próprio arquivo quando não é HEIC', async () => {
    const f = file('a.jpg', 'image/jpeg')
    expect(await fileToDisplayBlob(f)).toBe(f)
  })

  it('converte HEIC para JPEG via heic2any', async () => {
    const out = await fileToDisplayBlob(file('a.heic', 'image/heic'))
    expect(out.type).toBe('image/jpeg')
    expect(await out.text()).toBe('JPEG')
  })
})
