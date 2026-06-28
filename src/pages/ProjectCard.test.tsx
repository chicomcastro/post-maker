import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import i18n from '../i18n'
import { ProjectCard } from './ProjectCard'
import { createProjectFromTemplate, distributePhotos } from '../lib/project-factory'

beforeEach(async () => {
  await i18n.changeLanguage('pt')
})

function makeProject() {
  const base = createProjectFromTemplate('carousel3-solo', {
    name: 'Viagem ao Norte',
    now: Date.UTC(2026, 0, 15),
  })
  const { project } = distributePhotos(base, ['a', 'b', 'c', 'd'])
  return project
}

describe('ProjectCard', () => {
  it('mostra nome, data, template e nº de fotos', () => {
    render(<ProjectCard project={makeProject()} onOpen={() => {}} onDelete={() => {}} />)
    expect(screen.getByText('Viagem ao Norte')).toBeInTheDocument()
    expect(screen.getByText('carousel3-solo')).toBeInTheDocument()
    expect(screen.getByText(/4 fotos/)).toBeInTheDocument()
    expect(screen.getByText(/3 páginas/)).toBeInTheDocument()
    expect(screen.getByText(/2026/)).toBeInTheDocument()
  })

  it('dispara abrir e excluir', async () => {
    const onOpen = vi.fn()
    const onDelete = vi.fn()
    render(<ProjectCard project={makeProject()} onOpen={onOpen} onDelete={onDelete} />)
    await userEvent.click(screen.getByRole('button', { name: /abrir/i }))
    expect(onOpen).toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: /apagar/i }))
    expect(onDelete).toHaveBeenCalled()
  })
})
