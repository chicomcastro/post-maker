import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useEditorStore, editorTemporal } from '../../store/editorStore'
import { loadProject, saveProject } from '../../lib/storage'
import { Toolbar, Filmstrip, SidePanel } from './Panels'

const EditorStage = lazy(() => import('./canvas/EditorStage'))

export function EditorPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing'>('loading')

  const project = useEditorStore((s) => s.project)
  const currentPageIndex = useEditorStore((s) => s.currentPageIndex)
  const selectedPhotoId = useEditorStore((s) => s.selectedPhotoId)
  const setProject = useEditorStore((s) => s.setProject)
  const selectPhoto = useEditorStore((s) => s.selectPhoto)
  const updateCollagePhoto = useEditorStore((s) => s.updateCollagePhoto)

  const stageWrapRef = useRef<HTMLDivElement>(null)
  const [stageWidth, setStageWidth] = useState(360)

  // Carrega o projeto no store.
  useEffect(() => {
    let active = true
    if (!id) return
    editorTemporal.getState().clear()
    loadProject(id).then((p) => {
      if (!active) return
      if (p) {
        setProject(p)
        setStatus('ready')
      } else {
        setStatus('missing')
      }
    })
    return () => {
      active = false
    }
  }, [id, setProject])

  // Auto-save (debounced) a cada mudança no projeto.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const unsub = useEditorStore.subscribe((s, prev) => {
      if (s.project && s.project !== prev.project) {
        clearTimeout(timer)
        const snapshot = s.project
        timer = setTimeout(() => void saveProject(snapshot), 400)
      }
    })
    return () => {
      clearTimeout(timer)
      unsub()
    }
  }, [])

  // Mede a largura disponível para o palco.
  useEffect(() => {
    const el = stageWrapRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => setStageWidth(Math.min(el.clientWidth, 480)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [status])

  if (status === 'loading') return <main className="container" />
  if (status === 'missing' || !project) {
    return (
      <main className="container">
        <p>{t('home.noProjects')}</p>
        <Link to="/">{t('editor.backHome')}</Link>
      </main>
    )
  }

  const page = project.pages[currentPageIndex]

  return (
    <main className="container editor">
      <header className="create__topbar">
        <Link className="btn btn--ghost" to="/">
          ← {t('editor.backHome')}
        </Link>
        <strong>{project.name}</strong>
        <Toolbar />
      </header>

      <div className="editor__stageWrap" ref={stageWrapRef}>
        <Suspense fallback={<div className="editor__loading" />}>
          {page && (
            <EditorStage
              page={page}
              aspectRatio={project.aspectRatio}
              width={stageWidth}
              selectedPhotoId={selectedPhotoId}
              onSelect={selectPhoto}
              onChangePhoto={(photoId, updater) => updateCollagePhoto(page.id, photoId, updater)}
            />
          )}
        </Suspense>
      </div>

      <SidePanel project={project} />
      <Filmstrip project={project} />
    </main>
  )
}
