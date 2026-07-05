import { render, screen, within, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HashRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import i18n from '../i18n'
import { LibraryHome } from './LibraryHome'
import { putLibraryPhotos, saveProject, _resetDbForTests } from '../lib/storage'
import { createProjectFromTemplate } from '../lib/project-factory'
import { TEMPLATES } from '../templates/catalog'

function renderHome() {
  return render(
    <HashRouter>
      <LibraryHome />
    </HashRouter>,
  )
}

beforeEach(async () => {
  globalThis.indexedDB = new IDBFactory()
  _resetDbForTests()
  localStorage.clear()
  await i18n.changeLanguage('pt')
  // Neutraliza o prefetch do editor (Konva não carrega no ambiente de teste).
  ;(window as unknown as { requestIdleCallback: (cb: () => void) => number }).requestIdleCallback =
    () => 0
})

async function seedLibrary() {
  await putLibraryPhotos([
    { assetId: 'a', takenAt: Date.UTC(2026, 5, 27, 12), lat: -3.1, lon: -60.02, addedAt: 1 },
    { assetId: 'b', takenAt: Date.UTC(2026, 5, 27, 13), lat: -3.101, lon: -60.021, addedAt: 1 },
  ])
}

describe('LibraryHome', () => {
  it('biblioteca vazia: mostra CTA de importar e estado vazio', async () => {
    renderHome()
    expect(await screen.findByText(/importar fotos/i)).toBeInTheDocument()
    expect(screen.getByText(/importe suas fotos e o app agrupa/i)).toBeInTheDocument()
  })

  it('com biblioteca: mostra sugestões prontas e a grade agrupada', async () => {
    await seedLibrary()
    renderHome()
    expect(await screen.findByText(/prontos para postar/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /criar carrossel/i })).toBeInTheDocument()
    // Alternador de agrupamento.
    expect(screen.getByRole('button', { name: /^dia$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^lugar$/i })).toBeInTheDocument()
  })

  it('seleção: "Selecionar" + tocar numa foto revela "Criar projeto (N)"', async () => {
    await seedLibrary()
    const { container } = renderHome()
    await screen.findByText(/prontos para postar/i)

    await userEvent.click(screen.getByRole('button', { name: /^selecionar$/i }))
    const cells = container.querySelectorAll('.library-grid__item--btn')
    expect(cells.length).toBeGreaterThan(0)
    await userEvent.click(cells[0])

    expect(await screen.findByRole('button', { name: /criar projeto \(1\)/i })).toBeInTheDocument()
  })

  it('alterna o agrupamento para Lugar (mostra coordenadas no título)', async () => {
    await seedLibrary()
    const { container } = renderHome()
    await screen.findByText(/prontos para postar/i)
    await userEvent.click(screen.getByRole('button', { name: /^lugar$/i }))
    // grupo por proximidade => título da seção com as coordenadas do centro
    const titles = container.querySelectorAll('.library-section__title')
    expect(titles.length).toBe(1)
    expect(titles[0].textContent).toMatch(/-3\.10\d, -60\.0\d/)
  })

  it('toque e segure numa foto entra em seleção', async () => {
    await seedLibrary()
    const { container } = renderHome()
    await screen.findByText(/prontos para postar/i)
    const cell = container.querySelector('.library-grid__item--btn')!

    vi.useFakeTimers()
    fireEvent.pointerDown(cell)
    act(() => {
      vi.advanceTimersByTime(500)
    })
    vi.useRealTimers()
    fireEvent.pointerUp(cell)

    expect(screen.getByRole('button', { name: /criar projeto \(1\)/i })).toBeInTheDocument()
  })

  it('seleção múltipla: remover apaga as fotos escolhidas da biblioteca', async () => {
    await seedLibrary()
    const { container } = renderHome()
    await screen.findByText(/prontos para postar/i)

    await userEvent.click(screen.getByRole('button', { name: /^selecionar$/i }))
    const cells = container.querySelectorAll('.library-grid__item--btn')
    for (const cell of cells) await userEvent.click(cell)
    await userEvent.click(screen.getByRole('button', { name: /remover \d/i }))

    expect(await screen.findByText(/importe suas fotos e o app agrupa/i)).toBeInTheDocument()
  })

  it('dispensa uma sugestão pronta e a restaura', async () => {
    await seedLibrary()
    renderHome()
    expect(await screen.findByRole('button', { name: /criar carrossel/i })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /dispensar sugestão/i }))
    expect(screen.queryByRole('button', { name: /criar carrossel/i })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /restaurar 1 sugestão/i }))
    expect(await screen.findByRole('button', { name: /criar carrossel/i })).toBeInTheDocument()
  })

  it('aba Projetos: lista projetos existentes', async () => {
    const project = createProjectFromTemplate(TEMPLATES[0], { name: 'Viagem' })
    await saveProject(project)
    renderHome()
    await userEvent.click(await screen.findByRole('button', { name: /projetos/i }))
    const list = await screen.findByRole('list')
    expect(within(list).getByText('Viagem')).toBeInTheDocument()
  })

  it('aba Projetos vazia: mostra convite para selecionar fotos', async () => {
    renderHome()
    await userEvent.click(await screen.findByRole('button', { name: /projetos/i }))
    expect(screen.getByText(/selecione fotos da biblioteca/i)).toBeInTheDocument()
  })
})
