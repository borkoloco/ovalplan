/** Texto en uno o los dos idiomas de la app (ver `tx` en lib/format). */
export type Localized = { es?: string; en?: string }

export const TOPICS = [
  'passing',
  'evasion',
  'tackle',
  'ruck',
  'lineout',
  'scrum',
  'defense',
  'attack',
  'kicking',
] as const
export type Topic = (typeof TOPICS)[number]

export const EQUIPMENT = ['balls', 'cones', 'bibs', 'shields', 'tackleBags'] as const
export type Equipment = (typeof EQUIPMENT)[number]

export const BLOCKS = ['warmup', 'technique', 'game', 'cooldown'] as const
export type BlockType = (typeof BLOCKS)[number]

export type ExerciseKind = 'drill' | 'game'

export const CONTACT_LEVELS = ['none', 'tag', 'controlled', 'full'] as const
export type ContactLevel = (typeof CONTACT_LEVELS)[number]

export type Exercise = {
  id: string
  name: Localized
  summary: Localized
  steps: Localized[]
  kind: ExerciseKind
  /** Bloques de la sesión en los que encaja. */
  fits: BlockType[]
  topics: Topic[]
  /** Categoría mínima (número de la categoría "M": 8 = M8). */
  minAge: number
  minPlayers: number
  /** Duración sugerida en minutos. */
  duration: number
  equipment: Equipment[]
  contact: ContactLevel
  /** Enlace a un video público (YouTube, etc.). No se descargan videos ajenos. */
  videoUrl?: string
  /** Sólo en ejercicios de la base: los cargados por entrenadores se revisan antes de aprobarse. */
  status?: ExerciseStatus
  createdBy?: string | null
  reviewNote?: string | null
}

export type ExerciseStatus = 'pending' | 'approved' | 'rejected'

export type Focus = 'games' | 'balanced' | 'drills'

export type SessionInput = {
  category: string
  players: number
  duration: number
  topics: Topic[]
  focus: Focus
  equipment: Equipment[]
  date: string // YYYY-MM-DD
}

export type SessionItem = {
  uid: string
  exerciseId: string
  minutes: number
}

export type SessionBlock = {
  type: BlockType
  targetMinutes: number
  items: SessionItem[]
}

export type Session = {
  id: string
  createdAt: string
  input: SessionInput
  blocks: SessionBlock[]
  notes: string
  done: boolean
}
