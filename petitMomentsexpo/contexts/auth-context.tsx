import type { AuthError, Session } from '@supabase/supabase-js'
import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { Platform } from 'react-native'

import { supabase } from '@/utils/supabase'

WebBrowser.maybeCompleteAuthSession()

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
  signInWithGoogle: () => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function parseOAuthCodeFromUrl(url: string): string | null {
  try {
    const parsed = Linking.parse(url)
    const raw = parsed.queryParams?.code
    if (typeof raw === 'string' && raw.length > 0) return raw
    if (Array.isArray(raw) && typeof raw[0] === 'string') return raw[0]
    return null
  } catch {
    return null
  }
}

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

  const signInWithGoogle = useCallback(async (): Promise<{ error: string | null }> => {
    try {
      const redirectTo = Linking.createURL('/')

      if (Platform.OS === 'web') {
        const origin =
          typeof window !== 'undefined' ? `${window.location.origin}/` : redirectTo
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: origin },
        })
        if (error) return { error: error.message }
        if (data?.url && typeof window !== 'undefined') {
          window.location.href = data.url
        }
        return { error: null }
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      })

      if (error) return { error: error.message }
      if (!data?.url) return { error: 'Kon Google-aanmelding niet openen.' }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)

      if (result.type !== 'success') {
        return { error: null }
      }

      const successUrl = 'url' in result && typeof result.url === 'string' ? result.url : ''
      if (!successUrl) {
        return { error: null }
      }

      const code = parseOAuthCodeFromUrl(successUrl)
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        if (exchangeError) return { error: exchangeError.message }
        return { error: null }
      }

      return {
        error:
          "Geen autorisatiecode ontvangen. Voeg je redirect-URL toe in Supabase (Authentication → URL configuration) en zet Google-provider aan.",
      }
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Google-aanmelding mislukt.' }
    }
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
      signInWithGoogle,
      signOut,
    }),
    [session, loading, signInWithEmail, signUpWithEmail, signInWithGoogle, signOut]
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
