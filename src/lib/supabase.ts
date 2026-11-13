import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Cliente de Supabase para el navegador.
 * Sólo usa claves públicas (VITE_*). La service role / secret key NUNCA va acá.
 * Las variables las carga la integración de Vercel; en local, en .env.local.
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY) as
  | string
  | undefined

/** null si faltan las variables: la app sigue funcionando en modo local. */
export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null

export const isSupabaseConfigured = supabase !== null
