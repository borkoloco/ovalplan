import { useTranslation } from 'react-i18next'
import { categoryForMinAge } from '../data/categories'
import type { Exercise } from '../data/types'
import { categoryLabel } from '../lib/format'
import { Tag } from './ui'

const contactTone = { none: 'emerald', tag: 'slate', controlled: 'amber', full: 'red' } as const

export default function ExerciseTags({ ex, showTopics = true }: { ex: Exercise; showTopics?: boolean }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-wrap gap-1.5">
      {ex.status === 'pending' && <Tag tone="amber">{t('status.pending')}</Tag>}
      {ex.status === 'rejected' && <Tag tone="red">{t('status.rejected')}</Tag>}
      <Tag>{t(`kind.${ex.kind}`)}</Tag>
      <Tag>{t('exercise.fromCategory', { cat: categoryLabel(categoryForMinAge(ex.minAge).id, t) })}</Tag>
      <Tag tone={contactTone[ex.contact]}>{t(`contact.${ex.contact}`)}</Tag>
      {showTopics && ex.topics.map((topic) => <Tag key={topic} tone="emerald">{t(`topics.${topic}`)}</Tag>)}
    </div>
  )
}
