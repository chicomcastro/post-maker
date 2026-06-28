import { useTranslation } from 'react-i18next'
import type { Project } from '../types/project'
import { PagePreview } from '../components/PagePreview'
import { IconButton } from '../components/ui'
import { Trash } from '../components/icons'
import { useAssetUrls } from '../hooks/useAssetUrls'
import { collectAssetIds } from '../lib/project-io'

const LOCALES: Record<string, string> = { pt: 'pt-BR', en: 'en-US' }

/** Card de projeto na home: miniatura + nome + data, template e nº de fotos. */
export function ProjectCard({
  project,
  onOpen,
  onDelete,
}: {
  project: Project
  onOpen: () => void
  onDelete: () => void
}) {
  const { t, i18n } = useTranslation()
  const urls = useAssetUrls(collectAssetIds(project))
  const photos = project.assetPool.length
  const date = new Date(project.createdAt).toLocaleDateString(
    LOCALES[i18n.language] ?? i18n.language,
    { day: '2-digit', month: 'short', year: 'numeric' },
  )

  return (
    <li className="project-card">
      <button className="project-card__thumb" onClick={onOpen} aria-label={t('home.openProject')}>
        {project.pages[0] && (
          <PagePreview
            page={project.pages[0]}
            background={project.background}
            bgColor={project.bgColor}
            aspectRatio={project.aspectRatio}
            urls={urls}
            pageIndex={0}
            pageCount={project.pages.length}
          />
        )}
      </button>
      <div className="project-card__body" onClick={onOpen}>
        <div className="project-card__name">{project.name}</div>
        <div className="project-card__meta muted">
          {date} · {t('home.photoCount', { count: photos })}
        </div>
        <div className="project-card__tags">
          <span className="tag">{project.templateId}</span>
          <span className="tag">{t('home.pageCount', { count: project.pages.length })}</span>
        </div>
      </div>
      <IconButton label={t('home.deleteProject')} onClick={onDelete}>
        <Trash />
      </IconButton>
    </li>
  )
}
