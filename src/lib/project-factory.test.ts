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
      expect(page.background.assetId).toBeNull()
    }
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
  it('preenche background e colagem na ordem, devolvendo o excedente', () => {
    const project = createProjectFromTemplate('post-diagonal') // 1 página, A3 (2 colagens) => cap 3
    const { project: filled, leftover } = distributePhotos(project, ['a', 'b', 'c', 'd', 'e'])
    expect(filled.pages[0].background.assetId).toBe('a')
    expect(filled.pages[0].collage.map((c) => c.assetId)).toEqual(['b', 'c'])
    expect(leftover).toEqual(['d', 'e'])
  })

  it('deixa frames vazios quando faltam fotos', () => {
    const project = createProjectFromTemplate('post-trio-scatter') // A5 => cap 4
    const { project: filled, leftover } = distributePhotos(project, ['a', 'b'])
    expect(filled.pages[0].background.assetId).toBe('a')
    expect(filled.pages[0].collage[0].assetId).toBe('b')
    expect(filled.pages[0].collage[1].assetId).toBeNull()
    expect(leftover).toEqual([])
  })
})
