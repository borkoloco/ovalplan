import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { EXERCISES } from '../data/exercises'
import type { Exercise, ExerciseStatus } from '../data/types'
import { useAuth } from './auth'
import { supabase } from './supabase'

/**
 * Biblioteca de ejercicios: viene de Supabase y se guarda en caché local para
 * poder armar sesiones sin señal en la cancha. Si no hay Supabase, usa la
 * biblioteca de ejemplo que viene con la app.
 */

const CACHE_KEY = 'ovalplan.exercises'

type Row = {
  id: string
  name: Exercise['name']
  summary: Exercise['summary']
  steps: Exercise['steps']
  kind: Exercise['kind']
  fits: Exercise['fits']
  topics: Exercise['topics']
  min_age: number
  min_players: number
  duration: number
  equipment: Exercise['equipment']
  contact: Exercise['contact']
  video_url: string | null
  status: ExerciseStatus
  review_note: string | null
  created_by: string | null
}

const fromRow = (r: Row): Exercise => ({
  id: r.id,
  name: r.name,
  summary: r.summary,
  steps: r.steps,
  kind: r.kind,
  fits: r.fits,
  topics: r.topics,
  minAge: r.min_age,
  minPlayers: r.min_players,
  duration: r.duration,
  equipment: r.equipment,
  contact: r.contact,
  videoUrl: r.video_url ?? undefined,
  status: r.status,
  reviewNote: r.review_note,
  createdBy: r.created_by,
})

/** Campos que carga el entrenador (el resto lo maneja la base). */
export type ExerciseInput = Omit<Exercise, 'id' | 'status' | 'createdBy' | 'reviewNote'>

const toRow = (e: ExerciseInput) => ({
  name: e.name,
  summary: e.summary,
  steps: e.steps,
  kind: e.kind,
  fits: e.fits,
  topics: e.topics,
  min_age: e.minAge,
  min_players: e.minPlayers,
  duration: e.duration,
  equipment: e.equipment,
  contact: e.contact,
  video_url: e.videoUrl || null,
})

function readCache(): Exercise[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? (JSON.parse(raw) as Exercise[]) : null
  } catch {
    return null
  }
}

type ExercisesState = {
  /** Todo lo visible: aprobados, propios y (si sos admin) pendientes de otros. */
  all: Exercise[]
  /** Lo que se puede usar al armar sesiones: aprobados y propios no rechazados. */
  usable: Exercise[]
  byId: Record<string, Exercise>
  loading: boolean
  reload: () => Promise<void>
  create: (e: ExerciseInput) => Promise<{ id?: string; error?: string }>
  /** keepStatus: el admin edita sin cambiar el estado. */
  update: (id: string, e: ExerciseInput, opts?: { keepStatus?: boolean }) => Promise<{ error?: string }>
  review: (id: string, status: ExerciseStatus, note?: string) => Promise<{ error?: string }>
  remove: (id: string) => Promise<{ error?: string }>
}

const ExercisesContext = createContext<ExercisesState | null>(null)

export function ExercisesProvider({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth()
  const [all, setAll] = useState<Exercise[]>(() => (supabase && readCache()) || EXERCISES)
  const [loading, setLoading] = useState(Boolean(supabase))

  const reload = useCallback(async () => {
    if (!supabase) return
    setLoading(true)
    const { data, error } = await supabase.from('exercises').select('*').order('created_at')
    setLoading(false)
    if (error || !data) return // sin señal: queda la caché
    const list = (data as Row[]).map(fromRow)
    setAll(list)
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(list))
    } catch {
      // caché llena: no pasa nada
    }
  }, [])

  // Recargar al iniciar y cuando cambia el usuario (aparecen o se van sus ejercicios).
  useEffect(() => {
    if (ready) void reload()
  }, [ready, user?.id, reload])

  const usable = useMemo(
    () => all.filter((e) => !e.status || e.status === 'approved' || (e.createdBy === user?.id && e.status === 'pending')),
    [all, user?.id],
  )
  const byId = useMemo(() => Object.fromEntries(all.map((e) => [e.id, e])), [all])

  const create: ExercisesState['create'] = async (e) => {
    if (!supabase) return { error: 'offline' }
    const { data, error } = await supabase.from('exercises').insert(toRow(e)).select('id').single()
    if (error) return { error: error.message }
    await reload()
    return { id: data.id as string }
  }

  const update: ExercisesState['update'] = async (id, e, opts) => {
    if (!supabase) return { error: 'offline' }
    // Si lo edita el autor, vuelve a quedar pendiente de revisión.
    const changes = opts?.keepStatus ? toRow(e) : { ...toRow(e), status: 'pending' as const }
    const { error } = await supabase.from('exercises').update(changes).eq('id', id)
    if (error) return { error: error.message }
    await reload()
    return {}
  }

  const review: ExercisesState['review'] = async (id, status, note) => {
    if (!supabase) return { error: 'offline' }
    const { error } = await supabase.from('exercises').update({ status, review_note: note ?? null }).eq('id', id)
    if (error) return { error: error.message }
    await reload()
    return {}
  }

  const remove: ExercisesState['remove'] = async (id) => {
    if (!supabase) return { error: 'offline' }
    const { error } = await supabase.from('exercises').delete().eq('id', id)
    if (error) return { error: error.message }
    await reload()
    return {}
  }

  return (
    <ExercisesContext.Provider value={{ all, usable, byId, loading, reload, create, update, review, remove }}>
      {children}
    </ExercisesContext.Provider>
  )
}

export function useExercises() {
  const ctx = useContext(ExercisesContext)
  if (!ctx) throw new Error('useExercises fuera de ExercisesProvider')
  return ctx
}
