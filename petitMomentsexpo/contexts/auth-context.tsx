import type { AuthError, Session } from '@supabase/supabase-js'
import * as Linking from 'expo-linking'
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { supabase } from '@/utils/supabase'

function formatSignUpError(error: AuthError): string {
  const raw = error.message ?? ''
  const lower = raw.toLowerCase()

  if (lower.includes('database error saving new user')) {
    return (
      'Account aanmaken mislukt in de database. Vaak blokkeert een trigger bij nieuwe gebruikers (bijv. insert op de tabel profiles). ' +
      'Controleer in Supabase de logs voor Auth en Postgres.'
    )
  }

  if (error.code === 'weak_password') {
    const reasons =
      'reasons' in error &&
      Array.isArray((error as { reasons?: unknown }).reasons)
        ? (error as { reasons: string[] }).reasons.join(', ')
        : ''
    return reasons
      ? `Wachtwoord wordt afgekeurd door het Supabase beleid (${reasons}).`
      : 'Wachtwoord wordt afgekeurd door het Supabase beleid.'
  }

  if (lower.includes('captcha')) {
    return 'Registratie vereist captcha: schakel captcha bescherming uit in Auth-instellingen, of werk de flow bij om een captcha-token mee te sturen.'
  }

  if (lower.includes('signup') && lower.includes('not')) {
    return 'Registratie is uitgeschakeld voor dit Supabase-project. Controleer Authentication → Providers.'
  }

  return raw || 'Kon geen account aanmaken.'
}

export type SignUpProfile = {
  username?: string
}

type AuthContextValue = {
  session: Session | null
  loading: boolean
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>
  signUpWithEmail: (
    email: string,
    password: string,
    profile?: SignUpProfile
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

  const signUpWithEmail = useCallback(
    async (email: string, password: string, profile?: SignUpProfile) => {
      const trimmed = email.trim()
      const emailRedirectTo = Linking.createURL('/')

      const userMeta =
        profile?.username?.trim() ?
          { username: profile.username.trim(), display_name: profile.username.trim() }
        : undefined

      const { data, error } = await supabase.auth.signUp({
        email: trimmed,
        password,
        options: {
          emailRedirectTo,
          data: userMeta,
        },
      })

      if (error) return { error: formatSignUpError(error) }

      const user = data?.user
      const nextSession = data?.session ?? null

      /* Duplicate e-mail wordt soms niet als error gerapporteerd: user zonder identities, geen session. */
      if (
        !nextSession &&
        user &&
        Array.isArray(user.identities) &&
        user.identities.length === 0
      ) {
        return {
          error:
            "Dit e-mailadres is mogelijk al in gebruik. Probeer 'Inloggen' of gebruik een ander adres.",
        }
      }

      // Bij e-mailbevestiging: pas sessie nadat gebruiker via link heeft bevestigd.
      if (!nextSession) return { error: null, needsConfirmation: true }

      return { error: null, needsConfirmation: false }
    },
    []
  )

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
