import { describe, it, expect } from 'vitest'
import { normalizeProject } from './migrations'
import { createProjectFromTemplate, distributePhotos } from './project-factory'

describe('normalizeProject', () => {
  it('migra projeto antigo (background por página) para o formato atual', () => {
    const legacy = {
      id: 'old1',
      name: 'Antigo',
      createdAt: 1,
      updatedAt: 2,
      aspectRatio: '1:1',
      templateId: 'post-solo',
      pages: [
        {
          id: 'pg1',
          bgColor: '#abcdef',
          background: {
            assetId: 'bg-asset',
            transform: { x: 0.5, y: 0.5, scale: 1, rotation: 0 },
            adjustments: { brightness: 1, contrast: 1, saturation: 1 },
          },
          collage: [],
        },
      ],
    }
    const p = normalizeProject(legacy)
    expect(p.background.assetId).toBe('bg-asset')
    expect(p.bgColor).toBe('#abcdef')
    // página não deve mais carregar background/bgColor
    expect('background' in p.pages[0]).toBe(false)
    expect(p.pages[0].collage).toEqual([])
  })

  it('preenche defaults quando faltam campos', () => {
    const p = normalizeProject({ pages: [{ id: 'x' }] })
    expect(p.background.assetId).toBeNull()
    expect(p.bgColor).toBeTruthy()
    expect(p.aspectRatio).toBe('4:5')
    expect(p.pages[0].collage).toEqual([])
  })

  it('é idempotente para projetos já no formato novo', () => {
    const base = createProjectFromTemplate('carousel2-diagonal', { now: 5 })
    const { project } = distributePhotos(base, ['bg', 'a', 'b'])
    expect(normalizeProject(project)).toEqual(project)
  })
})
