import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Project } from '../../types/project'
import { renderProjectToDataUrls } from '../../lib/export-render'
import { IconButton } from '../../components/ui'
import { Close } from '../../components/icons'

/**
 * Preview do carrossel como no Instagram: páginas lado a lado com scroll-snap,
 * para deslizar e ver o fundo contínuo. Renderiza com o mesmo motor da
 * exportação (fidelidade total, inclusive o fundo fatiado entre páginas).
 */
export function CarouselPreview({ project, onClose }: { project: Project; onClose: () => void }) {
  const { t } = useTranslation()
  const [urls, setUrls] = useState<string[] | null>(null)
  const [page, setPage] = useState(0)

  useEffect(() => {
    let alive = true
    renderProjectToDataUrls(project).then((u) => {
      if (alive) setUrls(u)
    })
    return () => {
      alive = false
    }
  }, [project])

  // Fecha com Esc.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const total = urls?.length ?? project.pages.length

  return (
    <div
      className="preview-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={t('editor.preview')}
    >
      <div className="preview-overlay__bar">
        <IconButton label={t('common.cancel')} onClick={onClose} dark>
          <Close />
        </IconButton>
        <span className="preview-overlay__title">{t('editor.previewTitle')}</span>
        <span style={{ width: 40 }} />
      </div>

      {urls ? (
        <>
          <div
            className="preview-track"
            onScroll={(e) => {
              const el = e.currentTarget
              const w = el.clientWidth || 1
              setPage(Math.round(el.scrollLeft / w))
            }}
          >
            {urls.map((u, i) => (
              <div className="preview-slide" key={i}>
                <img
                  src={u}
                  alt={t('editor.page', { n: i + 1 })}
                  style={{ aspectRatio: project.aspectRatio.replace(':', ' / ') }}
                />
              </div>
            ))}
          </div>
          {total > 1 && (
            <div className="preview-dots" aria-hidden>
              {urls.map((_, i) => (
                <span
                  key={i}
                  className={'preview-dot' + (i === page ? ' preview-dot--active' : '')}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="preview-loading">{t('editor.previewRendering')}</div>
      )}
    </div>
  )
}
