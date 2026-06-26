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

export function ExportButton({ project }: { project: Project }) {
  const { t } = useTranslation()
  const [busy, setBusy] = useState<string | null>(null)

  async function handleExport() {
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

  return (
    <button className="btn" type="button" onClick={handleExport} disabled={!!busy}>
      {busy ?? t('editor.export')}
    </button>
  )
}
