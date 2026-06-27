import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useEditorStore, editorTemporal } from '../../store/editorStore'
import { loadProject, saveProject } from '../../lib/storage'
import { AppBar, IconButton } from '../../components/ui'
import { ChevronLeft } from '../../components/icons'
import { Toolbar, Filmstrip, SidePanel } from './Panels'
import { ExportButton } from './ExportButton'

const EditorStage = lazy(() => import('./canvas/EditorStage'))

export function EditorPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing'>('loading')

  const project = useEditorStore((s) => s.project)
  const currentPageIndex = useEditorStore((s) => s.currentPageIndex)
  const selectedPhotoId = useEditorStore((s) => s.selectedPhotoId)
  const setProject = useEditorStore((s) => s.setProject)
  const selectPhoto = useEditorStore((s) => s.selectPhoto)
  const updateCollagePhoto = useEditorStore((s) => s.updateCollagePhoto)

  const stageWrapRef = useRef<HTMLDivElement>(null)
  const [stageWidth, setStageWidth] = useState(320)

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

  const aspect = project?.aspectRatio
  useEffect(() => {
    const el = stageWrapRef.current
    if (!el || !aspect || typeof ResizeObserver === 'undefined') return
    const [aw, ah] = aspect.split(':').map(Number)
    const ratio = ah / aw
    const measure = () => {
      const availW = el.clientWidth - 28
      const availH = el.clientHeight - 28
      setStageWidth(Math.max(120, Math.min(availW, availH / ratio)))
    }
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    measure()
    return () => ro.disconnect()
  }, [status, aspect])

  if (status === 'loading') return <div className="editor" />
  if (status === 'missing' || !project) {
    return (
      <>
        <AppBar
          dark
          left={
            <IconButton label={t('editor.backHome')} onClick={() => navigate('/')}>
              <ChevronLeft />
            </IconButton>
          }
        />
        <div className="route__scroll">
          <p className="empty">{t('home.noProjects')}</p>
        </div>
      </>
    )
  }

  const page = project.pages[currentPageIndex]

  return (
    <div className="editor">
      <AppBar
        dark
        title={project.name}
        left={
          <IconButton label={t('editor.backHome')} onClick={() => navigate('/')}>
            <ChevronLeft />
          </IconButton>
        }
        right={
          <>
            <Toolbar />
            <ExportButton project={project} />
          </>
        }
      />

      <div className="editor__stage" ref={stageWrapRef}>
        <Suspense fallback={<div className="editor__loading" />}>
          {page && (
            <EditorStage
              page={page}
              background={project.background}
              bgColor={project.bgColor}
              aspectRatio={project.aspectRatio}
              width={stageWidth}
              selectedPhotoId={selectedPhotoId}
              onSelect={selectPhoto}
              onChangePhoto={(photoId, updater) => updateCollagePhoto(page.id, photoId, updater)}
            />
          )}
        </Suspense>
      </div>

      <Filmstrip project={project} />
      <SidePanel project={project} />
    </div>
  )
}
