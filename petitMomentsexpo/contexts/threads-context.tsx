import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/utils/supabase'

export type ThreadItem = {
  id: string
  title: string
  body: string
  createdAt: string
}

type ThreadsContextValue = {
  threads: ThreadItem[]
  loading: boolean
  loadError: string | null
  refreshThreads: () => void
}

const ThreadsContext = createContext<ThreadsContextValue | undefined>(undefined)

function rowToThread(row: Record<string, unknown>): ThreadItem {
  const title = String(row.title ?? '').trim() || 'Discussie'
  const body = String(row.body ?? row.content ?? row.message ?? '').trim()
  const createdRaw = row.created_at
  const createdAt =
    typeof createdRaw === 'string'
      ? createdRaw
      : createdRaw instanceof Date
        ? createdRaw.toISOString()
        : ''

  return {
    id: String(row.id ?? Date.now()),
    title,
    body,
    createdAt,
  }
}

export function ThreadsProvider({ children }: { children: React.ReactNode }) {
  const { session, loading: authLoading } = useAuth()
  const [threads, setThreads] = useState<ThreadItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadThreads = useCallback(async () => {
    setLoadError(null)
    await supabase.auth.getSession()
    setLoading(true)

    const selectVariants = [
      'id, title, content, created_at',
      'id, title, body, created_at',
      'id, title, message, created_at',
      'id, title, created_at',
    ]

    let rows: Record<string, unknown>[] = []
    let lastMessage = ''

    for (const columns of selectVariants) {
      const res = await supabase
        .from('threads')
        .select(columns)
        .order('created_at', { ascending: false })

      if (!res.error) {
        rows = ((res.data ?? []) as unknown) as Record<string, unknown>[]
        lastMessage = ''
        break
      }

      lastMessage = res.error.message ?? 'Onbekende fout'
      console.warn('[threads] Supabase select error:', columns, lastMessage)

      const hint = lastMessage.toLowerCase()
      const maybeWrongColumn =
        hint.includes('does not exist') ||
        hint.includes('column') ||
        hint.includes('schema cache')

      if (!maybeWrongColumn) {
        break
      }
    }

    if (lastMessage) {
      setThreads([])
      setLoading(false)
      setLoadError(
        `Kon discussies niet laden: ${lastMessage}. Zorg dat de tabel threads bestaat en RLS SELECT toestaat voor ingelogde gebruikers.`
      )
      return
    }

    setThreads(rows.map(rowToThread))
    setLoading(false)
  }, [])

  useEffect(() => {
    if (authLoading) {
      return
    }

    if (!session?.user?.id) {
      setThreads([])
      setLoading(false)
      setLoadError(null)
      return
    }

    let cancelled = false

    void (async () => {
      await loadThreads()
      if (cancelled) return
    })()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (cancelled) return
      if (event === 'SIGNED_OUT') {
        setThreads([])
        setLoadError(null)
        setLoading(false)
        return
      }
      if (
        (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') &&
        newSession?.user?.id
      ) {
        void loadThreads()
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [authLoading, loadThreads, session?.user?.id])

  const value = useMemo<ThreadsContextValue>(
    () => ({
      threads,
      loading,
      loadError,
      refreshThreads: () => {
        void loadThreads()
      },
    }),
    [threads, loading, loadError, loadThreads]
  )

  return <ThreadsContext.Provider value={value}>{children}</ThreadsContext.Provider>
}

export function useThreads() {
  const ctx = useContext(ThreadsContext)
  if (!ctx) {
    throw new Error('useThreads must be used inside ThreadsProvider')
  }
  return ctx
}
