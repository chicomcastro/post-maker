import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Project } from '../../types/project'
import { renderProjectToPngs } from '../../lib/export-render'
import {
  pngsToZip,
  shareOrDownload,
  blobToFile,
  slideFileName,
  zipFileName,
} from '../../lib/export'

/**
 * Lógica de exportação/compartilhamento das imagens finais (PNG por página;
 * .zip quando há mais de uma). Compartilhada pelo botão da barra e pelo CTA do
 * preview. `busy` é o rótulo de progresso (null = ocioso).
 */
export function useProjectExport(project: Project) {
  const { t } = useTranslation()
  const [busy, setBusy] = useState<string | null>(null)

  async function run() {
    if (busy) return
    setBusy(t('editor.exporting'))
    try {
      const blobs = await renderProjectToPngs(project, (done, total) =>
        setBusy(t('editor.exportProgress', { done, total })),
      )
      if (blobs.length === 1) {
        await shareOrDownload([blobToFile(blobs[0], slideFileName(0, 1, project.name))])
      } else {
        setBusy(t('editor.zipping'))
        const zip = await pngsToZip(blobs, project.name)
        await shareOrDownload([blobToFile(zip, zipFileName(project.name))])
      }
    } catch {
      window.alert(t('editor.exportError'))
    } finally {
      setBusy(null)
    }
  }

  return { busy, run }
}
