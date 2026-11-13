import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { CheckIcon, ChevronRightIcon, PlusIcon } from '../components/icons'
import { btnPrimary } from '../components/ui'
import { useLang } from '../i18n'
import { categoryLabel, formatDate, sessionMinutes } from '../lib/format'
import { listSessions } from '../lib/storage'

export default function Home() {
  const { t } = useTranslation()
  const lang = useLang()
  const sessions = listSessions()

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <section className="rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-900 p-6 text-white shadow-sm md:p-10">
        <p className="text-sm font-medium text-emerald-100">{t('app.tagline')}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-4xl">{t('home.title')}</h1>
        <p className="mt-3 max-w-xl text-emerald-50/90">{t('home.intro')}</p>
        <Link to="/plan" className={`${btnPrimary} mt-6 w-full bg-white !text-emerald-800 hover:bg-emerald-50 sm:w-auto`}>
          <PlusIcon />
          {t('home.cta')}
        </Link>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">{t('home.saved')}</h2>
        {sessions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
            {t('home.empty')}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
            {sessions.map((s) => (
              <li key={s.id}>
                <Link to={`/session/${s.id}`} className="flex items-center gap-3 p-4 hover:bg-slate-50">
                  <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-sm font-bold text-emerald-800">
                    {s.done ? <CheckIcon /> : categoryLabel(s.input.category, t).slice(0, 4)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium capitalize">{formatDate(s.input.date, lang)}</div>
                    <div className="truncate text-sm text-slate-500">
                      {categoryLabel(s.input.category, t)} · {s.input.players} {t('common.players')} ·{' '}
                      {sessionMinutes(s)} {t('common.min')}
                      {s.input.topics.length > 0 && ` · ${s.input.topics.map((tp) => t(`topics.${tp}`)).join(', ')}`}
                    </div>
                  </div>
                  <ChevronRightIcon className="shrink-0 text-slate-400" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-xs leading-relaxed text-slate-500">{t('home.disclaimer')}</p>
    </div>
  )
}
