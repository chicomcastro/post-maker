// @vitest-environment node
import { describe, it, expect, vi } from 'vitest'
import { extractPhotoMeta } from './photo-meta'

const parse = vi.hoisted(() => vi.fn())
vi.mock('exifr', () => ({ default: { parse } }))

function file(lastModified: number): File {
  return new File(['x'], 'a.jpg', { type: 'image/jpeg', lastModified })
}

describe('extractPhotoMeta', () => {
  it('usa DateTimeOriginal e GPS do EXIF quando presentes', async () => {
    const shot = new Date(2026, 5, 27, 15, 30)
    parse.mockResolvedValueOnce({
      DateTimeOriginal: shot,
      latitude: -3.1,
      longitude: -60.02,
    })
    const meta = await extractPhotoMeta(file(999))
    expect(meta.takenAt).toBe(shot.getTime())
    expect(meta.lat).toBeCloseTo(-3.1)
    expect(meta.lon).toBeCloseTo(-60.02)
  })

  it('cai para lastModified sem EXIF', async () => {
    parse.mockResolvedValueOnce(undefined)
    const meta = await extractPhotoMeta(file(123456))
    expect(meta.takenAt).toBe(123456)
    expect(meta.lat).toBeUndefined()
  })

  it('nunca lança: erro do parser vira fallback', async () => {
    parse.mockRejectedValueOnce(new Error('boom'))
    const meta = await extractPhotoMeta(file(777))
    expect(meta.takenAt).toBe(777)
  })
})
