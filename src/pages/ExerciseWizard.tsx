import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import ExerciseTags from '../components/ExerciseTags'
import DiagramEditor from '../components/diagram/DiagramEditor'
import FieldDiagram from '../components/diagram/FieldDiagram'
import type { Diagram } from '../data/diagram'
import { MinusIcon, PlusIcon, TrashIcon } from '../components/icons'
import { ChipGroup, Field, Segmented, btnPrimary, btnSecondary } from '../components/ui'
import { CATEGORIES, categoryForMinAge } from '../data/categories'
import {
  BLOCKS,
  CONTACT_LEVELS,
  EQUIPMENT,
  TOPICS,
  type BlockType,
  type ContactLevel,
  type Equipment,
  type Exercise,
  type ExerciseKind,
  type Topic,
} from '../data/types'
import { useLang, type Lang } from '../i18n'
import { useAuth } from '../lib/auth'
import { useExercises, type ExerciseInput } from '../lib/exercises'
import { categoryLabel, tx } from '../lib/format'

type Draft = {
  name: string
  kind: ExerciseKind
  fits: BlockType[]
  topics: Topic[]
  minAge: number
  minPlayers: number
  duration: number
  contact: ContactLevel
  summary: string
  steps: string[]
  videoUrl: string
  equipment: Equipment[]
  diagram?: Diagram
}

const EMPTY: Draft = {
  name: '',
  kind: 'drill',
  fits: [],
  topics: [],
  minAge: 8,
  minPlayers: 2,
  duration: 10,
  contact: 'none',
  summary: '',
  steps: [''],
  videoUrl: '',
  equipment: ['balls'],
}

const DRAFT_KEY = 'ovalplan.exerciseDraft'
const STEP_KEYS = ['what', 'who', 'how', 'diagram', 'review'] as const
const MAX_STEPS = 6

function fromExercise(ex: Exercise, lang: Lang): Draft {
  return {
    name: tx(ex.name, lang),
    kind: ex.kind,
    fits: ex.fits,
    topics: ex.topics,
    minAge: ex.minAge,
    minPlayers: ex.minPlayers,
    duration: ex.duration,
    contact: ex.contact,
    summary: tx(ex.summary, lang),
    steps: ex.steps.length ? ex.steps.map((s) => tx(s, lang)) : [''],
    videoUrl: ex.videoUrl ?? '',
    equipment: ex.equipment,
    diagram: ex.diagram,
  }
}

/** El texto se guarda en el idioma en que lo escribió el entrenador. */
function toInput(d: Draft, lang: Lang): ExerciseInput {
  const l = (text: string) => ({ [lang]: text.trim() })
  return {
    name: l(d.name),
    summary: l(d.summary),
    steps: d.steps.filter((s) => s.trim()).map(l),
    kind: d.kind,
    fits: d.fits,
    topics: d.topics,
    minAge: d.minAge,
    minPlayers: d.minPlayers,
    duration: d.duration,
    equipment: d.equipment,
    contact: d.contact,
    videoUrl: d.videoUrl.trim() || undefined,
    diagram: d.diagram,
  }
}

function loadDraft(): Draft {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    return raw ? { ...EMPTY, ...(JSON.parse(raw) as Partial<Draft>) } : EMPTY
  } catch {
    return EMPTY
  }
}

export default function ExerciseWizard() {
  const { id } = useParams()
  const { t } = useTranslation()
  const lang = useLang()
  const { user, ready, isAdmin } = useAuth()
  const { byId } = useExercises()
  const existing = id ? byId[id] : undefined

  if (!ready) return null
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(id ? `/exercises/${id}/edit` : '/exercises/new')}`} replace />
  if (id && !existing) return <p className="text-center text-slate-600">{t('exercise.notFound')}</p>
  if (existing && !isAdmin && (existing.createdBy !== user.id || existing.status === 'approved')) {
    return <Navigate to={`/library/${existing.id}`} replace />
  }
  return <Wizard key={id ?? 'new'} existing={existing} initial={existing ? fromExercise(existing, lang) : loadDraft()} />
}

function Wizard({ existing, initial }: { existing?: Exercise; initial: Draft }) {
  const { t } = useTranslation()
  const lang = useLang()
  const navigate = useNavigate()
  const { create, update } = useExercises()
  const { isAdmin } = useAuth()
  const [d, setD] = useState<Draft>(initial)
  const [step, setStep] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setD((prev) => ({ ...prev, [key]: value }))

  // Borrador local sólo para ejercicios nuevos (si se cierra la app a mitad de camino).
  useEffect(() => {
    if (existing) return
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(d))
    } catch {
      // sin almacenamiento: no pasa nada
    }
  }, [d, existing])

  const validate = (s: number): string | null => {
    if (s === 0) {
      if (d.name.trim().length < 3) return t('wizard.errors.name')
      if (d.fits.length === 0) return t('wizard.errors.blocks')
    }
    if (s === 1) {
      const ok = (n: number, min: number, max: number) => Number.isInteger(n) && n >= min && n <= max
      if (!ok(d.minPlayers, 1, 60) || !ok(d.duration, 3, 60)) return t('wizard.errors.numbers')
    }
    if (s === 2) {
      if (d.summary.trim().length < 5) return t('wizard.errors.summary')
      if (!d.steps.some((x) => x.trim())) return t('wizard.errors.steps')
      if (d.videoUrl.trim() && !/^https:\/\/\S+$/.test(d.videoUrl.trim())) return t('wizard.errors.video')
    }
    return null
  }

  const goNext = () => {
    const err = validate(step)
    setError(err)
    if (!err) {
      setStep((s) => s + 1)
      window.scrollTo({ top: 0 })
    }
  }

  const goBack = () => {
    setError(null)
    setStep((s) => s - 1)
    window.scrollTo({ top: 0 })
  }

  const save = async () => {
    for (const s of [0, 1, 2]) {
      const err = validate(s)
      if (err) {
        setStep(s)
        setError(err)
        return
      }
    }
    setSaving(true)
    const input = toInput(d, lang)
    const res = existing ? await update(existing.id, input, { keepStatus: isAdmin }) : await create(input)
    setSaving(false)
    if (res.error) return setError(t('wizard.saveError', { error: res.error }))
    if (!existing) {
      try {
        localStorage.removeItem(DRAFT_KEY)
      } catch {
        // nada
      }
    }
    const newId = existing?.id ?? ('id' in res ? res.id : undefined)
    navigate(newId ? `/library/${newId}` : '/library', { replace: true })
  }

  const preview: Exercise = { id: 'preview', ...toInput(d, lang), status: 'pending' }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <p className="text-sm font-medium text-emerald-700">
          {t('wizard.step', { n: step + 1, total: STEP_KEYS.length })} · {t(`wizard.steps.${STEP_KEYS[step]}`)}
        </p>
        <h1 className="text-2xl font-bold tracking-tight">{existing ? t('wizard.titleEdit') : t('wizard.titleNew')}</h1>
        {/* Barra de progreso */}
        <div className="mt-3 grid grid-cols-5 gap-1.5" aria-hidden>
          {STEP_KEYS.map((k, i) => (
            <div key={k} className={`h-1.5 rounded-full ${i <= step ? 'bg-emerald-600' : 'bg-slate-200'}`} />
          ))}
        </div>
      </div>

      <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-4 md:p-6">
        {step === 0 && (
          <>
            <Field label={`${t('wizard.name')} *`}>
              <input
                value={d.name}
                maxLength={80}
                onChange={(e) => set('name', e.target.value)}
                placeholder={t('wizard.namePlaceholder')}
                className="w-full rounded-xl border border-slate-300 px-3 py-3 text-base"
              />
            </Field>
            <Field label={t('wizard.kind')}>
              <Segmented<ExerciseKind>
                label={t('wizard.kind')}
                options={[
                  { value: 'drill', label: t('kind.drill') },
                  { value: 'game', label: t('kind.game') },
                ]}
                value={d.kind}
                onChange={(v) => set('kind', v)}
              />
            </Field>
            <Field label={`${t('wizard.blocks')} *`} hint={t('wizard.blocksHint')}>
              <ChipGroup
                label={t('wizard.blocks')}
                options={BLOCKS.map((b) => ({ value: b, label: t(`blocks.${b}`) }))}
                selected={d.fits}
                onChange={(v) => set('fits', v)}
              />
            </Field>
          </>
        )}

        {step === 1 && (
          <>
            <Field label={t('wizard.topics')}>
              <ChipGroup
                label={t('wizard.topics')}
                options={TOPICS.map((v) => ({ value: v, label: t(`topics.${v}`) }))}
                selected={d.topics}
                onChange={(v) => set('topics', v)}
              />
            </Field>
            <div className="grid gap-6 sm:grid-cols-2">
              <Field label={`${t('wizard.minAge')} *`} hint={t('wizard.minAgeHint')}>
                <select
                  value={categoryForMinAge(d.minAge).id}
                  onChange={(e) => set('minAge', CATEGORIES.find((c) => c.id === e.target.value)?.age ?? 8)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>{categoryLabel(c.id, t)}</option>
                  ))}
                </select>
              </Field>
              <Stepper label={`${t('wizard.minPlayers')} *`} value={d.minPlayers} min={1} max={60} step={1} onChange={(v) => set('minPlayers', v)} />
              <Stepper label={`${t('wizard.duration')} *`} value={d.duration} min={3} max={60} step={5} onChange={(v) => set('duration', v)} />
            </div>
            <Field label={t('wizard.contact')}>
              <div role="radiogroup" aria-label={t('wizard.contact')} className="grid gap-2 sm:grid-cols-2">
                {CONTACT_LEVELS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={d.contact === c}
                    onClick={() => set('contact', c)}
                    className={`rounded-xl border px-3 py-3 text-left text-sm font-medium transition ${
                      d.contact === c ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    {t(`contact.${c}`)}
                  </button>
                ))}
              </div>
              {d.contact !== 'none' && (
                <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{t('wizard.contactWarning')}</p>
              )}
            </Field>
          </>
        )}

        {step === 2 && (
          <>
            <Field label={`${t('wizard.summary')} *`}>
              <textarea
                rows={3}
                maxLength={400}
                value={d.summary}
                onChange={(e) => set('summary', e.target.value)}
                placeholder={t('wizard.summaryPlaceholder')}
                className="w-full rounded-xl border border-slate-300 p-3 text-base"
              />
            </Field>
            <Field label={`${t('wizard.stepsLabel')} *`}>
              <ol className="space-y-2">
                {d.steps.map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-3 grid size-6 shrink-0 place-items-center rounded-full bg-emerald-700 text-xs font-bold text-white">{i + 1}</span>
                    <textarea
                      rows={2}
                      maxLength={300}
                      value={s}
                      onChange={(e) => set('steps', d.steps.map((x, j) => (j === i ? e.target.value : x)))}
                      placeholder={t('wizard.stepPlaceholder', { n: i + 1 })}
                      className="w-full rounded-xl border border-slate-300 p-3 text-base"
                    />
                    {d.steps.length > 1 && (
                      <button
                        type="button"
                        aria-label={t('wizard.removeStep')}
                        onClick={() => set('steps', d.steps.filter((_, j) => j !== i))}
                        className="mt-2 grid size-9 shrink-0 place-items-center rounded-lg text-red-600 hover:bg-red-50"
                      >
                        <TrashIcon width={18} height={18} />
                      </button>
                    )}
                  </li>
                ))}
              </ol>
              {d.steps.length < MAX_STEPS && (
                <button type="button" onClick={() => set('steps', [...d.steps, ''])} className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">
                  <PlusIcon width={16} height={16} /> {t('wizard.addStep')}
                </button>
              )}
            </Field>
            <Field label={t('wizard.video')} hint={t('wizard.videoHint')}>
              <input
                type="url"
                inputMode="url"
                value={d.videoUrl}
                onChange={(e) => set('videoUrl', e.target.value)}
                placeholder="https://www.youtube.com/…"
                className="w-full rounded-xl border border-slate-300 px-3 py-3 text-base"
              />
            </Field>
          </>
        )}

        {step === 3 && (
          <>
            <p className="text-sm text-slate-600">{t('wizard.diagramHint')}</p>
            <DiagramEditor value={d.diagram} onChange={(v) => set('diagram', v)} />
          </>
        )}

        {step === 4 && (
          <>
            <Field label={t('wizard.equipment')}>
              <ChipGroup
                label={t('wizard.equipment')}
                options={EQUIPMENT.map((v) => ({ value: v, label: t(`equipment.${v}`) }))}
                selected={d.equipment}
                onChange={(v) => set('equipment', v)}
              />
            </Field>
            <div className="space-y-2">
              <div className="text-sm font-semibold">{t('wizard.preview')}</div>
              <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold">{d.name}</span>
                  <span className="shrink-0 text-xs text-slate-500">{d.duration} {t('common.min')}</span>
                </div>
                <p className="text-sm text-slate-600">{d.summary}</p>
                <ExerciseTags ex={preview} />
                {d.diagram && <FieldDiagram key={JSON.stringify(d.diagram)} diagram={d.diagram} compact />}
                <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-700">
                  {d.steps.filter((s) => s.trim()).map((s, i) => <li key={i}>{s}</li>)}
                </ol>
                <p className="text-xs text-slate-500">
                  {t('exercise.minPlayers', { count: d.minPlayers })} ·{' '}
                  {d.equipment.length ? d.equipment.map((e) => t(`equipment.${e}`)).join(', ') : t('exercise.noEquipment')}
                </p>
              </div>
            </div>
            <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">{t('wizard.reviewNotice')}</p>
          </>
        )}

        {error && <p role="alert" className="text-sm font-medium text-red-600">{error}</p>}
      </div>

      <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] flex gap-2 md:static">
        {step > 0 ? (
          <button type="button" onClick={goBack} className={`${btnSecondary} flex-1 bg-white md:flex-none`}>{t('wizard.back')}</button>
        ) : (
          <Link to="/library" className={`${btnSecondary} flex-1 bg-white md:flex-none`}>{t('common.cancel')}</Link>
        )}
        {step < STEP_KEYS.length - 1 ? (
          <button type="button" onClick={goNext} className={`${btnPrimary} flex-[2] md:flex-none`}>{t('wizard.next')}</button>
        ) : (
          <button type="button" onClick={save} disabled={saving} className={`${btnPrimary} flex-[2] disabled:opacity-60 md:flex-none`}>
            {saving ? t('wizard.saving') : t('wizard.save')}
          </button>
        )}
      </div>
    </div>
  )
}

function Stepper({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
}) {
  const clamp = (n: number) => Math.min(max, Math.max(min, Math.round(n) || min))
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <button type="button" aria-label="-" onClick={() => onChange(clamp(value - step))} className="grid size-12 shrink-0 place-items-center rounded-xl border border-slate-300 bg-white">
          <MinusIcon />
        </button>
        <input
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(clamp(Number(e.target.value)))}
          className="h-12 w-full min-w-0 rounded-xl border border-slate-300 text-center text-lg font-semibold"
        />
        <button type="button" aria-label="+" onClick={() => onChange(clamp(value + step))} className="grid size-12 shrink-0 place-items-center rounded-xl border border-slate-300 bg-white">
          <PlusIcon />
        </button>
      </div>
    </Field>
  )
}
