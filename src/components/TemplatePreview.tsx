import { getArrangement } from '../templates/arrangements'
import type { Template } from '../templates/catalog'
import type { AspectRatio } from '../types/project'

interface TemplatePreviewProps {
  template: Template
  aspectRatio?: AspectRatio
}

/** Mostra o layout da 1ª página do template como retângulos (sem fotos). */
export function TemplatePreview({ template, aspectRatio }: TemplatePreviewProps) {
  const arrangement = getArrangement(template.pages[0])
  const aspect = (aspectRatio ?? template.preferredAspect).replace(':', ' / ')

  return (
    <div className="template-preview" style={{ aspectRatio: aspect }}>
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
      {template.pages.length > 1 && (
        <span className="template-preview__badge">{template.pages.length}</span>
      )}
    </div>
  )
}
