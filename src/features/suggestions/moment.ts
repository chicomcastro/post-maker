import type { TFunction } from 'i18next'
import type { SuggestionGroup } from '../../lib/suggestions'
import { chooseTemplateFor } from '../../lib/suggestions'
import { createProjectFromTemplate, distributePhotos } from '../../lib/project-factory'
import { saveProject } from '../../lib/storage'

const LOCALES: Record<string, string> = { pt: 'pt-BR', en: 'en-US' }

/** Data curta (dd/mm/aa) de um timestamp, no idioma atual. */
export function formatMomentDay(ts: number, language: string): string {
  return new Date(ts).toLocaleDateString(LOCALES[language] ?? language, {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

/** Rótulo de data do card: "N dias" para séries, data curta para momentos. */
export function momentDateLabel(group: SuggestionGroup, t: TFunction, language: string): string {
  if (group.days.length > 1) return t('suggestions.dayCount', { count: group.days.length })
  return formatMomentDay(group.takenAt, language)
}

/** Nome do projeto criado a partir de um momento ("Lugar — data / várias datas"). */
export function momentProjectName(group: SuggestionGroup, t: TFunction, language: string): string {
  return t('suggestions.projectName', {
    place: group.place ?? t('suggestions.somewhere'),
    date:
      group.days.length > 1
        ? t('suggestions.multipleDates')
        : formatMomentDay(group.takenAt, language),
  })
}

/**
 * Cria (e persiste) um projeto a partir de um momento: template escolhido pela
 * quantidade de fotos, nome contextual, fotos distribuídas. Retorna o id.
 * Compartilhado pela home e pela tela de sugestões.
 */
export async function createProjectFromGroup(
  group: SuggestionGroup,
  t: TFunction,
  language: string,
): Promise<string> {
  const template = chooseTemplateFor(group.photos.length)
  const base = createProjectFromTemplate(template, { name: momentProjectName(group, t, language) })
  const { project } = distributePhotos(
    base,
    group.photos.map((p) => p.assetId),
  )
  await saveProject(project)
  return project.id
}
