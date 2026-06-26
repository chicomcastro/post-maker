import { useEffect, useRef } from 'react'
import { Stage, Layer, Rect, Image as KonvaImage, Transformer } from 'react-konva'
import Konva from 'konva'
import type { Background, CollagePhoto, Page, AspectRatio } from '../../../types/project'
import {
  backgroundCropRect,
  coverRect,
  photoPixelRect,
  nodeToTransform,
  stageSizeFor,
  type Size,
} from '../../../lib/editor-geometry'
import { useAssetImage } from './useAssetImage'

interface EditorStageProps {
  page: Page
  aspectRatio: AspectRatio
  width: number
  selectedPhotoId: string | null
  onSelect: (id: string | null) => void
  onChangePhoto: (photoId: string, updater: (p: CollagePhoto) => CollagePhoto) => void
}

export default function EditorStage({
  page,
  aspectRatio,
  width,
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
        <Rect x={0} y={0} width={stage.width} height={stage.height} fill={page.bgColor} />
        <BackgroundImage background={page.background} stage={stage} />
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

function BackgroundImage({ background, stage }: { background: Background; stage: Size }) {
  const img = useAssetImage(background.assetId)
  const ref = useRef<Konva.Image>(null)

  useEffect(() => {
    const node = ref.current
    if (!node || !img) return
    node.cache()
    node.getLayer()?.batchDraw()
  }, [img, background.adjustments, stage.width, stage.height])

  if (!img) return null
  const crop = backgroundCropRect(
    { width: img.naturalWidth, height: img.naturalHeight },
    stage,
    background.transform.scale,
    background.transform.x - 0.5,
    background.transform.y - 0.5,
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
  const crop = img
    ? coverRect(
        { width: img.naturalWidth, height: img.naturalHeight },
        { width: rect.width, height: rect.height },
      )
    : undefined

  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (img) node.cache()
    node.getLayer()?.batchDraw()
  }, [img, photo.adjustments, rect.width, rect.height])

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
