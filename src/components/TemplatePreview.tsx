import { getArrangement } from '../templates/arrangements'
import type { Template } from '../templates/catalog'
import type { AspectRatio } from '../types/project'

interface TemplatePreviewProps {
  template: Template
  aspectRatio?: AspectRatio
}

/**
 * Mostra o layout de TODAS as páginas do template (como retângulos, sem fotos),
 * lado a lado. Assim um template com arranjos diferentes por página (ex.: 1 foto
 * na 1ª e 2 na 2ª) fica visível antes de escolher.
 */
export function TemplatePreview({ template, aspectRatio }: TemplatePreviewProps) {
  const aspect = (aspectRatio ?? template.preferredAspect).replace(':', ' / ')
  const multi = template.pages.length > 1

  return (
    <div className={'template-preview' + (multi ? ' template-preview--multi' : '')}>
      {template.pages.map((arrangementId, pageIndex) => {
        const arrangement = getArrangement(arrangementId)
        return (
          <div key={pageIndex} className="template-preview__page" style={{ aspectRatio: aspect }}>
            {arrangement.slots.map((slot, i) => (
              <div
                key={i}
                className="template-preview__slot"
                style={{
                  left: `${slot.x * 100}%`,
                  top: `${slot.y * 100}%`,
                  width: `${slot.w * 100}%`,
                  height: `${slot.h * 100}%`,
                  transform: `translate(-50%, -50%) rotate(${slot.rotation}deg)`,
                }}
              />
            ))}
          </div>
        )
      })}
      {multi && <span className="template-preview__badge">{template.pages.length}</span>}
    </div>
  )
}
