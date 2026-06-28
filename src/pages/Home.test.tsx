import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HashRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import i18n from '../i18n'
import { Home } from './Home'

function renderHome() {
  return render(
    <HashRouter>
      <Home />
    </HashRouter>,
  )
}

describe('Home', () => {
  it('foca no botão de criar novo projeto', async () => {
    await i18n.changeLanguage('pt')
    renderHome()
    expect(screen.getByRole('button', { name: /criar novo projeto/i })).toBeInTheDocument()
  })

  it('troca o idioma para inglês pelo botão', async () => {
    await i18n.changeLanguage('pt')
    renderHome()
    await userEvent.click(screen.getByRole('button', { name: /idioma/i }))
    expect(screen.getByRole('button', { name: /create new project/i })).toBeInTheDocument()
  })
})
