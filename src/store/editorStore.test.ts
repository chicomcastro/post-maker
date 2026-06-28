import { describe, it, expect, beforeEach } from 'vitest'
import { useEditorStore, editorTemporal } from './editorStore'
import { createProjectFromTemplate } from '../lib/project-factory'

function load(templateId: string) {
  const project = createProjectFromTemplate(templateId)
  useEditorStore.getState().setProject(project)
  editorTemporal.getState().clear()
  return project
}

beforeEach(() => {
  useEditorStore.setState({ project: null, currentPageIndex: 0 })
  editorTemporal.getState().clear()
})

describe('editorStore — páginas', () => {
  it('adiciona página até o limite de 4', () => {
    load('carousel3-diagonal') // 3 páginas
    useEditorStore.getState().addPage('A1')
    expect(useEditorStore.getState().project?.pages).toHaveLength(4)
    useEditorStore.getState().addPage('A1') // não passa de 4
    expect(useEditorStore.getState().project?.pages).toHaveLength(4)
  })

  it('duplica uma página gerando novos ids', () => {
    const project = load('post-solo')
    const pageId = project.pages[0].id
    useEditorStore.getState().duplicatePage(pageId)
    const pages = useEditorStore.getState().project!.pages
    expect(pages).toHaveLength(2)
    expect(pages[0].id).not.toBe(pages[1].id)
    expect(pages[0].collage[0].id).not.toBe(pages[1].collage[0].id)
  })

  it('não remove a última página', () => {
    const project = load('post-solo')
    useEditorStore.getState().removePage(project.pages[0].id)
    expect(useEditorStore.getState().project?.pages).toHaveLength(1)
  })

  it('reordena páginas', () => {
    const project = load('carousel3-diagonal')
    const firstId = project.pages[0].id
    useEditorStore.getState().reorderPages(0, 2)
    expect(useEditorStore.getState().project!.pages[2].id).toBe(firstId)
  })
})

describe('editorStore — edição de fotos e fundo', () => {
  it('atualiza ajustes de uma foto de colagem', () => {
    const project = load('post-trio-scatter')
    const page = project.pages[0]
    const photoId = page.collage[0].id
    useEditorStore.getState().updateCollagePhoto(page.id, photoId, (p) => ({
      ...p,
      adjustments: { ...p.adjustments, saturation: 0 },
    }))
    expect(useEditorStore.getState().project!.pages[0].collage[0].adjustments.saturation).toBe(0)
  })

  it('muda a cor de fundo e o zoom do background (compartilhados)', () => {
    load('post-solo')
    useEditorStore.getState().setBgColor('#ff0000')
    useEditorStore.getState().updateBackground((b) => ({
      ...b,
      transform: { ...b.transform, scale: 2 },
    }))
    const updated = useEditorStore.getState().project!
    expect(updated.bgColor).toBe('#ff0000')
    expect(updated.background.transform.scale).toBe(2)
  })

  it('reordena camadas (frente/trás)', () => {
    const project = load('post-trio-scatter')
    const page = project.pages[0]
    const firstId = page.collage[0].id
    useEditorStore.getState().bringPhotoToFront(page.id, firstId)
    let collage = useEditorStore.getState().project!.pages[0].collage
    expect(collage[collage.length - 1].id).toBe(firstId)

    useEditorStore.getState().sendPhotoToBack(page.id, firstId)
    collage = useEditorStore.getState().project!.pages[0].collage
    expect(collage[0].id).toBe(firstId)
  })

  it('seleciona e deseleciona uma foto (fora do histórico)', () => {
    load('post-solo')
    useEditorStore.getState().selectPhoto('abc')
    expect(useEditorStore.getState().selectedPhotoId).toBe('abc')
    expect(editorTemporal.getState().pastStates.length).toBe(0)
  })
})

describe('editorStore — modo de interação', () => {
  it('começa em "frame" e alterna sem entrar no histórico', () => {
    load('post-solo')
    expect(useEditorStore.getState().interactionMode).toBe('frame')
    useEditorStore.getState().setInteractionMode('move')
    expect(useEditorStore.getState().interactionMode).toBe('move')
    expect(editorTemporal.getState().pastStates.length).toBe(0)
  })
})

describe('editorStore — undo/redo', () => {
  it('desfaz e refaz uma renomeação', () => {
    load('post-solo')
    useEditorStore.getState().rename('Praia')
    expect(useEditorStore.getState().project?.name).toBe('Praia')

    editorTemporal.getState().undo()
    expect(useEditorStore.getState().project?.name).toBe('Novo post')

    editorTemporal.getState().redo()
    expect(useEditorStore.getState().project?.name).toBe('Praia')
  })
})
