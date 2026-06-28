import { useStore } from 'zustand'
import { useTranslation } from 'react-i18next'
import { useEditorStore, editorTemporal } from '../../store/editorStore'
import { PagePreview } from '../../components/PagePreview'
import { IconButton } from '../../components/ui'
import { Undo, Redo, Plus, Copy, Trash } from '../../components/icons'
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

const BG_COLORS = ['#0f1420', '#ffffff', '#f5e9da', '#1b3a4b', '#3a2e3f', '#c2410c']

export function Toolbar() {
  const { t } = useTranslation()
  const canUndo = useStore(editorTemporal, (s) => s.pastStates.length > 0)
  const canRedo = useStore(editorTemporal, (s) => s.futureStates.length > 0)
  return (
    <>
      <IconButton
        label={t('editor.undo')}
        disabled={!canUndo}
        onClick={() => editorTemporal.getState().undo()}
      >
        <Undo />
      </IconButton>
      <IconButton
        label={t('editor.redo')}
        disabled={!canRedo}
        onClick={() => editorTemporal.getState().redo()}
      >
        <Redo />
      </IconButton>
    </>
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
          <PagePreview
            page={page}
            background={project.background}
            bgColor={project.bgColor}
            aspectRatio={project.aspectRatio}
            urls={urls}
            pageIndex={i}
            pageCount={project.pages.length}
          />
        </button>
      ))}
      {canAdd && (
        <button
          type="button"
          className="filmstrip__add"
          onClick={() => addPage()}
          aria-label={t('editor.addPageLabel')}
        >
          <Plus />
        </button>
      )}
      <span style={{ flex: 1 }} />
      <IconButton
        label={t('editor.duplicatePage')}
        disabled={!canAdd}
        onClick={() => duplicatePage(project.pages[current].id)}
      >
        <Copy />
      </IconButton>
      <IconButton
        label={t('editor.removePage')}
        disabled={project.pages.length <= 1}
        onClick={() => removePage(project.pages[current].id)}
      >
        <Trash />
      </IconButton>
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

/** Tira de miniaturas das fotos do projeto, para escolher. */
function AssetThumbs({
  assetIds,
  selectedId,
  onPick,
  allowNone,
  noneLabel,
}: {
  assetIds: string[]
  selectedId: string | null
  onPick: (id: string | null) => void
  allowNone?: boolean
  noneLabel?: string
}) {
  const urls = useAssetUrls(assetIds)
  return (
    <div className="thumbs">
      {allowNone && (
        <button
          type="button"
          className={'thumb thumb--none' + (selectedId == null ? ' thumb--active' : '')}
          onClick={() => onPick(null)}
        >
          {noneLabel}
        </button>
      )}
      {assetIds.map((id) => (
        <button
          key={id}
          type="button"
          aria-label="foto"
          className={'thumb' + (id === selectedId ? ' thumb--active' : '')}
          style={{ backgroundImage: urls[id] ? `url(${urls[id]})` : undefined }}
          onClick={() => onPick(id)}
        />
      ))}
    </div>
  )
}

/** Painel contextual (bottom sheet): edita a foto selecionada ou o fundo. */
export function SidePanel({ project }: { project: Project }) {
  const page = project.pages[useEditorStore((s) => s.currentPageIndex)] as Page | undefined
  const selectedPhotoId = useEditorStore((s) => s.selectedPhotoId)
  if (!page) return null
  const photo = page.collage.find((p) => p.id === selectedPhotoId)

  return (
    <div className="sheet">
      <div className="sheet__grip" />
      {photo ? (
        <PhotoControls key={photo.id} pageId={page.id} photo={photo} pool={project.assetPool} />
      ) : (
        <BackgroundControls project={project} />
      )}
    </div>
  )
}

function BackgroundControls({ project }: { project: Project }) {
  const { t } = useTranslation()
  const updateBackground = useEditorStore((s) => s.updateBackground)
  const setBgColor = useEditorStore((s) => s.setBgColor)
  const setBackgroundAsset = useEditorStore((s) => s.setBackgroundAsset)
  const bg = project.background
  const hasImage = !!bg.assetId

  return (
    <>
      <h3 className="panel__title">{t('editor.background')}</h3>

      <div className="panel__group">
        <span className="field-label">{t('editor.backgroundImage')}</span>
        <AssetThumbs
          assetIds={project.assetPool}
          selectedId={bg.assetId}
          onPick={setBackgroundAsset}
          allowNone
          noneLabel={t('editor.noBackground')}
        />
      </div>

      {hasImage ? (
        <>
          <div className="panel__group">
            <Slider
              label={t('editor.zoom')}
              value={bg.transform.scale}
              min={1}
              max={3}
              step={0.05}
              onChange={(v) =>
                updateBackground((b) => ({ ...b, transform: { ...b.transform, scale: v } }))
              }
            />
            <Slider
              label={t('editor.panX')}
              value={bg.transform.x}
              min={0}
              max={1}
              step={0.02}
              onChange={(v) =>
                updateBackground((b) => ({ ...b, transform: { ...b.transform, x: v } }))
              }
            />
            <Slider
              label={t('editor.panY')}
              value={bg.transform.y}
              min={0}
              max={1}
              step={0.02}
              onChange={(v) =>
                updateBackground((b) => ({ ...b, transform: { ...b.transform, y: v } }))
              }
            />
          </div>
          <AdjustControls
            adjustments={bg.adjustments}
            onChange={(adjustments) => updateBackground((b) => ({ ...b, adjustments }))}
          />
          <button
            type="button"
            className="btn btn--ghost btn--block"
            onClick={() => setBackgroundAsset(null)}
          >
            {t('editor.removeBackground')}
          </button>
        </>
      ) : (
        <div className="panel__group">
          <span className="field-label">{t('editor.bgColor')}</span>
          <div className="swatches">
            {BG_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={'swatch' + (project.bgColor === c ? ' swatch--active' : '')}
                style={{ background: c }}
                aria-label={c}
                onClick={() => setBgColor(c)}
              />
            ))}
            <input
              type="color"
              className="swatch-input"
              aria-label={t('editor.bgColor')}
              value={project.bgColor}
              onChange={(e) => setBgColor(e.target.value)}
            />
          </div>
        </div>
      )}
    </>
  )
}

function PhotoControls({
  pageId,
  photo,
  pool,
}: {
  pageId: string
  photo: CollagePhoto
  pool: string[]
}) {
  const { t } = useTranslation()
  const updateCollagePhoto = useEditorStore((s) => s.updateCollagePhoto)
  const setCollagePhotoAsset = useEditorStore((s) => s.setCollagePhotoAsset)
  const removeCollagePhoto = useEditorStore((s) => s.removeCollagePhoto)
  const bringToFront = useEditorStore((s) => s.bringPhotoToFront)
  const sendToBack = useEditorStore((s) => s.sendPhotoToBack)
  const interactionMode = useEditorStore((s) => s.interactionMode)
  const setInteractionMode = useEditorStore((s) => s.setInteractionMode)
  const update = (updater: (p: CollagePhoto) => CollagePhoto) =>
    updateCollagePhoto(pageId, photo.id, updater)

  const ratio = photo.frame.width / photo.frame.height
  const orientation = ratio < 0.95 ? 'portrait' : ratio > 1.05 ? 'landscape' : 'square'
  const setOrientation = (kind: 'portrait' | 'square' | 'landscape') =>
    update((p) => {
      const long = Math.min(0.9, Math.max(0.2, Math.max(p.frame.width, p.frame.height)))
      const dims =
        kind === 'portrait'
          ? { width: long * 0.8, height: long }
          : kind === 'landscape'
            ? { width: long, height: long * 0.8 }
            : { width: long, height: long }
      return { ...p, frame: { ...p.frame, ...dims } }
    })

  return (
    <>
      <h3 className="panel__title">{photo.assetId ? t('editor.photo') : t('editor.emptySlot')}</h3>

      <div className="panel__group">
        {!photo.assetId && <span className="field-label">{t('editor.emptySlotHint')}</span>}
        <AssetThumbs
          assetIds={pool}
          selectedId={photo.assetId}
          onPick={(id) => setCollagePhotoAsset(pageId, photo.id, id)}
        />
      </div>

      <div className="panel__group">
        <span className="field-label">{t('editor.orientation')}</span>
        <div className="filter-row">
          {(['portrait', 'square', 'landscape'] as const).map((kind) => (
            <button
              key={kind}
              type="button"
              className={'chip' + (orientation === kind ? ' chip--active' : '')}
              onClick={() => setOrientation(kind)}
            >
              {t(`editor.${kind}`)}
            </button>
          ))}
        </div>
      </div>

      {photo.assetId && (
        <>
          <div className="panel__group">
            <span className="field-label">{t('editor.dragDoes')}</span>
            <div className="segmented segmented--block">
              <button
                type="button"
                className={
                  'segmented__item' +
                  (interactionMode === 'frame' ? ' segmented__item--active' : '')
                }
                onClick={() => setInteractionMode('frame')}
              >
                {t('editor.dragFrame')}
              </button>
              <button
                type="button"
                className={
                  'segmented__item' + (interactionMode === 'move' ? ' segmented__item--active' : '')
                }
                onClick={() => setInteractionMode('move')}
              >
                {t('editor.dragMove')}
              </button>
            </div>
          </div>
          <div className="panel__group">
            <span className="field-label">{t('editor.framing')}</span>
            <Slider
              label={t('editor.zoom')}
              value={photo.crop.scale}
              min={1}
              max={3}
              step={0.05}
              onChange={(v) => update((p) => ({ ...p, crop: { ...p.crop, scale: v } }))}
            />
            <Slider
              label={t('editor.panX')}
              value={photo.crop.x}
              min={0}
              max={1}
              step={0.02}
              onChange={(v) => update((p) => ({ ...p, crop: { ...p.crop, x: v } }))}
            />
            <Slider
              label={t('editor.panY')}
              value={photo.crop.y}
              min={0}
              max={1}
              step={0.02}
              onChange={(v) => update((p) => ({ ...p, crop: { ...p.crop, y: v } }))}
            />
          </div>
          <AdjustControls
            adjustments={photo.adjustments}
            onChange={(adjustments) => update((p) => ({ ...p, adjustments }))}
          />
          <div className="panel__group">
            <label className="switch">
              {t('editor.shadow')}
              <input
                type="checkbox"
                checked={photo.style.shadow}
                onChange={(e) =>
                  update((p) => ({ ...p, style: { ...p.style, shadow: e.target.checked } }))
                }
              />
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
              <button type="button" className="chip" onClick={() => bringToFront(pageId, photo.id)}>
                {t('editor.toFront')}
              </button>
              <button type="button" className="chip" onClick={() => sendToBack(pageId, photo.id)}>
                {t('editor.toBack')}
              </button>
            </div>
          </div>
        </>
      )}

      <button
        type="button"
        className="btn btn--ghost btn--block btn--danger"
        onClick={() => removeCollagePhoto(pageId, photo.id)}
      >
        {t('editor.deletePhoto')}
      </button>
    </>
  )
}
