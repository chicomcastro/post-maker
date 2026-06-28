import type { CSSProperties } from 'react'
import type { AspectRatio, Background, Page } from '../types/project'

interface PagePreviewProps {
  page: Page
  background: Background
  bgColor: string
  aspectRatio: AspectRatio
  urls: Record<string, string>
  className?: string
  /** Para o fundo contínuo: índice da página e total de páginas do carrossel. */
  pageIndex?: number
  pageCount?: number
}

/** Render read-only de uma página (background contínuo compartilhado + colagem). */
export function PagePreview({
  page,
  background,
  bgColor,
  aspectRatio,
  urls,
  className,
  pageIndex = 0,
  pageCount = 1,
}: PagePreviewProps) {
  const bgUrl = background.assetId ? urls[background.assetId] : undefined
  const pages = Math.max(1, pageCount)
  const index = Math.min(Math.max(0, pageIndex), pages - 1)

  return (
    <div
      className={'page-preview' + (className ? ' ' + className : '')}
      style={{ aspectRatio: aspectRatio.replace(':', ' / '), backgroundColor: bgColor }}
    >
      {bgUrl && (
        <div
          className="page-preview__bg"
          style={{
            // A imagem cobre a faixa de todas as páginas; deslocamos para mostrar
            // a fatia desta página — dá o efeito de panorama contínuo.
            backgroundImage: `url(${bgUrl})`,
            width: `${pages * 100}%`,
            left: `${-index * 100}%`,
            transform: `scale(${background.transform.scale})`,
            transformOrigin: `${background.transform.x * 100}% ${background.transform.y * 100}%`,
            ...adjustmentFilter(background.adjustments),
          }}
        />
      )}
      {page.collage.map((photo) => {
        const url = photo.assetId ? urls[photo.assetId] : undefined
        const style: CSSProperties = {
          left: `${photo.transform.x * 100}%`,
          top: `${photo.transform.y * 100}%`,
          width: `${photo.frame.width * 100}%`,
          height: `${photo.frame.height * 100}%`,
          transform: `translate(-50%, -50%) rotate(${photo.transform.rotation}deg) scale(${photo.transform.scale})`,
          borderRadius: `${photo.frame.cornerRadius * 100}%`,
          boxShadow: photo.style.shadow ? '0 6px 16px rgba(0,0,0,0.25)' : undefined,
          outline:
            photo.style.borderWidth > 0
              ? `${photo.style.borderWidth}px solid ${photo.style.borderColor}`
              : undefined,
          backgroundImage: url ? `url(${url})` : undefined,
          // Enquadramento (pan) dentro do slot; o zoom fica para o editor/export.
          backgroundPosition: `${photo.crop.x * 100}% ${photo.crop.y * 100}%`,
          ...adjustmentFilter(photo.adjustments),
        }
        return (
          <div
            key={photo.id}
            className={'page-preview__photo' + (url ? '' : ' page-preview__photo--empty')}
            style={style}
          />
        )
      })}
    </div>
  )
}

function adjustmentFilter(a: {
  brightness: number
  contrast: number
  saturation: number
}): CSSProperties {
  return {
    filter: `brightness(${a.brightness}) contrast(${a.contrast}) saturate(${a.saturation})`,
  }
}
