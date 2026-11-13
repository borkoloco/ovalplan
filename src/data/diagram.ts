/**
 * Diagrama de un ejercicio: la cancha vista desde arriba, en metros.
 * Se guarda como datos (no como imagen) para que se vea nítido en cualquier
 * pantalla, pese poco y se pueda animar y editar.
 */

export type Vec = [number, number]

export const PLAYER_KINDS = ['att', 'def', 'coach'] as const
export const ITEM_KINDS = ['att', 'def', 'coach', 'cone', 'ball', 'shield'] as const
export type ItemKind = (typeof ITEM_KINDS)[number]

export type DiagramItem = {
  id: string
  kind: ItemKind
  x: number
  y: number
  /** Sólo pelotas: jugador que la tiene al empezar. */
  holder?: string
}

export type DiagramMove =
  /** El elemento corre (o se desplaza) hasta un punto. */
  | { id: string; step: number; kind: 'run'; item: string; to: Vec }
  /** La pelota que tiene `from` va a otro jugador o a un punto de la cancha. */
  | { id: string; step: number; kind: 'pass' | 'kick'; from: string; to: string | Vec }

export type Diagram = {
  /** Tamaño de la cancha en metros (x = ancho, y = alto). */
  w: number
  h: number
  items: DiagramItem[]
  moves: DiagramMove[]
  /** Líneas verticales (líneas de try, zonas) en metros desde la izquierda. */
  lines?: number[]
}

export const isPlayer = (kind: ItemKind) => (PLAYER_KINDS as readonly string[]).includes(kind)

/** Posiciones y quién tiene cada pelota en un momento dado. */
export type Frame = {
  pos: Record<string, Vec>
  holder: Record<string, string | null>
}

/** Distancia (m) a la que un jugador que corre levanta una pelota suelta. */
const PICKUP_RADIUS = 1

export function stepCount(d: Diagram): number {
  return d.moves.length ? Math.max(...d.moves.map((m) => m.step)) + 1 : 0
}

const dist = (a: Vec, b: Vec) => Math.hypot(a[0] - b[0], a[1] - b[1])

/**
 * Simula los pasos: frames[0] es la posición inicial y frames[k + 1] la
 * posición al terminar el paso k.
 */
export function simulate(d: Diagram): Frame[] {
  const first: Frame = { pos: {}, holder: {} }
  for (const it of d.items) {
    first.pos[it.id] = [it.x, it.y]
    if (it.kind === 'ball') first.holder[it.id] = it.holder ?? null
  }
  const balls = d.items.filter((i) => i.kind === 'ball').map((i) => i.id)
  for (const b of balls) {
    const h = first.holder[b]
    if (h && first.pos[h]) first.pos[b] = first.pos[h]
  }

  const frames = [first]
  const steps = stepCount(d)
  for (let k = 0; k < steps; k++) {
    const start = frames[k]
    const end: Frame = { pos: { ...start.pos }, holder: { ...start.holder } }
    const moves = d.moves.filter((m) => m.step === k)

    for (const m of moves) {
      if (m.kind === 'run' && end.pos[m.item]) end.pos[m.item] = m.to
    }
    const passed = new Set<string>()
    for (const m of moves) {
      if (m.kind === 'run') continue
      const ball = balls.find((b) => start.holder[b] === m.from && !passed.has(b))
      if (!ball) continue
      passed.add(ball)
      if (typeof m.to === 'string') {
        end.holder[ball] = m.to
      } else {
        end.holder[ball] = null
        end.pos[ball] = m.to
      }
    }
    // Las pelotas acompañan a quien las tiene.
    for (const b of balls) {
      const h = end.holder[b]
      if (h && end.pos[h]) end.pos[b] = end.pos[h]
    }
    // Un jugador que termina su carrera al lado de una pelota suelta la levanta.
    for (const b of balls) {
      if (end.holder[b] || passed.has(b)) continue
      const runner = moves.find(
        (m) => m.kind === 'run' && isPlayerId(d, m.item) && dist(m.to, end.pos[b]) <= PICKUP_RADIUS,
      )
      if (runner && runner.kind === 'run') {
        end.holder[b] = runner.item
        end.pos[b] = end.pos[runner.item]
      }
    }
    frames.push(end)
  }
  return frames
}

function isPlayerId(d: Diagram, id: string) {
  const it = d.items.find((i) => i.id === id)
  return Boolean(it && isPlayer(it.kind))
}

/** Pelotas que se patean en el paso k (para dibujarlas en arco). */
export function kickedBalls(d: Diagram, frames: Frame[], k: number): Set<string> {
  const out = new Set<string>()
  const start = frames[k]
  if (!start) return out
  for (const m of d.moves) {
    if (m.step !== k || m.kind !== 'kick') continue
    for (const [b, h] of Object.entries(start.holder)) if (h === m.from) out.add(b)
  }
  return out
}

const ease = (f: number) => (f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2)

/** Posiciones en el instante t (0 = inicio, stepCount = final). */
export function positionsAt(d: Diagram, frames: Frame[], t: number): Record<string, Vec> {
  const steps = frames.length - 1
  if (steps <= 0) return frames[0].pos
  const k = Math.min(Math.floor(t), steps - 1)
  const f = ease(Math.min(1, Math.max(0, t - k)))
  const a = frames[k].pos
  const b = frames[k + 1].pos
  const kicked = kickedBalls(d, frames, k)
  const out: Record<string, Vec> = {}
  for (const id of Object.keys(a)) {
    const p = a[id]
    const q = b[id] ?? p
    const dx = q[0] - p[0]
    const dy = q[1] - p[1]
    // La patada sigue la misma curva que su flecha (bezier con control desplazado
    // un cuarto del largo hacia la perpendicular (dy, -dx)).
    const arc = kicked.has(id) ? 0.5 * f * (1 - f) : 0
    out[id] = [p[0] + dx * f + dy * arc, p[1] + dy * f - dx * arc]
  }
  return out
}

/**
 * Cuánto se dibuja cada pelota "al costado" de quien la lleva (0 = suelta,
 * 1 = en manos de alguien), interpolado para que no salte al pasarla.
 */
export function ballOffsets(frames: Frame[], t: number): Record<string, number> {
  const steps = frames.length - 1
  const out: Record<string, number> = {}
  if (steps <= 0) {
    for (const [b, h] of Object.entries(frames[0].holder)) out[b] = h ? 1 : 0
    return out
  }
  const k = Math.min(Math.floor(t), steps - 1)
  const f = Math.min(1, Math.max(0, t - k))
  for (const b of Object.keys(frames[0].holder)) {
    const s = frames[k].holder[b] ? 1 : 0
    const e = frames[k + 1].holder[b] ? 1 : 0
    // Durante un pase la pelota viaja sola: sin desplazamiento a mitad de camino.
    const passed = frames[k].holder[b] !== frames[k + 1].holder[b]
    out[b] = passed ? (f < 0.5 ? s * (1 - 2 * f) : e * (2 * f - 1)) : s
  }
  return out
}

/** Recorta un diagrama recibido de afuera a algo válido y razonable. */
export function sanitizeDiagram(raw: unknown): Diagram | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const r = raw as Partial<Diagram>
  const w = clampNum(r.w, 5, 100, 30)
  const h = clampNum(r.h, 5, 100, 20)
  const items = (Array.isArray(r.items) ? r.items : [])
    .filter((i): i is DiagramItem => Boolean(i) && typeof i.id === 'string' && (ITEM_KINDS as readonly string[]).includes(i.kind))
    .slice(0, 60)
    .map((i) => ({ ...i, x: clampNum(i.x, 0, w, 0), y: clampNum(i.y, 0, h, 0) }))
  const ids = new Set(items.map((i) => i.id))
  const moves = (Array.isArray(r.moves) ? r.moves : [])
    .filter((m): m is DiagramMove => {
      if (!m || typeof m.id !== 'string' || !Number.isInteger(m.step) || m.step < 0 || m.step > 20) return false
      if (m.kind === 'run') return ids.has(m.item) && Array.isArray(m.to)
      if (m.kind === 'pass' || m.kind === 'kick') return ids.has(m.from) && (typeof m.to !== 'string' || ids.has(m.to))
      return false
    })
    .slice(0, 80)
  const lines = Array.isArray(r.lines) ? r.lines.filter((x) => typeof x === 'number' && x >= 0 && x <= w).slice(0, 6) : undefined
  return { w, h, items, moves, ...(lines?.length ? { lines } : {}) }
}

function clampNum(v: unknown, min: number, max: number, fallback: number) {
  return typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback
}
