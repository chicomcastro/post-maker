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
  it('mostra a chamada principal e o botão de criar', async () => {
    await i18n.changeLanguage('pt')
    renderHome()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/postou nada/i)
    expect(screen.getByRole('button', { name: /criar novo/i })).toBeInTheDocument()
  })

  it('troca o idioma para inglês', async () => {
    await i18n.changeLanguage('pt')
    renderHome()
    await userEvent.selectOptions(screen.getByRole('combobox'), 'en')
    expect(screen.getByRole('button', { name: /create new/i })).toBeInTheDocument()
  })
})
