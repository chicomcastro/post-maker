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
  projectFileName,
} from '../../lib/export'
import { collectAssetIds, exportProjectZip } from '../../lib/project-io'
import { getAsset } from '../../lib/storage'

/**
 * Exportação do projeto, em dois modos:
 *  - `exportImages`: gera os PNGs finais (um por página; .zip se houver vários)
 *    para postar na rede — usa Web Share no mobile e download no desktop.
 *  - `exportProject`: empacota o projeto + fotos num .zip (backup/transferência,
 *    reimportável depois).
 * `busy` é o rótulo de progresso (null = ocioso).
 */
export function useProjectExport(project: Project) {
  const { t } = useTranslation()
  const [busy, setBusy] = useState<string | null>(null)

  async function exportImages() {
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

  async function exportProject() {
    if (busy) return
    setBusy(t('editor.exportingProject'))
    try {
      const ids = collectAssetIds(project)
      const assets = new Map<string, Blob>()
      await Promise.all(
        ids.map(async (id) => {
          const blob = await getAsset(id)
          if (blob) assets.set(id, blob)
        }),
      )
      const zip = await exportProjectZip(project, assets)
      await shareOrDownload([blobToFile(zip, projectFileName(project.name))])
    } catch {
      window.alert(t('editor.exportError'))
    } finally {
      setBusy(null)
    }
  }

  return { busy, exportImages, exportProject }
}
