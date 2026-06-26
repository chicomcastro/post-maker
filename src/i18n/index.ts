import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import pt from './locales/pt.json'
import en from './locales/en.json'

export const resources = {
  pt: { translation: pt },
  en: { translation: en },
} as const

export const supportedLngs = ['pt', 'en'] as const
export type Language = (typeof supportedLngs)[number]

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'pt',
    supportedLngs: [...supportedLngs],
    interpolation: { escapeValue: false },
    // As chaves de proporção contêm ':' (ex.: "4:5"); desabilitar o separador de
    // namespace evita que o i18next interprete o ':' como divisor.
    nsSeparator: false,
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'post-maker-lang',
      caches: ['localStorage'],
    },
  })

export default i18n
