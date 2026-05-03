import type { Session } from '@supabase/supabase-js'
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { supabase } from '@/utils/supabase'

type AuthContextValue = {
  session: Session | null
  loading: boolean
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>
  signUpWithEmail: (
    email: string,
    password: string
  ) => Promise<{ error: string | null; needsConfirmation?: boolean }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    void supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return
      setSession(data.session ?? null)
      setLoading(false)
    })

    const { data } = supabase.auth.onAuthStateChange((_evt, nextSession) => {
      setSession(nextSession)
    })

    return () => {
      cancelled = true
      data.subscription.unsubscribe()
    }
  }, [])

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const trimmed = email.trim()
    const { error } = await supabase.auth.signInWithPassword({
      email: trimmed,
      password,
    })
    return { error: error?.message ?? null }
  }, [])

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    const trimmed = email.trim()
    const { data, error } = await supabase.auth.signUp({
      email: trimmed,
      password,
    })
    if (error) return { error: error.message ?? 'Could not register' }
    // When email confirmations are enabled, session exists only after verify.
    if (!data.session) return { error: null, needsConfirmation: true }
    return { error: null, needsConfirmation: false }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const value = useMemo(
    (): AuthContextValue => ({
      session,
      loading,
      signInWithEmail,
      signUpWithEmail,
      signOut,
    }),
    [session, loading, signInWithEmail, signUpWithEmail, signOut]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return ctx
}
