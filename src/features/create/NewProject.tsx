import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ASPECT_RATIOS, type AspectRatio } from '../../types/project'
import { TEMPLATES, type Template, type TemplateKind } from '../../templates/catalog'
import { TemplatePreview } from '../../components/TemplatePreview'
import { AppBar, IconButton } from '../../components/ui'
import { ChevronLeft, ImagePlus } from '../../components/icons'
import { isImageFile } from '../../lib/images'
import { importFiles } from '../../lib/asset-import'
import { createProjectFromTemplate, distributePhotos } from '../../lib/project-factory'
import { saveProject } from '../../lib/storage'

type Step = 'aspect' | 'template' | 'photos'
type Filter = 'all' | TemplateKind
const STEPS: Step[] = ['aspect', 'template', 'photos']

export function NewProject() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>('aspect')
  const [aspect, setAspect] = useState<AspectRatio | null>(null)
  const [template, setTemplate] = useState<Template | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const filteredTemplates = useMemo(
    () => TEMPLATES.filter((tpl) => filter === 'all' || tpl.kind === filter),
    [filter],
  )

  function goBack() {
    setError(null)
    if (step === 'template') setStep('aspect')
    else if (step === 'photos') setStep('template')
    else navigate('/')
  }

  async function handleFinish() {
    if (!template || !aspect) return
    if (files.length === 0) {
      setError(t('create.needPhoto'))
      return
    }
    setError(null)
    try {
      const hasHeic = files.some((f) => /hei[cf]/i.test(f.type) || /\.(heic|heif)$/i.test(f.name))
      setBusy(hasHeic ? t('create.convertingHeic') : t('create.creating'))
      const assets = await importFiles(files)
      const base = createProjectFromTemplate(template, { aspectRatio: aspect })
      const { project } = distributePhotos(
        base,
        assets.map((a) => a.id),
      )
      await saveProject(project)
      navigate(`/editor/${project.id}`)
    } catch (err) {
      console.error('Falha ao montar o projeto:', err)
      setBusy(null)
      setError(t('create.genericError'))
    }
  }

  const stepIndex = STEPS.indexOf(step)

  return (
    <>
      <AppBar
        left={
          <IconButton label={t('common.back')} onClick={goBack}>
            <ChevronLeft />
          </IconButton>
        }
      />
      <div className="route__scroll">
        <div className="progress" aria-hidden>
          {STEPS.map((s, i) => (
            <span
              key={s}
              className={'progress__seg' + (i <= stepIndex ? ' progress__seg--done' : '')}
            />
          ))}
        </div>

        {step === 'aspect' && (
          <section className="create__step">
            <h1>{t('create.stepAspect')}</h1>
            <div className="aspect-grid">
              {ASPECT_RATIOS.map((ar) => (
                <button
                  key={ar}
                  type="button"
                  className="aspect-card"
                  onClick={() => {
                    setAspect(ar)
                    setStep('template')
                  }}
                >
                  <span
                    className="aspect-card__box"
                    style={{ aspectRatio: ar.replace(':', ' / ') }}
                  />
                  <span>{t(`create.aspect.${ar}`)}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {step === 'template' && (
          <section className="create__step">
            <h1>{t('create.stepTemplate')}</h1>
            <div className="segmented">
              {(['all', 'post', 'carousel'] as Filter[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  className={'segmented__item' + (filter === f ? ' segmented__item--active' : '')}
                  onClick={() => setFilter(f)}
                >
                  {t(
                    f === 'all'
                      ? 'create.filterAll'
                      : f === 'post'
                        ? 'create.filterPosts'
                        : 'create.filterCarousels',
                  )}
                </button>
              ))}
            </div>
            <div className="template-grid">
              {filteredTemplates.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  className="template-card"
                  aria-label={tpl.id}
                  onClick={() => {
                    setTemplate(tpl)
                    setStep('photos')
                  }}
                >
                  <TemplatePreview template={tpl} aspectRatio={aspect ?? undefined} />
                </button>
              ))}
            </div>
          </section>
        )}

        {step === 'photos' && (
          <section className="create__step">
            <h1>{t('create.stepPhotos')}</h1>
            <PhotoPicker files={files} onChange={setFiles} />
            {error && <p className="error">{error}</p>}
          </section>
        )}
      </div>

      {step === 'photos' && (
        <div className="bottom-cta">
          <button className="btn btn--block" type="button" onClick={handleFinish} disabled={!!busy}>
            {busy ?? t('create.finish')}
          </button>
        </div>
      )}
    </>
  )
}

function PhotoPicker({ files, onChange }: { files: File[]; onChange: (files: File[]) => void }) {
  const { t } = useTranslation()
  const [urls, setUrls] = useState<string[]>([])
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => {
    const created = files.map((f) => URL.createObjectURL(f))
    setUrls(created)
    return () => created.forEach((u) => URL.revokeObjectURL(u))
  }, [files])

  function addFiles(list: FileList | null) {
    if (!list) return
    const incoming = Array.from(list).filter(isImageFile)
    onChange([...files, ...incoming])
  }

  return (
    <div>
      <label
        className={'dropzone' + (dragOver ? ' dropzone--over' : '')}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          addFiles(e.dataTransfer.files)
        }}
      >
        <ImagePlus />
        <input
          type="file"
          accept="image/*,.heic,.heif"
          multiple
          hidden
          onChange={(e) => addFiles(e.target.files)}
        />
        <span>{t('create.dropHint')}</span>
      </label>

      {files.length > 0 && (
        <>
          <p className="muted" style={{ margin: '12px 2px 0' }}>
            {t('create.selectedCount', { count: files.length })}
          </p>
          <div className="photo-grid">
            {urls.map((url, i) => (
              <div key={i} className="photo-thumb" style={{ backgroundImage: `url(${url})` }}>
                <button
                  type="button"
                  className="photo-thumb__remove"
                  aria-label={t('common.cancel')}
                  onClick={() => onChange(files.filter((_, idx) => idx !== i))}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
