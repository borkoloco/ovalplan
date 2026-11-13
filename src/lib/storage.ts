import type { Session, SessionInput } from '../data/types'

/**
 * Persistencia local (localStorage) para el prototipo.
 * Más adelante se reemplaza por el backend sin tocar las pantallas.
 */
const SESSIONS_KEY = 'ovalplan.sessions'
const LAST_INPUT_KEY = 'ovalplan.lastInput'

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // almacenamiento lleno o bloqueado: la app sigue funcionando en memoria
  }
}

export function listSessions(): Session[] {
  return read<Session[]>(SESSIONS_KEY, []).sort((a, b) =>
    b.input.date === a.input.date
      ? b.createdAt.localeCompare(a.createdAt)
      : b.input.date.localeCompare(a.input.date),
  )
}

export function getSession(id: string): Session | undefined {
  return read<Session[]>(SESSIONS_KEY, []).find((s) => s.id === id)
}

export function saveSession(session: Session) {
  const all = read<Session[]>(SESSIONS_KEY, []).filter((s) => s.id !== session.id)
  write(SESSIONS_KEY, [session, ...all])
}

export function deleteSession(id: string) {
  write(
    SESSIONS_KEY,
    read<Session[]>(SESSIONS_KEY, []).filter((s) => s.id !== id),
  )
}

export function getLastInput(): Partial<SessionInput> {
  return read<Partial<SessionInput>>(LAST_INPUT_KEY, {})
}

export function saveLastInput(input: SessionInput) {
  write(LAST_INPUT_KEY, input)
}
