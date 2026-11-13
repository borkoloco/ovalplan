import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next, useTranslation } from 'react-i18next'
import en from './en'
import es from './es'

export const LANGUAGES = ['es', 'en'] as const
export type Lang = (typeof LANGUAGES)[number]

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { es: { translation: es }, en: { translation: en } },
    supportedLngs: LANGUAGES,
    nonExplicitSupportedLngs: true, // es-AR -> es, en-US -> en
    fallbackLng: 'es',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'ovalplan.lang',
      caches: ['localStorage'],
    },
  })

const syncHtmlLang = (lng: string) => document.documentElement.setAttribute('lang', lng)
syncHtmlLang(i18n.resolvedLanguage ?? 'es')
i18n.on('languageChanged', syncHtmlLang)

/** Idioma actual normalizado a 'es' | 'en'. */
export function useLang(): Lang {
  const { i18n: instance } = useTranslation()
  return instance.resolvedLanguage?.startsWith('en') ? 'en' : 'es'
}

export default i18n
