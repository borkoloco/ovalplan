import { useMemo, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ballOffsets,
  isPlayer,
  simulate,
  stepCount,
  type Diagram,
  type DiagramItem,
  type DiagramMove,
  type ItemKind,
  type Vec,
} from '../../data/diagram'
import { newId } from '../../lib/generateSession'
import { ChevronLeftIcon, ChevronRightIcon, TrashIcon } from '../icons'
import DiagramSvg, { COLORS, Item } from './DiagramSvg'
import FieldDiagram from './FieldDiagram'

type Tool = ItemKind | 'move' | 'run' | 'pass' | 'kick' | 'erase'

const SIZES: Vec[] = [
  [10, 10],
  [20, 15],
  [30, 20],
  [40, 30],
  [70, 50],
]

const EMPTY: Diagram = { w: 30, h: 20, items: [], moves: [] }
const MAX_HISTORY = 50

const shortId = () => newId().slice(0, 8)
const snap = (n: number) => Math.round(n * 2) / 2

/** Editor táctil del diagrama de un ejercicio. */
export default function DiagramEditor({ value, onChange }: { value?: Diagram; onChange: (d: Diagram | undefined) => void }) {
  const { t } = useTranslation()
  const d = value ?? EMPTY
  const [tool, setTool] = useState<Tool>('att')
  const [step, setStep] = useState(0)
  const [pending, setPending] = useState<string | null>(null)
  const [hint, setHint] = useState<string | null>(null)
  const [history, setHistory] = useState<Diagram[]>([])
  const [preview, setPreview] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)
  const drag = useRef<{ id: string; moved: boolean } | null>(null)

  const frames = useMemo(() => simulate(d), [d])
  const steps = stepCount(d)
  // El paso que se edita puede ser uno nuevo, todavía sin flechas.
  const frame = frames[Math.min(step, frames.length - 1)]

  const commit = (next: Diagram) => {
    setHistory((h) => [...h.slice(-MAX_HISTORY + 1), d])
    onChange(next)
  }

  const undo = () => {
    const prev = history[history.length - 1]
    if (!prev) return
    setHistory((h) => h.slice(0, -1))
    onChange(prev.items.length || prev.moves.length ? prev : undefined)
    setPending(null)
  }

  const toPoint = (e: PointerEvent): Vec => {
    const svg = svgRef.current
    if (!svg) return [0, 0]
    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const p = pt.matrixTransform(svg.getScreenCTM()!.inverse())
    return [Math.min(d.w, Math.max(0, snap(p.x))), Math.min(d.h, Math.max(0, snap(p.y)))]
  }

  const itemById = (id: string) => d.items.find((i) => i.id === id)
  const holdsBall = (id: string) => Object.values(frame.holder).includes(id)

  const addItem = (kind: ItemKind, [x, y]: Vec, holder?: string) => {
    if (d.items.length >= 60) return
    const item: DiagramItem = { id: `${kind[0]}${shortId()}`, kind, x, y, ...(holder ? { holder } : {}) }
    commit({ ...d, items: [...d.items, item] })
  }

  const addMove = (move: DiagramMove) => {
    if (d.moves.length >= 80) return
    // Un elemento hace una sola carrera por paso y un jugador hace un solo pase por paso.
    const rest = d.moves.filter((m) => {
      if (m.step !== move.step) return true
      if (move.kind === 'run' && m.kind === 'run') return m.item !== move.item
      if (move.kind !== 'run' && m.kind !== 'run') return m.from !== move.from
      return true
    })
    commit({ ...d, moves: [...rest, move] })
  }

  const removeItem = (id: string) => {
    commit({
      ...d,
      items: d.items
        .filter((i) => i.id !== id)
        .map((i) => (i.holder === id ? { id: i.id, kind: i.kind, x: i.x, y: i.y } : i)),
      moves: d.moves.filter((m) => (m.kind === 'run' ? m.item !== id : m.from !== id && m.to !== id)),
    })
  }

  const onBackgroundDown = (e: PointerEvent<SVGSVGElement>) => {
    const p = toPoint(e)
    setHint(null)
    if (tool === 'att' || tool === 'def' || tool === 'coach' || tool === 'cone' || tool === 'shield' || tool === 'ball') {
      if (step > 0 && tool !== 'ball') return setHint(t('diagram.editor.placeOnlyFirst'))
      return addItem(tool, p)
    }
    if (tool === 'run' && pending) {
      addMove({ id: shortId(), step, kind: 'run', item: pending, to: p })
      return setPending(null)
    }
    if ((tool === 'pass' || tool === 'kick') && pending) {
      addMove({ id: shortId(), step, kind: tool, from: pending, to: p })
      return setPending(null)
    }
  }

  const onItemDown = (id: string, e: PointerEvent<SVGGElement>) => {
    const it = itemById(id)
    if (!it) return
    setHint(null)
    if (tool === 'erase') return removeItem(id)
    if (tool === 'move') {
      if (step > 0) return setHint(t('diagram.editor.moveOnlyFirst'))
      svgRef.current?.setPointerCapture(e.pointerId)
      drag.current = { id, moved: false }
      setHistory((h) => [...h.slice(-MAX_HISTORY + 1), d])
      return
    }
    if (tool === 'ball') {
      if (!isPlayer(it.kind)) return
      if (step > 0) return setHint(t('diagram.editor.placeOnlyFirst'))
      return addItem('ball', [it.x, it.y], it.id)
    }
    if (tool === 'run') {
      if (it.kind === 'ball') return
      return setPending(pending === id ? null : id)
    }
    if (tool === 'pass' || tool === 'kick') {
      if (!pending) {
        if (!isPlayer(it.kind)) return
        if (!holdsBall(id)) return setHint(t('diagram.editor.noBall'))
        return setPending(id)
      }
      if (pending === id) return setPending(null)
      if (isPlayer(it.kind)) {
        addMove({ id: shortId(), step, kind: tool, from: pending, to: id })
        return setPending(null)
      }
      return
    }
    // Herramientas de "poner": tocar un elemento existente no hace nada.
  }

  const onMoveDown = (id: string) => {
    commit({ ...d, moves: d.moves.filter((m) => m.id !== id) })
  }

  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    if (!drag.current) return
    const [x, y] = toPoint(e)
    drag.current.moved = true
    const id = drag.current.id
    // Durante el arrastre no se guarda historial en cada movimiento.
    onChange({ ...d, items: d.items.map((i) => (i.id === id ? { ...i, x, y } : i)) })
  }

  const onPointerUp = () => {
    if (drag.current && !drag.current.moved) setHistory((h) => h.slice(0, -1))
    drag.current = null
  }

  const resize = ([w, h]: Vec) => {
    commit({
      ...d,
      w,
      h,
      items: d.items.map((i) => ({ ...i, x: Math.min(w, i.x), y: Math.min(h, i.y) })),
      moves: d.moves.map((m) => (m.kind === 'run' ? { ...m, to: [Math.min(w, m.to[0]), Math.min(h, m.to[1])] as Vec } : m)),
      lines: d.lines?.filter((x) => x <= w),
    })
  }

  const chooseTool = (next: Tool) => {
    setTool(next)
    setPending(null)
    setHint(null)
  }

  const goStep = (n: number) => {
    setStep(Math.max(0, n))
    setPending(null)
    setHint(null)
  }

  const tools: { id: Tool; label: string; icon: ReactNode }[] = [
    { id: 'att', label: t('diagram.legend.att'), icon: <ToolItem kind="att" /> },
    { id: 'def', label: t('diagram.legend.def'), icon: <ToolItem kind="def" /> },
    { id: 'coach', label: t('diagram.legend.coach'), icon: <ToolItem kind="coach" /> },
    { id: 'ball', label: t('diagram.legend.ball'), icon: <ToolItem kind="ball" /> },
    { id: 'cone', label: t('diagram.legend.cone'), icon: <ToolItem kind="cone" /> },
    { id: 'shield', label: t('diagram.legend.shield'), icon: <ToolItem kind="shield" /> },
    { id: 'run', label: t('diagram.legend.run'), icon: <ToolLine kind="run" /> },
    { id: 'pass', label: t('diagram.legend.pass'), icon: <ToolLine kind="pass" /> },
    { id: 'kick', label: t('diagram.legend.kick'), icon: <ToolLine kind="kick" /> },
    { id: 'move', label: t('diagram.editor.move'), icon: <span aria-hidden className="text-base leading-none">✥</span> },
    { id: 'erase', label: t('diagram.editor.erase'), icon: <TrashIcon width={16} height={16} /> },
  ]

  const help =
    pending && tool === 'run'
      ? t('diagram.editor.help.runTarget')
      : pending && (tool === 'pass' || tool === 'kick')
        ? t('diagram.editor.help.passTarget')
        : t(`diagram.editor.help.${tool}`)

  return (
    <div className="space-y-3">
      {/* Herramientas */}
      <div role="toolbar" aria-label={t('diagram.editor.tools')} className="-mx-1 flex flex-wrap gap-1.5">
        {tools.map((x) => (
          <button
            key={x.id}
            type="button"
            aria-pressed={tool === x.id}
            onClick={() => chooseTool(x.id)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
              tool === x.id ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'border-slate-300 bg-white text-slate-700'
            }`}
          >
            {x.icon}
            {x.label}
          </button>
        ))}
      </div>

      <p className="min-h-5 text-sm text-slate-600" aria-live="polite">
        {hint ? <span className="font-medium text-amber-700">{hint}</span> : help}
      </p>

      {/* Cancha */}
      <div className="overflow-hidden rounded-2xl shadow-sm ring-1 ring-black/5">
        <DiagramSvg
          d={d}
          frames={frames}
          pos={frame.pos}
          offsets={ballOffsets(frames, Math.min(step, steps))}
          activeStep={step}
          hideFuture
          selected={pending}
          svgRef={svgRef}
          onBackgroundDown={onBackgroundDown}
          onItemDown={onItemDown}
          onMoveDown={tool === 'erase' ? onMoveDown : undefined}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          title={t('diagram.title')}
        />
      </div>

      {/* Pasos de la animación */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-slate-700">{t('diagram.editor.stepLabel')}</span>
        <div className="flex items-center rounded-lg border border-slate-300 bg-white">
          <button type="button" aria-label={t('diagram.editor.prevStep')} disabled={step === 0} onClick={() => goStep(step - 1)} className="grid size-9 place-items-center disabled:opacity-30">
            <ChevronLeftIcon width={18} height={18} />
          </button>
          <span className="min-w-16 text-center text-sm font-semibold tabular-nums">
            {step + 1} / {Math.max(steps, step + 1)}
          </span>
          <button type="button" aria-label={t('diagram.editor.nextStep')} disabled={step >= steps} onClick={() => goStep(step + 1)} className="grid size-9 place-items-center disabled:opacity-30">
            <ChevronRightIcon width={18} height={18} />
          </button>
        </div>
        {step >= steps - 1 && steps > 0 && step < steps && (
          <button type="button" onClick={() => goStep(steps)} className="text-sm font-semibold text-emerald-700">
            + {t('diagram.editor.newStep')}
          </button>
        )}
      </div>

      {/* Acciones */}
      <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
        <button type="button" onClick={undo} disabled={!history.length} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 disabled:opacity-40">
          {t('diagram.editor.undo')}
        </button>
        {steps > 0 && (
          <button type="button" onClick={() => setPreview((p) => !p)} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700">
            {preview ? t('common.close') : t('diagram.play')}
          </button>
        )}
        <label className="ml-auto inline-flex items-center gap-2 text-sm text-slate-600">
          {t('diagram.editor.size')}
          <select
            value={`${d.w}x${d.h}`}
            onChange={(e) => resize(e.target.value.split('x').map(Number) as Vec)}
            className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm"
          >
            {SIZES.some(([w, h]) => w === d.w && h === d.h) ? null : <option value={`${d.w}x${d.h}`}>{d.w} × {d.h} m</option>}
            {SIZES.map(([w, h]) => (
              <option key={`${w}x${h}`} value={`${w}x${h}`}>{w} × {h} m</option>
            ))}
          </select>
        </label>
        {(d.items.length > 0 || d.moves.length > 0) && (
          <button
            type="button"
            onClick={() => {
              if (!confirm(t('diagram.editor.clearConfirm'))) return
              commit(EMPTY)
              onChange(undefined)
              goStep(0)
            }}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            {t('diagram.editor.clear')}
          </button>
        )}
      </div>

      {preview && steps > 0 && <FieldDiagram key={JSON.stringify(d)} diagram={d} compact />}
    </div>
  )
}

function ToolItem({ kind }: { kind: ItemKind }) {
  return (
    <svg viewBox="-1.2 -1.2 2.4 2.4" width={16} height={16} aria-hidden className="rounded-sm bg-[#3f8f4c]">
      <Item kind={kind} r={0.85} u={1.1} />
    </svg>
  )
}

function ToolLine({ kind }: { kind: 'run' | 'pass' | 'kick' }) {
  return (
    <svg viewBox="-1.2 -1.2 2.4 2.4" width={16} height={16} aria-hidden className="rounded-sm bg-[#3f8f4c]">
      <line
        x1={-0.9}
        y1={0.5}
        x2={0.9}
        y2={-0.5}
        stroke={kind === 'run' ? COLORS.run : COLORS.pass}
        strokeWidth={0.28}
        strokeLinecap="round"
        strokeDasharray={kind === 'run' ? undefined : kind === 'pass' ? '0.5 0.3' : '0.1 0.35'}
      />
    </svg>
  )
}
