import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AppBar, IconButton } from '../../components/ui'
import { ChevronLeft, ImagePlus, Globe } from '../../components/icons'
import {
  listLibraryPhotos,
  setLibraryPlaces,
  saveProject,
  type LibraryPhoto,
} from '../../lib/storage'
import { importToLibrary } from '../../lib/library-import'
import { reverseGeocode } from '../../lib/geocode'
import {
  clusterByDayAndPlace,
  chooseTemplateFor,
  type SuggestionGroup,
} from '../../lib/suggestions'
import { createProjectFromTemplate, distributePhotos } from '../../lib/project-factory'
import { useAssetUrls } from '../../hooks/useAssetUrls'

const LOCALES: Record<string, string> = { pt: 'pt-BR', en: 'en-US' }

/**
 * Sugestões automáticas: importa fotos em massa, agrupa por dia + localidade
 * (EXIF, tudo no aparelho) e cria carrosséis prontos a partir de cada grupo.
 */
export function SuggestionsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [library, setLibrary] = useState<LibraryPhoto[]>([])
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    listLibraryPhotos().then(setLibrary)
  }, [])

  const groups = useMemo(() => clusterByDayAndPlace(library), [library])

  async function onFiles(list: FileList | null) {
    const files = Array.from(list ?? [])
    if (!files.length) return
    setBusy(t('suggestions.importing', { done: 0, total: files.length }))
    try {
      await importToLibrary(files, (done, total) =>
        setBusy(t('suggestions.importing', { done, total })),
      )
      setLibrary(await listLibraryPhotos())
    } finally {
      setBusy(null)
    }
  }

  // Nomeia os grupos com GPS ainda sem nome (envia SÓ coordenadas, a pedido).
  async function nameGroups() {
    const pending = groups.filter((g) => g.lat != null && g.lon != null && !g.place)
    if (!pending.length) return
    setBusy(t('suggestions.naming'))
    try {
      for (const group of pending) {
        const place = await reverseGeocode(group.lat!, group.lon!)
        if (place) {
          await setLibraryPlaces(new Map(group.photos.map((p) => [p.assetId, place])))
        }
      }
      setLibrary(await listLibraryPhotos())
    } finally {
      setBusy(null)
    }
  }

  async function createFromGroup(group: SuggestionGroup) {
    const template = chooseTemplateFor(group.photos.length)
    const base = createProjectFromTemplate(template, {
      name: t('suggestions.projectName', {
        place: group.place ?? t('suggestions.somewhere'),
        date: formatDay(group.takenAt),
      }),
    })
    const { project } = distributePhotos(
      base,
      group.photos.map((p) => p.assetId),
    )
    await saveProject(project)
    navigate(`/editor/${project.id}`)
  }

  const { i18n } = useTranslation()
  function formatDay(ts: number): string {
    return new Date(ts).toLocaleDateString(LOCALES[i18n.language] ?? i18n.language, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const canName = groups.some((g) => g.lat != null && !g.place)

  return (
    <>
      <AppBar
        title={t('suggestions.title')}
        left={
          <IconButton label={t('common.back')} onClick={() => navigate('/')}>
            <ChevronLeft />
          </IconButton>
        }
      />
      <div className="route__scroll">
        <label className="dropzone suggestions__drop">
          <ImagePlus />
          <input
            type="file"
            accept="image/*,.heic,.heif"
            multiple
            hidden
            disabled={!!busy}
            onChange={(e) => onFiles(e.target.files)}
          />
          <span>{busy ?? t('suggestions.dropHint')}</span>
          <small className="muted">{t('suggestions.privacy')}</small>
        </label>

        {groups.length === 0 ? (
          <p className="empty">{t('suggestions.empty')}</p>
        ) : (
          <>
            <div className="suggestions__bar">
              <h2 className="section-title">{t('suggestions.groups', { count: groups.length })}</h2>
              {canName && (
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={nameGroups}
                  disabled={!!busy}
                >
                  <Globe /> {t('suggestions.namePlaces')}
                </button>
              )}
            </div>
            <ul className="suggestion-list">
              {groups.map((group) => (
                <SuggestionCard
                  key={group.key}
                  group={group}
                  dateLabel={formatDay(group.takenAt)}
                  onCreate={() => createFromGroup(group)}
                />
              ))}
            </ul>
          </>
        )}
      </div>
    </>
  )
}

function SuggestionCard({
  group,
  dateLabel,
  onCreate,
}: {
  group: SuggestionGroup
  dateLabel: string
  onCreate: () => void
}) {
  const { t } = useTranslation()
  const preview = group.photos.slice(0, 4)
  const urls = useAssetUrls(preview.map((p) => p.assetId))
  const placeLabel =
    group.place ??
    (group.lat != null
      ? `${group.lat.toFixed(3)}, ${group.lon!.toFixed(3)}`
      : t('suggestions.noPlace'))

  return (
    <li className="suggestion-card">
      <div className="suggestion-card__thumbs">
        {preview.map((p) => (
          <span
            key={p.assetId}
            className="suggestion-card__thumb"
            style={{
              backgroundImage: urls[p.assetId] ? `url(${urls[p.assetId]})` : undefined,
            }}
          />
        ))}
      </div>
      <div className="suggestion-card__body">
        <div className="suggestion-card__title">{dateLabel}</div>
        <div className="suggestion-card__meta muted">
          {placeLabel} · {t('home.photoCount', { count: group.photos.length })}
        </div>
      </div>
      <button type="button" className="btn btn--sm" onClick={onCreate}>
        {t('suggestions.create')}
      </button>
    </li>
  )
}
