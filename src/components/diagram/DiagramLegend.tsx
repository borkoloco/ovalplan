import { useTranslation } from 'react-i18next'
import type { Diagram } from '../../data/diagram'
import { COLORS, Item } from './DiagramSvg'

/** Referencias: sólo lo que aparece en el diagrama. */
export default function DiagramLegend({ diagram }: { diagram: Diagram }) {
  const { t } = useTranslation()
  const kinds = new Set<string>(diagram.items.map((i) => i.kind))
  for (const m of diagram.moves) kinds.add(m.kind)
  const order = ['att', 'def', 'coach', 'ball', 'cone', 'shield', 'run', 'pass', 'kick'] as const

  return (
    <figcaption className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-600">
      {order
        .filter((k) => kinds.has(k))
        .map((k) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <svg viewBox="-1.2 -1.2 2.4 2.4" width={16} height={16} aria-hidden className="rounded-sm bg-[#3f8f4c]">
              {k === 'run' || k === 'pass' || k === 'kick' ? (
                <line
                  x1={-0.9}
                  y1={0}
                  x2={0.9}
                  y2={0}
                  stroke={k === 'run' ? COLORS.run : COLORS.pass}
                  strokeWidth={0.28}
                  strokeLinecap="round"
                  strokeDasharray={k === 'run' ? undefined : k === 'pass' ? '0.5 0.3' : '0.1 0.35'}
                />
              ) : (
                <Item kind={k} r={0.85} u={1.1} />
              )}
            </svg>
            {t(`diagram.legend.${k}`)}
          </span>
        ))}
    </figcaption>
  )
}
