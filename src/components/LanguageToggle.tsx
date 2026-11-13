import { useTranslation } from 'react-i18next'
import { LANGUAGES, useLang } from '../i18n'

export default function LanguageToggle() {
  const { t, i18n } = useTranslation()
  const lang = useLang()

  return (
    <div
      role="group"
      aria-label={t('language.label')}
      className="flex rounded-full bg-slate-100 p-0.5 text-xs font-semibold"
    >
      {LANGUAGES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => i18n.changeLanguage(l)}
          aria-pressed={lang === l}
          className={`min-w-10 rounded-full px-2.5 py-1.5 uppercase transition ${
            lang === l ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500'
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  )
}
