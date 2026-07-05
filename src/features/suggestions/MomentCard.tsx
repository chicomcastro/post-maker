import { useTranslation } from 'react-i18next'
import type { SuggestionGroup } from '../../lib/suggestions'
import { IconButton } from '../../components/ui'
import { Close } from '../../components/icons'
import { useAssetUrls } from '../../hooks/useAssetUrls'

/** Card de um "momento" (grupo de fotos): miniaturas + data/lugar + criar. */
export function MomentCard({
  group,
  dateLabel,
  onCreate,
  onDismiss,
}: {
  group: SuggestionGroup
  dateLabel: string
  onCreate: () => void
  onDismiss?: () => void
}) {
  const { t } = useTranslation()
  const preview = group.photos.slice(0, 4)
  const urls = useAssetUrls(preview.map((p) => p.assetId))
  const placeLabel =
    group.place ??
    (group.lat != null
      ? `${group.lat.toFixed(3)}, ${group.lon!.toFixed(3)}`
      : t('suggestions.noPlace'))

  return (
    <li className="suggestion-card">
      <div className="suggestion-card__thumbs">
        {preview.map((p) => (
          <span
            key={p.assetId}
            className="suggestion-card__thumb"
            style={{
              backgroundImage: urls[p.assetId] ? `url(${urls[p.assetId]})` : undefined,
            }}
          />
        ))}
      </div>
      <div className="suggestion-card__body">
        <div className="suggestion-card__title">{dateLabel}</div>
        <div className="suggestion-card__meta muted">
          {placeLabel} · {t('home.photoCount', { count: group.photos.length })}
        </div>
      </div>
      <button type="button" className="btn btn--sm" onClick={onCreate}>
        {t('suggestions.create')}
      </button>
      {onDismiss && (
        <IconButton label={t('suggestions.dismiss')} onClick={onDismiss}>
          <Close />
        </IconButton>
      )}
    </li>
  )
}
