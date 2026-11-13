import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ChipGroup, Field, Segmented, btnPrimary } from '../components/ui'
import { MinusIcon, PlusIcon } from '../components/icons'
import { CATEGORIES } from '../data/categories'
import { EQUIPMENT, TOPICS, type Focus, type SessionInput } from '../data/types'
import { categoryLabel, todayISO } from '../lib/format'
import { createSession } from '../lib/generateSession'
import { getLastInput, saveLastInput, saveSession } from '../lib/storage'

const DURATIONS = [60, 75, 90, 120]

function initialInput(): SessionInput {
  const last = getLastInput()
  return {
    category: last.category ?? 'M10',
    players: last.players ?? 16,
    duration: last.duration ?? 90,
    topics: last.topics ?? [],
    focus: last.focus ?? 'balanced',
    equipment: last.equipment ?? ['balls', 'cones', 'bibs'],
    date: todayISO(),
  }
}

export default function NewSession() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [input, setInput] = useState<SessionInput>(initialInput)
  const set = <K extends keyof SessionInput>(key: K, value: SessionInput[K]) =>
    setInput((prev) => ({ ...prev, [key]: value }))

  const setPlayers = (n: number) => set('players', Math.min(60, Math.max(1, n || 1)))

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const session = createSession(input)
    saveSession(session)
    saveLastInput(input)
    navigate(`/session/${session.id}`)
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{t('form.title')}</h1>

      <div className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-2 md:p-6">
        <Field label={t('form.category')}>
          <select
            value={input.category}
            onChange={(e) => set('category', e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base"
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {categoryLabel(c.id, t)}
              </option>
            ))}
          </select>
        </Field>

        <Field label={t('form.players')}>
          <div className="flex items-center gap-2">
            <button type="button" aria-label="-1" onClick={() => setPlayers(input.players - 1)} className="grid size-12 place-items-center rounded-xl border border-slate-300 bg-white">
              <MinusIcon />
            </button>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={60}
              value={input.players}
              onChange={(e) => setPlayers(Number(e.target.value))}
              className="h-12 w-full min-w-0 rounded-xl border border-slate-300 text-center text-lg font-semibold"
            />
            <button type="button" aria-label="+1" onClick={() => setPlayers(input.players + 1)} className="grid size-12 place-items-center rounded-xl border border-slate-300 bg-white">
              <PlusIcon />
            </button>
          </div>
        </Field>

        <Field label={t('form.duration')}>
          <Segmented
            label={t('form.duration')}
            options={DURATIONS.map((d) => ({ value: d, label: `${d}′` }))}
            value={input.duration}
            onChange={(v) => set('duration', v)}
          />
        </Field>

        <Field label={t('form.date')}>
          <input
            type="date"
            value={input.date}
            onChange={(e) => set('date', e.target.value || todayISO())}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base"
          />
        </Field>

        <div className="md:col-span-2">
          <Field label={t('form.topics')} hint={t('form.topicsHint')}>
            <ChipGroup
              label={t('form.topics')}
              options={TOPICS.map((v) => ({ value: v, label: t(`topics.${v}`) }))}
              selected={input.topics}
              onChange={(v) => set('topics', v)}
            />
          </Field>
        </div>

        <div className="md:col-span-2">
          <Field label={t('form.focus')}>
            <Segmented<Focus>
              label={t('form.focus')}
              options={[
                { value: 'games', label: t('form.focusGames') },
                { value: 'balanced', label: t('form.focusBalanced') },
                { value: 'drills', label: t('form.focusDrills') },
              ]}
              value={input.focus}
              onChange={(v) => set('focus', v)}
            />
          </Field>
        </div>

        <div className="md:col-span-2">
          <Field label={t('form.equipment')}>
            <ChipGroup
              label={t('form.equipment')}
              options={EQUIPMENT.map((v) => ({ value: v, label: t(`equipment.${v}`) }))}
              selected={input.equipment}
              onChange={(v) => set('equipment', v)}
            />
          </Field>
        </div>
      </div>

      {/* En celular el botón queda fijo arriba de la barra inferior */}
      <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:static">
        <button type="submit" className={`${btnPrimary} w-full md:w-auto`}>
          {t('form.generate')}
        </button>
      </div>
    </form>
  )
}
