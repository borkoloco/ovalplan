import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ExerciseTags from '../components/ExerciseTags'
import FieldDiagram from '../components/diagram/FieldDiagram'
import { ChevronLeftIcon, PlayIcon, TrashIcon } from '../components/icons'
import { btnSecondary } from '../components/ui'
import { useLang } from '../i18n'
import { useAuth } from '../lib/auth'
import { useExercises } from '../lib/exercises'
import { tx } from '../lib/format'

export default function ExerciseDetail() {
  const { id = '' } = useParams()
  const { t } = useTranslation()
  const lang = useLang()
  const navigate = useNavigate()
  const { byId, loading, remove } = useExercises()
  const { user, isAdmin } = useAuth()
  const ex = byId[id]

  const back = () => (window.history.length > 1 ? navigate(-1) : navigate('/library'))

  if (!ex && loading) return null
  if (!ex) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 text-center">
        <p className="text-slate-600">{t('exercise.notFound')}</p>
        <Link to="/library" className={btnSecondary}>{t('common.back')}</Link>
      </div>
    )
  }

  const isOwner = Boolean(user && ex.createdBy === user.id)
  const canEdit = isAdmin || (isOwner && ex.status !== 'approved')

  const onDelete = async () => {
    if (!confirm(t('exercise.deleteConfirm'))) return
    const res = await remove(ex.id)
    if (res.error) alert(res.error)
    else navigate('/library', { replace: true })
  }

  return (
    <article className="mx-auto max-w-3xl space-y-5">
      <button type="button" onClick={back} className="-ml-1 inline-flex items-center gap-1 text-sm font-medium text-slate-600">
        <ChevronLeftIcon width={18} height={18} /> {t('common.back')}
      </button>

      <header className="space-y-3">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{tx(ex.name, lang)}</h1>
        <p className="text-slate-700">{tx(ex.summary, lang)}</p>
        <ExerciseTags ex={ex} />
        <p className="text-sm text-slate-500">
          {ex.duration} {t('common.min')} · {t('exercise.minPlayers', { count: ex.minPlayers })}
        </p>
        {ex.reviewNote && (isOwner || isAdmin) && (
          <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
            <span className="font-semibold">{t('exercise.reviewNote')}:</span> {ex.reviewNote}
          </p>
        )}
        {canEdit && (
          <div className="flex gap-2">
            <Link to={`/exercises/${ex.id}/edit`} className={btnSecondary}>{t('exercise.edit')}</Link>
            <button type="button" onClick={onDelete} className={`${btnSecondary} !text-red-600`}>
              <TrashIcon width={16} height={16} /> {t('common.delete')}
            </button>
          </div>
        )}
      </header>

      {/* Diagrama */}
      {ex.diagram ? (
        <FieldDiagram diagram={ex.diagram} title={`${t('diagram.title')}: ${tx(ex.name, lang)}`} />
      ) : (
        <div className="grid aspect-video place-items-center rounded-2xl border border-dashed border-slate-300 bg-[repeating-linear-gradient(90deg,#ecfdf5_0,#ecfdf5_40px,#d1fae5_40px,#d1fae5_80px)] p-4 text-center text-sm text-emerald-900/70">
          {t('diagram.none')}
        </div>
      )}
      {ex.videoUrl && (
        <a href={ex.videoUrl} target="_blank" rel="noopener noreferrer" className={btnSecondary}>
          <PlayIcon width={18} height={18} /> {t('exercise.video')}
        </a>
      )}

      <section className="space-y-2">
        <h2 className="font-semibold">{t('exercise.steps')}</h2>
        <ol className="space-y-2">
          {ex.steps.map((step, i) => (
            <li key={i} className="flex gap-3 rounded-xl bg-white p-3 ring-1 ring-slate-200">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-emerald-700 text-xs font-bold text-white">{i + 1}</span>
              <span className="text-slate-700">{tx(step, lang)}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">{t('exercise.equipment')}</h2>
        <p className="text-slate-700">
          {ex.equipment.length ? ex.equipment.map((e) => t(`equipment.${e}`)).join(', ') : t('exercise.noEquipment')}
        </p>
      </section>
    </article>
  )
}
