import 'i18next'
import type { Translation } from './es'

// Claves de traducción tipadas: un t('clave.mal.escrita') no compila.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: { translation: Translation }
  }
}
