import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { AppBar, IconButton } from '../components/ui'
import { ImagePlus, Sparkle, Trash, Close, Globe } from '../components/icons'
import {
  listProjects,
  deleteProject,
  saveProject,
  listLibraryPhotos,
  setLibraryPlaces,
  removeLibraryPhoto,
  pruneOrphanAssets,
  type LibraryPhoto,
} from '../lib/storage'
import type { Project } from '../types/project'
import {
  clusterByDayAndPlace,
  clusterByPlaceAcrossDays,
  groupByDay,
  groupByPlace,
  type SuggestionGroup,
} from '../lib/suggestions'
import { importToLibrary } from '../lib/library-import'
import { reverseGeocode } from '../lib/geocode'
import { loadDismissed, dismiss, restoreAll } from '../lib/dismissals'
import { useAssetUrls } from '../hooks/useAssetUrls'
import { MomentCard } from '../features/suggestions/MomentCard'
import {
  formatMomentDay,
  momentDateLabel,
  createProjectFromGroup,
} from '../features/suggestions/moment'
import { ProjectCard } from './ProjectCard'

type Tab = 'library' | 'projects'
type GroupMode = 'day' | 'place'

/** Quantas sugestões prontas destacar no topo (o resto continua na grade). */
const READY_POSTS = 4

/**
 * Tela inicial focada na biblioteca: importa fotos, sugere posts prontos e deixa
 * navegar/selecionar fotos agrupadas por dia ou lugar para criar um projeto.
 * Abas Biblioteca | Projetos.
 */
export function LibraryHome() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('library')
  const [library, setLibrary] = useState<LibraryPhoto[]>([])
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    listLibraryPhotos().then(setLibrary)
    listProjects().then(setProjects)
    // Pré-carrega o chunk do editor (Konva) enquanto ocioso.
    const prefetch = () => void import('../features/editor/canvas/EditorStage')
    const ric = (window as unknown as { requestIdleCallback?: (cb: () => void) => number })
      .requestIdleCallback
    if (ric) ric(prefetch)
    else setTimeout(prefetch, 400)
  }, [])

  async function removeProject(id: string) {
    await deleteProject(id)
    setProjects((prev) => prev.filter((p) => p.id !== id))
  }

  async function renameProject(project: Project, name: string) {
    const updated = { ...project, name, updatedAt: Date.now() }
    await saveProject(updated)
    setProjects((prev) => prev.map((p) => (p.id === project.id ? updated : p)))
  }

  return (
    <>
      <AppBar title={t('app.name')} right={<LanguageSwitcher />} />
      <div className="route__scroll">
        <div className="segmented segmented--block library-tabs">
          {(['library', 'projects'] as Tab[]).map((tb) => (
            <button
              key={tb}
              type="button"
              className={'segmented__item' + (tab === tb ? ' segmented__item--active' : '')}
              onClick={() => setTab(tb)}
            >
              {t(tb === 'library' ? 'library.tabLibrary' : 'library.tabProjects')}
              {tb === 'projects' && projects.length > 0 ? ` (${projects.length})` : ''}
            </button>
          ))}
        </div>

        {tab === 'library' ? (
          <LibraryTab
            library={library}
            setLibrary={setLibrary}
            onCreateFromMoment={async (group) => {
              const id = await createProjectFromGroup(group, t, i18n.language)
              navigate(`/editor/${id}`)
            }}
            onCreateFromSelection={(assetIds) => navigate('/new', { state: { assetIds } })}
          />
        ) : projects.length === 0 ? (
          <p className="empty">{t('library.noProjects')}</p>
        ) : (
          <ul className="project-list">
            {projects.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                onOpen={() => navigate(`/editor/${p.id}`)}
                onDelete={() => removeProject(p.id)}
                onRename={(name) => renameProject(p, name)}
              />
            ))}
          </ul>
        )}
      </div>
    </>
  )
}

function LibraryTab({
  library,
  setLibrary,
  onCreateFromMoment,
  onCreateFromSelection,
}: {
  library: LibraryPhoto[]
  setLibrary: (photos: LibraryPhoto[]) => void
  onCreateFromMoment: (group: SuggestionGroup) => void
  onCreateFromSelection: (assetIds: string[]) => void
}) {
  const { t, i18n } = useTranslation()
  const [busy, setBusy] = useState<string | null>(null)
  const [mode, setMode] = useState<GroupMode>('day')
  const [dismissed, setDismissed] = useState<Set<string>>(() => loadDismissed())
  const [selecting, setSelecting] = useState(false)
  const [selected, setSelected] = useState<string[]>([])

  const urls = useAssetUrls(library.map((p) => p.assetId))

  // Sugestões prontas: dia+lugar e séries por lugar, sem as dispensadas.
  const ready = useMemo(() => {
    const groups = [...clusterByDayAndPlace(library), ...clusterByPlaceAcrossDays(library)]
      .filter((g) => !dismissed.has(g.key))
      .sort((a, b) => b.takenAt - a.takenAt)
    return groups.slice(0, READY_POSTS)
  }, [library, dismissed])
  const dismissedCount = useMemo(() => {
    const all = [...clusterByDayAndPlace(library), ...clusterByPlaceAcrossDays(library)]
    return all.filter((g) => dismissed.has(g.key)).length
  }, [library, dismissed])
  const canName = ready.some((g) => g.lat != null && !g.place)

  const grouped = useMemo(
    () => (mode === 'day' ? groupByDay(library) : groupByPlace(library)),
    [library, mode],
  )

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

  // Nomeia grupos com GPS ainda sem nome (envia SÓ coordenadas, a pedido).
  async function nameGroups() {
    const pending = ready.filter((g) => g.lat != null && g.lon != null && !g.place)
    if (!pending.length) return
    setBusy(t('suggestions.naming'))
    try {
      for (const group of pending) {
        const place = await reverseGeocode(group.lat!, group.lon!)
        if (place) await setLibraryPlaces(new Map(group.photos.map((p) => [p.assetId, place])))
      }
      setLibrary(await listLibraryPhotos())
    } finally {
      setBusy(null)
    }
  }

  async function removeSelected() {
    for (const id of selected) await removeLibraryPhoto(id)
    await pruneOrphanAssets()
    setSelected([])
    setSelecting(false)
    setLibrary(await listLibraryPhotos())
  }

  function exitSelection() {
    setSelected([])
    setSelecting(false)
  }

  return (
    <>
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
        <span>{busy ?? t('library.import')}</span>
        <small className="muted">{t('suggestions.privacy')}</small>
      </label>

      {library.length === 0 ? (
        <p className="empty">{t('library.empty')}</p>
      ) : (
        <>
          {(ready.length > 0 || dismissedCount > 0) && (
            <>
              <div className="suggestions__bar">
                <h2 className="section-title">
                  <Sparkle /> {t('library.readyPosts')}
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
              {ready.length > 0 && (
                <ul className="suggestion-list">
                  {ready.map((group) => (
                    <MomentCard
                      key={group.key}
                      group={group}
                      dateLabel={momentDateLabel(group, t, i18n.language)}
                      onCreate={() => onCreateFromMoment(group)}
                      onDismiss={() => setDismissed(dismiss(group.key))}
                    />
                  ))}
                </ul>
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

          <div className="suggestions__bar library-toolbar">
            <div className="segmented">
              {(['day', 'place'] as GroupMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  className={'segmented__item' + (mode === m ? ' segmented__item--active' : '')}
                  onClick={() => setMode(m)}
                >
                  {t(m === 'day' ? 'library.byDay' : 'library.byPlace')}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => (selecting ? exitSelection() : setSelecting(true))}
            >
              {selecting ? t('common.cancel') : t('library.select')}
            </button>
          </div>
          {!selecting && <p className="muted library-hint">{t('library.selectHint')}</p>}

          {grouped.map((group) => (
            <section key={group.key} className="library-section">
              <h3 className="library-section__title">
                <span>{groupTitle(group, mode, t, i18n.language)}</span>
                <span className="muted">
                  {t('home.photoCount', { count: group.photos.length })}
                </span>
              </h3>
              <div className="library-grid">
                {group.photos.map((photo) => (
                  <PhotoCell
                    key={photo.assetId}
                    url={urls[photo.assetId]}
                    selectable={selecting}
                    selected={selected.includes(photo.assetId)}
                    onLongPress={() => {
                      setSelecting(true)
                      setSelected((prev) =>
                        prev.includes(photo.assetId) ? prev : [...prev, photo.assetId],
                      )
                    }}
                    onToggle={() =>
                      setSelected((prev) =>
                        prev.includes(photo.assetId)
                          ? prev.filter((id) => id !== photo.assetId)
                          : [...prev, photo.assetId],
                      )
                    }
                  />
                ))}
              </div>
            </section>
          ))}
          {/* Espaço para a última linha não ficar sob a barra flutuante. */}
          {selected.length > 0 && <div className="selection-bar-spacer" aria-hidden />}
        </>
      )}

      {selected.length > 0 &&
        createPortal(
          <div className="selection-bar">
            <IconButton label={t('library.clearSelection')} onClick={exitSelection}>
              <Close />
            </IconButton>
            <button
              type="button"
              className="btn btn--ghost btn--sm btn--danger"
              onClick={removeSelected}
            >
              <Trash /> {t('library.removeSelected', { count: selected.length })}
            </button>
            <button
              type="button"
              className="btn btn--sm selection-bar__create"
              onClick={() => onCreateFromSelection(selected)}
            >
              {t('library.createSelected', { count: selected.length })}
            </button>
          </div>,
          document.body,
        )}
    </>
  )
}

/** Célula de foto na grade: toque-e-segure entra em seleção; toque alterna. */
function PhotoCell({
  url,
  selectable,
  selected,
  onLongPress,
  onToggle,
}: {
  url?: string
  selectable: boolean
  selected: boolean
  onLongPress: () => void
  onToggle: () => void
}) {
  const { t } = useTranslation()
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const longFired = useRef(false)

  function start() {
    longFired.current = false
    timer.current = setTimeout(() => {
      longFired.current = true
      onLongPress()
    }, 450)
  }
  function cancel() {
    if (timer.current) clearTimeout(timer.current)
  }
  function click() {
    if (longFired.current) {
      longFired.current = false
      return
    }
    if (selectable) onToggle()
  }

  return (
    <button
      type="button"
      className={
        'library-grid__item library-grid__item--btn' +
        (selected ? ' library-grid__item--selected' : '')
      }
      aria-pressed={selectable ? selected : undefined}
      style={{ backgroundImage: url ? `url(${url})` : undefined }}
      onPointerDown={start}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onClick={click}
    >
      {selectable && (
        <span className={'library-grid__check' + (selected ? ' library-grid__check--on' : '')}>
          {selected ? '✓' : ''}
        </span>
      )}
      {selected && <span className="sr-only">{t('library.clearSelection')}</span>}
    </button>
  )
}

/** Título de uma seção da grade, conforme o modo de agrupamento. */
function groupTitle(
  group: SuggestionGroup,
  mode: GroupMode,
  t: ReturnType<typeof useTranslation>['t'],
  language: string,
): string {
  if (mode === 'place') {
    if (group.place) return group.place
    if (group.lat != null) return `${group.lat.toFixed(3)}, ${group.lon!.toFixed(3)}`
    return t('suggestions.noPlace')
  }
  const date = formatMomentDay(group.takenAt, language)
  return group.place ? `${date} · ${group.place}` : date
}
