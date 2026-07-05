import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HashRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import i18n from '../../i18n'
import { SuggestionsPage } from './SuggestionsPage'
import { putLibraryPhotos, listProjects, _resetDbForTests } from '../../lib/storage'

const reverseGeocode = vi.hoisted(() => vi.fn())
vi.mock('../../lib/geocode', () => ({ reverseGeocode }))

const DAY = new Date(2026, 5, 27, 12, 0).getTime()

beforeEach(async () => {
  globalThis.indexedDB = new IDBFactory()
  _resetDbForTests()
  vi.clearAllMocks()
  await i18n.changeLanguage('pt')
})

function renderPage() {
  return render(
    <HashRouter>
      <SuggestionsPage />
    </HashRouter>,
  )
}

describe('SuggestionsPage', () => {
  it('mostra estado vazio sem biblioteca', async () => {
    renderPage()
    expect(await screen.findByText(/adicione fotos e o app agrupa/i)).toBeInTheDocument()
  })

  it('lista grupos por dia/lugar e cria um projeto a partir do grupo', async () => {
    await putLibraryPhotos([
      { assetId: 'a', takenAt: DAY, lat: -3.1, lon: -60.02, addedAt: 1 },
      { assetId: 'b', takenAt: DAY + 3600e3, lat: -3.101, lon: -60.021, addedAt: 1 },
      { assetId: 'c', takenAt: DAY + 86400e3, addedAt: 1 },
    ])
    renderPage()

    // dois momentos: dia 27 com GPS e dia 28 sem GPS
    expect(await screen.findByText(/2 momentos encontrados/i)).toBeInTheDocument()
    const buttons = screen.getAllByRole('button', { name: /criar carrossel/i })
    expect(buttons).toHaveLength(2)

    await userEvent.click(buttons[1])
    await waitFor(async () => {
      const projects = await listProjects()
      expect(projects).toHaveLength(1)
      expect(projects[0].assetPool).toEqual(['a', 'b'])
    })
  })

  it('nomeia lugares sob demanda (envia só coordenadas)', async () => {
    reverseGeocode.mockResolvedValue('Manaus, Amazonas')
    await putLibraryPhotos([{ assetId: 'a', takenAt: DAY, lat: -3.1, lon: -60.02, addedAt: 1 }])
    renderPage()

    await userEvent.click(await screen.findByRole('button', { name: /nomear lugares/i }))
    expect(await screen.findByText(/Manaus, Amazonas/)).toBeInTheDocument()
    expect(reverseGeocode).toHaveBeenCalledWith(-3.1, -60.02)
  })
})
