import { categoryAge } from '../data/categories'
import type {
  BlockType,
  Exercise,
  Focus,
  Session,
  SessionBlock,
  SessionInput,
} from '../data/types'
import { BLOCKS } from '../data/types'

/** Reparto del tiempo por bloque según el enfoque elegido. */
const SPLIT: Record<Focus, Record<BlockType, number>> = {
  games: { warmup: 0.15, technique: 0.25, game: 0.5, cooldown: 0.1 },
  balanced: { warmup: 0.15, technique: 0.375, game: 0.375, cooldown: 0.1 },
  drills: { warmup: 0.15, technique: 0.5, game: 0.25, cooldown: 0.1 },
}

const round5 = (n: number) => Math.max(5, Math.round(n / 5) * 5)

export const newId = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`

/**
 * ¿El ejercicio es apto para este grupo? Nunca se propone algo por debajo de la
 * edad mínima, con más jugadores de los que hay o con material que no tienen.
 */
export function isSuitable(ex: Exercise, input: SessionInput): boolean {
  return (
    categoryAge(input.category) >= ex.minAge &&
    input.players >= ex.minPlayers &&
    ex.equipment.every((e) => input.equipment.includes(e))
  )
}

function score(ex: Exercise, block: BlockType, input: SessionInput, jitter: boolean): number {
  const overlap = ex.topics.filter((t) => input.topics.includes(t)).length
  let s = overlap * 10
  if (ex.fits[0] === block) s += 2 // es su bloque "natural"
  if (input.focus === 'games' && ex.kind === 'game') s += 4
  if (input.focus === 'drills' && ex.kind === 'drill') s += 4
  if (jitter) s += Math.random() * 3 // variedad al rearmar
  return s
}

/** Ejercicios aptos para un bloque, de mejor a peor. */
export function rankForBlock(
  library: Exercise[],
  block: BlockType,
  input: SessionInput,
  opts: { exclude?: Set<string>; jitter?: boolean } = {},
): Exercise[] {
  return library.filter(
    (ex) => ex.fits.includes(block) && isSuitable(ex, input) && !opts.exclude?.has(ex.id),
  )
    .map((ex) => ({ ex, s: score(ex, block, input, opts.jitter ?? false) }))
    .sort((a, b) => b.s - a.s)
    .map(({ ex }) => ex)
}

function blockTargets(input: SessionInput): Record<BlockType, number> {
  const split = SPLIT[input.focus]
  const warmup = round5(input.duration * split.warmup)
  const cooldown = round5(input.duration * split.cooldown)
  const technique = round5(input.duration * split.technique)
  const game = Math.max(5, input.duration - warmup - cooldown - technique)
  return { warmup, technique, game, cooldown }
}

/** Un ejercicio se puede estirar hasta un 50 % más de su duración sugerida. */
const MAX_STRETCH = 1.5

/** Llena un bloque con hasta `minutes` minutos. Devuelve los minutos que no pudo cubrir. */
function fillBlock(
  library: Exercise[],
  block: SessionBlock,
  minutes: number,
  input: SessionInput,
  used: Set<string>,
): number {
  const byId = new Map(library.map((e) => [e.id, e]))
  let remaining = minutes
  for (const ex of rankForBlock(library, block.type, input, { exclude: used, jitter: true })) {
    if (remaining < 5) break
    const m = Math.min(ex.duration, remaining)
    if (m < 5) continue
    block.items.push({ uid: newId(), exerciseId: ex.id, minutes: m })
    used.add(ex.id)
    remaining -= m
  }
  // Lo que sobra se reparte estirando los ejercicios del bloque, sin pasarse.
  for (let i = block.items.length - 1; i >= 0 && remaining > 0; i--) {
    const item = block.items[i]
    const max = Math.floor(((byId.get(item.exerciseId)?.duration ?? item.minutes) * MAX_STRETCH) / 5) * 5
    const extra = Math.min(remaining, Math.max(0, max - item.minutes))
    item.minutes += extra
    remaining -= extra
  }
  return remaining
}

export function buildBlocks(library: Exercise[], input: SessionInput): SessionBlock[] {
  const targets = blockTargets(input)
  const used = new Set<string>()
  const blocks: SessionBlock[] = BLOCKS.map((type) => ({ type, targetMinutes: targets[type], items: [] }))

  let leftover = 0
  for (const block of blocks) leftover += fillBlock(library, block, block.targetMinutes, input, used)

  // Si un bloque no se pudo cubrir (p. ej. no hay técnica apta para M6),
  // esos minutos pasan a otros bloques, empezando por el juego.
  for (const type of ['game', 'technique', 'warmup'] as const) {
    if (leftover < 5) break
    const block = blocks.find((b) => b.type === type)!
    const placed = leftover - fillBlock(library, block, leftover, input, used)
    block.targetMinutes += placed
    leftover -= placed
  }
  // Los objetivos de los bloques vacíos se ajustan a lo que realmente hay.
  for (const block of blocks) {
    if (block.items.length === 0) block.targetMinutes = 0
  }
  return blocks
}

export function createSession(library: Exercise[], input: SessionInput): Session {
  return {
    id: newId(),
    createdAt: new Date().toISOString(),
    input,
    blocks: buildBlocks(library, input),
    notes: '',
    done: false,
  }
}
