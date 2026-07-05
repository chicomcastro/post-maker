import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HashRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import i18n from '../i18n'
import { Home } from './Home'
import { putLibraryPhotos, _resetDbForTests } from '../lib/storage'

function renderHome() {
  return render(
    <HashRouter>
      <Home />
    </HashRouter>,
  )
}

beforeEach(async () => {
  globalThis.indexedDB = new IDBFactory()
  _resetDbForTests()
  localStorage.clear()
  await i18n.changeLanguage('pt')
})

describe('Home', () => {
  it('foca no botão de criar novo projeto', async () => {
    renderHome()
    expect(screen.getByRole('button', { name: /criar novo projeto/i })).toBeInTheDocument()
  })

  it('troca o idioma para inglês pelo botão', async () => {
    renderHome()
    await userEvent.click(screen.getByRole('button', { name: /idioma/i }))
    expect(screen.getByRole('button', { name: /create new project/i })).toBeInTheDocument()
  })

  it('sem biblioteca: mostra o botão de sugestões, sem faixa de momentos', async () => {
    renderHome()
    expect(
      await screen.findByRole('button', { name: /sugestões por data e lugar/i }),
    ).toBeInTheDocument()
    expect(screen.queryByText(/momentos recentes/i)).not.toBeInTheDocument()
  })

  it('com biblioteca: mostra "Momentos recentes" e oculta o botão genérico', async () => {
    await putLibraryPhotos([
      { assetId: 'a', takenAt: Date.UTC(2026, 5, 27, 12), lat: -3.1, lon: -60.02, addedAt: 1 },
      { assetId: 'b', takenAt: Date.UTC(2026, 5, 27, 13), lat: -3.101, lon: -60.021, addedAt: 1 },
    ])
    renderHome()
    expect(await screen.findByText(/momentos recentes/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /criar carrossel/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ver todos/i })).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /sugestões por data e lugar/i }),
    ).not.toBeInTheDocument()
  })
})
