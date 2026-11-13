import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import ExerciseTags from '../components/ExerciseTags'
import { ChipGroup } from '../components/ui'
import { CATEGORIES, categoryAge } from '../data/categories'
import { EXERCISES } from '../data/exercises'
import { TOPICS, type Topic } from '../data/types'
import { useLang } from '../i18n'
import { categoryLabel } from '../lib/format'

const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')

export default function Library() {
  const { t } = useTranslation()
  const lang = useLang()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [topics, setTopics] = useState<Topic[]>([])

  const results = useMemo(() => {
    const q = normalize(query.trim())
    return EXERCISES.filter(
      (ex) =>
        (!q || normalize(`${ex.name[lang]} ${ex.summary[lang]}`).includes(q)) &&
        (!category || categoryAge(category) >= ex.minAge) &&
        (topics.length === 0 || topics.some((tp) => ex.topics.includes(tp))),
    )
  }, [query, category, topics, lang])

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold tracking-tight">{t('library.title')}</h1>

      <div className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('library.search')}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label={t('form.category')}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base sm:w-56"
          >
            <option value="">{t('library.allCategories')}</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{categoryLabel(c.id, t)}</option>
            ))}
          </select>
        </div>
        <ChipGroup
          label={t('form.topics')}
          options={TOPICS.map((v) => ({ value: v, label: t(`topics.${v}`) }))}
          selected={topics}
          onChange={setTopics}
        />
      </div>

      <p className="text-sm text-slate-500">{t('library.count', { count: results.length })}</p>

      {results.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">{t('library.none')}</p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {results.map((ex) => (
            <li key={ex.id}>
              <Link
                to={`/library/${ex.id}`}
                className="flex h-full flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-emerald-300 hover:shadow-sm"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="font-semibold">{ex.name[lang]}</h2>
                  <span className="shrink-0 text-xs text-slate-500">{ex.duration} {t('common.min')}</span>
                </div>
                <p className="flex-1 text-sm text-slate-600">{ex.summary[lang]}</p>
                <ExerciseTags ex={ex} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
