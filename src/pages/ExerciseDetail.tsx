import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ExerciseTags from '../components/ExerciseTags'
import { ChevronLeftIcon, PlayIcon } from '../components/icons'
import { btnSecondary } from '../components/ui'
import { EXERCISES_BY_ID } from '../data/exercises'
import { useLang } from '../i18n'

export default function ExerciseDetail() {
  const { id = '' } = useParams()
  const { t } = useTranslation()
  const lang = useLang()
  const navigate = useNavigate()
  const ex = EXERCISES_BY_ID[id]

  const back = () => (window.history.length > 1 ? navigate(-1) : navigate('/library'))

  if (!ex) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 text-center">
        <p className="text-slate-600">{t('exercise.notFound')}</p>
        <Link to="/library" className={btnSecondary}>{t('common.back')}</Link>
      </div>
    )
  }

  return (
    <article className="mx-auto max-w-3xl space-y-5">
      <button type="button" onClick={back} className="-ml-1 inline-flex items-center gap-1 text-sm font-medium text-slate-600">
        <ChevronLeftIcon width={18} height={18} /> {t('common.back')}
      </button>

      <header className="space-y-3">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{ex.name[lang]}</h1>
        <p className="text-slate-700">{ex.summary[lang]}</p>
        <ExerciseTags ex={ex} />
        <p className="text-sm text-slate-500">
          {ex.duration} {t('common.min')} · {t('exercise.minPlayers', { count: ex.minPlayers })}
        </p>
      </header>

      {/* Video o diagrama */}
      {ex.videoUrl ? (
        <a href={ex.videoUrl} target="_blank" rel="noopener noreferrer" className={btnSecondary}>
          <PlayIcon width={18} height={18} /> {t('exercise.video')}
        </a>
      ) : (
        <div className="grid aspect-video place-items-center rounded-2xl border border-dashed border-slate-300 bg-[repeating-linear-gradient(90deg,#ecfdf5_0,#ecfdf5_40px,#d1fae5_40px,#d1fae5_80px)] text-sm text-emerald-900/70">
          {t('exercise.noVideo')}
        </div>
      )}

      <section className="space-y-2">
        <h2 className="font-semibold">{t('exercise.steps')}</h2>
        <ol className="space-y-2">
          {ex.steps.map((step, i) => (
            <li key={i} className="flex gap-3 rounded-xl bg-white p-3 ring-1 ring-slate-200">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-emerald-700 text-xs font-bold text-white">{i + 1}</span>
              <span className="text-slate-700">{step[lang]}</span>
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
