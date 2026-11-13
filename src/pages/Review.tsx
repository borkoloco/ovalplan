import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import ExerciseTags from '../components/ExerciseTags'
import { CheckIcon, XIcon } from '../components/icons'
import { btnSecondary } from '../components/ui'
import { useLang } from '../i18n'
import { useAuth } from '../lib/auth'
import { useExercises } from '../lib/exercises'
import { tx } from '../lib/format'

/** Revisión de ejercicios cargados por entrenadores (sólo admin). */
export default function Review() {
  const { t } = useTranslation()
  const lang = useLang()
  const { isAdmin, ready } = useAuth()
  const { all, review } = useExercises()
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!ready) return null
  if (!isAdmin) return <p className="text-center text-slate-600">{t('review.forbidden')}</p>

  const pending = all.filter((e) => e.status === 'pending')

  const act = async (id: string, status: 'approved' | 'rejected') => {
    let note: string | undefined
    if (status === 'rejected') {
      const answer = prompt(t('review.rejectPrompt'))
      if (answer === null) return
      note = answer.trim() || undefined
    }
    setBusy(id)
    const res = await review(id, status, note)
    setBusy(null)
    setError(res.error ?? null)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="text-2xl font-bold tracking-tight">{t('review.title')}</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {pending.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">{t('review.empty')}</p>
      ) : (
        <ul className="space-y-3">
          {pending.map((ex) => (
            <li key={ex.id} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
              <Link to={`/library/${ex.id}`} className="block space-y-1.5">
                <div className="font-semibold underline-offset-2 hover:underline">{tx(ex.name, lang)}</div>
                <p className="text-sm text-slate-600">{tx(ex.summary, lang)}</p>
              </Link>
              <ExerciseTags ex={ex} />
              <div className="flex gap-2">
                <button type="button" disabled={busy === ex.id} onClick={() => act(ex.id, 'approved')} className={`${btnSecondary} !border-emerald-600 !text-emerald-800`}>
                  <CheckIcon width={18} height={18} /> {t('review.approve')}
                </button>
                <button type="button" disabled={busy === ex.id} onClick={() => act(ex.id, 'rejected')} className={`${btnSecondary} !text-red-600`}>
                  <XIcon width={18} height={18} /> {t('review.reject')}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
