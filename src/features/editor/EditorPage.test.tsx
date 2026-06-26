import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import i18n from '../../i18n'
import { EditorPage } from './EditorPage'
import { useEditorStore } from '../../store/editorStore'
import { createProjectFromTemplate, distributePhotos } from '../../lib/project-factory'
import { saveProject, _resetDbForTests } from '../../lib/storage'

// O palco Konva depende de <canvas>; substituímos por um stub no teste do container.
vi.mock('./canvas/EditorStage', () => ({
  default: () => <div data-testid="stage-stub" />,
}))

beforeEach(async () => {
  globalThis.indexedDB = new IDBFactory()
  _resetDbForTests()
  useEditorStore.setState({ project: null, currentPageIndex: 0, selectedPhotoId: null })
  await i18n.changeLanguage('pt')
})

function renderAt(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/editor/${id}`]}>
      <Routes>
        <Route path="/editor/:id" element={<EditorPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('EditorPage', () => {
  it('carrega o projeto e mostra palco, painel de fundo e tira de páginas', async () => {
    const base = createProjectFromTemplate('carousel2-diagonal', { name: 'Trip' })
    const { project } = distributePhotos(base, ['bg', 'a', 'b'])
    await saveProject(project)

    renderAt(project.id)

    await waitFor(() => expect(screen.getByText('Trip')).toBeInTheDocument())
    expect(await screen.findByTestId('stage-stub')).toBeInTheDocument()
    // Nada selecionado => painel de fundo.
    expect(screen.getByRole('heading', { name: /fundo/i })).toBeInTheDocument()
    // Duas páginas na tira.
    expect(screen.getByRole('button', { name: /página 1/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /página 2/i })).toBeInTheDocument()
  })

  it('mostra o painel da foto quando uma está selecionada', async () => {
    const base = createProjectFromTemplate('post-solo', { name: 'X' })
    const { project } = distributePhotos(base, ['bg', 'p1'])
    await saveProject(project)
    renderAt(project.id)
    await waitFor(() => expect(screen.getByText('X')).toBeInTheDocument())

    const photoId = project.pages[0].collage[0].id
    useEditorStore.getState().selectPhoto(photoId)

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /^foto$/i })).toBeInTheDocument(),
    )
  })

  it('redireciona para aviso quando o projeto não existe', async () => {
    renderAt('nope')
    await waitFor(() => expect(screen.getByText(/não tem projetos salvos/i)).toBeInTheDocument())
  })
})
