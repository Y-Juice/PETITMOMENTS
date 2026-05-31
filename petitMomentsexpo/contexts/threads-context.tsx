import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { useAuth } from '@/contexts/auth-context'
import type { ContentWarningLabel, ModerationStatus } from '@/data/moderation'
import { isContentHiddenFromViewer } from '@/data/moderation'
import {
  parseContentWarnings,
  parseModerationStatus,
} from '@/utils/moderation-parse'
import { supabase } from '@/utils/supabase'

export type ThreadItem = {
  id: string
  title: string
  body: string
  createdAt: string
  /** Gekoppelde momenten (als de kolom moment_ids in de database bestaat). */
  momentIds?: string[]
  ownerId?: string | null
  contentWarning?: ContentWarningLabel[]
  moderationStatus?: ModerationStatus
}

type ThreadsContextValue = {
  threads: ThreadItem[]
  loading: boolean
  loadError: string | null
  refreshThreads: () => Promise<void>
}

const ThreadsContext = createContext<ThreadsContextValue | undefined>(undefined)

function parseMomentIds(raw: unknown): string[] | undefined {
  if (raw == null) return undefined
  if (Array.isArray(raw)) {
    const ids = raw.map(String).filter(Boolean)
    return ids.length ? ids : undefined
  }
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as unknown
      if (Array.isArray(parsed)) {
        const ids = parsed.map(String).filter(Boolean)
        return ids.length ? ids : undefined
      }
    } catch {
      return undefined
    }
  }
  return undefined
}

/** Supabase nested resource thread_moments(...) op threads. */
function momentIdsFromRow(row: Record<string, unknown>): string[] | undefined {
  const nested = row.thread_moments
  if (Array.isArray(nested) && nested.length > 0) {
    const items = nested as Record<string, unknown>[]
    const sorted = [...items].sort((a, b) => {
      const pa = Number(a.order_index ?? a.position ?? a.sort_order ?? 0)
      const pb = Number(b.order_index ?? b.position ?? b.sort_order ?? 0)
      return pa - pb
    })
    const ids = sorted
      .map((x) => String(x.moment_id ?? x.momentId ?? '').trim())
      .filter(Boolean)
    if (ids.length) return ids
  }
  return parseMomentIds(row.moment_ids)
}

function rowToThread(row: Record<string, unknown>): ThreadItem {
  const title = String(row.title ?? '').trim() || 'Rode draad'
  const body = String(row.body ?? row.content ?? row.message ?? row.description ?? '').trim()
  const createdRaw = row.created_at
  const createdAt =
    typeof createdRaw === 'string'
      ? createdRaw
      : createdRaw instanceof Date
        ? createdRaw.toISOString()
        : ''

  const ownerId =
    typeof row.user_id === 'string'
      ? row.user_id
      : typeof row.created_by === 'string'
        ? row.created_by
        : null

  return {
    id: String(row.id ?? Date.now()),
    title,
    body,
    createdAt,
    momentIds: momentIdsFromRow(row),
    ownerId,
    contentWarning: parseContentWarnings(row.content_warning),
    moderationStatus: parseModerationStatus(row.moderation_status),
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
      'id, title, description, created_at, user_id, content_warning, moderation_status, thread_moments(moment_id, order_index)',
      'id, title, description, created_at, created_by, content_warning, moderation_status, thread_moments(moment_id, order_index)',
      'id, title, description, created_at, thread_moments(moment_id, order_index)',
      'id, title, description, created_at, thread_moments(moment_id, order_index, added_by)',
      'id, title, description, created_at, thread_moments(moment_id, position)',
      'id, title, description, created_at, thread_moments(moment_id, sort_order)',
      'id, title, description, created_at, thread_moments(moment_id)',
      'id, title, description, created_at',
      'id, title, content, created_at, moment_ids',
      'id, title, content, created_at',
      'id, title, body, created_at, moment_ids',
      'id, title, body, created_at',
      'id, title, message, created_at, moment_ids',
      'id, title, message, created_at',
      'id, title, description, created_at, moment_ids',
      'id, title, created_at, moment_ids',
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
        `Kon rode draden niet laden: ${lastMessage}. Zorg dat de tabel threads bestaat en RLS SELECT toestaat voor ingelogde gebruikers.`
      )
      return
    }

    setThreads(rows.map(rowToThread))
    setLoading(false)
  }, [])

  const currentUserId = session?.user?.id ?? null
  const visibleThreads = useMemo(
    () =>
      threads.filter((thread) => !isContentHiddenFromViewer(thread, currentUserId)),
    [threads, currentUserId],
  )

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
      threads: visibleThreads,
      loading,
      loadError,
      refreshThreads: async () => {
        await loadThreads()
      },
    }),
    [visibleThreads, loading, loadError, loadThreads]
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
