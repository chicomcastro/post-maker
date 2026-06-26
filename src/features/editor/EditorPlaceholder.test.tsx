import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { describe, it, expect, beforeEach } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import i18n from '../../i18n'
import { EditorPlaceholder } from './EditorPlaceholder'
import { createProjectFromTemplate, distributePhotos } from '../../lib/project-factory'
import { saveProject, putAsset, _resetDbForTests } from '../../lib/storage'

beforeEach(async () => {
  globalThis.indexedDB = new IDBFactory()
  _resetDbForTests()
  await i18n.changeLanguage('pt')
})

function renderAt(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/editor/${id}`]}>
      <Routes>
        <Route path="/editor/:id" element={<EditorPlaceholder />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('EditorPlaceholder', () => {
  it('carrega o projeto salvo e mostra uma prévia por página', async () => {
    const base = createProjectFromTemplate('carousel2-diagonal', { name: 'Bali' })
    const { project } = distributePhotos(base, ['bg1', 'a', 'b'])
    await saveProject(project)
    await putAsset('bg1', new Blob(['x'], { type: 'image/png' }))

    renderAt(project.id)

    await waitFor(() => expect(screen.getByText('Bali')).toBeInTheDocument())
    expect(screen.getByText(/página 1/i)).toBeInTheDocument()
    expect(screen.getByText(/página 2/i)).toBeInTheDocument()
  })

  it('mostra aviso quando o projeto não existe', async () => {
    renderAt('inexistente')
    await waitFor(() => expect(screen.getByText(/não tem projetos salvos/i)).toBeInTheDocument())
  })
})
