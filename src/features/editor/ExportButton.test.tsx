import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import i18n from '../../i18n'
import { ExportButton } from './ExportButton'
import { createProjectFromTemplate } from '../../lib/project-factory'

const { renderProjectToPngs, shareOrDownload } = vi.hoisted(() => ({
  renderProjectToPngs: vi.fn<(...a: unknown[]) => Promise<Blob[]>>(),
  shareOrDownload: vi.fn<(...a: unknown[]) => Promise<'share' | 'download'>>(),
}))

vi.mock('../../lib/export-render', () => ({ renderProjectToPngs }))
vi.mock('../../lib/export', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../lib/export')>()),
  shareOrDownload,
}))

beforeEach(async () => {
  vi.clearAllMocks()
  shareOrDownload.mockResolvedValue('download')
  await i18n.changeLanguage('pt')
})

function filesFromCall(): File[] {
  return shareOrDownload.mock.calls[0]![0] as File[]
}

async function openAndChooseImages() {
  await userEvent.click(screen.getByRole('button', { name: /exportar/i }))
  // o seletor pergunta: gerar imagens ou exportar projeto
  await userEvent.click(screen.getByRole('button', { name: /gerar imagens/i }))
}

describe('ExportButton', () => {
  it('exporta um post de página única como um PNG só', async () => {
    renderProjectToPngs.mockResolvedValueOnce([new Blob(['p'], { type: 'image/png' })])
    const project = createProjectFromTemplate('post-solo', { name: 'Praia' })

    render(<ExportButton project={project} />)
    await openAndChooseImages()

    await waitFor(() => expect(shareOrDownload).toHaveBeenCalledOnce())
    const files = filesFromCall()
    expect(files).toHaveLength(1)
    expect(files[0].name).toBe('praia.png')
  })

  it('exporta um carrossel como PNGs individuais (sem zip)', async () => {
    renderProjectToPngs.mockResolvedValueOnce([
      new Blob(['1'], { type: 'image/png' }),
      new Blob(['2'], { type: 'image/png' }),
    ])
    const project = createProjectFromTemplate('carousel2-diagonal', { name: 'Trip' })

    render(<ExportButton project={project} />)
    await openAndChooseImages()

    await waitFor(() => expect(shareOrDownload).toHaveBeenCalledOnce())
    const files = filesFromCall()
    expect(files).toHaveLength(2)
    expect(files.map((f) => f.name)).toEqual(['trip-1.png', 'trip-2.png'])
  })
})
