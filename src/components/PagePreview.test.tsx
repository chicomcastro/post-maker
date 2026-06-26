import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { PagePreview } from './PagePreview'
import { createProjectFromTemplate, distributePhotos } from '../lib/project-factory'

describe('PagePreview', () => {
  it('renderiza o background e cada foto de colagem posicionada', () => {
    const base = createProjectFromTemplate('post-trio-scatter') // 1 bg + 3 colagens
    const { project } = distributePhotos(base, ['bg', 'p1', 'p2', 'p3'])
    const page = project.pages[0]
    const urls = { bg: 'blob:bg', p1: 'blob:p1', p2: 'blob:p2', p3: 'blob:p3' }

    const { container } = render(
      <PagePreview page={page} aspectRatio={project.aspectRatio} urls={urls} />,
    )

    expect(container.querySelector('.page-preview__bg')).toBeTruthy()
    expect(container.querySelectorAll('.page-preview__photo')).toHaveLength(3)
  })

  it('marca fotos sem url como vazias', () => {
    const page = createProjectFromTemplate('post-solo').pages[0]
    const { container } = render(<PagePreview page={page} aspectRatio="1:1" urls={{}} />)
    expect(container.querySelector('.page-preview__photo--empty')).toBeTruthy()
  })
})
