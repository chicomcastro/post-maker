import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { PagePreview } from './PagePreview'
import { createProjectFromTemplate, distributePhotos } from '../lib/project-factory'

describe('PagePreview', () => {
  it('renderiza o background e cada foto de colagem posicionada', () => {
    const base = createProjectFromTemplate('post-trio-scatter') // A5 => 3 colagens
    const { project } = distributePhotos(base, ['p1', 'p2', 'p3'])
    // background é escolhido depois; aqui simulamos uma foto definida como fundo
    const background = { ...project.background, assetId: 'bg' }
    const page = project.pages[0]
    const urls = { bg: 'blob:bg', p1: 'blob:p1', p2: 'blob:p2', p3: 'blob:p3' }

    const { container } = render(
      <PagePreview
        page={page}
        background={background}
        bgColor={project.bgColor}
        aspectRatio={project.aspectRatio}
        urls={urls}
      />,
    )

    expect(container.querySelector('.page-preview__bg')).toBeTruthy()
    expect(container.querySelectorAll('.page-preview__photo')).toHaveLength(3)
  })

  it('marca fotos sem url como vazias', () => {
    const project = createProjectFromTemplate('post-solo')
    const { container } = render(
      <PagePreview
        page={project.pages[0]}
        background={project.background}
        bgColor={project.bgColor}
        aspectRatio="1:1"
        urls={{}}
      />,
    )
    expect(container.querySelector('.page-preview__photo--empty')).toBeTruthy()
  })
})
