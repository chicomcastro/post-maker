import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Project } from '../types/project'
import { PagePreview } from '../components/PagePreview'
import { IconButton } from '../components/ui'
import { Trash, Pencil } from '../components/icons'
import { useAssetUrls } from '../hooks/useAssetUrls'
import { collectAssetIds } from '../lib/project-io'

const LOCALES: Record<string, string> = { pt: 'pt-BR', en: 'en-US' }

/** Card de projeto na home: miniatura + nome (renomeável) + data, template e nº de fotos. */
export function ProjectCard({
  project,
  onOpen,
  onDelete,
  onRename,
}: {
  project: Project
  onOpen: () => void
  onDelete: () => void
  onRename: (name: string) => void
}) {
  const { t, i18n } = useTranslation()
  const urls = useAssetUrls(collectAssetIds(project))
  const photos = project.assetPool.length
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(project.name)
  const inputRef = useRef<HTMLInputElement>(null)

  const date = new Date(project.createdAt).toLocaleDateString(
    LOCALES[i18n.language] ?? i18n.language,
    { day: '2-digit', month: 'short', year: 'numeric' },
  )

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  function commit() {
    const next = value.trim()
    if (next && next !== project.name) onRename(next)
    else setValue(project.name)
    setEditing(false)
  }

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
      <div className="project-card__body">
        {editing ? (
          <input
            ref={inputRef}
            className="project-card__rename"
            value={value}
            aria-label={t('home.renameProject')}
            onChange={(e) => setValue(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit()
              if (e.key === 'Escape') {
                setValue(project.name)
                setEditing(false)
              }
            }}
          />
        ) : (
          <button className="project-card__name" onClick={onOpen}>
            {project.name}
          </button>
        )}
        <div className="project-card__meta muted" onClick={onOpen}>
          {date} · {t('home.photoCount', { count: photos })}
        </div>
        <div className="project-card__tags" onClick={onOpen}>
          <span className="tag">{project.templateId}</span>
          <span className="tag">{t('home.pageCount', { count: project.pages.length })}</span>
        </div>
      </div>
      <div className="project-card__actions">
        <IconButton label={t('home.renameProject')} onClick={() => setEditing(true)}>
          <Pencil />
        </IconButton>
        <IconButton label={t('home.deleteProject')} onClick={onDelete}>
          <Trash />
        </IconButton>
      </div>
    </li>
  )
}
