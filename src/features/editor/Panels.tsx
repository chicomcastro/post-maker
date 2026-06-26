import { useStore } from 'zustand'
import { useTranslation } from 'react-i18next'
import { useEditorStore, editorTemporal } from '../../store/editorStore'
import { PagePreview } from '../../components/PagePreview'
import { useAssetUrls } from '../../hooks/useAssetUrls'
import { collectAssetIds } from '../../lib/project-io'
import type { Adjustments, CollagePhoto, Page, Project } from '../../types/project'

const FILTERS: Record<string, Partial<Adjustments>> = {
  original: { brightness: 1, contrast: 1, saturation: 1 },
  bw: { saturation: 0 },
  warm: { saturation: 1.2, brightness: 1.05 },
  cool: { saturation: 0.9, brightness: 0.98 },
  vivid: { saturation: 1.4, contrast: 1.1 },
}

export function Toolbar() {
  const { t } = useTranslation()
  const canUndo = useStore(editorTemporal, (s) => s.pastStates.length > 0)
  const canRedo = useStore(editorTemporal, (s) => s.futureStates.length > 0)
  return (
    <div className="toolbar">
      <button
        type="button"
        className="btn btn--ghost"
        disabled={!canUndo}
        onClick={() => editorTemporal.getState().undo()}
        aria-label={t('editor.undo')}
      >
        ↶
      </button>
      <button
        type="button"
        className="btn btn--ghost"
        disabled={!canRedo}
        onClick={() => editorTemporal.getState().redo()}
        aria-label={t('editor.redo')}
      >
        ↷
      </button>
    </div>
  )
}

export function Filmstrip({ project }: { project: Project }) {
  const { t } = useTranslation()
  const current = useEditorStore((s) => s.currentPageIndex)
  const setCurrentPage = useEditorStore((s) => s.setCurrentPage)
  const addPage = useEditorStore((s) => s.addPage)
  const duplicatePage = useEditorStore((s) => s.duplicatePage)
  const removePage = useEditorStore((s) => s.removePage)
  const urls = useAssetUrls(collectAssetIds(project))
  const canAdd = project.pages.length < 4

  return (
    <div className="filmstrip">
      {project.pages.map((page, i) => (
        <button
          key={page.id}
          type="button"
          className={'filmstrip__page' + (i === current ? ' filmstrip__page--active' : '')}
          onClick={() => setCurrentPage(i)}
          aria-label={t('editor.page', { n: i + 1 })}
        >
          <PagePreview page={page} aspectRatio={project.aspectRatio} urls={urls} />
        </button>
      ))}
      <div className="filmstrip__actions">
        <button
          type="button"
          className="btn btn--ghost"
          disabled={!canAdd}
          onClick={() => addPage()}
        >
          + {t('editor.addPage')}
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          disabled={!canAdd}
          onClick={() => duplicatePage(project.pages[current].id)}
        >
          {t('editor.duplicatePage')}
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          disabled={project.pages.length <= 1}
          onClick={() => removePage(project.pages[current].id)}
        >
          {t('editor.removePage')}
        </button>
      </div>
    </div>
  )
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
}) {
  return (
    <label className="slider">
      <span>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  )
}

function AdjustControls({
  adjustments,
  onChange,
}: {
  adjustments: Adjustments
  onChange: (a: Adjustments) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="panel__group">
      <Slider
        label={t('editor.brightness')}
        value={adjustments.brightness}
        min={0.5}
        max={1.5}
        step={0.02}
        onChange={(v) => onChange({ ...adjustments, brightness: v })}
      />
      <Slider
        label={t('editor.contrast')}
        value={adjustments.contrast}
        min={0.5}
        max={1.5}
        step={0.02}
        onChange={(v) => onChange({ ...adjustments, contrast: v })}
      />
      <Slider
        label={t('editor.saturation')}
        value={adjustments.saturation}
        min={0}
        max={2}
        step={0.02}
        onChange={(v) => onChange({ ...adjustments, saturation: v })}
      />
      <div className="filter-row">
        {Object.keys(FILTERS).map((key) => (
          <button
            key={key}
            type="button"
            className="chip"
            onClick={() => onChange({ ...adjustments, ...FILTERS[key] })}
          >
            {t(`editor.filter.${key}`)}
          </button>
        ))}
      </div>
    </div>
  )
}

/** Painel contextual: edita a foto selecionada ou a página/fundo. */
export function SidePanel({ project }: { project: Project }) {
  const { t } = useTranslation()
  const page = project.pages[useEditorStore((s) => s.currentPageIndex)] as Page | undefined
  const selectedPhotoId = useEditorStore((s) => s.selectedPhotoId)
  const updateCollagePhoto = useEditorStore((s) => s.updateCollagePhoto)
  const updateBackground = useEditorStore((s) => s.updateBackground)
  const setPageBgColor = useEditorStore((s) => s.setPageBgColor)
  const bringToFront = useEditorStore((s) => s.bringPhotoToFront)
  const sendToBack = useEditorStore((s) => s.sendPhotoToBack)
  if (!page) return null

  const photo = page.collage.find((p) => p.id === selectedPhotoId)

  if (photo) {
    const update = (updater: (p: CollagePhoto) => CollagePhoto) =>
      updateCollagePhoto(page.id, photo.id, updater)
    return (
      <aside className="panel">
        <h3>{t('editor.photo')}</h3>
        <AdjustControls
          adjustments={photo.adjustments}
          onChange={(adjustments) => update((p) => ({ ...p, adjustments }))}
        />
        <div className="panel__group">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={photo.style.shadow}
              onChange={(e) =>
                update((p) => ({ ...p, style: { ...p.style, shadow: e.target.checked } }))
              }
            />
            {t('editor.shadow')}
          </label>
          <Slider
            label={t('editor.border')}
            value={photo.style.borderWidth}
            min={0}
            max={12}
            step={1}
            onChange={(v) => update((p) => ({ ...p, style: { ...p.style, borderWidth: v } }))}
          />
          <Slider
            label={t('editor.corner')}
            value={photo.frame.cornerRadius}
            min={0}
            max={0.25}
            step={0.01}
            onChange={(v) => update((p) => ({ ...p, frame: { ...p.frame, cornerRadius: v } }))}
          />
          <div className="filter-row">
            <button type="button" className="chip" onClick={() => bringToFront(page.id, photo.id)}>
              {t('editor.toFront')}
            </button>
            <button type="button" className="chip" onClick={() => sendToBack(page.id, photo.id)}>
              {t('editor.toBack')}
            </button>
          </div>
        </div>
      </aside>
    )
  }

  return (
    <aside className="panel">
      <h3>{t('editor.background')}</h3>
      <div className="panel__group">
        <label className="slider">
          <span>{t('editor.bgColor')}</span>
          <input
            type="color"
            value={page.bgColor}
            onChange={(e) => setPageBgColor(page.id, e.target.value)}
          />
        </label>
        <Slider
          label={t('editor.zoom')}
          value={page.background.transform.scale}
          min={1}
          max={3}
          step={0.05}
          onChange={(v) =>
            updateBackground(page.id, (b) => ({ ...b, transform: { ...b.transform, scale: v } }))
          }
        />
        <Slider
          label={t('editor.panX')}
          value={page.background.transform.x}
          min={0}
          max={1}
          step={0.02}
          onChange={(v) =>
            updateBackground(page.id, (b) => ({ ...b, transform: { ...b.transform, x: v } }))
          }
        />
        <Slider
          label={t('editor.panY')}
          value={page.background.transform.y}
          min={0}
          max={1}
          step={0.02}
          onChange={(v) =>
            updateBackground(page.id, (b) => ({ ...b, transform: { ...b.transform, y: v } }))
          }
        />
      </div>
      <AdjustControls
        adjustments={page.background.adjustments}
        onChange={(adjustments) => updateBackground(page.id, (b) => ({ ...b, adjustments }))}
      />
    </aside>
  )
}
