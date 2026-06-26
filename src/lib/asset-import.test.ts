// @vitest-environment node
import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { importFiles } from './asset-import'
import { getAsset, _resetDbForTests } from './storage'

vi.mock('heic2any', () => ({
  default: vi.fn(async () => new Blob(['JPEG'], { type: 'image/jpeg' })),
}))

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory()
  _resetDbForTests()
})

function file(name: string, type: string): File {
  return new File(['bytes'], name, { type })
}

describe('importFiles', () => {
  it('importa apenas imagens, persiste e reporta progresso', async () => {
    const onProgress = vi.fn()
    const assets = await importFiles(
      [file('a.png', 'image/png'), file('nota.txt', 'text/plain'), file('b.jpg', 'image/jpeg')],
      onProgress,
    )
    expect(assets).toHaveLength(2)
    expect(await getAsset(assets[0].id)).toBeDefined()
    expect(onProgress).toHaveBeenLastCalledWith(2, 2)
  })

  it('converte HEIC ao importar', async () => {
    const assets = await importFiles([file('foto.heic', 'image/heic')])
    expect(assets).toHaveLength(1)
    const stored = await getAsset(assets[0].id)
    expect(stored?.type).toBe('image/jpeg')
  })
})
