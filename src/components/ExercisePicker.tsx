import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { BlockType, Exercise } from '../data/types'
import { useLang } from '../i18n'
import ExerciseTags from './ExerciseTags'
import { XIcon } from './icons'

/** Hoja inferior en celular, diálogo centrado en escritorio. */
export default function ExercisePicker({
  block,
  options,
  onPick,
  onClose,
}: {
  block: BlockType
  options: Exercise[]
  onPick: (ex: Exercise) => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const lang = useLang()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-6">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('picker.title', { block: t(`blocks.${block}`) })}
        className="relative flex max-h-[85dvh] w-full flex-col rounded-t-2xl bg-white shadow-xl md:max-w-lg md:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="font-semibold">{t('picker.title', { block: t(`blocks.${block}`) })}</h2>
          <button type="button" onClick={onClose} aria-label={t('common.close')} className="grid size-9 place-items-center rounded-lg hover:bg-slate-100">
            <XIcon />
          </button>
        </div>
        <ul className="overflow-y-auto p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
          {options.length === 0 && <li className="p-4 text-sm text-slate-500">{t('picker.none')}</li>}
          {options.map((ex) => (
            <li key={ex.id}>
              <button
                type="button"
                onClick={() => onPick(ex)}
                className="w-full space-y-1.5 rounded-xl p-3 text-left hover:bg-slate-50"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-medium">{ex.name[lang]}</span>
                  <span className="shrink-0 text-xs text-slate-500">{ex.duration} {t('common.min')}</span>
                </div>
                <p className="text-sm text-slate-600">{ex.summary[lang]}</p>
                <ExerciseTags ex={ex} />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
