import { render, screen, fireEvent, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach } from 'vitest'
import i18n from '../../i18n'
import { Toolbar, Filmstrip, SidePanel } from './Panels'
import { useEditorStore, editorTemporal } from '../../store/editorStore'
import { createProjectFromTemplate, distributePhotos } from '../../lib/project-factory'

function setup(templateId = 'carousel2-diagonal') {
  const base = createProjectFromTemplate(templateId, { name: 'Trip' })
  const { project } = distributePhotos(base, ['bg', 'a', 'b', 'bg2', 'c', 'd'])
  useEditorStore.setState({ project, currentPageIndex: 0, selectedPhotoId: null })
  editorTemporal.getState().clear()
  return project
}

beforeEach(async () => {
  await i18n.changeLanguage('pt')
})

describe('Toolbar', () => {
  it('habilita desfazer após uma mudança e desfaz', async () => {
    setup()
    render(<Toolbar />)
    const undo = screen.getByRole('button', { name: /desfazer/i })
    expect(undo).toBeDisabled()

    useEditorStore.getState().setBgColor('#abcdef')
    await waitFor(() => expect(undo).toBeEnabled())
    await userEvent.click(undo)
    await waitFor(() => expect(screen.getByRole('button', { name: /refazer/i })).toBeEnabled())
  })
})

describe('Filmstrip', () => {
  it('troca de página, adiciona, duplica e remove', async () => {
    const project = setup()
    const { rerender } = render(<Filmstrip project={useEditorStore.getState().project!} />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: /página 2/i }))
    expect(useEditorStore.getState().currentPageIndex).toBe(1)

    await user.click(screen.getByRole('button', { name: /adicionar página/i }))
    rerender(<Filmstrip project={useEditorStore.getState().project!} />)
    expect(useEditorStore.getState().project!.pages.length).toBe(3)

    await user.click(screen.getByRole('button', { name: /duplicar/i }))
    rerender(<Filmstrip project={useEditorStore.getState().project!} />)
    expect(useEditorStore.getState().project!.pages.length).toBe(4)

    await user.click(screen.getByRole('button', { name: /remover/i }))
    rerender(<Filmstrip project={useEditorStore.getState().project!} />)
    expect(useEditorStore.getState().project!.pages.length).toBe(3)

    expect(project.name).toBe('Trip')
  })
})

describe('SidePanel — fundo', () => {
  it('ajusta cor, zoom/pan e aplica filtro no background compartilhado', () => {
    setup()
    render(<SidePanel project={useEditorStore.getState().project!} />)
    expect(screen.getByRole('heading', { name: /fundo/i })).toBeInTheDocument()

    const sliders = screen.getAllByRole('slider')
    sliders.forEach((s, i) => fireEvent.change(s, { target: { value: i % 2 ? '1.2' : '2' } }))

    fireEvent.click(screen.getByRole('button', { name: /^p&b$/i }))
    const bg = useEditorStore.getState().project!.background
    expect(bg.adjustments.saturation).toBe(0)
    expect(bg.transform.scale).toBeGreaterThanOrEqual(1)
  })
})

describe('SidePanel — foto', () => {
  it('edita ajustes, estilo e ordem de camadas da foto selecionada', () => {
    const project = setup()
    const pageId = project.pages[0].id
    const photoId = project.pages[0].collage[0].id
    useEditorStore.setState({ selectedPhotoId: photoId })

    render(<SidePanel project={useEditorStore.getState().project!} />)
    expect(screen.getByRole('heading', { name: /^foto$/i })).toBeInTheDocument()

    screen.getAllByRole('slider').forEach((s) => fireEvent.change(s, { target: { value: '0' } }))
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: /vívido/i }))
    fireEvent.click(screen.getByRole('button', { name: /trazer à frente/i }))

    const page = useEditorStore.getState().project!.pages.find((p) => p.id === pageId)!
    expect(page.collage[page.collage.length - 1].id).toBe(photoId)

    fireEvent.click(
      within(screen.getByText(/enviar para trás/i).closest('div')!).getByText(/enviar para trás/i),
    )
    const page2 = useEditorStore.getState().project!.pages.find((p) => p.id === pageId)!
    expect(page2.collage[0].id).toBe(photoId)
  })
})
