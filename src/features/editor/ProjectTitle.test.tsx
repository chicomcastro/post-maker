import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import i18n from '../../i18n'
import { ProjectTitle } from './ProjectTitle'

beforeEach(async () => {
  await i18n.changeLanguage('pt')
})

describe('ProjectTitle', () => {
  it('renomeia ao confirmar com Enter', async () => {
    const onRename = vi.fn()
    render(<ProjectTitle name="Sem título" onRename={onRename} />)
    await userEvent.click(screen.getByRole('button', { name: /renomear/i }))
    const input = screen.getByRole('textbox', { name: /renomear/i })
    await userEvent.clear(input)
    await userEvent.type(input, 'Praia{Enter}')
    expect(onRename).toHaveBeenCalledWith('Praia')
  })

  it('cancela com Esc e não renomeia', async () => {
    const onRename = vi.fn()
    render(<ProjectTitle name="Sem título" onRename={onRename} />)
    await userEvent.click(screen.getByRole('button', { name: /renomear/i }))
    const input = screen.getByRole('textbox', { name: /renomear/i })
    await userEvent.type(input, 'Xyz{Escape}')
    expect(onRename).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /renomear/i })).toHaveTextContent('Sem título')
  })

  it('ignora nome vazio', async () => {
    const onRename = vi.fn()
    render(<ProjectTitle name="Original" onRename={onRename} />)
    await userEvent.click(screen.getByRole('button', { name: /renomear/i }))
    const input = screen.getByRole('textbox', { name: /renomear/i })
    await userEvent.clear(input)
    await userEvent.type(input, '{Enter}')
    expect(onRename).not.toHaveBeenCalled()
  })
})
