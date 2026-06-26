import { useTranslation } from 'react-i18next'
import { supportedLngs, type Language } from '../i18n'
import { Globe } from './icons'

/** Botão que alterna entre os idiomas suportados (estilo app, sem dropdown). */
export function LanguageSwitcher() {
  const { i18n, t } = useTranslation()
  const current = (i18n.resolvedLanguage ?? 'pt') as Language

  function toggle() {
    const idx = supportedLngs.indexOf(current)
    const next = supportedLngs[(idx + 1) % supportedLngs.length]
    void i18n.changeLanguage(next)
  }

  return (
    <button type="button" className="icon-btn" onClick={toggle} aria-label={t('language.label')}>
      <Globe />
      <span className="sr-only">{current.toUpperCase()}</span>
    </button>
  )
}
