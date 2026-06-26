// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { exportProjectZip, importProjectZip, collectAssetIds } from './project-io'
import { createProjectFromTemplate, distributePhotos } from './project-factory'

function fakeImage(content: string, type = 'image/jpeg'): Blob {
  return new Blob([content], { type })
}

describe('project-io', () => {
  it('coleta ids de assets referenciados (sem duplicar)', () => {
    const base = createProjectFromTemplate('post-diagonal')
    const { project } = distributePhotos(base, ['bg', 'p1', 'p2'])
    expect(collectAssetIds(project).sort()).toEqual(['bg', 'p1', 'p2'])
  })

  it('exporta e reimporta um projeto preservando dados e assets', async () => {
    const base = createProjectFromTemplate('carousel2-diagonal', { name: 'Roteiro' })
    const { project } = distributePhotos(base, ['bg1', 'a', 'b'])
    const assets = new Map<string, Blob>([
      ['bg1', fakeImage('FUNDO')],
      ['a', fakeImage('AAA', 'image/png')],
      ['b', fakeImage('BBB', 'image/webp')],
    ])

    const zip = await exportProjectZip(project, assets)
    expect(zip.type).toBe('application/zip')

    const imported = await importProjectZip(zip)
    expect(imported.project.name).toBe('Roteiro')
    expect(imported.project.pages).toHaveLength(2)
    expect(imported.project).toEqual(project)
    expect(imported.assets.size).toBe(3)
    expect(await imported.assets.get('bg1')!.text()).toBe('FUNDO')
    expect(await imported.assets.get('a')!.text()).toBe('AAA')
  })

  it('rejeita um zip sem manifest', async () => {
    const notAProject = new Blob(['lixo'], { type: 'application/zip' })
    await expect(importProjectZip(notAProject)).rejects.toThrow()
  })
})
