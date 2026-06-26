import { describe, it, expect, vi, afterEach } from 'vitest'
import { canShareFiles, shareOrDownload, blobToFile } from './export'

const nav = navigator as unknown as {
  canShare?: (data: ShareData) => boolean
  share?: (data: ShareData) => Promise<void>
}

afterEach(() => {
  delete nav.canShare
  delete nav.share
})

function file(name: string): File {
  return blobToFile(new Blob(['x'], { type: 'image/png' }), name)
}

describe('shareOrDownload', () => {
  it('faz download de cada arquivo quando Web Share não está disponível', async () => {
    const download = vi.fn()
    const method = await shareOrDownload([file('a.png'), file('b.png')], download)
    expect(method).toBe('download')
    expect(download).toHaveBeenCalledTimes(2)
  })

  it('usa o compartilhamento nativo quando suportado', async () => {
    nav.canShare = () => true
    nav.share = vi.fn(async () => {})
    const download = vi.fn()
    const method = await shareOrDownload([file('a.png')], download)
    expect(method).toBe('share')
    expect(nav.share).toHaveBeenCalledOnce()
    expect(download).not.toHaveBeenCalled()
  })

  it('cai para download se o compartilhamento falhar', async () => {
    nav.canShare = () => true
    nav.share = vi.fn(async () => {
      throw new Error('cancelado')
    })
    const download = vi.fn()
    const method = await shareOrDownload([file('a.png')], download)
    expect(method).toBe('download')
    expect(download).toHaveBeenCalledOnce()
  })

  it('canShareFiles é falso sem suporte', () => {
    expect(canShareFiles([file('a.png')])).toBe(false)
  })
})
