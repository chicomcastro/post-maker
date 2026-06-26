// @vitest-environment node
import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { describe, it, expect, beforeEach } from 'vitest'
import {
  saveProject,
  loadProject,
  listProjects,
  deleteProject,
  putAsset,
  getAsset,
  pruneOrphanAssets,
  _resetDbForTests,
} from './storage'
import { createProjectFromTemplate, distributePhotos } from './project-factory'

beforeEach(() => {
  // Banco limpo a cada teste.
  globalThis.indexedDB = new IDBFactory()
  _resetDbForTests()
})

describe('storage', () => {
  it('salva, lê e remove um projeto', async () => {
    const project = createProjectFromTemplate('post-solo', { name: 'Teste' })
    await saveProject(project)
    expect((await loadProject(project.id))?.name).toBe('Teste')
    await deleteProject(project.id)
    expect(await loadProject(project.id)).toBeUndefined()
  })

  it('lista projetos do mais recente para o mais antigo', async () => {
    const older = createProjectFromTemplate('post-solo', { name: 'Velho', now: 1000 })
    const newer = createProjectFromTemplate('post-solo', { name: 'Novo', now: 2000 })
    await saveProject(older)
    await saveProject(newer)
    const list = await listProjects()
    expect(list.map((p) => p.name)).toEqual(['Novo', 'Velho'])
  })

  it('guarda e recupera assets como Blob', async () => {
    await putAsset('img1', new Blob(['dados'], { type: 'image/png' }))
    const blob = await getAsset('img1')
    expect(await blob!.text()).toBe('dados')
  })

  it('remove assets órfãos não referenciados por nenhum projeto', async () => {
    const base = createProjectFromTemplate('post-solo')
    const { project } = distributePhotos(base, ['used-bg', 'used-collage'])
    await saveProject(project)
    await putAsset('used-bg', new Blob(['x']))
    await putAsset('used-collage', new Blob(['y']))
    await putAsset('orphan', new Blob(['z']))

    const removed = await pruneOrphanAssets()
    expect(removed).toBe(1)
    expect(await getAsset('orphan')).toBeUndefined()
    expect(await getAsset('used-bg')).toBeDefined()
  })
})
