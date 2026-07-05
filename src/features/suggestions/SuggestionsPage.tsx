import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AppBar, IconButton } from '../../components/ui'
import { ChevronLeft, ImagePlus, Globe, Trash } from '../../components/icons'
import {
  listLibraryPhotos,
  setLibraryPlaces,
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
  type SuggestionGroup,
} from '../../lib/suggestions'
import { loadDismissed, dismiss, restoreAll } from '../../lib/dismissals'
import { useAssetUrls } from '../../hooks/useAssetUrls'
import { MomentCard } from './MomentCard'
import { createProjectFromGroup, momentDateLabel } from './moment'

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
    const id = await createProjectFromGroup(group, t, i18n.language)
    navigate(`/editor/${id}`)
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
                <MomentCard
                  key={group.key}
                  group={group}
                  dateLabel={momentDateLabel(group, t, i18n.language)}
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
                    <MomentCard
                      key={group.key}
                      group={group}
                      dateLabel={momentDateLabel(group, t, i18n.language)}
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
