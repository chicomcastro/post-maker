import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import type { Project } from '../../types/project'
import { Share, ImagePlus, Copy, Close } from '../../components/icons'
import { useProjectExport } from './useProjectExport'

/**
 * Ação principal do editor: "Exportar". Abre um seletor perguntando se é para
 * gerar as imagens (postar) ou exportar o arquivo do projeto (backup).
 */
export function ExportButton({ project }: { project: Project }) {
  const { t } = useTranslation()
  const { busy, exportImages, exportProject } = useProjectExport(project)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  async function choose(action: () => Promise<void>) {
    setOpen(false)
    await action()
  }

  return (
    <>
      <button
        type="button"
        className="btn btn--sm export-cta"
        onClick={() => setOpen(true)}
        disabled={!!busy}
      >
        <Share /> {busy ?? t('editor.export')}
      </button>

      {open &&
        createPortal(
          <div
            className="action-sheet"
            role="dialog"
            aria-modal="true"
            aria-label={t('editor.exportChoose')}
            onClick={() => setOpen(false)}
          >
            <div className="action-sheet__panel" onClick={(e) => e.stopPropagation()}>
              <div className="action-sheet__head">
                <h3>{t('editor.exportChoose')}</h3>
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={t('common.cancel')}
                  onClick={() => setOpen(false)}
                >
                  <Close />
                </button>
              </div>

              <button
                type="button"
                className="action-sheet__option"
                onClick={() => choose(exportImages)}
              >
                <ImagePlus />
                <span>
                  <strong>{t('editor.exportAsImages')}</strong>
                  <small>{t('editor.exportAsImagesHint')}</small>
                </span>
              </button>

              <button
                type="button"
                className="action-sheet__option"
                onClick={() => choose(exportProject)}
              >
                <Copy />
                <span>
                  <strong>{t('editor.exportAsProject')}</strong>
                  <small>{t('editor.exportAsProjectHint')}</small>
                </span>
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
