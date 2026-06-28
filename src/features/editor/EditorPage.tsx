import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { ProjectTitle } from './ProjectTitle'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useEditorStore, editorTemporal } from '../../store/editorStore'
import type { Project } from '../../types/project'
import { loadProject, saveProject } from '../../lib/storage'
import { AppBar, IconButton } from '../../components/ui'
import { ChevronLeft, Eye } from '../../components/icons'
import { Toolbar, Filmstrip, SidePanel } from './Panels'
import { ExportButton } from './ExportButton'
import { CarouselPreview } from './CarouselPreview'

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
  const rename = useEditorStore((s) => s.rename)

  const stageWrapRef = useRef<HTMLDivElement>(null)
  const [stageWidth, setStageWidth] = useState(320)
  const [previewing, setPreviewing] = useState(false)

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
    let pending: Project | null = null
    const flush = () => {
      if (pending) {
        void saveProject(pending)
        pending = null
      }
    }
    const unsub = useEditorStore.subscribe((s, prev) => {
      if (s.project && s.project !== prev.project) {
        pending = s.project
        clearTimeout(timer)
        timer = setTimeout(flush, 400)
      }
    })
    return () => {
      // Descarrega mudanças pendentes ao sair (ex.: renomear e voltar logo em
      // seguida) — antes o debounce era cancelado e a alteração se perdia.
      clearTimeout(timer)
      flush()
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

  // Salva o estado atual antes de sair, para a listagem refletir o último nome/
  // edição mesmo se o usuário voltar logo após mexer (evita corrida com o
  // debounce do autosave).
  async function goHome() {
    const current = useEditorStore.getState().project
    if (current) await saveProject(current)
    navigate('/')
  }

  return (
    <div className="editor">
      <AppBar
        dark
        title={<ProjectTitle name={project.name} onRename={rename} />}
        left={
          <IconButton label={t('editor.backHome')} onClick={goHome}>
            <ChevronLeft />
          </IconButton>
        }
        right={
          <>
            <Toolbar />
            <IconButton label={t('editor.preview')} onClick={() => setPreviewing(true)}>
              <Eye />
            </IconButton>
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
              pageIndex={currentPageIndex}
              pageCount={project.pages.length}
              selectedPhotoId={selectedPhotoId}
              onSelect={selectPhoto}
              onChangePhoto={(photoId, updater) => updateCollagePhoto(page.id, photoId, updater)}
            />
          )}
        </Suspense>
      </div>

      <Filmstrip project={project} />
      <SidePanel project={project} />

      {previewing && <CarouselPreview project={project} onClose={() => setPreviewing(false)} />}
    </div>
  )
}
