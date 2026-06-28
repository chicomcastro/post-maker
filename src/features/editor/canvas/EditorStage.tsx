import { useEffect, useRef } from 'react'
import { Stage, Layer, Rect, Image as KonvaImage, Transformer } from 'react-konva'
import Konva from 'konva'
import type { Background, CollagePhoto, Page, AspectRatio } from '../../../types/project'
import {
  continuousBackgroundCropRect,
  photoPixelRect,
  nodeToTransform,
  stageSizeFor,
  type Size,
} from '../../../lib/editor-geometry'
import { useAssetImage } from './useAssetImage'

interface EditorStageProps {
  page: Page
  background: Background
  bgColor: string
  aspectRatio: AspectRatio
  width: number
  /** Índice da página atual e total de páginas (para o fundo contínuo). */
  pageIndex: number
  pageCount: number
  selectedPhotoId: string | null
  onSelect: (id: string | null) => void
  onChangePhoto: (photoId: string, updater: (p: CollagePhoto) => CollagePhoto) => void
}

export default function EditorStage({
  page,
  background,
  bgColor,
  aspectRatio,
  width,
  pageIndex,
  pageCount,
  selectedPhotoId,
  onSelect,
  onChangePhoto,
}: EditorStageProps) {
  const stage = stageSizeFor(aspectRatio, width)
  const layerRef = useRef<Konva.Layer>(null)
  const trRef = useRef<Konva.Transformer>(null)

  useEffect(() => {
    const tr = trRef.current
    const layer = layerRef.current
    if (!tr || !layer) return
    const node = selectedPhotoId ? layer.findOne('#' + selectedPhotoId) : null
    tr.nodes(node ? [node] : [])
    tr.getLayer()?.batchDraw()
  }, [selectedPhotoId, page])

  return (
    <Stage
      width={stage.width}
      height={stage.height}
      className="editor-stage"
      onMouseDown={(e) => {
        if (e.target === e.target.getStage()) onSelect(null)
      }}
      onTouchStart={(e) => {
        if (e.target === e.target.getStage()) onSelect(null)
      }}
    >
      <Layer ref={layerRef}>
        <Rect
          x={0}
          y={0}
          width={stage.width}
          height={stage.height}
          fill={bgColor}
          listening={false}
        />
        <BackgroundImage
          background={background}
          stage={stage}
          pageIndex={pageIndex}
          pageCount={pageCount}
        />
        {page.collage.map((photo) => (
          <CollageImage
            key={photo.id}
            photo={photo}
            stage={stage}
            onSelect={() => onSelect(photo.id)}
            onChange={(updater) => onChangePhoto(photo.id, updater)}
          />
        ))}
        <Transformer
          ref={trRef}
          rotationSnaps={[0, 90, 180, 270]}
          boundBoxFunc={(oldBox, newBox) =>
            newBox.width < 24 || newBox.height < 24 ? oldBox : newBox
          }
        />
      </Layer>
    </Stage>
  )
}

function BackgroundImage({
  background,
  stage,
  pageIndex,
  pageCount,
}: {
  background: Background
  stage: Size
  pageIndex: number
  pageCount: number
}) {
  const img = useAssetImage(background.assetId)
  const ref = useRef<Konva.Image>(null)
  const { transform, adjustments } = background

  // Re-cacheia sempre que algo do recorte muda (zoom/pan/página/ajustes), senão
  // o nó cacheado segue mostrando o crop antigo — o bug de "não atualiza".
  useEffect(() => {
    const node = ref.current
    if (!node || !img) return
    node.cache()
    node.getLayer()?.batchDraw()
  }, [
    img,
    adjustments,
    transform.scale,
    transform.x,
    transform.y,
    pageIndex,
    pageCount,
    stage.width,
    stage.height,
  ])

  if (!img) return null
  const crop = continuousBackgroundCropRect(
    { width: img.naturalWidth, height: img.naturalHeight },
    stage,
    transform.scale,
    transform.x - 0.5,
    transform.y - 0.5,
    pageIndex,
    pageCount,
  )
  return (
    <KonvaImage
      ref={ref}
      image={img}
      x={0}
      y={0}
      width={stage.width}
      height={stage.height}
      crop={crop}
      listening={false}
      filters={[Konva.Filters.Brighten, Konva.Filters.Contrast, Konva.Filters.HSL]}
      brightness={background.adjustments.brightness - 1}
      contrast={(background.adjustments.contrast - 1) * 100}
      saturation={background.adjustments.saturation - 1}
    />
  )
}

function CollageImage({
  photo,
  stage,
  onSelect,
  onChange,
}: {
  photo: CollagePhoto
  stage: Size
  onSelect: () => void
  onChange: (updater: (p: CollagePhoto) => CollagePhoto) => void
}) {
  const img = useAssetImage(photo.assetId)
  const ref = useRef<Konva.Image>(null)
  const rect = photoPixelRect(photo, stage)
  // Recorte "cover" + enquadramento (zoom/pan) dentro do slot — mesma matemática
  // do background, aplicada ao tamanho do slot.
  const crop = img
    ? continuousBackgroundCropRect(
        { width: img.naturalWidth, height: img.naturalHeight },
        { width: rect.width, height: rect.height },
        photo.crop.scale,
        photo.crop.x - 0.5,
        photo.crop.y - 0.5,
        0,
        1,
      )
    : undefined

  // Re-cacheia quando qualquer atributo visual muda (ajustes, borda, cantos,
  // sombra, tamanho, enquadramento). Sem isso o nó cacheado mantém o desenho antigo.
  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (img) node.cache()
    node.getLayer()?.batchDraw()
  }, [
    img,
    photo.adjustments,
    photo.style.borderWidth,
    photo.style.borderColor,
    photo.style.shadow,
    photo.frame.cornerRadius,
    photo.crop.scale,
    photo.crop.x,
    photo.crop.y,
    rect.width,
    rect.height,
  ])

  const cornerPx = photo.frame.cornerRadius * Math.min(rect.width, rect.height)

  return (
    <KonvaImage
      ref={ref}
      id={photo.id}
      image={img}
      x={rect.x}
      y={rect.y}
      width={rect.width}
      height={rect.height}
      offsetX={rect.width / 2}
      offsetY={rect.height / 2}
      crop={crop}
      rotation={photo.transform.rotation}
      scaleX={photo.transform.scale}
      scaleY={photo.transform.scale}
      cornerRadius={cornerPx}
      fill={img ? undefined : 'rgba(255,255,255,0.5)'}
      stroke={photo.style.borderWidth > 0 ? photo.style.borderColor : undefined}
      strokeWidth={photo.style.borderWidth}
      strokeScaleEnabled={false}
      shadowColor="#000000"
      shadowBlur={photo.style.shadow ? 16 : 0}
      shadowOpacity={photo.style.shadow ? 0.3 : 0}
      filters={
        img ? [Konva.Filters.Brighten, Konva.Filters.Contrast, Konva.Filters.HSL] : undefined
      }
      brightness={photo.adjustments.brightness - 1}
      contrast={(photo.adjustments.contrast - 1) * 100}
      saturation={photo.adjustments.saturation - 1}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => {
        const t = nodeToTransform(
          {
            x: e.target.x(),
            y: e.target.y(),
            rotation: e.target.rotation(),
            scaleX: photo.transform.scale,
          },
          stage,
        )
        onChange((p) => ({ ...p, transform: { ...p.transform, x: t.x, y: t.y } }))
      }}
      onTransformEnd={(e) => {
        const node = e.target
        const t = nodeToTransform(
          { x: node.x(), y: node.y(), rotation: node.rotation(), scaleX: node.scaleX() },
          stage,
        )
        node.scaleY(node.scaleX())
        onChange((p) => ({
          ...p,
          transform: { x: t.x, y: t.y, rotation: t.rotation, scale: t.scale },
        }))
      }}
    />
  )
}
