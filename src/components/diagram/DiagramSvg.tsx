import { useId, type PointerEvent, type Ref } from 'react'
import { isPlayer, type Diagram, type DiagramMove, type Frame, type ItemKind, type Vec } from '../../data/diagram'

/** Colores del diagrama (cancha y fichas), iguales en claro y oscuro. */
export const COLORS = {
  grass: '#3f8f4c',
  grassAlt: '#479a55',
  line: '#ffffff',
  att: '#2563eb',
  def: '#dc2626',
  coach: '#f59e0b',
  cone: '#fb923c',
  run: '#ffffff',
  pass: '#fde047',
}

export type ArrowGeom = { move: DiagramMove; from: Vec; to: Vec; toPlayer: boolean }

/** Geometría de cada flecha: sale de donde está el jugador al empezar su paso. */
export function arrowGeometry(d: Diagram, frames: Frame[]): ArrowGeom[] {
  const out: ArrowGeom[] = []
  for (const m of d.moves) {
    const start = frames[m.step]
    const end = frames[m.step + 1] ?? start
    if (!start) continue
    if (m.kind === 'run') {
      const from = start.pos[m.item]
      if (from) out.push({ move: m, from, to: m.to, toPlayer: false })
    } else {
      const from = start.pos[m.from]
      const to = typeof m.to === 'string' ? (end.pos[m.to] ?? start.pos[m.to]) : m.to
      if (from && to) out.push({ move: m, from, to, toPlayer: typeof m.to === 'string' })
    }
  }
  return out
}

type Props = {
  d: Diagram
  frames: Frame[]
  pos: Record<string, Vec>
  /** Ver ballOffsets en data/diagram. */
  offsets: Record<string, number>
  /** Paso resaltado (las flechas de los otros pasos se ven tenues). null = todas iguales. */
  activeStep?: number | null
  /** Ocultar flechas de pasos posteriores al activo (modo editor). */
  hideFuture?: boolean
  showStepNumbers?: boolean
  selected?: string | null
  svgRef?: Ref<SVGSVGElement>
  onBackgroundDown?: (e: PointerEvent<SVGSVGElement>) => void
  onItemDown?: (id: string, e: PointerEvent<SVGGElement>) => void
  onMoveDown?: (id: string, e: PointerEvent<SVGGElement>) => void
  onPointerMove?: (e: PointerEvent<SVGSVGElement>) => void
  onPointerUp?: (e: PointerEvent<SVGSVGElement>) => void
  title?: string
  className?: string
}

export default function DiagramSvg({
  d,
  frames,
  pos,
  offsets,
  activeStep = null,
  hideFuture = false,
  showStepNumbers = false,
  selected,
  svgRef,
  onBackgroundDown,
  onItemDown,
  onMoveDown,
  onPointerMove,
  onPointerUp,
  title,
  className,
}: Props) {
  const uid = useId().replace(/:/g, '')
  // Unidad visual: todo se dibuja proporcional al tamaño de la cancha.
  const u = Math.max(d.w, d.h) / 28
  const r = 0.75 * u
  const pad = 1.2 * u
  const stripe = Math.max(d.w / 6, 1)
  const interactive = Boolean(onBackgroundDown || onItemDown || onMoveDown)

  const arrows = arrowGeometry(d, frames).filter((a) => !(hideFuture && activeStep !== null && a.move.step > activeStep))

  return (
    <svg
      ref={svgRef}
      viewBox={`${-pad} ${-pad} ${d.w + pad * 2} ${d.h + pad * 2}`}
      className={`block h-auto w-full select-none ${interactive ? 'touch-none' : ''} ${className ?? ''}`}
      role="img"
      aria-label={title}
      onPointerDown={onBackgroundDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {title && <title>{title}</title>}
      <defs>
        <pattern id={`grass-${uid}`} width={stripe * 2} height={d.h} patternUnits="userSpaceOnUse">
          <rect width={stripe} height={d.h} fill={COLORS.grass} />
          <rect x={stripe} width={stripe} height={d.h} fill={COLORS.grassAlt} />
        </pattern>
        {(['run', 'pass'] as const).map((k) => (
          <marker
            key={k}
            id={`head-${k}-${uid}`}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="4"
            markerHeight="4"
            orient="auto-start-reverse"
          >
            <path d="M0 0 10 5 0 10z" fill={k === 'run' ? COLORS.run : COLORS.pass} />
          </marker>
        ))}
      </defs>

      {/* Cancha */}
      <rect x={-pad} y={-pad} width={d.w + pad * 2} height={d.h + pad * 2} fill={COLORS.grass} rx={u * 0.6} />
      <rect width={d.w} height={d.h} fill={`url(#grass-${uid})`} stroke={COLORS.line} strokeWidth={0.12 * u} strokeOpacity={0.9} />
      {d.lines?.map((x) => (
        <line key={x} x1={x} x2={x} y1={0} y2={d.h} stroke={COLORS.line} strokeWidth={0.1 * u} strokeDasharray={`${u * 0.6} ${u * 0.4}`} opacity={0.8} />
      ))}

      {/* Flechas */}
      {arrows.map(({ move, from, to, toPlayer }) => {
        const dim = activeStep !== null && move.step !== activeStep
        const dx = to[0] - from[0]
        const dy = to[1] - from[1]
        const len = Math.hypot(dx, dy) || 1
        // No tapar a los jugadores con la punta ni el arranque.
        const startOff = Math.min(r * 1.1, len / 3)
        const endOff = toPlayer ? Math.min(r * 1.3, len / 3) : 0
        const a: Vec = [from[0] + (dx / len) * startOff, from[1] + (dy / len) * startOff]
        const b: Vec = [to[0] - (dx / len) * endOff, to[1] - (dy / len) * endOff]
        const isRun = move.kind === 'run'
        const color = isRun ? COLORS.run : COLORS.pass
        const head = `url(#head-${isRun ? 'run' : 'pass'}-${uid})`
        const path =
          move.kind === 'kick'
            ? `M${a[0]} ${a[1]} Q${(a[0] + b[0]) / 2 + (dy / len) * len * 0.25} ${(a[1] + b[1]) / 2 - (dx / len) * len * 0.25} ${b[0]} ${b[1]}`
            : `M${a[0]} ${a[1]} L${b[0]} ${b[1]}`
        const mid: Vec = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
        return (
          <g
            key={move.id}
            opacity={dim ? 0.3 : 1}
            onPointerDown={onMoveDown ? (e) => { e.stopPropagation(); onMoveDown(move.id, e) } : undefined}
            className={onMoveDown ? 'cursor-pointer' : undefined}
          >
            {onMoveDown && <path d={path} stroke="transparent" strokeWidth={u * 1.4} fill="none" />}
            <path
              d={path}
              fill="none"
              stroke={color}
              strokeWidth={0.16 * u}
              strokeLinecap="round"
              strokeDasharray={isRun ? undefined : move.kind === 'pass' ? `${u * 0.5} ${u * 0.35}` : `${u * 0.12} ${u * 0.35}`}
              markerEnd={head}
            />
            {showStepNumbers && (move.kind !== 'run' || isPlayer(kindOf(d, move.item))) && (
              <g transform={`translate(${mid[0]} ${mid[1]})`}>
                <circle r={u * 0.5} fill="#0f172a" opacity={0.75} />
                <text textAnchor="middle" dominantBaseline="central" fontSize={u * 0.6} fontWeight={700} fill="#fff">
                  {move.step + 1}
                </text>
              </g>
            )}
          </g>
        )
      })}

      {/* Elementos: primero conos y escudos, después jugadores y al final las pelotas */}
      {[...d.items]
        .sort((x, y) => layer(x.kind) - layer(y.kind))
        .map((it) => {
          const p = pos[it.id] ?? [it.x, it.y]
          const sel = selected === it.id
          // La pelota que lleva un jugador se dibuja al costado, para que se vean los dos.
          const off = it.kind === 'ball' ? (offsets[it.id] ?? 0) * r * 0.75 : 0
          const [x, y] = [p[0] + off, p[1] - off]
          return (
            <g
              key={it.id}
              transform={`translate(${x} ${y})`}
              onPointerDown={onItemDown ? (e) => { e.stopPropagation(); onItemDown(it.id, e) } : undefined}
              className={onItemDown ? 'cursor-pointer' : undefined}
            >
              {onItemDown && <circle r={r * 1.6} fill="transparent" />}
              {sel && <circle r={r * 1.45} fill="none" stroke="#fde047" strokeWidth={0.18 * u} />}
              <Item kind={it.kind} r={r} u={u} />
            </g>
          )
        })}
    </svg>
  )
}

const kindOf = (d: Diagram, id: string): ItemKind => d.items.find((i) => i.id === id)?.kind ?? 'cone'

function layer(kind: string) {
  return kind === 'cone' ? 0 : kind === 'shield' ? 1 : kind === 'ball' ? 3 : 2
}

export function Item({ kind, r, u }: { kind: string; r: number; u: number }) {
  switch (kind) {
    case 'att':
    case 'def':
    case 'coach':
      return <circle r={r} fill={COLORS[kind]} stroke="#fff" strokeWidth={0.14 * u} />
    case 'cone':
      return <path d={`M0 ${-r * 0.8} L${r * 0.7} ${r * 0.55} L${-r * 0.7} ${r * 0.55}Z`} fill={COLORS.cone} stroke="#7c2d12" strokeWidth={0.06 * u} strokeLinejoin="round" />
    case 'ball':
      return <ellipse rx={r * 0.55} ry={r * 0.36} transform="rotate(-30)" fill="#fffbeb" stroke="#78350f" strokeWidth={0.08 * u} />
    case 'shield':
      return <rect x={-r * 0.35} y={-r * 0.9} width={r * 0.7} height={r * 1.8} rx={r * 0.2} fill="#e5e7eb" stroke="#1f2937" strokeWidth={0.08 * u} />
    default:
      return null
  }
}
