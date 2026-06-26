import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { loadProject } from '../../lib/storage'
import { collectAssetIds } from '../../lib/project-io'
import { useAssetUrls } from '../../hooks/useAssetUrls'
import { PagePreview } from '../../components/PagePreview'
import type { Project } from '../../types/project'

export function EditorPlaceholder() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    if (!id) return
    loadProject(id).then((p) => {
      if (active) {
        setProject(p ?? null)
        setLoading(false)
      }
    })
    return () => {
      active = false
    }
  }, [id])

  const assetIds = project ? collectAssetIds(project) : []
  const urls = useAssetUrls(assetIds)

  if (loading) return <main className="container" />
  if (!project) {
    return (
      <main className="container">
        <p>{t('home.noProjects')}</p>
        <Link to="/">{t('editor.backHome')}</Link>
      </main>
    )
  }

  return (
    <main className="container editor-preview">
      <header className="create__topbar">
        <Link className="btn btn--ghost" to="/">
          ← {t('editor.backHome')}
        </Link>
        <strong>{project.name}</strong>
      </header>
      <p className="muted">{t('editor.comingSoon')}</p>
      <div className="slides">
        {project.pages.map((page, i) => (
          <figure key={page.id} className="slides__item">
            <PagePreview page={page} aspectRatio={project.aspectRatio} urls={urls} />
            <figcaption className="muted">{t('editor.page', { n: i + 1 })}</figcaption>
          </figure>
        ))}
      </div>
    </main>
  )
}
