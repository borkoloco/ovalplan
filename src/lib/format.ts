import type { TFunction } from 'i18next'
import { EXERCISES_BY_ID } from '../data/exercises'
import type { Session } from '../data/types'
import type { Lang } from '../i18n'

export function formatDate(date: string, lang: Lang, opts?: Intl.DateTimeFormatOptions) {
  // Fecha local (YYYY-MM-DD) sin corrimiento por zona horaria.
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(lang === 'es' ? 'es-AR' : 'en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...opts,
  })
}

export function todayISO() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function categoryLabel(id: string, t: TFunction) {
  return id === 'senior' ? t('categories.senior') : id
}

export function sessionMinutes(session: Session) {
  return session.blocks.reduce((sum, b) => sum + b.items.reduce((s, i) => s + i.minutes, 0), 0)
}

/** Texto plano de la sesión para mandar por WhatsApp o copiar. */
export function sessionToText(session: Session, t: TFunction, lang: Lang) {
  const { input } = session
  const lines = [
    `OvalPlan · ${categoryLabel(input.category, t)} · ${input.players} ${t('common.players')} · ${sessionMinutes(session)} ${t('common.min')}`,
    formatDate(input.date, lang, { weekday: 'long', year: 'numeric' }),
  ]
  for (const block of session.blocks) {
    if (!block.items.length) continue
    const mins = block.items.reduce((s, i) => s + i.minutes, 0)
    lines.push('', `${t(`blocks.${block.type}`)} (${mins} ${t('common.min')})`)
    for (const item of block.items) {
      const ex = EXERCISES_BY_ID[item.exerciseId]
      if (ex) lines.push(`• ${ex.name[lang]} · ${item.minutes} ${t('common.min')}`)
    }
  }
  if (session.notes.trim()) lines.push('', session.notes.trim())
  return lines.join('\n')
}
