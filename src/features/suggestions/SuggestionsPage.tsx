import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AppBar, IconButton } from '../../components/ui'
import { ChevronLeft, ImagePlus, Globe, Close, Trash } from '../../components/icons'
import {
  listLibraryPhotos,
  setLibraryPlaces,
  saveProject,
  removeLibraryPhoto,
  clearLibrary,
  pruneOrphanAssets,
  type LibraryPhoto,
} from '../../lib/storage'
import { importToLibrary } from '../../lib/library-import'
import { reverseGeocode } from '../../lib/geocode'
import {
  clusterByDayAndPlace,
  clusterByPlaceAcrossDays,
  chooseTemplateFor,
  type SuggestionGroup,
} from '../../lib/suggestions'
import { loadDismissed, dismiss, restoreAll } from '../../lib/dismissals'
import { createProjectFromTemplate, distributePhotos } from '../../lib/project-factory'
import { useAssetUrls } from '../../hooks/useAssetUrls'

const LOCALES: Record<string, string> = { pt: 'pt-BR', en: 'en-US' }

/**
 * Sugestões automáticas: importa fotos em massa, agrupa por dia + localidade e
 * por lugar entre datas (EXIF, tudo no aparelho) e cria carrosséis prontos.
 */
export function SuggestionsPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [library, setLibrary] = useState<LibraryPhoto[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState<Set<string>>(() => loadDismissed())
  const [managing, setManaging] = useState(false)

  useEffect(() => {
    listLibraryPhotos().then(setLibrary)
  }, [])

  const dayGroups = useMemo(() => clusterByDayAndPlace(library), [library])
  const placeSeries = useMemo(() => clusterByPlaceAcrossDays(library), [library])
  const visibleDays = dayGroups.filter((g) => !dismissed.has(g.key))
  const visibleSeries = placeSeries.filter((g) => !dismissed.has(g.key))
  const dismissedCount =
    dayGroups.length + placeSeries.length - visibleDays.length - visibleSeries.length

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
    const pending = [...visibleDays, ...visibleSeries].filter(
      (g) => g.lat != null && g.lon != null && !g.place,
    )
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
    const multiDay = group.days.length > 1
    const base = createProjectFromTemplate(template, {
      name: t('suggestions.projectName', {
        place: group.place ?? t('suggestions.somewhere'),
        date: multiDay ? t('suggestions.multipleDates') : formatDay(group.takenAt),
      }),
    })
    const { project } = distributePhotos(
      base,
      group.photos.map((p) => p.assetId),
    )
    await saveProject(project)
    navigate(`/editor/${project.id}`)
  }

  async function removePhoto(assetId: string) {
    await removeLibraryPhoto(assetId)
    await pruneOrphanAssets()
    setLibrary(await listLibraryPhotos())
  }

  async function clearAll() {
    if (!window.confirm(t('suggestions.clearConfirm'))) return
    await clearLibrary()
    await pruneOrphanAssets()
    setLibrary([])
    setManaging(false)
  }

  // Formato numérico compacto: cabe no card mesmo com os botões ao lado.
  function formatDay(ts: number): string {
    return new Date(ts).toLocaleDateString(LOCALES[i18n.language] ?? i18n.language, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  function seriesDateLabel(group: SuggestionGroup): string {
    return t('suggestions.dayCount', { count: group.days.length })
  }

  const canName = [...visibleDays, ...visibleSeries].some((g) => g.lat != null && !g.place)

  return (
    <>
      <AppBar
        title={t('suggestions.title')}
        left={
          <IconButton label={t('common.back')} onClick={() => navigate('/')}>
            <ChevronLeft />
          </IconButton>
        }
        right={
          library.length > 0 ? (
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => setManaging((m) => !m)}
            >
              {managing ? t('suggestions.done') : t('suggestions.manage')}
            </button>
          ) : undefined
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

        {managing ? (
          <ManageLibrary library={library} onRemove={removePhoto} onClear={clearAll} />
        ) : library.length === 0 ? (
          <p className="empty">{t('suggestions.empty')}</p>
        ) : (
          <>
            <div className="suggestions__bar">
              <h2 className="section-title">
                {t('suggestions.groups', { count: visibleDays.length })}
              </h2>
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
              {visibleDays.map((group) => (
                <SuggestionCard
                  key={group.key}
                  group={group}
                  dateLabel={formatDay(group.takenAt)}
                  onCreate={() => createFromGroup(group)}
                  onDismiss={() => setDismissed(dismiss(group.key))}
                />
              ))}
            </ul>

            {visibleSeries.length > 0 && (
              <>
                <h2 className="section-title suggestions__series-title">
                  {t('suggestions.seriesTitle')}
                </h2>
                <ul className="suggestion-list">
                  {visibleSeries.map((group) => (
                    <SuggestionCard
                      key={group.key}
                      group={group}
                      dateLabel={seriesDateLabel(group)}
                      onCreate={() => createFromGroup(group)}
                      onDismiss={() => setDismissed(dismiss(group.key))}
                    />
                  ))}
                </ul>
              </>
            )}

            {dismissedCount > 0 && (
              <button
                type="button"
                className="btn btn--ghost btn--block suggestions__restore"
                onClick={() => setDismissed(restoreAll())}
              >
                {t('suggestions.restoreDismissed', { count: dismissedCount })}
              </button>
            )}
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
  onDismiss,
}: {
  group: SuggestionGroup
  dateLabel: string
  onCreate: () => void
  onDismiss: () => void
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
      <IconButton label={t('suggestions.dismiss')} onClick={onDismiss}>
        <Close />
      </IconButton>
    </li>
  )
}

/** Modo gerenciar: grade da biblioteca com remoção por foto e limpar tudo. */
function ManageLibrary({
  library,
  onRemove,
  onClear,
}: {
  library: LibraryPhoto[]
  onRemove: (assetId: string) => void
  onClear: () => void
}) {
  const { t } = useTranslation()
  const urls = useAssetUrls(library.map((p) => p.assetId))

  return (
    <>
      <div className="suggestions__bar">
        <h2 className="section-title">
          {t('suggestions.libraryCount', { count: library.length })}
        </h2>
        {library.length > 0 && (
          <button type="button" className="btn btn--ghost btn--sm btn--danger" onClick={onClear}>
            <Trash /> {t('suggestions.clearAll')}
          </button>
        )}
      </div>
      <div className="library-grid">
        {library.map((photo) => (
          <div
            key={photo.assetId}
            className="library-grid__item"
            style={{
              backgroundImage: urls[photo.assetId] ? `url(${urls[photo.assetId]})` : undefined,
            }}
          >
            <button
              type="button"
              className="library-grid__remove"
              aria-label={t('suggestions.removePhoto')}
              onClick={() => onRemove(photo.assetId)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </>
  )
}
