import { describe, it, expect } from 'vitest'
import { createProjectFromTemplate, distributePhotos } from './project-factory'
import { getArrangement } from '../templates/arrangements'

describe('createProjectFromTemplate', () => {
  it('cria projeto com páginas e frames de colagem do template', () => {
    const project = createProjectFromTemplate('carousel3-scatter', { now: 1000 })
    expect(project.pages).toHaveLength(3)
    expect(project.aspectRatio).toBe('1:1')
    expect(project.createdAt).toBe(1000)
    for (const page of project.pages) {
      expect(page.collage).toHaveLength(getArrangement('A5').count)
    }
    expect(project.background.assetId).toBeNull()
  })

  it('respeita name e aspectRatio sobrescritos', () => {
    const project = createProjectFromTemplate('post-solo', {
      name: 'Minha viagem',
      aspectRatio: '9:16',
    })
    expect(project.name).toBe('Minha viagem')
    expect(project.aspectRatio).toBe('9:16')
  })

  it('aplica a rotação do arranjo às fotos de colagem', () => {
    const project = createProjectFromTemplate('post-trio-fan')
    const rotations = project.pages[0].collage.map((c) => c.transform.rotation)
    expect(rotations).toEqual(getArrangement('A9').slots.map((s) => s.rotation))
  })
})

describe('distributePhotos', () => {
  it('preenche os slots de colagem em ordem e não define background automático', () => {
    const project = createProjectFromTemplate('post-diagonal') // 1 página, A3 (2 colagens)
    const { project: filled, leftover } = distributePhotos(project, ['a', 'b', 'c', 'd', 'e'])
    // background fica vazio — é opcional e escolhido depois, no editor
    expect(filled.background.assetId).toBeNull()
    expect(filled.pages[0].collage.map((c) => c.assetId)).toEqual(['a', 'b'])
    // sobra o que não coube nos slots de colagem
    expect(leftover).toEqual(['c', 'd', 'e'])
  })

  it('guarda todas as fotos no assetPool para escolha posterior', () => {
    const project = createProjectFromTemplate('post-diagonal')
    const { project: filled } = distributePhotos(project, ['a', 'b', 'c', 'd', 'e'])
    expect(filled.assetPool).toEqual(['a', 'b', 'c', 'd', 'e'])
  })

  it('distribui as fotos pelos slots de todas as páginas do carrossel', () => {
    const project = createProjectFromTemplate('carousel3-diagonal') // 3 páginas, A3 cada (6 slots)
    const { project: filled, leftover } = distributePhotos(project, ['a', 'b', 'c', 'd', 'e', 'f'])
    expect(filled.background.assetId).toBeNull()
    expect(filled.pages).toHaveLength(3)
    expect(filled.pages.flatMap((p) => p.collage.map((c) => c.assetId))).toEqual([
      'a',
      'b',
      'c',
      'd',
      'e',
      'f',
    ])
    expect(leftover).toEqual([])
  })

  it('deixa frames vazios quando faltam fotos', () => {
    const project = createProjectFromTemplate('post-trio-scatter') // A5 => 3 slots
    const { project: filled, leftover } = distributePhotos(project, ['a', 'b'])
    expect(filled.pages[0].collage[0].assetId).toBe('a')
    expect(filled.pages[0].collage[1].assetId).toBe('b')
    expect(filled.pages[0].collage[2].assetId).toBeNull()
    expect(leftover).toEqual([])
  })
})
