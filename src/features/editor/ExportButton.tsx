import { useTranslation } from 'react-i18next'
import type { Project } from '../../types/project'
import { IconButton } from '../../components/ui'
import { Share } from '../../components/icons'
import { useProjectExport } from './useProjectExport'

export function ExportButton({ project }: { project: Project }) {
  const { t } = useTranslation()
  const { busy, run } = useProjectExport(project)

  return (
    <IconButton label={t('editor.export')} onClick={run} disabled={!!busy}>
      <Share />
    </IconButton>
  )
}
