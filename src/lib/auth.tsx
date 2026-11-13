import type { Session as AuthSession, User } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from './supabase'

type AuthState = {
  /** false mientras se recupera la sesión guardada. */
  ready: boolean
  user: User | null
  isAdmin: boolean
  /** Manda el link mágico al mail. Devuelve un mensaje de error o null. */
  signIn: (email: string, next?: string) => Promise<string | null>
  signOut: () => Promise<void>
  enabled: boolean
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [ready, setReady] = useState(!supabase)
  /** id del usuario para el que se confirmó que es admin. */
  const [adminFor, setAdminFor] = useState<string | null>(null)
  const userId = session?.user.id
  const isAdmin = Boolean(userId) && adminFor === userId

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setReady(true)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!supabase || !userId) return
    let cancelled = false
    supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setAdminFor(data?.is_admin ? userId : null)
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  const signIn = async (email: string, next = '/') => {
    if (!supabase) return 'Supabase no está configurado.'
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}${next}` },
    })
    return error ? error.message : null
  }

  const signOut = async () => {
    await supabase?.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{ ready, user: session?.user ?? null, isAdmin, signIn, signOut, enabled: Boolean(supabase) }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth fuera de AuthProvider')
  return ctx
}
