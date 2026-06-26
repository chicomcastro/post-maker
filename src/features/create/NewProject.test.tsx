import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HashRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach } from 'vitest'
import i18n from '../../i18n'
import { NewProject } from './NewProject'

function renderFlow() {
  return render(
    <HashRouter>
      <NewProject />
    </HashRouter>,
  )
}

beforeEach(async () => {
  await i18n.changeLanguage('pt')
})

describe('NewProject — fluxo', () => {
  it('navega de formato → template → fotos', async () => {
    const user = userEvent.setup()
    renderFlow()

    expect(screen.getByRole('heading', { name: /escolha o formato/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /feed/i }))

    expect(screen.getByRole('heading', { name: /escolha um template/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'post-solo' }))

    expect(screen.getByRole('heading', { name: /selecione suas fotos/i })).toBeInTheDocument()
  })

  it('filtra templates por tipo', async () => {
    const user = userEvent.setup()
    renderFlow()
    await user.click(screen.getByRole('button', { name: /feed/i }))

    await user.click(screen.getByRole('button', { name: /^posts$/i }))
    expect(screen.getAllByRole('button', { name: /^post-/ })).toHaveLength(6)
  })

  it('exige ao menos uma foto para criar', async () => {
    const user = userEvent.setup()
    renderFlow()
    await user.click(screen.getByRole('button', { name: /feed/i }))
    await user.click(screen.getByRole('button', { name: 'post-solo' }))
    await user.click(screen.getByRole('button', { name: /criar projeto/i }))

    expect(screen.getByText(/selecione ao menos uma foto/i)).toBeInTheDocument()
  })
})
