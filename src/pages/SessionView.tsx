import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ExercisePicker from '../components/ExercisePicker'
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  MinusIcon,
  PlusIcon,
  RefreshIcon,
  ShareIcon,
  SwapIcon,
  TrashIcon,
} from '../components/icons'
import { IconButton, btnSecondary } from '../components/ui'
import { EXERCISES_BY_ID } from '../data/exercises'
import type { BlockType, Exercise, Session, SessionBlock } from '../data/types'
import { useLang } from '../i18n'
import { categoryLabel, formatDate, sessionMinutes, sessionToText } from '../lib/format'
import { buildBlocks, newId, rankForBlock } from '../lib/generateSession'
import { deleteSession, getSession, saveSession } from '../lib/storage'

export default function SessionView() {
  const { id = '' } = useParams()
  const session = getSession(id)
  const { t } = useTranslation()

  if (!session) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 text-center">
        <p className="text-slate-600">{t('session.notFound')}</p>
        <Link to="/" className={btnSecondary}>{t('common.back')}</Link>
      </div>
    )
  }
  // key: si cambia el id se reinicia el estado del editor
  return <SessionEditor key={id} initial={session} />
}

function SessionEditor({ initial }: { initial: Session }) {
  const { t } = useTranslation()
  const lang = useLang()
  const navigate = useNavigate()
  const [session, setSession] = useState(initial)
  const [picker, setPicker] = useState<BlockType | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  // Autoguardado
  useEffect(() => saveSession(session), [session])

  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(null), 2500)
    return () => clearTimeout(id)
  }, [toast])

  const usedIds = () => new Set(session.blocks.flatMap((b) => b.items.map((i) => i.exerciseId)))

  const updateBlock = (type: BlockType, fn: (b: SessionBlock) => SessionBlock) =>
    setSession((s) => ({ ...s, blocks: s.blocks.map((b) => (b.type === type ? fn(b) : b)) }))

  const updateItems = (type: BlockType, fn: (items: SessionBlock['items']) => SessionBlock['items']) =>
    updateBlock(type, (b) => ({ ...b, items: fn(b.items) }))

  const move = (type: BlockType, index: number, dir: -1 | 1) =>
    updateItems(type, (items) => {
      const next = [...items]
      const [it] = next.splice(index, 1)
      next.splice(index + dir, 0, it)
      return next
    })

  const swap = (type: BlockType, uid: string) => {
    const alt = rankForBlock(type, session.input, { exclude: usedIds() })[0]
    if (!alt) return setToast(t('session.noAlternatives'))
    updateItems(type, (items) => items.map((i) => (i.uid === uid ? { ...i, exerciseId: alt.id } : i)))
  }

  const addExercise = (type: BlockType, ex: Exercise) => {
    updateItems(type, (items) => [...items, { uid: newId(), exerciseId: ex.id, minutes: ex.duration }])
    setPicker(null)
  }

  const closePicker = useCallback(() => setPicker(null), [])

  const regenerate = () => {
    if (!confirm(t('session.regenerateConfirm'))) return
    setSession((s) => ({ ...s, blocks: buildBlocks(s.input) }))
  }

  const remove = () => {
    if (!confirm(t('session.deleteConfirm'))) return
    deleteSession(session.id)
    navigate('/', { replace: true })
  }

  const share = async () => {
    const text = sessionToText(session, t, lang)
    try {
      if (navigator.share) {
        await navigator.share({ title: 'OvalPlan', text })
        return
      }
      await navigator.clipboard.writeText(text)
      setToast(t('session.copied'))
    } catch {
      // el usuario canceló el share: no hacemos nada
    }
  }

  const { input } = session
  const total = sessionMinutes(session)

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {/* Encabezado */}
      <header className="space-y-3">
        <div>
          <p className="text-sm font-medium capitalize text-emerald-700">
            {formatDate(input.date, lang, { weekday: 'long', year: 'numeric' })}
          </p>
          <h1 className="text-2xl font-bold tracking-tight">
            {categoryLabel(input.category, t)} · {input.players} {t('common.players')}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            <span className={total === input.duration ? 'font-semibold text-emerald-700' : 'font-semibold text-amber-700'}>
              {total} {t('common.min')}
            </span>{' '}
            {t('session.of')} {input.duration} {t('common.min')}
            {input.topics.length > 0 && ` · ${input.topics.map((tp) => t(`topics.${tp}`)).join(', ')}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={share} className={btnSecondary}>
            <ShareIcon width={18} height={18} /> {t('session.share')}
          </button>
          <button type="button" onClick={regenerate} className={btnSecondary}>
            <RefreshIcon width={18} height={18} /> {t('session.regenerate')}
          </button>
          <button
            type="button"
            onClick={() => setSession((s) => ({ ...s, done: !s.done }))}
            aria-pressed={session.done}
            className={`${btnSecondary} ${session.done ? '!border-emerald-600 !bg-emerald-50 !text-emerald-800' : ''}`}
          >
            <CheckIcon width={18} height={18} /> {session.done ? t('session.done') : t('session.markDone')}
          </button>
        </div>
      </header>

      {/* Bloques */}
      {session.blocks.map((block) => {
        const mins = block.items.reduce((s, i) => s + i.minutes, 0)
        return (
          <section key={block.type} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-baseline justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
              <h2 className="font-semibold">{t(`blocks.${block.type}`)}</h2>
              <span className="text-sm text-slate-500">
                {mins} / {block.targetMinutes} {t('common.min')}
              </span>
            </div>

            <ul className="divide-y divide-slate-100">
              {block.items.length === 0 && (
                <li className="px-4 py-4 text-sm text-slate-500">{t('session.emptyBlock')}</li>
              )}
              {block.items.map((item, i) => {
                const ex = EXERCISES_BY_ID[item.exerciseId]
                if (!ex) return null
                return (
                  <li key={item.uid} className="space-y-2 px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <Link to={`/library/${ex.id}`} className="min-w-0">
                        <div className="font-medium underline-offset-2 hover:underline">{ex.name[lang]}</div>
                        <p className="line-clamp-2 text-sm text-slate-600">{ex.summary[lang]}</p>
                      </Link>
                      {/* Minutos */}
                      <div className="flex shrink-0 items-center rounded-lg border border-slate-200">
                        <IconButton
                          label={t('session.less')}
                          disabled={item.minutes <= 5}
                          onClick={() => updateItems(block.type, (items) => items.map((x) => (x.uid === item.uid ? { ...x, minutes: x.minutes - 5 } : x)))}
                        >
                          <MinusIcon width={16} height={16} />
                        </IconButton>
                        <span className="w-10 text-center text-sm font-semibold tabular-nums">{item.minutes}′</span>
                        <IconButton
                          label={t('session.more')}
                          onClick={() => updateItems(block.type, (items) => items.map((x) => (x.uid === item.uid ? { ...x, minutes: x.minutes + 5 } : x)))}
                        >
                          <PlusIcon width={16} height={16} />
                        </IconButton>
                      </div>
                    </div>
                    {/* Acciones */}
                    <div className="-ml-2 flex items-center">
                      <IconButton label={t('session.moveUp')} disabled={i === 0} onClick={() => move(block.type, i, -1)}>
                        <ArrowUpIcon width={18} height={18} />
                      </IconButton>
                      <IconButton label={t('session.moveDown')} disabled={i === block.items.length - 1} onClick={() => move(block.type, i, 1)}>
                        <ArrowDownIcon width={18} height={18} />
                      </IconButton>
                      <IconButton label={t('session.swap')} onClick={() => swap(block.type, item.uid)}>
                        <SwapIcon width={18} height={18} />
                      </IconButton>
                      <div className="ml-auto">
                        <IconButton
                          label={t('session.remove')}
                          tone="danger"
                          onClick={() => updateItems(block.type, (items) => items.filter((x) => x.uid !== item.uid))}
                        >
                          <TrashIcon width={18} height={18} />
                        </IconButton>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>

            <button
              type="button"
              onClick={() => setPicker(block.type)}
              className="flex w-full items-center justify-center gap-2 border-t border-slate-100 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
            >
              <PlusIcon width={18} height={18} /> {t('session.add')}
            </button>
          </section>
        )
      })}

      {/* Notas / seguimiento */}
      <section className="space-y-2">
        <label htmlFor="notes" className="text-sm font-semibold">{t('session.notes')}</label>
        <textarea
          id="notes"
          rows={4}
          value={session.notes}
          placeholder={t('session.notesPlaceholder')}
          onChange={(e) => setSession((s) => ({ ...s, notes: e.target.value }))}
          className="w-full rounded-xl border border-slate-300 bg-white p-3 text-base"
        />
      </section>

      <button type="button" onClick={remove} className="inline-flex items-center gap-2 text-sm font-medium text-red-600">
        <TrashIcon width={16} height={16} /> {t('common.delete')}
      </button>

      {picker && (
        <ExercisePicker
          block={picker}
          options={rankForBlock(picker, input, { exclude: usedIds() })}
          onPick={(ex) => addExercise(picker, ex)}
          onClose={closePicker}
        />
      )}

      {toast && (
        <div role="status" className="fixed inset-x-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-40 mx-auto max-w-sm rounded-xl bg-slate-900 px-4 py-3 text-center text-sm text-white shadow-lg md:bottom-8">
          {toast}
        </div>
      )}
    </div>
  )
}
